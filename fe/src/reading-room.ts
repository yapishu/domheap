import { api, action, remote } from "./api";
import { el, button, field, status, message } from "./dom";
import { postList, showPost } from "./publication";
import type { Author, Session, Post, Publication, Index } from "./types";
export async function readingRoom(
  main: HTMLElement,
  route: string,
  session: Session,
  isCurrent: () => boolean,
  reader: (body: string) => HTMLElement,
  refresh: () => void | Promise<void>,
) {
  if (!session.owner)
    throw new Error("Open Domheap on your own ship to use the reading room.");
  const author = await api<Author>("author");
  if (!isCurrent()) return;
  const [, host, id] = route.split("/");
  if (host && id) {
    const [post, p, s] = await Promise.all([
      api<Post>(remote(host, `posts/${id}`)),
      api<Publication>(remote(host, "publication")),
      api<Session>(remote(host, "session")),
    ]);
    if (!isCurrent()) return;
    showPost(main, post, p, s, reader, session.host, host);
    return;
  }
  main.append(
    el("h1", {}, "Reading room"),
    el(
      "p",
      { class: "intro" },
      "Publications you follow, read directly from their ships.",
    ),
  );
  const form = el("form", { class: "inline-form" }),
    note = status(),
    input = field(
      "Publication ship",
      "ship",
      "",
      "text",
      "Enter the author’s ship to follow their writing.",
    );
  form.append(
    input,
    el("button", { type: "submit", class: "primary" }, "Follow publication"),
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await action("follow", { ship: new FormData(form).get("ship") });
      void refresh();
    } catch (error) {
      note.textContent = message(error);
    }
  };
  main.append(form, note);
  if (!author.following.length)
    main.append(
      el(
        "div",
        { class: "empty" },
        el("h2", {}, "Make room for good writing."),
        el(
          "p",
          {},
          "Follow a publication above. Subscriber posts use the access granted to your ship.",
        ),
      ),
    );
  const sections = author.following.map((host) => {
    const section = el(
      "section",
      { class: "feed-section" },
      el(
        "div",
        { class: "section-heading" },
        el("h2", {}, host),
        button("Unfollow", async () => {
          await action("unfollow", { ship: host });
          void refresh();
        }),
      ),
      el("p", { class: "muted" }, "Fetching from the author’s ship…"),
    );
    main.append(section);
    return { host, section };
  });
  await Promise.all(
    sections.map(async ({ host, section }) => {
      try {
        const index = await api<Index>(remote(host, "posts"));
        if (!isCurrent()) return;
        section.querySelector("h2")!.textContent = index.publication.title;
        section.lastChild?.remove();
        section.append(
          index.posts.length
            ? postList(index.posts, host)
            : el("p", { class: "empty" }, "No posts published yet."),
        );
      } catch (error) {
        if (isCurrent()) {
          section.lastChild!.textContent = message(error);
          section.append(button("Retry", () => refresh()));
        }
      }
    }),
  );
}
