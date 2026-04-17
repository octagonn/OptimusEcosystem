import { ensureOrchestrator } from "@/app/lib/orchestrator";
import { subscribe } from "@/app/lib/eventBus";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureOrchestrator();
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown, event?: string) => {
        const head = event ? `event: ${event}\n` : "";
        controller.enqueue(enc.encode(`${head}data: ${JSON.stringify(data)}\n\n`));
      };
      send({ type: "info", message: "facility bus online" });

      const off = subscribe((e) => send(e));
      const ping = setInterval(() => {
        try {
          controller.enqueue(enc.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        } catch {
          /* closed */
        }
      }, 15_000);

      const cleanup = () => {
        off();
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };
      // @ts-expect-error Next.js abort signal
      controller.signal?.addEventListener?.("abort", cleanup);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
