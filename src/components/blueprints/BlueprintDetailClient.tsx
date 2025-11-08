"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { BlueprintCanvas } from "@/components/canvas/BlueprintCanvas";
import type { ToolBlueprintDetail } from "@/lib/data/tool-blueprints";
import type { ToolDraft } from "@/lib/types/tooling";

type CanvasTool = Omit<ToolDraft, "rawOperation">;

interface BlueprintDetailClientProps {
  blueprint: ToolBlueprintDetail;
}

interface EditFormState {
  name: string;
  description: string;
  summary: string;
  tags: string;
  inputSchema: string;
  outputSchema: string;
  security: string;
}

export function BlueprintDetailClient({ blueprint }: BlueprintDetailClientProps) {
  const router = useRouter();
  const [toolsState, setToolsState] = useState<CanvasTool[]>(() => [...(blueprint.tools as CanvasTool[])]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(toolsState[0]?.id ?? null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [label, setLabel] = useState<string>(blueprint.label);
  const [labelDraft, setLabelDraft] = useState<string>(blueprint.label);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "done" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{
    instanceId: string;
    apiKey: string;
    endpoint: string;
    discovery: unknown;
    capabilities: unknown;
  } | null>(null);

  useEffect(() => {
    setToolsState([...(blueprint.tools as CanvasTool[])]);
    setLabel(blueprint.label);
    setLabelDraft(blueprint.label);
    setSelectedToolId(blueprint.tools[0]?.id ?? null);
  }, [blueprint]);

  const selectedTool = useMemo<CanvasTool | null>(() => {
    if (!selectedToolId) return null;
    return toolsState.find((tool) => tool.id === selectedToolId) ?? null;
  }, [selectedToolId, toolsState]);

  useEffect(() => {
    if (!selectedTool) {
      setEditForm(null);
      return;
    }
    setEditForm({
      name: selectedTool.name ?? "",
      description: selectedTool.description ?? "",
      summary: selectedTool.summary ?? "",
      tags: selectedTool.tags?.join(", ") ?? "",
      inputSchema: JSON.stringify(selectedTool.inputSchema ?? {}, null, 2),
      outputSchema: selectedTool.outputSchema ? JSON.stringify(selectedTool.outputSchema, null, 2) : "",
      security: selectedTool.security ? JSON.stringify(selectedTool.security, null, 2) : "",
    });
  }, [selectedTool]);

  const handleEditFieldChange = (field: keyof EditFormState, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveTool = async () => {
    if (!selectedTool || !editForm) return;
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const parsedInput = JSON.parse(editForm.inputSchema || "{}");
      const parsedOutput = editForm.outputSchema ? JSON.parse(editForm.outputSchema) : undefined;
      const parsedSecurity = editForm.security ? JSON.parse(editForm.security) : undefined;
      const parsedTags = editForm.tags
        ? editForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const updatedTools = toolsState.map((tool) =>
        tool.id === selectedTool.id
          ? {
              ...tool,
              name: editForm.name,
              description: editForm.description,
              summary: editForm.summary || undefined,
              tags: parsedTags,
              inputSchema: parsedInput,
              outputSchema: parsedOutput,
              security: parsedSecurity,
            }
          : tool,
      );

      const response = await fetch(`/api/tool-blueprints/${blueprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          tools: updatedTools,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? "Failed to save blueprint");
      }

      setToolsState(updatedTools);
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (error) {
      console.error(error);
      setSaveError((error as Error).message);
      setSaveStatus("error");
    }
  };

  const handleSaveLabel = async () => {
    if (labelDraft === label) return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const response = await fetch(`/api/tool-blueprints/${blueprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: labelDraft }),
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? "Failed to save blueprint name");
      }
      setLabel(labelDraft);
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (error) {
      setSaveError((error as Error).message);
      setSaveStatus("error");
    }
  };

  const handlePublish = async () => {
    setPublishStatus("publishing");
    setPublishError(null);
    setPublishResult(null);

    try {
      const response = await fetch("/api/mcp/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprintId: blueprint.id }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to publish MCP instance");
      }
      setPublishResult({
        instanceId: json.instance.id,
        apiKey: json.apiKey,
        endpoint: json.endpoint,
        discovery: json.discovery,
        capabilities: json.capabilities,
      });
      setPublishStatus("done");
      router.refresh();
    } catch (error) {
      setPublishError((error as Error).message);
      setPublishStatus("error");
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">Blueprint settings</h2>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <label className="flex w-full flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] md:w-auto md:flex-1">
                Title
                <input
                  value={labelDraft}
                  onChange={(event) => setLabelDraft(event.target.value)}
                  className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                />
              </label>
              <div className="flex items-center gap-2 self-start pt-2 md:self-center">
                <button
                  type="button"
                  onClick={handleSaveLabel}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-button-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:opacity-60"
                  disabled={saveStatus === "saving" || labelDraft === label}
                >
                  {saveStatus === "saving" && labelDraft === label ? "Saving…" : "Save title"}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishStatus === "publishing" || toolsState.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary-500)] bg-[var(--ui-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-600)] shadow-[var(--ui-shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-500)]/10 disabled:opacity-60"
                >
                  {publishStatus === "publishing" ? "Publishing…" : "Publish MCP"}
                </button>
              </div>
            </div>
            {saveError ? <p className="text-xs text-[var(--color-error-500)]">{saveError}</p> : null}
            {saveStatus === "saved" ? (
              <p className="text-xs text-[var(--color-success-500)]">Saved successfully.</p>
            ) : null}
            {publishStatus === "error" && publishError ? (
              <p className="text-xs text-[var(--color-error-500)]">{publishError}</p>
            ) : null}
            {publishResult ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-success-500)]/40 bg-[var(--color-success-500)]/10 p-4 text-xs text-[var(--color-success-700)]">
                <span className="font-semibold text-sm text-[var(--color-success-600)]">Published MCP instance</span>
                <p>Provide these details to ChatGPT, Claude, or other MCP-aware agents.</p>
                <div className="grid gap-2 text-[var(--ui-text-secondary)]">
                  <div>
                    <span className="font-semibold text-[var(--ui-text-primary)]">Endpoint</span>
                    <pre className="mt-1 overflow-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1 text-xs">
                      {publishResult.endpoint}
                    </pre>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--ui-text-primary)]">API Key (shown once)</span>
                    <pre className="mt-1 overflow-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1 text-xs">
                      {publishResult.apiKey}
                    </pre>
                  </div>
                  <details className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/60 p-3">
                    <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)] text-xs">Discovery payload</summary>
                    <pre className="mt-2 max-h-48 overflow-auto text-[10px]">
                      {JSON.stringify(publishResult.discovery, null, 2)}
                    </pre>
                  </details>
                  <details className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/60 p-3">
                    <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)] text-xs">Capabilities</summary>
                    <pre className="mt-2 max-h-48 overflow-auto text-[10px]">
                      {JSON.stringify(publishResult.capabilities, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">Visual layout</h2>
            <p className="text-sm text-[var(--ui-text-secondary)]">
              Nodes mirror each generated MCP tool. We&apos;ll map these to canvas editing controls and execution wiring in
              upcoming steps, similar to the PromptFlow extension.
            </p>
          </div>
          <BlueprintCanvas tools={toolsState} selectedToolId={selectedToolId} onSelectTool={setSelectedToolId} />
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">Tool editor</h3>
              {selectedTool ? (
                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-1 text-xs text-[var(--ui-text-secondary)]">
                  {selectedTool.method.toUpperCase()} · {selectedTool.path}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[var(--ui-text-secondary)]">
              Edit metadata, update schemas, and save back to Supabase. Changes sync with the canvas immediately.
            </p>
          </header>
          {selectedTool && editForm ? (
            <form
              className="grid gap-3 text-sm text-[var(--ui-text-secondary)]"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveTool();
              }}
            >
              <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                  Name
                  <input
                    value={editForm.name}
                    onChange={(event) => handleEditFieldChange("name", event.target.value)}
                    className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                  Summary
                  <input
                    value={editForm.summary}
                    onChange={(event) => handleEditFieldChange("summary", event.target.value)}
                    className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                Description
                <textarea
                  value={editForm.description}
                  onChange={(event) => handleEditFieldChange("description", event.target.value)}
                  className="min-h-[96px] rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                Tags (comma separated)
                <input
                  value={editForm.tags}
                  onChange={(event) => handleEditFieldChange("tags", event.target.value)}
                  className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                Input schema (JSON)
                <textarea
                  value={editForm.inputSchema}
                  onChange={(event) => handleEditFieldChange("inputSchema", event.target.value)}
                  className="min-h-[200px] rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 font-mono text-xs text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                  spellCheck={false}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                Output schema (JSON, optional)
                <textarea
                  value={editForm.outputSchema}
                  onChange={(event) => handleEditFieldChange("outputSchema", event.target.value)}
                  className="min-h-[160px] rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 font-mono text-xs text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                  spellCheck={false}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                Security requirements (JSON array, optional)
                <textarea
                  value={editForm.security}
                  onChange={(event) => handleEditFieldChange("security", event.target.value)}
                  className="min-h-[120px] rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 font-mono text-xs text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                  spellCheck={false}
                />
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-button-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:opacity-60"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving…" : "Save tool"}
                </button>
                {saveStatus === "saved" ? (
                  <span className="text-xs text-[var(--color-success-500)]">Saved.</span>
                ) : null}
                {saveStatus === "error" && saveError ? (
                  <span className="text-xs text-[var(--color-error-500)]">{saveError}</span>
                ) : null}
              </div>
            </form>
          ) : (
            <p className="text-sm text-[var(--ui-text-secondary)]">Select a node to inspect and edit its configuration.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
          <header className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">All generated tools</h3>
            <span className="text-xs text-[var(--ui-text-secondary)]">{toolsState.length} total</span>
          </header>
          <div className="flex max-h-80 flex-col gap-2 overflow-auto pr-2">
            {toolsState.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSelectedToolId(tool.id)}
                className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selectedToolId === tool.id
                    ? "border-[var(--color-primary-500)] bg-[var(--ui-surface)]"
                    : "border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 hover:border-[var(--ui-border-strong)]"
                }`}
              >
                <span className="font-semibold text-[var(--ui-text-primary)]">{tool.name}</span>
                <span className="text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                  {tool.method.toUpperCase()} · {tool.path}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-5 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">Source specification</h2>
          <p className="text-sm text-[var(--ui-text-secondary)]">
            Stored verbatim so we can re-run ingestion, diff changes, and feed the MCP server generator.
          </p>
        </div>
        <pre className="max-h-[520px] overflow-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 text-xs leading-6 text-[var(--ui-text-secondary)]">
          {blueprint.raw_spec ?? "No source document stored."}
        </pre>
        {blueprint.warnings?.length ? (
          <div className="rounded-2xl border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 p-4 text-xs text-[var(--color-warning-600)]">
            <h3 className="mb-2 font-semibold">Warnings</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {blueprint.warnings.map((warning) => (
                <li key={warning.id}>
                  {warning.message}
                  {warning.operationId ? (
                    <span className="ml-2 rounded bg-[var(--ui-surface)] px-2 py-0.5 text-[var(--ui-text-secondary)]">
                      {warning.operationId}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

