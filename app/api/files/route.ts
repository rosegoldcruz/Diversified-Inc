import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const columns = await query<{ column_name: string }>(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'file_records'
    `,
    );
    const columnNames = new Set(columns.map((column) => column.column_name));
    const hasPromptSchema = columnNames.has("file_id");

    const rows = hasPromptSchema
      ? await query(`
          SELECT id, file_id, file_name, file_type, linked_job, file_size, uploaded_by, uploaded_at, url
          FROM file_records
          ORDER BY uploaded_at DESC
        `)
      : await query(`
          SELECT
            id,
            'F-' || LPAD(id::text, 3, '0') AS file_id,
            name AS file_name,
            category AS file_type,
            COALESCE(
              linked_work_order_id::text,
              linked_request_id::text,
              linked_task_id::text,
              linked_sop_id::text
            ) AS linked_job,
            CASE
              WHEN size_bytes IS NULL THEN NULL
              WHEN size_bytes >= 1048576 THEN ROUND((size_bytes::numeric / 1048576), 1)::text || ' MB'
              WHEN size_bytes >= 1024 THEN ROUND((size_bytes::numeric / 1024), 0)::text || ' KB'
              ELSE size_bytes::text || ' B'
            END AS file_size,
            uploaded_by,
            uploaded_at,
            url
          FROM file_records
          ORDER BY uploaded_at DESC
        `);
    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
