import { formatConversation } from "@/lib/openai.ts";
import { define } from "@/utils.ts";
import { errorJson, noStoreJson } from "@/lib/http_response.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = (await ctx.req.text()).trim();
      if (!body) {
        return noStoreJson({ error: "Conversation text is required." }, {
          status: 400,
        });
      }

      const response = await formatConversation(body);
      return noStoreJson(response);
    } catch (error) {
      console.error("Formatting request failed", error);
      return errorJson(error);
    }
  },
});
