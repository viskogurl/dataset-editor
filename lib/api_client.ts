export async function fetchCompletionContent(): Promise<string> {
  const data = await requestJson("/chat-comp", { method: "GET" });
  return getCompletionContent(data);
}

export async function moderateConcept(concept: string): Promise<boolean> {
  const data = await requestJson("/chat-mod", {
    method: "POST",
    headers: { "content-type": "text/plain; charset=utf-8" },
    body: concept,
  });
  return getModerationFlag(data);
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
