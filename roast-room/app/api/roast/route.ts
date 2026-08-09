import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/roastStore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pitch = (body.pitch || "").trim();

  if (!pitch) {
    return NextResponse.json({ error: "pitch is required" }, { status: 400 });
  }
  if (pitch.length > 1500) {
    return NextResponse.json({ error: "pitch is too long (max 1500 characters)" }, { status: 400 });
  }

  const session = store.create(pitch);

  // Fire and forget — the client watches progress over SSE.
  store.orchestrate(session.id);

  return NextResponse.json({ id: session.id, mock: Boolean(session.mock) }, { status: 201 });
}
