"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { BlueprintCanvas } from "@/components/canvas/BlueprintCanvas";
import { Tabs } from "@/components/ui/tabs";
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
  const [label, setLabel] = useState<string>(blueprint.label);
  const [labelDraft, setLabelDraft] = useState<string>(blueprint.label);
  const [labelStatus, setLabelStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toolError, setToolError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "done" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{
    instanceId: string;
    apiKey: string;
    endpoint: string;
    discovery: unknown;
    capabilities: unknown;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"canvas" | "tools" | "spec">("canvas");

  useEffect(() => {
    setToolsState([...(blueprint.tools as CanvasTool[])]);
    setLabel(blueprint.label);
    setLabelDraft(blueprint.label);
    setSelectedToolId(blueprint.tools[0]?.id ?? null);
    setToolStatus("idle");
    setToolError(null);
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

  const handleAddTool = () => {
    const id = `custom_${Date.now()}`;
    const newTool: CanvasTool = {
      id,
      name: `custom_tool_${toolsState.length + 1}`,
      description: "Custom MCP tool",
      summary: "",
      method: "post",
      path: "/custom-endpoint",
      tags: [],
      inputSchema: {
        type: "object",
        properties: {
          body: {
            type: "object",
            description: "Request payload",
          },
        },
        required: ["body"],
        additionalProperties: false,
      },
      outputSchema: undefined,
      security: undefined,
      httpConfig: {
        baseUrl: toolsState[0]?.httpConfig?.baseUrl,
        parameters: [],
        requestBody: {
          propertyName: "body",
          contentType: "application/json",
          required: true,
        },
        responseContentType: "application/json",
      },
    };

    setToolsState((prev) => [...prev, newTool]);
    setSelectedToolId(id);
    setEditForm({
      name: newTool.name,
      description: newTool.description,
      summary: "",
      tags: "",
      inputSchema: JSON.stringify(newTool.inputSchema, null, 2),
      outputSchema: "",
      security: "",
    });
    setToolStatus("idle");
    setToolError(null);
    setActiveTab("tools");
  };

  const handleSaveTool = async () => {
    if (!selectedTool || !editForm) return;
    setToolStatus("saving");
    setToolError(null);

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
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save blueprint");
      }

      setToolsState(updatedTools);
      setToolStatus("saved");
      router.refresh();
      setTimeout(() => setToolStatus("idle"), 1800);
    } catch (error) {
      setToolError((error as Error).message);
      setToolStatus("error");
    }
  };

  const handleSaveLabel = async () => {
    if (labelDraft === label) return;
    setLabelStatus("saving");
    setLabelError(null);
    try {
      const response = await fetch(`/api/tool-blueprints/${blueprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: labelDraft }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save blueprint name");
      }
      setLabel(labelDraft);
      setLabelStatus("saved");
      router.refresh();
      setTimeout(() => setLabelStatus("idle"), 1800);
    } catch (error) {
      setLabelError((error as Error).message);
      setLabelStatus("error");
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

  const specWarnings = blueprint.warnings ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:max-w-xl">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
              Title
              <input
                value={labelDraft}
                onChange={(event) => setLabelDraft(event.target.value)}
                className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 px-3 py-2 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
              />
            </label>
            <p className="text-xs text-[var(--ui-text-secondary)]">
              Give this blueprint a friendly name to surface it in demos or in the gallery.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveLabel}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-button-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:opacity-60"
              disabled={labelStatus === "saving" || labelDraft === label}
            >
              {labelStatus === "saving" ? "Saving…" : "Save title"}
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
        <div className="flex flex-wrap gap-3 text-xs">
          {labelError ? <span className="text-[var(--color-error-500)]">{labelError}</span> : null}
          {labelStatus === "saved" ? <span className="text-[var(--color-success-500)]">Title saved.</span> : null}
          {publishStatus === "error" && publishError ? (
            <span className="text-[var(--color-error-500)]">{publishError}</span>
          ) : null}
          {publishStatus === "done" && publishResult ? (
            <span className="text-[var(--color-success-500)]">MCP instance published.</span>
          ) : null}
        </div>
        {publishResult ? (
          <div className="grid gap-2 rounded-2xl border border-[var(--color-success-500)]/50 bg-[var(--color-success-500)]/10 p-4 text-xs text-[var(--color-success-700)] md:grid-cols-2">
            <div className="space-y-1">
              <p className="font-semibold text-[var(--color-success-600)]">Endpoint</p>
              <pre className="max-h-24 overflow-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1 text-[10px] text-[var(--ui-text-secondary)]">
                {publishResult.endpoint}
              </pre>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[var(--color-success-600)]">API key (copy immediately)</p>
              <pre className="max-h-24 overflow-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1 text-[10px] text-[var(--ui-text-secondary)]">
                {publishResult.apiKey}
              </pre>
            </div>
            <details className="col-span-2 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/60 p-3">
              <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)]">Discovery payload</summary>
              <pre className="mt-2 max-h-56 overflow-auto text-[10px]">
                {JSON.stringify(publishResult.discovery, null, 2)}
              </pre>
            </details>
            <details className="col-span-2 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/60 p-3">
              <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)]">Capabilities</summary>
              <pre className="mt-2 max-h-56 overflow-auto text-[10px]">
                {JSON.stringify(publishResult.capabilities, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        tabs={[
          { value: "canvas", label: "Canvas" },
          { value: "tools", label: "Tools", badge: String(toolsState.length) },
          { value: "spec", label: "Specification" },
        ]}
      />

      {activeTab === "canvas" ? (
        <div className="grid gap-6 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)] lg:grid-cols-[1fr_0.8fr]">
          <div className="flex flex-col gap-4 text-sm text-[var(--ui-text-secondary)]">
            <h3 className="text-lg font-semibold text-[var(--ui-text-primary)]">Execution flow</h3>
            <p>
              The canvas mirrors the end-to-end journey: the agent triggers <code>tools/call</code>, Nexi validates and
              hydrates the request, invokes the upstream API, then streams data back to the agent. Double-click tool nodes
              to dive into their configuration.
            </p>
            <ul className="space-y-3">
              <li className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-3">
                <p className="font-semibold text-[var(--ui-text-primary)]">Agent Request</p>
                <p className="text-xs">
                  ChatGPT/Claude issues a structured MCP call with the arguments gathered from the conversation.
                </p>
              </li>
              <li className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-3">
                <p className="font-semibold text-[var(--ui-text-primary)]">MCP Runtime</p>
                <p className="text-xs">
                  Nexi validates the schema, injects secrets, and prepares HTTP calls using the steps you define here.
                </p>
              </li>
              <li className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-3">
                <p className="font-semibold text-[var(--ui-text-primary)]">Client API & Response</p>
                <p className="text-xs">
                  The upstream hotel API is called, responses are normalized, and structured content is returned to the agent.
                </p>
              </li>
            </ul>
          </div>
          <BlueprintCanvas tools={toolsState} selectedToolId={selectedToolId} onSelectTool={setSelectedToolId} />
        </div>
      ) : null}

      {activeTab === "tools" ? (
        <div className="grid gap-6 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">Pipeline steps</h3>
                <p className="text-xs text-[var(--ui-text-secondary)]">
                  Select a node to edit fields, rename operations, or adjust schemas. Add custom steps to extend the workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTool}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]/60"
              >
                + Add step
              </button>
            </div>
            <div className="flex max-h-[360px] flex-col gap-2 overflow-auto pr-2">
              {toolsState.map((tool) => {
                const isSelected = selectedToolId === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setSelectedToolId(tool.id)}
                    className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[var(--color-primary-500)] bg-[var(--ui-surface)]"
                        : "border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 hover:border-[var(--ui-border-strong)]"
                    }`}
                  >
                    <span className="font-semibold text-[var(--ui-text-primary)]">{tool.name}</span>
                    <span className="text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                      {tool.method.toUpperCase()} · {tool.path}
                    </span>
                  </button>
                );
              })}
              {toolsState.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 text-xs text-[var(--ui-text-secondary)]">
                  No tools yet. Click “Add step” or run generation again to seed operations.
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-5">
            <header className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">Tool configuration</h3>
              {selectedTool ? (
                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1 text-xs text-[var(--ui-text-secondary)]">
                  {selectedTool.method.toUpperCase()} · {selectedTool.path}
                </span>
              ) : null}
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
                    disabled={toolStatus === "saving"}
                  >
                    {toolStatus === "saving" ? "Saving…" : "Save tool"}
                  </button>
                  {toolStatus === "saved" ? (
                    <span className="text-xs text-[var(--color-success-500)]">Saved.</span>
                  ) : null}
                  {toolStatus === "error" && toolError ? (
                    <span className="text-xs text-[var(--color-error-500)]">{toolError}</span>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="text-sm text-[var(--ui-text-secondary)]">
                Select a node to inspect and edit its configuration.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "spec" ? (
        <div className="grid gap-6 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)] lg:grid-cols-[1fr_0.6fr]">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-[var(--ui-text-primary)]">Source specification</h3>
            <p className="text-sm text-[var(--ui-text-secondary)]">
              This is the document we derived the blueprint from. Re-export it, diff revisions, or re-run ingestion if the
              upstream API changes.
            </p>
            <pre className="max-h-[520px] overflow-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 text-xs leading-6 text-[var(--ui-text-secondary)]">
              {blueprint.raw_spec ?? "No source document stored."}
            </pre>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 text-xs text-[var(--ui-text-secondary)]">
            <h4 className="text-sm font-semibold text-[var(--ui-text-primary)]">Warnings & notes</h4>
            {specWarnings.length ? (
              <ul className="flex list-disc flex-col gap-2 pl-5">
                {specWarnings.map((warning) => (
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
            ) : (
              <p>No warnings recorded for this blueprint.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}