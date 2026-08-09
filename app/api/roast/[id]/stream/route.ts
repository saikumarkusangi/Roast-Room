import { NextRequest } from "next/server";
import { store, RoastSession } from "@/lib/roastStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval>;
  let listener: (payload: { type: string; session: RoastSession }) => void;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const current = store.get(id);
      if (current) send("snapshot", current);

      listener = (payload) => {
        if (payload.session.id === id) send(payload.type, payload.session);
      };
      store.on(`roast:${id}`, listener);

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        store.off(`roast:${id}`, listener);
        controller.close();
      });
    },
    cancel() {
      clearInterval(heartbeat);
      store.off(`roast:${id}`, listener);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
