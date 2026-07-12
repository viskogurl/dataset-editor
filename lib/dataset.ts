export type ImportMode = "auto" | "pairs" | "openai";

export interface DatasetPair {
  prompt: string;
  response: string;
}

export const SYSTEM_PROMPT =
  "You are a Social Media Expert specializing in creating viral content for Instagram, TikTok, and other short-form video platforms. Your expertise includes trend analysis, creative video concepts, and maximizing engagement through catchy hooks, humor, and relatable moments. You have a deep understanding of current social media trends and how to leverage them to make content that resonates with broad audiences and goes viral.";

export const GENERATION_PROMPT =
  "Create a unique and engaging Instagram Reels video concept that has the potential to go viral. The video should be visually captivating and resonate with a broad audience. Consider current social media trends, humor, relatable moments, or challenges that encourage user participation. The idea should be easy to replicate and share, with a catchy hook that grabs attention in the first few seconds. Make sure the content can be adapted for various niches and has the potential to inspire others to create their own version.";

export function parseDatasetText(
  text: string,
  requestedMode: ImportMode = "auto",
): DatasetPair[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) throw new Error("The selected file is empty.");

  const parsedLines = lines.map((line, index) => {
    try {
      return JSON.parse(line) as unknown;
    } catch {
      throw new Error(`Line ${index + 1} is not valid JSON.`);
    }
  });

  const mode = requestedMode === "auto"
    ? detectImportMode(parsedLines[0])
    : requestedMode;

  return parsedLines.map((value, index) =>
    parseDatasetRow(value, mode, index + 1)
  );
}

export function serializePairDataset(rows: DatasetPair[]): string {
  return rows.map((row) => JSON.stringify([row.prompt, row.response])).join(
    "\n",
  );
}

export function serializeOpenAIDataset(rows: DatasetPair[]): string {
  return rows.map((row) =>
    JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: row.prompt },
        { role: "assistant", content: row.response },
      ],
    })
  ).join("\n");
}

function detectImportMode(value: unknown): Exclude<ImportMode, "auto"> {
  return isRecord(value) && Array.isArray(value.messages) ? "openai" : "pairs";
}

function parseDatasetRow(
  value: unknown,
  mode: Exclude<ImportMode, "auto">,
  lineNumber: number,
): DatasetPair {
  if (mode === "openai") {
    if (!isRecord(value) || !Array.isArray(value.messages)) {
      throw new Error(`Line ${lineNumber} does not contain a messages array.`);
    }

    const messages = value.messages.filter(isRecord);
    const userMessage = messages.find((message) => message.role === "user");
    const assistantMessage = messages.find((message) =>
      message.role === "assistant"
    );

    return {
      prompt: contentToText(userMessage?.content),
      response: contentToText(assistantMessage?.content),
    };
  }

  if (!Array.isArray(value) || value.length < 2) {
    throw new Error(
      `Line ${lineNumber} must be a JSON array with a prompt and response.`,
    );
  }

  return {
    prompt: valueToText(value[0]),
    response: valueToText(value[1]),
  };
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return valueToText(content);

  return content.map((part) => {
    if (typeof part === "string") return part;
    if (isRecord(part) && typeof part.text === "string") return part.text;
    return "";
  }).filter(Boolean).join("\n");
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
