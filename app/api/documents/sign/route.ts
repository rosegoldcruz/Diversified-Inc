import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { HttpError, requireUser } from "@/lib/session";
import {
  ValidationError,
  requireInteger,
  requireString,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser();
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const signatureId = requireInteger(body.signature_id, "signature_id");
    const signatureData = requireString(
      body.signature_data,
      "signature_data",
      200000,
    );
    const userAgent =
      typeof body.user_agent === "string"
        ? body.user_agent.slice(0, 500)
        : null;

    const result = await withTransaction(async (q) => {
      const existingRows = await q<{
        document_id: number;
        signer_email: string | null;
        status: string;
      }>(
        `SELECT document_id, signer_email, status
         FROM document_signatures
         WHERE id = $1
         LIMIT 1`,
        [signatureId],
      );

      const existing = existingRows[0];
      if (!existing) return null;

      const isManagerLevel =
        session.role === "Manager" ||
        session.role === "Admin" ||
        session.role === "Leadership";
      const signerMatchesSession =
        !existing.signer_email ||
        existing.signer_email.toLowerCase() === session.email.toLowerCase();

      if (!isManagerLevel && !signerMatchesSession) {
        throw new HttpError(403, "Forbidden");
      }

      if (existing.status !== "pending_signature") {
        throw new ValidationError("Signature is not pending");
      }

      const signatureRows = await q<{ document_id: number }>(
        `UPDATE document_signatures
         SET status = 'signed', signature_data = $1, signed_at = NOW()
         WHERE id = $2 AND status = 'pending_signature'
         RETURNING document_id`,
        [signatureData, signatureId],
      );

      if (signatureRows.length === 0) return null;
      const documentId = signatureRows[0].document_id;

      await q(
        `INSERT INTO document_audit_logs (document_id, action, performed_by, details, created_at)
         VALUES ($1, 'signature.captured', $2, $3, NOW())`,
        [
          documentId,
          session.userId,
          userAgent ? `Signed from ${userAgent}` : "Signature captured",
        ],
      );

      await q(
        `UPDATE documents
         SET sign_status = CASE
             WHEN EXISTS (
               SELECT 1 FROM document_signatures
               WHERE document_id = $1 AND status <> 'signed'
             ) THEN 'partially_signed'
             ELSE 'signed'
           END,
           signed_by = CASE
             WHEN NOT EXISTS (
               SELECT 1 FROM document_signatures
               WHERE document_id = $1 AND status <> 'signed'
             ) THEN $2
             ELSE signed_by
           END,
           signed_at = CASE
             WHEN NOT EXISTS (
               SELECT 1 FROM document_signatures
               WHERE document_id = $1 AND status <> 'signed'
             ) THEN NOW()
             ELSE signed_at
           END,
           updated_at = NOW()
         WHERE id = $1`,
        [documentId, session.userId],
      );

      return { document_id: documentId };
    });

    if (!result) {
      return NextResponse.json(
        { error: "Signature not found" },
        { status: 404 },
      );
    }

    await createAuditLog({
      actorUserId: session.userId,
      action: "document.signature_captured",
      module: "documents",
      entityType: "document",
      entityId: result.document_id,
      afterData: {
        document_id: result.document_id,
        signature_id: signatureId,
        signed_by: session.userId,
      },
      request,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to sign document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
