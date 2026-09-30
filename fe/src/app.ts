import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/400-italic.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/600.css";
import "./style.css";
import { api, base, updates } from "./api";
import {
  el,
  link,
  button,
  field,
  status,
  message,
  date,
  safeImage,
} from "./dom";
import { prose } from "./reading";
import { themeControl } from "./theme";
import {
  publicationForm,
  subscribers,
  paymentSettings,
  authorNav,
} from "./author";
import { postList, masthead, showPost } from "./publication";
import { readingRoom } from "./reading-room";
import { subscribeScreen } from "./subscriptions";
import type { Publication, Post, Session, Author, Index } from "./types";
const app = document.querySelector<HTMLDivElement>("#app")!;
let session: Session;
let publication: Publication;
let dispose: (() => void)[] = [];
let dirty: () => boolean = () => false;
let generation = 0;
let refreshTimer = 0;
let lastRenderKey = "";
let acceptedLocation = location.href;
const reader = (body: string) => {
  const r = prose(body);
  dispose.push(r.dispose);
  return r.element;
};
const path = () =>
  decodeURIComponent(location.pathname.slice(base.length).replace(/^\//, ""));
function navigate(href: string) {
  if (dirty() && !confirm("Leave this post without saving your changes?"))
    return;
  history.pushState({}, "", href);
  acceptedLocation = location.href;
  void render();
  window.scrollTo({ top: 0 });
}
document.addEventListener("click", (event) => {
  const a = (event.target as Element).closest("a");
  if (
    !a ||
    event.defaultPrevented ||
    (event as MouseEvent).button !== 0 ||
    (event as MouseEvent).metaKey ||
    (event as MouseEvent).ctrlKey ||
    a.target
  )
    return;
  const url = new URL(a.href);
  if (
    url.origin === location.origin &&
    url.pathname.startsWith(base + "/") &&
    !url.pathname.startsWith(base + "/api/")
  ) {
    event.preventDefault();
    navigate(url.pathname + url.search);
  }
});
window.addEventListener("popstate", () => {
  if (dirty() && !confirm("Leave this post without saving your changes?")) {
    history.pushState({}, "", acceptedLocation);
    return;
  }
  acceptedLocation = location.href;
  void render();
});
function shell() {
  const theme = themeControl();
  const mark = link("domheap", "", "wordmark");
  const nav = el(
    "nav",
    { "aria-label": "Main navigation" },
    link("Publication", "publication"),
    link("About", "about"),
  );
  if (session.owner)
    nav.append(
      link("Reading room", "reader"),
      link("Settings", "author/publication"),
    );
  else nav.append(link("Subscribe", "subscribe"));
  const header = el("header", { class: "site-header" }, mark, nav, theme);
  const main = el("main", { id: "main" });
  const frame = el(
    "div",
    { class: "app-frame" },
    el("a", { href: "#main", class: "skip" }, "Skip to content"),
    header,
    main,
    el(
      "footer",
      { class: "site-footer" },
      el("span", {}, `${publication.host} · Published with Domheap`),
      el("span", {}, "A place of your own."),
    ),
  );
  return { main, frame };
}
async function render(background = false) {
  const turn = ++generation;
  const previousDispose = dispose;
  dispose = [];
  const nextDispose = dispose;
  let route = path();
  const oldFocus = document.activeElement?.id;
  try {
    [session, publication] = await Promise.all([
      api<Session>("session"),
      api<Publication>("publication"),
    ]);
    if (turn !== generation) return;
    if (!route) route = session.owner ? "reader" : "publication";
    document.title = `${publication.title} · Domheap`;
    const { main, frame } = shell();
    if (route.startsWith("author/")) {
      if (!session.owner)
        throw new Error("Log in to this ship to open the author tools.");
      const author = await api<Author>("author");
      if (turn !== generation) return;
      const tab = route.split("/")[1] || "publication";
      main.className = "author-main";
      main.append(authorNav(tab));
      const reload = () => void render();
      if (tab === "publication") main.append(publicationForm(author, reload));
      else if (tab === "subscribers") main.append(subscribers(author, reload));
      else if (tab === "payments") main.append(paymentSettings(author, reload));
      else if (tab === "write") {
        const { editorScreen } = await import("./editor");
        const edit = await editorScreen(author, route.split("/")[2], () =>
          navigate(`${base}/author/writing`),
        );
        if (turn !== generation) {
          edit.dispose();
          return;
        }
        main.append(edit.element);
        dispose.push(edit.dispose);
        dirty = edit.dirty;
      } else {
        const index = await api<Index>("posts");
        main.append(
          el(
            "div",
            { class: "section-heading" },
            el("h1", {}, "Writing"),
            link("Write a post", "author/write", "button primary"),
          ),
          el(
            "p",
            { class: "intro" },
            "Your notebook is your publication. Changes appear for readers as soon as you save them.",
          ),
        );
        if (!index.posts.length)
          main.append(
            el(
              "p",
              { class: "empty" },
              "Choose a notebook in Publication, then write your first post.",
            ),
          );
        for (const post of index.posts)
          main.append(
            el(
              "div",
              { class: "writing-row" },
              el(
                "div",
                {},
                link(post.title, `post/${post.id}`),
                el(
                  "small",
                  {},
                  `${date(post.updatedAt)} · ${post.paid ? "Subscriber post" : "Public post"}`,
                ),
              ),
              link("Edit", `author/write/${post.id}`),
            ),
          );
      }
    } else if (route === "reader" || route.startsWith("reader/")) {
      await readingRoom(
        main,
        route,
        session,
        () => turn === generation,
        reader,
        () => render(),
      );
    } else if (route === "subscribe") {
      subscribeScreen(main, publication, session, () => void render());
    } else if (route.startsWith("post/")) {
      const post = await api<Post>(`posts/${route.split("/")[1]}`);
      if (turn !== generation) return;
      showPost(main, post, publication, session, reader, session.host);
    } else if (route === "about") {
      main.className = "article-main";
      main.append(
        link(publication.title, "publication", "back-link"),
        el("h1", {}, "About this publication"),
        reader(
          publication.about || "The author has not added an about page yet.",
        ),
        link("Subscribe", "subscribe", "button primary"),
      );
    } else {
      const index = await api<Index>("posts");
      if (turn !== generation) return;
      main.append(
        masthead(publication),
        el(
          "div",
          { class: "section-heading" },
          el("h2", {}, "Latest writing"),
          el(
            "span",
            { class: "muted" },
            `${index.posts.length} ${index.posts.length === 1 ? "post" : "posts"}`,
          ),
        ),
        index.posts.length
          ? postList(index.posts)
          : el(
              "div",
              { class: "empty" },
              el("h2", {}, "The first page is still ahead."),
              el(
                "p",
                {},
                session.owner
                  ? "Choose a notebook in Settings to start your publication."
                  : "New writing will appear here.",
              ),
              session.owner
                ? link(
                    "Set up your publication",
                    "author/publication",
                    "button primary",
                  )
                : null,
            ),
      );
    }
    if (turn !== generation) {
      nextDispose.forEach((fn) => fn());
      return;
    }
    const key = route + "\n" + frame.innerHTML;
    if (background && key === lastRenderKey) {
      nextDispose.forEach((fn) => fn());
      dispose = previousDispose;
      app.querySelector(".connection-status")?.remove();
      return;
    }
    previousDispose.forEach((fn) => fn());
    lastRenderKey = key;
    app.replaceChildren(frame);
    if (!route.startsWith("author/write")) dirty = () => false;
    if (oldFocus) document.getElementById(oldFocus)?.focus();
  } catch (error) {
    nextDispose.forEach((fn) => fn());
    if (turn !== generation) return;
    dispose = previousDispose;
    if (background) {
      let warning = app.querySelector(".connection-status");
      if (!warning) {
        warning = el("span", { class: "connection-status", role: "status" });
        app.querySelector("footer")?.append(warning);
      }
      warning.textContent = "Connection interrupted. Retrying shortly.";
      return;
    }
    const main = app.querySelector("main") ?? app;
    main.replaceChildren(
      el(
        "section",
        { class: "error-page" },
        el("h1", {}, "Couldn’t open this page"),
        el("p", { role: "alert" }, message(error)),
        button("Try again", () => render()),
        link("Back to publication", "publication"),
      ),
    );
  }
}
void render().then(() => {
  if (session?.owner)
    updates(session.host, () => {
      clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (!path().startsWith("author/") && path() !== "subscribe")
          void render(true);
      }, 400);
    });
});
// Revalidate entitlement and content without retaining post bodies in storage.
window.setInterval(() => {
  if (
    !document.hidden &&
    !path().startsWith("author/") &&
    path() !== "subscribe"
  )
    void render(true);
}, 60000);

document.addEventListener("visibilitychange", () => {
  if (
    !document.hidden &&
    !path().startsWith("author/") &&
    path() !== "subscribe"
  )
    void render(true);
});
