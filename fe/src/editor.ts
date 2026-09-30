import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { notesRequest as request } from "./notes";
import { el, field, button, status, message } from "./dom";
import type { Author } from "./types";
const Paywall = Node.create({
  name: "paywall",
  group: "block",
  atom: true,
  parseHTML() {
    return [{ tag: "div[data-paywall]" }];
  },
  renderHTML() {
    return [
      "div",
      { "data-paywall": "", class: "paywall-divider" },
      "Subscribers continue below",
    ];
  },
  markdownTokenizer: {
    name: "paywall",
    level: "block",
    start: (src: string) => src.indexOf("<<<paywall>>>"),
    tokenize: (src: string) => {
      const match = /^<<<paywall>>>\s*(?:\n|$)/.exec(src);
      return match ? { type: "paywall", raw: match[0] } : undefined;
    },
  },
  parseMarkdown: () => ({ type: "paywall" }),
  renderMarkdown: () => "<<<paywall>>>",
});
export async function editorScreen(
  author: Author,
  id: string | undefined,
  onSave: () => void,
) {
  const nb = author.notebooks.find(
    (n) => n.name === author.notebook && n.host === author.publication.host,
  );
  if (!nb)
    throw new Error("Choose a private notebook in Publication before writing.");
  const path = `/notes/~/v1/notebooks/${nb.host}/${nb.name}/notes`;
  let revision = 0,
    originalTitle = "",
    body = "";
  if (id) {
    const response = await request<any>(`${path}/${id}`);
    const note = response.note ?? response.body?.note ?? response;
    body = note.bodyMd;
    originalTitle = note.title;
    revision = note.revision;
    if (typeof body !== "string")
      throw new Error(
        "The notebook returned an unreadable note. Open it in Notes.",
      );
  }
  const root = el(
    "section",
    { class: "editor-screen" },
    el("h1", {}, id ? "Edit post" : "Write a post"),
    el(
      "p",
      { class: "muted" },
      "Saving publishes directly from your notebook.",
    ),
  );
  const title = field("Title", "title", originalTitle);
  const titleInput = title.querySelector("input")!;
  titleInput.required = true;
  const mode = el(
    "select",
    { "aria-label": "Editor mode" },
    el("option", { value: "source" }, "Markdown"),
    el("option", { value: "rich" }, "Rich text"),
  );
  const source = el("textarea", {
    "aria-label": "Post Markdown",
    class: "source-editor",
    spellcheck: "true",
  });
  source.value = body;
  const content = el("div", { class: "rich-editor" });
  content.hidden = true;
  let editor: Editor | undefined;
  let dirty = false;
  const note = status();
  const warning = el(
    "p",
    { class: "muted" },
    "Markdown preserves every part of your source. Rich text supports headings, lists, quotes, links, and a subscriber break.",
  );
  const toolbar = el(
    "div",
    { class: "toolbar" },
    mode,
    button("Subscriber break", () => {
      dirty = true;
      if (mode.value === "rich")
        editor?.chain().focus().insertContent({ type: "paywall" }).run();
      else {
        source.setRangeText(
          "\n\n<<<paywall>>>\n\n",
          source.selectionStart,
          source.selectionEnd,
          "end",
        );
        source.focus();
      }
    }),
  );
  const formatting: HTMLButtonElement[] = [];
  for (const [label, cmd] of [
    ["Bold", "toggleBold"],
    ["Italic", "toggleItalic"],
    ["Heading", "heading"],
    ["Quote", "toggleBlockquote"],
  ] as const) {
    const control = button(label, () => {
      if (!editor || mode.value !== "rich") return;
      const chain = editor.chain().focus();
      if (cmd === "heading") chain.toggleHeading({ level: 2 }).run();
      else chain[cmd]().run();
    });
    control.disabled = true;
    formatting.push(control);
    toolbar.append(control);
  }
  mode.onchange = () => {
    formatting.forEach((control) => (control.disabled = mode.value !== "rich"));
    if (mode.value === "rich") {
      editor?.destroy();
      editor = new Editor({
        element: content,
        extensions: [StarterKit, Markdown, Paywall],
        content: source.value,
        contentType: "markdown",
        onUpdate: () => (dirty = true),
      });
      content.hidden = false;
      source.hidden = true;
    } else {
      source.value = editor?.getMarkdown() ?? source.value;
      content.hidden = true;
      source.hidden = false;
    }
  };
  source.oninput = () => (dirty = true);
  titleInput.oninput = () => (dirty = true);
  const save = button(
    "Publish post",
    async () => {
      save.disabled = true;
      note.textContent = "Publishing…";
      try {
        const text =
          mode.value === "rich" ? editor!.getMarkdown() : source.value;
        if (!titleInput.value.trim())
          throw new Error("Give this post a title.");
        if (id) {
          const saved = await request<any>(
            `${path}/${id}`,
            { body: text, expectedRevision: revision },
            "PUT",
          );
          if (saved.body.type === "ok")
            revision = saved.body.response.update.noteUpdate.note.revision;
          if (titleInput.value !== originalTitle) {
            await request(`${path}/${id}`, { title: titleInput.value }, "PUT");
            originalTitle = titleInput.value;
          }
        } else {
          await request(path, {
            title: titleInput.value,
            body: text,
            folder: Number(nb.rootFolderId),
          });
        }
        dirty = false;
        note.textContent = "Published.";
        onSave();
      } catch (error) {
        note.textContent = message(error);
      } finally {
        save.disabled = false;
      }
    },
    "primary",
  );
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (dirty) event.preventDefault();
  };
  window.addEventListener("beforeunload", beforeUnload);
  root.append(
    title,
    toolbar,
    warning,
    source,
    content,
    el("div", { class: "actions" }, save),
    note,
  );
  return {
    element: root,
    dispose: () => {
      editor?.destroy();
      window.removeEventListener("beforeunload", beforeUnload);
    },
    dirty: () => dirty,
  };
}
