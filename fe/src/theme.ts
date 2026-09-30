import { el } from "./dom";
export function themeControl() {
  const select = el("select", { "aria-label": "Color theme", class: "theme" });
  for (const [value, label] of [
    ["system", "Auto"],
    ["light", "Day"],
    ["dark", "Night"],
  ])
    select.append(el("option", { value }, label));
  try {
    select.value = localStorage.getItem("domheap-theme") || "system";
  } catch {}
  const apply = () => {
    document.documentElement.dataset.theme = select.value;
    try {
      localStorage.setItem("domheap-theme", select.value);
    } catch {}
  };
  select.onchange = apply;
  apply();
  return select;
}
