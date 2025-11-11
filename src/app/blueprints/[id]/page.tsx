import Link from "next/link";
import { notFound } from "next/navigation";

import { getToolBlueprint } from "@/lib/data/tool-blueprints";
import { BlueprintDetailClient } from "@/components/blueprints/BlueprintDetailClient";

interface BlueprintPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlueprintPage({ params }: BlueprintPageProps) {
  const { id } = await params;
  const blueprint = await getToolBlueprint(id);

  if (!blueprint) {
    notFound();
  }

  return (
    <div className="pb-20 pt-10 text-[var(--ui-text-primary)]">
      <BlueprintDetailClient blueprint={blueprint} />
    </div>
  );
}

