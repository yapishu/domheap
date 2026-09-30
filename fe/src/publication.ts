import { base } from "./api";
import { el, link, date, safeImage } from "./dom";
import { login } from "./identity";
import type { Publication, Post, Session } from "./types";
export function postList(posts: Post[], host?: string) {
  const list = el("div", { class: "post-list" });
  for (const post of posts) {
    const href = host ? `reader/${host}/${post.id}` : `post/${post.id}`;
    const excerpt = post.body
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/[#*_>`\[\]]/g, "")
      .trim()
      .slice(0, 210);
    list.append(
      el(
        "article",
        { class: "post-row" },
        el(
          "div",
          { class: "post-date" },
          el(
            "time",
            { datetime: new Date(post.createdAt).toISOString() },
            date(post.createdAt),
          ),
          post.paid
            ? el("span", { class: "access-label" }, "For subscribers")
            : null,
        ),
        el(
          "div",
          {},
          el("h2", {}, link(post.title, href)),
          el(
            "p",
            { class: "excerpt" },
            excerpt + (post.body.length > 210 ? "…" : ""),
          ),
          link("Read post", href, "read-link"),
        ),
      ),
    );
  }
  return list;
}
export function masthead(p: Publication) {
  const avatar = safeImage(p.avatar),
    cover = safeImage(p.cover);
  return el(
    "section",
    { class: "masthead" },
    cover
      ? el("img", {
          src: cover,
          alt: "",
          class: "cover",
          referrerpolicy: "no-referrer",
        })
      : null,
    el(
      "div",
      { class: "publication-heading" },
      avatar
        ? el("img", {
            src: avatar,
            alt: "",
            class: "avatar",
            referrerpolicy: "no-referrer",
          })
        : null,
      el(
        "div",
        {},
        el("h1", {}, p.title),
        p.description ? el("p", { class: "description" }, p.description) : null,
      ),
    ),
    el(
      "div",
      { class: "publication-byline" },
      el("span", {}, `Published by ${p.host}`),
      link("About this publication", "about"),
    ),
  );
}
export function showPost(
  main: HTMLElement,
  post: Post,
  p: Publication,
  s: Session,
  reader: (body: string) => HTMLElement,
  viewerShip: string,
  host?: string,
) {
  main.className = "article-main";
  main.append(
    link(
      host ? "Reading room" : p.title,
      host ? "reader" : "publication",
      "back-link",
    ),
    el(
      "header",
      { class: "article-header" },
      el("h1", {}, post.title),
      el(
        "p",
        { class: "muted" },
        `${date(post.createdAt)} · ${p.host}${post.paid ? " · For subscribers" : ""}`,
      ),
    ),
    reader(post.body),
  );
  if (post.locked) {
    const destination = host
      ? s.plan
        ? `${s.plan.origin}${base}/subscribe?ship=${encodeURIComponent(viewerShip)}`
        : null
      : `${base}/subscribe`;
    main.append(
      el(
        "aside",
        { class: "paywall" },
        el("h2", {}, "Keep reading with a subscription."),
        el("p", {}, `Support ${p.title} and read the rest of this post.`),
        destination
          ? el("a", { href: destination, class: "button primary" }, "Subscribe")
          : el("p", {}, `Ask ${p.host} to grant your ship access.`),
        el(
          "p",
          { class: "muted" },
          host
            ? "Your subscription follows your ship."
            : "Already a subscriber? ",
          host ? null : el("a", { href: login() }, "Sign in with your ship"),
        ),
      ),
    );
  }
}
