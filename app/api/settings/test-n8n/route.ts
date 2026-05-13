import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function probe(url: string) {
  const candidates = [
    url,
    `${url.replace(/\/$/, "")}/healthz`,
    `${url.replace(/\/$/, "")}/`,
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });

      return {
        ok: response.ok,
        status: response.status,
        checkedUrl: candidate,
      };
    } catch {
      // Try next candidate endpoint.
    }
  }

  return {
    ok: false,
    status: 0,
    checkedUrl: candidates[0],
  };
}

export async function POST() {
  try {
    const baseUrl = process.env.N8N_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        {
          status: "missing",
          message: "N8N_BASE_URL is not configured.",
          checkedAt: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const result = await probe(baseUrl);

    return NextResponse.json({
      status: result.ok ? "reachable" : "unreachable",
      httpStatus: result.status,
      checkedUrl: result.checkedUrl,
      checkedAt: new Date().toISOString(),
      note: "Connectivity check only. No webhook payloads were sent.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to test n8n connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
