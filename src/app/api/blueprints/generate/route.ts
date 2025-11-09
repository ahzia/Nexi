import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { generateBlueprintFromSource } from "@/lib/services/blueprints";

const PayloadSchema = z.object({
  source: z.string().min(1, "Input is required"),
});

export async function POST(req: NextRequest) {
  try {
    const { source } = PayloadSchema.parse(await req.json());
    const result = await generateBlueprintFromSource(source);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 422 });
    }
    console.error("[blueprints.generate]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to generate blueprint" }, { status: 400 });
  }
}
