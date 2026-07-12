import type { JSX } from "preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import {
  type DatasetPair,
  GENERATION_PROMPT,
  type ImportMode,
  parseDatasetText,
  serializeOpenAIDataset,
  serializePairDataset,
} from "@/lib/dataset.ts";

interface EditorRow extends DatasetPair {
  id: string;
  flagged?: boolean;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "info" | "success" | "error";
}

interface AppStatus {
  message: string;
  state: "ready" | "working" | "error";
}

interface WritableFileHandle {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface SaveFileHandle {
  createWritable(): Promise<WritableFileHandle>;
}

interface FilePickerWindow extends Window {
  showSaveFilePicker?: (options: unknown) => Promise<SaveFileHandle>;
}

const POLL_DELAY_MS = 650;

export default function DatasetEditor() {
  const [rows, setRows] = useState<EditorRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AppStatus>({
    message: "Ready",
    state: "ready",
  });
  const [isPolling, setIsPolling] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImportMode = useRef<ImportMode>("auto");
  const pollingRef = useRef(false);
  const toastIdRef = useRef(0);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      `${row.prompt} ${row.response}`.toLocaleLowerCase().includes(
        normalizedQuery,
      )
    );
  }, [query, rows]);

  const showToast = useCallback((
    message: string,
    type: ToastMessage["type"] = "info",
  ) => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message, type }]);
    globalThis.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const focusRow = useCallback((id: string) => {
    globalThis.requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLTextAreaElement>(
        `[data-row-id="${id}"] textarea`,
      );
      editor?.focus();
      editor?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const addRow = useCallback(() => {
    const row = createEditorRow();
    setRows((current) => [...current, row]);
    focusRow(row.id);
  }, [focusRow]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("dataset-studio-theme");
    const preferredTheme = globalThis.matchMedia("(prefers-color-scheme: dark)")
        .matches
      ? "dark"
      : "light";
    const resolvedTheme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : preferredTheme;
    setTheme(resolvedTheme);
    document.documentElement.dataset.theme = resolvedTheme;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        addRow();
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("#datasetSearch")?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [addRow]);

  useEffect(() => {
    return () => {
      pollingRef.current = false;
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("dataset-studio-theme", nextTheme);
    showToast(`${nextTheme === "dark" ? "Dark" : "Light"} theme enabled.`);
  };

  const updateRow = (
    id: string,
    field: "prompt" | "response",
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) => row.id === id ? { ...row, [field]: value } : row)
    );
  };

  const deleteRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
    showToast("Row removed.", "success");
  };

  const chooseImport = (mode: ImportMode) => {
    pendingImportMode.current = mode;
    fileInputRef.current?.click();
  };

  const importFile = async (file: File, mode: ImportMode) => {
    try {
      const pairs = parseDatasetText(await file.text(), mode);
      setRows(pairs.map((pair) => createEditorRow(pair)));
      setQuery("");
      showToast(
        `${pairs.length} example${
          pairs.length === 1 ? "" : "s"
        } imported from ${file.name}.`,
        "success",
      );
    } catch (error) {
      console.error("Dataset import failed", error);
      showToast(errorMessage(error), "error");
    }
  };

  const onFileChange: JSX.GenericEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const file = event.currentTarget.files?.[0];
    if (file) await importFile(file, pendingImportMode.current);
    pendingImportMode.current = "auto";
    event.currentTarget.value = "";
  };

  const onDrop: JSX.DragEventHandler<HTMLElement> = async (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("is-dragging");
    const file = event.dataTransfer?.files?.[0];
    if (file) await importFile(file, "auto");
  };

  const saveWorkingDataset = async () => {
    if (rows.length === 0) {
      showToast("Add at least one row before saving.", "error");
      return;
    }

    try {
      await saveTextFile(
        serializePairDataset(rows),
        "dataset.jsonl",
        "application/json",
      );
      showToast("Working dataset saved.", "success");
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("Dataset save failed", error);
      showToast("The dataset could not be saved.", "error");
    }
  };

  const exportOpenAIDataset = () => {
    if (rows.length === 0) {
      showToast("Add at least one row before exporting.", "error");
      return;
    }

    downloadTextFile(
      serializeOpenAIDataset(rows),
      "openai-dataset.jsonl",
      "application/json",
    );
    showToast("OpenAI dataset exported.", "success");
  };

  const startPolling = async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setIsPolling(true);
    setStatus({ message: "Polling API", state: "working" });

    let failed = false;
    try {
      while (pollingRef.current) {
        const response = await fetch("/chat-comp", { method: "GET" });
        const data = await readJsonResponse(response);
        const content = getCompletionContent(data);
        const row = createEditorRow({
          prompt: GENERATION_PROMPT,
          response: content,
        });
        setRows((current) => [...current, row]);
        focusRow(row.id);

        if (pollingRef.current) await delay(POLL_DELAY_MS);
      }
    } catch (error) {
      failed = true;
      console.error("API polling failed", error);
      pollingRef.current = false;
      setStatus({ message: "API error", state: "error" });
      showToast(errorMessage(error), "error");
    } finally {
      setIsPolling(false);
      if (!failed) setStatus({ message: "Ready", state: "ready" });
      pollingRef.current = false;
    }
  };

  const stopPolling = () => {
    pollingRef.current = false;
    showToast("Polling will stop after the current request.");
  };

  const moderateResponses = async () => {
    const sourceRows = rows.filter((row) => !row.flagged);
    if (sourceRows.length === 0) {
      showToast("There are no responses to moderate.", "error");
      return;
    }

    setIsModerating(true);
    let flaggedCount = 0;

    try {
      for (let index = 0; index < sourceRows.length; index += 1) {
        setStatus({
          message: `Moderating ${index + 1}/${sourceRows.length}`,
          state: "working",
        });
        const concept = sourceRows[index].response;
        const response = await fetch("/chat-mod", {
          method: "POST",
          headers: { "content-type": "text/plain; charset=utf-8" },
          body: concept,
        });
        const data = await readJsonResponse(response);
        if (getModerationFlag(data)) {
          flaggedCount += 1;
          setRows((current) => [
            ...current,
            createEditorRow({
              prompt: "Flagged by moderation",
              response: concept,
            }, true),
          ]);
        }
      }

      setStatus({ message: "Ready", state: "ready" });
      showToast(
        flaggedCount
          ? `${flaggedCount} flagged response${
            flaggedCount === 1 ? "" : "s"
          } added for review.`
          : "Moderation complete. No responses were flagged.",
        "success",
      );
    } catch (error) {
      console.error("Moderation failed", error);
      setStatus({ message: "Moderation error", state: "error" });
      showToast(errorMessage(error), "error");
    } finally {
      setIsModerating(false);
    }
  };

  return (
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="/" aria-label="Dataset Studio home">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v12.5A2.75 2.75 0 0 1 16.25 21h-8.5A2.75 2.75 0 0 1 5 18.25V5.75Z" />
              <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
            </svg>
          </span>
          <span>
            <strong>Dataset Studio</strong>
            <small>Fresh fine-tuning workspace</small>
          </span>
        </a>

        <div class="topbar-actions">
          <div
            class="sync-status"
            data-state={status.state}
            role="status"
            aria-live="polite"
          >
            <span class="status-dot" aria-hidden="true" />
            <span>{status.message}</span>
          </div>
          <button
            class="icon-button"
            type="button"
            aria-label="Switch color theme"
            title="Switch color theme"
            onClick={toggleTheme}
          >
            <svg
              class="theme-icon theme-icon-sun"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <svg
              class="theme-icon theme-icon-moon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.4 15.1A8.5 8.5 0 0 1 8.9 3.6 8.5 8.5 0 1 0 20.4 15.1Z" />
            </svg>
          </button>
        </div>
      </header>

      <main class="workspace">
        <section class="editor-column" aria-labelledby="pageTitle">
          <div class="page-heading">
            <div>
              <span class="eyebrow">Dataset editor</span>
              <h1 id="pageTitle">Shape better training data.</h1>
              <p>
                Edit prompt-response pairs, review generated concepts, and
                export a clean OpenAI-ready dataset.
              </p>
            </div>
            <div class="heading-actions">
              <input
                ref={fileInputRef}
                class="visually-hidden"
                type="file"
                accept=".jsonl,.json,.txt,application/json,text/plain"
                onChange={onFileChange}
              />
              <button
                class="button button-secondary"
                type="button"
                onClick={() => chooseImport("auto")}
              >
                <UploadIcon />
                Import file
              </button>
              <button
                class="button button-primary"
                type="button"
                onClick={addRow}
              >
                <PlusIcon />
                Add row
              </button>
            </div>
          </div>

          <section class="summary-grid" aria-label="Dataset summary">
            <SummaryCard
              icon={<DatasetIcon />}
              label="Total examples"
              value={String(rows.length)}
            />
            <SummaryCard
              icon={<VisibleIcon />}
              label="Visible examples"
              value={String(visibleRows.length)}
            />
            <SummaryCard
              wide
              icon={<ShieldCheckIcon />}
              label="Output format"
              value="OpenAI JSONL"
            />
          </section>

          <section
            class="data-card"
            onDragOver={(event) => {
              event.preventDefault();
              event.currentTarget.classList.add("is-dragging");
            }}
            onDragLeave={(event) => {
              event.currentTarget.classList.remove("is-dragging");
            }}
            onDrop={onDrop}
          >
            <div class="data-card-header">
              <div>
                <h2>Prompt-response pairs</h2>
                <p>
                  Edit any field directly. Changes stay in the browser until you
                  save or export.
                </p>
              </div>
              <div class="search-field">
                <SearchIcon />
                <input
                  type="search"
                  id="datasetSearch"
                  placeholder="Search examples"
                  aria-label="Search dataset examples"
                  value={query}
                  onInput={(event) => setQuery(event.currentTarget.value)}
                />
                <kbd>⌘ K</kbd>
              </div>
            </div>

            {rows.length === 0
              ? (
                <div class="empty-state">
                  <span class="empty-illustration" aria-hidden="true">
                    <EmptyFileIcon />
                  </span>
                  <h3>Your dataset is ready for its first example</h3>
                  <p>
                    Add a blank row, drop or import a JSONL file, or poll the
                    API to start building your dataset.
                  </p>
                  <button
                    class="button button-primary"
                    type="button"
                    onClick={addRow}
                  >
                    Add first row
                  </button>
                </div>
              )
              : (
                <div class="table-container">
                  <table id="resultTable">
                    <thead>
                      <tr>
                        <th scope="col" class="index-column">#</th>
                        <th scope="col">User prompt</th>
                        <th scope="col">Assistant response</th>
                        <th scope="col" class="actions-column">
                          <span class="visually-hidden">Row actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => {
                        const rowNumber = rows.findIndex((item) =>
                          item.id === row.id
                        ) + 1;
                        return (
                          <tr
                            key={row.id}
                            data-row-id={row.id}
                            data-flagged={row.flagged ? "true" : undefined}
                          >
                            <td class="row-index">{rowNumber}</td>
                            <td class="editor-cell">
                              <textarea
                                class="cell-editor"
                                aria-label={`User prompt for row ${rowNumber}`}
                                placeholder="Write the user prompt…"
                                value={row.prompt}
                                onInput={(event) =>
                                  updateRow(
                                    row.id,
                                    "prompt",
                                    event.currentTarget.value,
                                  )}
                              />
                            </td>
                            <td class="editor-cell">
                              <textarea
                                class="cell-editor"
                                aria-label={`Assistant response for row ${rowNumber}`}
                                placeholder="Write the assistant response…"
                                value={row.response}
                                onInput={(event) =>
                                  updateRow(
                                    row.id,
                                    "response",
                                    event.currentTarget.value,
                                  )}
                              />
                            </td>
                            <td class="row-actions">
                              <button
                                type="button"
                                class="row-action-button"
                                aria-label={`Delete row ${rowNumber}`}
                                title="Delete row"
                                onClick={() => deleteRow(row.id)}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {visibleRows.length === 0 && (
                    <div class="no-results">
                      <SearchIcon />
                      <strong>No matching examples</strong>
                      <span>Try a different search term.</span>
                    </div>
                  )}
                </div>
              )}
          </section>
        </section>

        <aside class="side-panel" aria-label="Dataset controls">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Controls</span>
              <h2>Workspace actions</h2>
            </div>
          </div>

          <section class="panel-section">
            <div class="section-heading">
              <span>Dataset</span>
              <small>Manage local rows</small>
            </div>
            <PanelButton
              icon={<DownloadIcon />}
              title="Load dataset"
              description="Import prompt-response JSONL"
              onClick={() => chooseImport("pairs")}
            />
            <PanelButton
              icon={<CubeIcon />}
              title="Load OpenAI file"
              description="Import messages-format JSONL"
              onClick={() => chooseImport("openai")}
            />
            <PanelButton
              icon={<SaveIcon />}
              title="Save working data"
              description="Download editable row pairs"
              onClick={saveWorkingDataset}
            />
            <PanelButton
              accent
              icon={<UploadIcon />}
              title="Export OpenAI dataset"
              description="Create fine-tuning JSONL"
              onClick={exportOpenAIDataset}
            />
          </section>

          <section class="panel-section">
            <div class="section-heading">
              <span>Automation</span>
              <small>Generate and review</small>
            </div>
            <PanelButton
              icon={<PollIcon />}
              title="Start API polling"
              description="Append generated concepts"
              disabled={isPolling || isModerating}
              onClick={startPolling}
            />
            <PanelButton
              icon={<StopIcon />}
              title="Stop polling"
              description="Cancel after current request"
              disabled={!isPolling}
              onClick={stopPolling}
            />
            <PanelButton
              icon={<ModerateIcon />}
              title="Moderate responses"
              description="Review every assistant output"
              disabled={isModerating || isPolling}
              onClick={moderateResponses}
            />
          </section>

          <div class="panel-tip">
            <InfoIcon />
            <p>
              <strong>Tip:</strong> Press <kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd>
              {" "}
              to add a new row from anywhere.
            </p>
          </div>
        </aside>
      </main>

      <div class="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div class="toast" data-type={toast.type} key={toast.id}>
            <span class="toast-dot" aria-hidden="true" />
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard(props: {
  icon: JSX.Element;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <article class={`summary-card${props.wide ? " summary-card-wide" : ""}`}>
      <span class="summary-icon" aria-hidden="true">{props.icon}</span>
      <span>
        <small>{props.label}</small>
        <strong>{props.value}</strong>
      </span>
    </article>
  );
}

function PanelButton(props: {
  icon: JSX.Element;
  title: string;
  description: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      class={`panel-button${props.accent ? " panel-button-accent" : ""}`}
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <span class="panel-button-icon">{props.icon}</span>
      <span>
        <strong>{props.title}</strong>
        <small>{props.description}</small>
      </span>
    </button>
  );
}

function createEditorRow(
  pair: DatasetPair = { prompt: "", response: "" },
  flagged = false,
): EditorRow {
  return {
    id: crypto.randomUUID(),
    prompt: pair.prompt,
    response: pair.response,
    flagged,
  };
}

async function readJsonResponse(response: Response): Promise<unknown> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `The server returned an invalid response (${response.status}).`,
    );
  }

  if (!response.ok) {
    const message = isRecord(data) && typeof data.error === "string"
      ? data.error
      : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data;
}

function getCompletionContent(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    throw new Error("The completion response did not contain any choices.");
  }
  const firstChoice = value.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("The completion response did not contain a message.");
  }
  const content = firstChoice.message.content;
  if (typeof content !== "string") {
    throw new Error("The completion response did not contain text content.");
  }
  return content;
}

function getModerationFlag(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.results)) return false;
  const firstResult = value.results[0];
  return isRecord(firstResult) && firstResult.flagged === true;
}

async function saveTextFile(
  content: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const pickerWindow = globalThis as unknown as FilePickerWindow;
  if (!pickerWindow.showSaveFilePicker) {
    downloadTextFile(content, fileName, mimeType);
    return;
  }

  const handle = await pickerWindow.showSaveFilePicker({
    suggestedName: fileName,
    types: [{
      description: "JSON Lines file",
      accept: { [mimeType]: [".jsonl"] },
    }],
  });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request failed. Check the server and try again.";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v12M7.5 11.5 12 16l4.5-4.5M5 19h14" />
    </svg>
  );
}
function DatasetIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11Z" />
      <path d="M8.5 9h7M8.5 12h7M8.5 15h4" />
    </svg>
  );
}
function VisibleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M7 17 17 7M8 7h9v9" />
      <path d="M5 5v14h14" />
    </svg>
  );
}
function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 3 4.5 7v5c0 4.6 3.2 7.7 7.5 9 4.3-1.3 7.5-4.4 7.5-9V7L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
function EmptyFileIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <path d="M17 13h22l8 8v30H17V13Z" />
      <path d="M39 13v10h8M24 31h16M24 38h16M24 45h10" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}
function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h12l2 2v14H5V4Z" />
      <path d="M8 4v6h8V4M8 20v-6h8v6" />
    </svg>
  );
}
function PollIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}
function ModerateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4.5 7v5c0 4.6 3.2 7.7 7.5 9 4.3-1.3 7.5-4.4 7.5-9V7L12 3Z" />
      <path d="M9 12h6" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
