import OpenAI from "openai";
import { GENERATION_PROMPT, SYSTEM_PROMPT } from "./dataset.ts";

const DEFAULT_COMPLETION_MODEL =
  "ft:gpt-4o-2024-08-06:kippai:reels-inspo-v011:AAvcJeg1";
const DEFAULT_FORMAT_MODEL =
  "ft:gpt-3.5-turbo-0125:kippai:convert-v0011:9LaXlICm";
const DEFAULT_MODERATION_MODEL = "omni-moderation-latest";

let client: OpenAI | undefined;

export async function createCompletion() {
  const startedAt = performance.now();
  const response = await getClient().chat.completions.create({
    model: Deno.env.get("OPENAI_COMPLETION_MODEL") ?? DEFAULT_COMPLETION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `${GENERATION_PROMPT} Please do not suggest concepts involving plants, the gym, remembering embarrassing moments, Jell-O, cereal, hot Cheetos, spaghetti, salad, folding fitted sheets, cats, or dogs.`,
      },
    ],
    temperature: 1,
    max_tokens: 4000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  console.log(
    `createCompletion completed in ${
      (performance.now() - startedAt).toFixed(2)
    }ms`,
  );
  return response;
}

export async function formatConversation(messages: string) {
  const startedAt = performance.now();
  const response = await getClient().chat.completions.create({
    model: Deno.env.get("OPENAI_FORMAT_MODEL") ?? DEFAULT_FORMAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a conversational consultant, analyzing dialogues to enhance user engagement and optimize conversation design. Employ your expertise in conversation analysis to identify patterns, suggest improvements, and facilitate more effective and engaging interactions between users.",
      },
      { role: "user", content: messages },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  console.log(
    `formatConversation completed in ${
      (performance.now() - startedAt).toFixed(2)
    }ms`,
  );
  return response;
}

export async function moderateConcept(concept: string) {
  const startedAt = performance.now();
  const response = await getClient().moderations.create({
    model: Deno.env.get("OPENAI_MODERATION_MODEL") ?? DEFAULT_MODERATION_MODEL,
    input: concept,
  });

  console.log(
    `moderateConcept completed in ${
      (performance.now() - startedAt).toFixed(2)
    }ms`,
  );
  return response;
}

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it locally or in Deno Deploy environment variables.",
    );
  }

  client = new OpenAI({ apiKey });
  return client;
}
