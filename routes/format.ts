import { formatConversation } from "@/lib/openai.ts";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = (await ctx.req.text()).trim();
      if (!body) {
        return Response.json(
          { error: "Conversation text is required." },
          { status: 400 },
        );
      }

      const response = await formatConversation(body);
      return Response.json(response, {
        headers: { "cache-control": "no-store" },
      });
    } catch (error) {
      console.error("Formatting request failed", error);
      return Response.json(
        { error: errorMessage(error) },
        { status: 500, headers: { "cache-control": "no-store" } },
      );
    }
  },
});

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed processing the request.";
}
