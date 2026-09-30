import { request } from "./api";
/** Notes reports application failures inside its JSON response envelope. */
export async function notesRequest<T = unknown>(
  path: string,
  data?: unknown,
  method = data === undefined ? "GET" : "POST",
): Promise<T> {
  const result = await request<any>(path, data, method);
  if (result.body?.type === "error") {
    const kind = result.body.errorType;
    const detail = Array.isArray(result.body.message)
      ? result.body.message.join("\n")
      : String(result.body.message ?? "");
    throw new Error(
      kind === "conflict" || /revision|conflict/i.test(detail)
        ? "This post changed in Notes. Copy your draft, reload the post, and merge your changes before publishing."
        : detail || `Notes could not save this change (${kind}).`,
    );
  }
  if (result.body?.type === "pending")
    throw new Error(
      "Notes has not confirmed this change. Check the notebook before trying again.",
    );
  return result as T;
}
