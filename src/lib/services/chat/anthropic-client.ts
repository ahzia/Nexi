import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaMessage,
  BetaMessageParam,
  BetaMCPToolUseBlock,
  BetaRequestMCPToolResultBlockParam,
  BetaTextBlock,
  BetaToolUseBlock,
} from "@anthropic-ai/sdk/resources/beta/messages";

import { config } from "@/lib/config";

interface ToolResult {
  content: string;
  isError: boolean;
}

export interface ChatRequestOptions {
  slug: string;
  endpoint: string;
  requireKey: boolean;
  apiKey?: string;
  history: BetaMessageParam[];
  userMessage: string;
}

export interface ChatResponse {
  replyText: string;
  toolOutputs: ToolResult[];
  conversation: BetaMessageParam[];
}

export async function sendMessageWithMcp(options: ChatRequestOptions): Promise<ChatResponse> {
  if (!config.anthropic.apiKey) {
    throw new Error("Anthropic API key is not configured.");
  }

  const client = getAnthropicClient();

  const conversation: BetaMessageParam[] = [
    ...options.history,
    {
      role: "user",
      content: [{ type: "text", text: options.userMessage }],
    },
  ];

  const toolOutputs: ToolResult[] = [];

  while (true) {
    let response: BetaMessage;
    try {
      response = await client.beta.messages.create({
        model: config.anthropic.model,
        max_tokens: 1024,
        temperature: 0,
        messages: conversation,
        mcp_servers: [
          {
            type: "url",
            url: options.endpoint,
            name: options.slug,
            authorization_token:
              options.requireKey && options.apiKey ? options.apiKey : undefined,
          },
        ],
        betas: ["mcp-client-2025-04-04"],
      });
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        throw new Error(
          `Anthropic could not find model "${config.anthropic.model}". Update ANT HROPIC_MODEL to a currently available model (see https://docs.anthropic.com/en/docs/about-claude/models).`,
        );
      }
      throw error;
    }

    const assistantMessage: BetaMessageParam = {
      role: "assistant",
      content: response.content,
    };
    conversation.push(assistantMessage);

    const toolUseBlocks = response.content.filter(
      (block): block is BetaToolUseBlock | BetaMCPToolUseBlock =>
        block.type === "tool_use" || block.type === "mcp_tool_use",
    );

    if (!toolUseBlocks.length) {
      const replyText = extractAssistantText(response.content);
      return { replyText, toolOutputs, conversation };
    }

    for (const block of toolUseBlocks) {
      const toolResult = await executeToolCall(options, block);
      toolOutputs.push(toolResult);

      const toolMessage: BetaMessageParam = {
        role: "user",
        content: [
          buildToolResultBlock(block.id, toolResult),
        ],
      };

      conversation.push(toolMessage);
    }
  }
}

let cachedClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!config.anthropic.apiKey) {
    throw new Error("Anthropic API key is not configured.");
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return cachedClient;
}

function extractAssistantText(blocks: BetaContentBlock[]): string {
  const textParts = blocks
    .filter((block) => block.type === "text")
    .map((block) => (block as BetaTextBlock).text);
  return textParts.join("\n\n").trim();
}

async function executeToolCall(
  options: { endpoint: string; requireKey: boolean; apiKey?: string },
  block: BetaToolUseBlock | BetaMCPToolUseBlock,
): Promise<ToolResult> {
  try {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.requireKey && options.apiKey
          ? { Authorization: `Bearer ${options.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: block.id,
        method: "tools/call",
        params: {
          name: block.name,
          arguments: block.input ?? {},
        },
      }),
    });

    if (!response.ok) {
      const errorPayload = await safeJson(response);
      return {
        content: `Tool call failed (${response.status}): ${JSON.stringify(errorPayload)}`,
        isError: true,
      };
    }

    const result = await safeJson(response);
    return {
      content: formatToolResult(result),
      isError: false,
    };
  } catch (error) {
    return {
      content: `Tool invocation error: ${(error as Error).message}`,
      isError: true,
    };
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}

function formatToolResult(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }
  return "```json\n" + JSON.stringify(result, null, 2) + "\n```";
}

function buildToolResultBlock(
  toolUseId: string,
  result: ToolResult,
): BetaRequestMCPToolResultBlockParam {
  return {
    type: "mcp_tool_result",
    tool_use_id: toolUseId,
    content: result.content,
    is_error: result.isError || undefined,
  };
}

