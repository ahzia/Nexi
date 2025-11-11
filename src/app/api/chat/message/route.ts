import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages";

import { sendMessageWithMcp } from "@/lib/services/chat/anthropic-client";
import { getMcpInstanceBySlug } from "@/lib/services/mcp-instances";

const TextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ToolResultBlockSchema = z.object({
  type: z.literal("mcp_tool_result"),
  tool_use_id: z.string(),
  content: z.unknown(),
  is_error: z.boolean().optional(),
});

const ContentBlockSchema = z.union([TextBlockSchema, ToolResultBlockSchema]);

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(ContentBlockSchema)]),
});

const BodySchema = z.object({
  slug: z.string().min(1, "Instance slug is required."),
  apiKey: z.string().optional(),
  history: z.array(MessageSchema).default([]),
  message: z.string().min(1, "Message cannot be empty."),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = BodySchema.parse(json);

    const instance = await getMcpInstanceBySlug(payload.slug);
    if (!instance) {
      return NextResponse.json({ error: "MCP instance not found." }, { status: 404 });
    }

    if (instance.requiresKey && !payload.apiKey) {
      return NextResponse.json(
        { error: "API key is required to chat with this instance." },
        { status: 400 },
      );
    }

    const normalizedHistory = payload.history.map((message) => ({
      role: message.role,
      content:
        typeof message.content === "string"
          ? [{ type: "text", text: message.content }]
          : message.content,
    })) as BetaMessageParam[];

    const { replyText, toolOutputs, conversation } = await sendMessageWithMcp({
      slug: instance.slug,
      endpoint: instance.baseUrl,
      requireKey: instance.requiresKey,
      apiKey: payload.apiKey,
      history: normalizedHistory,
      userMessage: payload.message,
    });

    return NextResponse.json(
      {
        reply: replyText,
        toolOutputs,
        history: conversation,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload.", details: error.flatten() }, { status: 422 });
    }
    console.error("[chat.message]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to process message." }, { status: 400 });
  }
}

