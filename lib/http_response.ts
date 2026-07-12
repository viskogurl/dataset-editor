export function noStoreJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(data, { ...init, headers });
}

export function errorJson(error: unknown, status = 500) {
  return noStoreJson({ error: errorMessage(error) }, { status });
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed processing the request.";
}
