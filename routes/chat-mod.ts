import { moderateConcept } from "@/lib/openai.ts";
import { define } from "@/utils.ts";
import { errorJson, noStoreJson } from "@/lib/http_response.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const concept = (await ctx.req.text()).trim();
      if (!concept) {
        return noStoreJson({ error: "A concept is required." }, {
          status: 400,
        });
      }

      const response = await moderateConcept(concept);
      return noStoreJson(response);
    } catch (error) {
      console.error("Moderation request failed", error);
      return errorJson(error);
    }
  },
});
