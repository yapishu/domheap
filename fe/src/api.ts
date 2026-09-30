export const base = "/apps/domheap";
export async function request<T>(
  path: string,
  data?: unknown,
  method = data === undefined ? "GET" : "POST",
  headers: Record<string, string> = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    method === "GET" && !path.includes("/remote/") ? 15000 : 35000,
  );
  try {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-domheap": "1",
        ...headers,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const result = await response.json().catch((error: unknown) => {
      if (controller.signal.aborted) throw error;
      throw new Error(
        `The ship returned an invalid response (${response.status}).`,
      );
    });
    if (!response.ok)
      throw new Error(result.error || `Request failed (${response.status}).`);
    return result as T;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        method === "GET"
          ? "The ship did not respond. Try again."
          : "The request timed out. Check whether the change was saved before trying again.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export const api = <T>(path: string, data?: unknown) =>
  request<T>(`${base}/api/${path}`, data);
export const action = (op: string, fields: Record<string, unknown> = {}) =>
  api("action", { op, ...fields });
export const remote = (host: string, path: string) =>
  `remote/${encodeURIComponent(host)}/${path}`;
