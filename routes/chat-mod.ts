import { moderateConcept } from "@/lib/openai.ts";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const concept = (await ctx.req.text()).trim();
      if (!concept) {
        return Response.json(
          { error: "A concept is required." },
          { status: 400 },
        );
      }

      const response = await moderateConcept(concept);
      return Response.json(response, {
        headers: { "cache-control": "no-store" },
      });
    } catch (error) {
      console.error("Moderation request failed", error);
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
