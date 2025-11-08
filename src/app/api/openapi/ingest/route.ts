import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { ingestOpenApiSpec } from '@/lib/openapi';

const PayloadSchema = z
  .object({
    source: z.string().min(1, 'Expected OpenAPI source content.').optional(),
    document: z.unknown().optional(),
    sourceName: z.string().optional(),
  })
  .refine((value) => value.source || value.document, {
    message: 'Either `source` (string) or `document` (object) must be provided.',
    path: ['source'],
  });

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = PayloadSchema.parse(json);

    const result = await ingestOpenApiSpec({
      source: payload.source,
      document: payload.document,
      sourceName: payload.sourceName,
    });

    return NextResponse.json(
      {
        tools: result.tools,
        warnings: result.errors,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[openapi.ingest] failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: (error as Error).message ?? 'Failed to ingest OpenAPI document' }, { status: 400 });
  }
}

