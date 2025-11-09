import { notFound } from "next/navigation";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { getMcpInstanceBySlug } from "@/lib/services/mcp-instances";

interface ChatPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    token?: string;
    embed?: string;
  }>;
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};

  const instance = await getMcpInstanceBySlug(slug);
  if (!instance) {
    notFound();
  }

  if (instance.requiresKey && !query.token) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center text-[var(--ui-text-primary)]">
        <h1 className="text-2xl font-semibold">API key required</h1>
        <p className="text-sm text-[var(--ui-text-secondary)]">
          The MCP instance <strong>{instance.displayName ?? instance.slug}</strong> requires an API key. Append{" "}
          <code className="rounded bg-[var(--ui-surface-muted)]/50 px-2 py-1 text-xs text-[var(--ui-text-secondary)]">
            ?token=YOUR_API_KEY
          </code>{" "}
          to the URL or provide the key via the embed configuration to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10 text-[var(--ui-text-primary)]">
      <ChatWindow
        slug={instance.slug}
        instanceName={instance.displayName}
        apiKey={query.token}
        mode={query.embed === "1" ? "embed" : "full"}
      />
    </div>
  );
}

