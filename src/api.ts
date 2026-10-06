export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Could not reach Credora. Check that the API server is running.", 0);
  }

  if (!response.ok) {
    const result = await response.json().catch(() => null) as
      | { error?: string; details?: Array<{ field: string; message: string }> }
      | null;
    const detail = result?.details?.[0];
    const message = detail ? `${detail.field}: ${detail.message}` : result?.error;
    throw new ApiError(message || `The request failed (${response.status}).`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function sendJson<T>(path: string, method: "POST" | "PUT", body: unknown) {
  return api<T>(path, { method, body: JSON.stringify(body) });
}
