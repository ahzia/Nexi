import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getMcpInstanceBySlug } from "@/lib/services/mcp-instances";

const BodySchema = z.object({
  slug: z.string().min(1, "Instance slug is required."),
  apiKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = BodySchema.parse(json);

    const instance = await getMcpInstanceBySlug(payload.slug);
    if (!instance) {
      return NextResponse.json({ error: "MCP instance not found." }, { status: 404 });
    }

    if (instance.status !== "active") {
      return NextResponse.json({ error: "MCP instance is not active." }, { status: 400 });
    }

    if (instance.requiresKey && !payload.apiKey) {
      return NextResponse.json(
        { error: "API key is required to start a chat for this instance." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        sessionId: `${instance.slug}-${randomUUID()}`,
        slug: instance.slug,
        displayName: instance.displayName,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload.", details: error.flatten() }, { status: 422 });
    }
    console.error("[chat.session]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to create chat session." }, { status: 400 });
  }
}

