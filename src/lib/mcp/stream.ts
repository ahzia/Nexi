import { NextResponse } from "next/server";

const STREAM_CONTENT_TYPE = "application/mcp+jsonlines";

type StreamCallback = (write: (payload: string) => void) => Promise<void>;

export async function createStreamResponse(callback: StreamCallback) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (payload: string) => {
        controller.enqueue(encoder.encode(`${payload}\n`));
      };

      try {
        await callback(write);
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  const response = new NextResponse(stream, {
    headers: {
      "Content-Type": STREAM_CONTENT_TYPE,
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
  });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, MCP-Proxy-Auth-Token");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  return response;
}
