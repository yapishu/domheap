import Urbit from "@urbit/http-api";
export const base = "/apps/domheap";
export async function request<T>(
  path: string,
  data?: unknown,
  method = data === undefined ? "GET" : "POST",
  headers: Record<string, string> = {},
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-domheap": "1",
      ...headers,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const result = await response
    .json()
    .catch(() => ({ error: `Request failed (${response.status}).` }));
  if (!response.ok)
    throw new Error(result.error || `Request failed (${response.status}).`);
  return result as T;
}
export const api = <T>(path: string, data?: unknown) =>
  request<T>(`${base}/api/${path}`, data);
export const action = (op: string, fields: Record<string, unknown> = {}) =>
  api("action", { op, ...fields });
export const remote = (host: string, path: string) =>
  `remote/${encodeURIComponent(host)}/${path}`;
export function updates(ship: string, refresh: () => void) {
  const channel = new Urbit("", "", "domheap");
  channel.ship = ship.replace(/^~/, "");
  channel.onError = () => {};
  channel
    .subscribe({
      app: "domheap",
      path: "/updates",
      event: refresh,
      err: () => {},
    })
    .catch(() => {});
  window.addEventListener(
    "pagehide",
    () => {
      void channel.delete();
    },
    { once: true },
  );
}
