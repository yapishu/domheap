export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const child of children) if (child != null) node.append(child);
  return node;
}
export const link = (text: string, path: string, cls = "") =>
  el("a", { href: `/apps/domheap/${path}`, class: cls }, text);
export function button(
  text: string,
  run: () => void | Promise<void>,
  cls = "",
) {
  const b = el("button", { type: "button", class: cls }, text);
  b.onclick = () => {
    void run();
  };
  return b;
}
export function field(
  label: string,
  name: string,
  value = "",
  type = "text",
  hint = "",
) {
  const input =
    type === "textarea"
      ? el("textarea", { name, id: name })
      : el("input", { name, id: name, type });
  input.value = value;
  return el(
    "label",
    { class: "field", for: name },
    el("span", {}, label),
    input,
    hint ? el("small", {}, hint) : null,
  );
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
export function status() {
  return el("p", { class: "status", role: "status", "aria-live": "polite" });
}
export async function submit(
  form: HTMLFormElement,
  note: HTMLElement,
  run: (data: FormData) => Promise<void>,
) {
  form.onsubmit = async (e) => {
    e.preventDefault();
    const controls = [...form.querySelectorAll<HTMLButtonElement>("button")];
    controls.forEach((b) => (b.disabled = true));
    note.textContent = "Saving…";
    try {
      await run(new FormData(form));
      note.textContent = "Saved.";
    } catch (error) {
      note.textContent = message(error);
      note.classList.add("error");
    } finally {
      controls.forEach((b) => (b.disabled = false));
    }
  };
}
export const date = (time: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(time);
export function safeImage(url: string): string {
  try {
    const parsed = new URL(url, location.origin);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}
