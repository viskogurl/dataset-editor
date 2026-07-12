import { createCompletion } from "@/lib/openai.ts";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET() {
    try {
      const response = await createCompletion();
      return Response.json(response, {
        headers: { "cache-control": "no-store" },
      });
    } catch (error) {
      console.error("Completion request failed", error);
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
