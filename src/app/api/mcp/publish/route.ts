import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getToolBlueprint } from "@/lib/data/tool-blueprints";
import { publishBlueprintToMcp } from "@/lib/data/mcp";

const PublishSchema = z.object({
  blueprintId: z.string().min(1, "Blueprint ID is required."),
  baseUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = PublishSchema.parse(json);

    const blueprint = await getToolBlueprint(payload.blueprintId);
    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    const result = await publishBlueprintToMcp(blueprint, { baseUrl: payload.baseUrl });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 422 });
    }
    console.error("[mcp.publish]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to publish MCP instance" }, { status: 400 });
  }
}
