import { NextRequest, NextResponse } from "next/server";
import { isArenaId } from "@/lib/arenas";
import { store } from "@/lib/roastStore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pitch = (body.pitch || "").trim();
  const arenaRaw = typeof body.arenaId === "string" ? body.arenaId : "startup";
  const arenaId = isArenaId(arenaRaw) ? arenaRaw : "startup";

  if (!pitch) {
    return NextResponse.json({ error: "pitch is required" }, { status: 400 });
  }
  if (pitch.length > 1500) {
    return NextResponse.json({ error: "pitch is too long (max 1500 characters)" }, { status: 400 });
  }

  const session = store.create(pitch, arenaId);
  store.orchestrate(session.id);

  return NextResponse.json(
    { id: session.id, mock: Boolean(session.mock), arenaId: session.arenaId },
    { status: 201 }
  );
}
