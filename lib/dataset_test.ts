import assert from "node:assert/strict";
import {
  parseDatasetText,
  serializeOpenAIDataset,
} from "./dataset.ts";

Deno.test("parses OpenAI messages JSONL", () => {
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

Deno.test("rejects prompt-response JSONL arrays", () => {
  assert.throws(
    () => parseDatasetText('["hello","world"]'),
    /Line 1 must be an OpenAI messages JSON object\./,
  );
});

Deno.test("reads structured text message content", () => {
  const rows = parseDatasetText(
    JSON.stringify({
      messages: [
        { role: "user", content: [{ type: "text", text: "prompt" }] },
        { role: "assistant", content: [{ type: "text", text: "response" }] },
      ],
    }),
  );
  assert.deepEqual(rows, [{ prompt: "prompt", response: "response" }]);
});

Deno.test("serializes OpenAI messages JSONL", () => {
  const rows = [{ prompt: "p", response: "r" }];
  const exported = JSON.parse(serializeOpenAIDataset(rows));
  assert.equal(exported.messages[1].content, "p");
  assert.equal(exported.messages[2].content, "r");
});
