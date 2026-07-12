import { createCompletion } from "@/lib/openai.ts";
import { define } from "@/utils.ts";
import { errorJson, noStoreJson } from "@/lib/http_response.ts";

export const handler = define.handlers({
  async GET() {
    try {
      const response = await createCompletion();
      return noStoreJson(response);
    } catch (error) {
      console.error("Completion request failed", error);
      return errorJson(error);
    }
  },
});
