import assert from "node:assert/strict";
import {
  parseDatasetText,
  serializeOpenAIDataset,
  serializePairDataset,
} from "./dataset.ts";

Deno.test("parses prompt-response JSONL", () => {
  const rows = parseDatasetText(
    '["hello","world"]\n["second","answer"]',
    "pairs",
  );
  assert.deepEqual(rows, [
    { prompt: "hello", response: "world" },
    { prompt: "second", response: "answer" },
  ]);
});

Deno.test("auto-detects OpenAI messages JSONL", () => {
  const rows = parseDatasetText(
    JSON.stringify({
      messages: [
        { role: "system", content: "system" },
        { role: "user", content: "prompt" },
        { role: "assistant", content: "response" },
      ],
    }),
  );
  assert.deepEqual(rows, [{ prompt: "prompt", response: "response" }]);
});

Deno.test("reads structured text message content", () => {
  const rows = parseDatasetText(
    JSON.stringify({
      messages: [
        { role: "user", content: [{ type: "text", text: "prompt" }] },
        { role: "assistant", content: [{ type: "text", text: "response" }] },
      ],
    }),
    "openai",
  );
  assert.deepEqual(rows, [{ prompt: "prompt", response: "response" }]);
});

Deno.test("serializes both supported dataset formats", () => {
  const rows = [{ prompt: "p", response: "r" }];
  assert.equal(serializePairDataset(rows), '["p","r"]');

  const exported = JSON.parse(serializeOpenAIDataset(rows));
  assert.equal(exported.messages[1].content, "p");
  assert.equal(exported.messages[2].content, "r");
});
