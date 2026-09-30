import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  prepareRichInline,
  walkRichInlineLineRanges,
  materializeRichInlineLineRange,
} from "@chenglou/pretext/rich-inline";
import { el } from "./dom";
/** Sanitized Markdown supplies semantics; Pretext supplies the visible line layout. */
export function prose(markdown: string) {
  const root = el("div", { class: "prose" });
  root.innerHTML = DOMPurify.sanitize(
    marked.parse(markdown, { async: false }),
    {
      FORBID_TAGS: ["style", "form", "input", "button", "iframe"],
      FORBID_ATTR: ["style"],
    },
  );
  root.querySelectorAll("a").forEach((a) => {
    a.rel = "noopener noreferrer";
  });
  root.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
  });
  const paragraphs = [
    ...root.querySelectorAll<HTMLElement>("p, h2, h3, h4, li"),
  ].filter((p) => !p.querySelector("img,br,p,ul,ol,table"));
  const measure = document.createElement("canvas").getContext("2d")!;
  const originals = paragraphs.map((p) => p.cloneNode(true) as HTMLElement);
  let lastWidth = 0,
    frame = 0,
    version = 0;
  async function layout() {
    if (!root.isConnected) return;
    const width = root.clientWidth;
    if (!width || width === lastWidth) return;
    lastWidth = width;
    const pass = ++version;
    await Promise.all(
      paragraphs.map(async (p, i) => {
        p.replaceChildren(
          ...[...originals[i].childNodes].map((n) => n.cloneNode(true)),
        );
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        let n;
        while ((n = walker.nextNode())) nodes.push(n as Text);
        if (!nodes.length) return;
        const sources = nodes.map((n) => {
          const parent = n.parentElement!;
          const style = getComputedStyle(parent);
          const wrappers: HTMLElement[] = [];
          let cursor: HTMLElement | null = parent;
          while (cursor && cursor !== p) {
            wrappers.unshift(cursor.cloneNode(false) as HTMLElement);
            cursor = cursor.parentElement;
          }
          return {
            text: n.data,
            font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
            wrappers,
          };
        });
        // Measurement starts only after the exact faces are loaded. Preparing
        // before font loading caches fallback metrics and makes lines overflow.
        try {
          await Promise.all(
            sources.map((source) =>
              document.fonts.load(source.font, source.text),
            ),
          );
        } catch {
          return;
        }
        if (pass !== version || !root.isConnected) return;
        const prepared = prepareRichInline(sources);
        const fragment = document.createDocumentFragment();
        walkRichInlineLineRanges(prepared, p.clientWidth, (range) => {
          const line = el("span", { class: "pretext-line" });
          for (const part of materializeRichInlineLineRange(prepared, range)
            .fragments) {
            const span = el("span", { class: "pretext-fragment" });
            const leading = part.gapBefore > 0 ? " " : "";
            measure.font = sources[part.itemIndex].font;
            span.style.marginInlineStart = `${part.gapBefore - (leading ? measure.measureText(" ").width : 0)}px`;
            let parent: HTMLElement = span;
            for (const wrapper of sources[part.itemIndex].wrappers) {
              const copy = wrapper.cloneNode(false) as HTMLElement;
              parent.append(copy);
              parent = copy;
            }
            parent.append(leading + part.text);
            line.append(span);
          }
          fragment.append(line, document.createTextNode("\n"));
        });
        p.replaceChildren(fragment);
        p.dataset.renderer = "pretext";
      }),
    );
  }
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  });
  observer.observe(root);
  void document.fonts.ready.then(() => {
    lastWidth = 0;
    layout();
  });
  return {
    element: root,
    dispose: () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      version++;
    },
  };
}
