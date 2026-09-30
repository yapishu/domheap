import { el, field } from "./dom";
import {
  periods,
  automaticPrices,
  defaultPrices,
  fromAtomic,
  type Period,
  type Prices,
} from "./pricing";
import type { Plan } from "./types";
export function priceFields(plan: Plan | null) {
  const current: Prices = plan
    ? (Object.fromEntries(
        periods.map((p) => [p, fromAtomic(plan.prices[p], plan.decimals)]),
      ) as Prices)
    : { ...defaultPrices };
  const root = el(
    "fieldset",
    { class: "price-fields" },
    el("legend", {}, "Subscription prices"),
  );
  const basis = el("select", { name: "priceBasis", id: "priceBasis" });
  for (const period of periods)
    basis.append(
      el(
        "option",
        { value: period },
        period[0].toUpperCase() + period.slice(1),
      ),
    );
  basis.value = "month";
  root.append(
    el(
      "label",
      { class: "field", for: "priceBasis" },
      el("span", {}, "Calculate other prices from"),
      basis,
    ),
  );
  const inputs = {} as Record<Period, HTMLInputElement>,
    checks = {} as Record<Period, HTMLInputElement>;
  let inferred: Prices;
  try {
    inferred = automaticPrices(current.month, "month");
  } catch {
    inferred = { ...current };
  }
  for (const period of periods) {
    const price = field(
      `$ / ${period}`,
      `price-${period}`,
      current[period],
      "number",
    );
    const input = price.querySelector("input")!;
    input.min = "0.01";
    input.step = "0.01";
    inputs[period] = input;
    const check = el("input", {
      type: "checkbox",
      "aria-label": `Set ${period} price separately`,
    });
    check.checked = current[period] !== inferred[period];
    checks[period] = check;
    root.append(
      el(
        "div",
        { class: "price-row" },
        price,
        el("label", { class: "check" }, check, "Set separately"),
      ),
    );
  }
  const update = () => {
    const selected = basis.value as Period;
    checks[selected].checked = false;
    checks[selected].disabled = true;
    for (const period of periods)
      if (period !== selected) checks[period].disabled = false;
    try {
      const calculated = automaticPrices(inputs[selected].value, selected);
      for (const period of periods)
        if (period !== selected && !checks[period].checked)
          inputs[period].value = calculated[period];
    } catch {
      /* The browser keeps an incomplete price while the author is typing. */
    }
  };
  basis.onchange = update;
  for (const period of periods) {
    inputs[period].oninput = () => {
      if (period === basis.value) update();
      else checks[period].checked = true;
    };
    checks[period].onchange = update;
  }
  update();
  root.append(
    el(
      "small",
      {},
      "Automatic prices use 365 days, 52 weeks, or 12 months per year and round to cents. A month grants 30 days of access; a year grants 365 days.",
    ),
  );
  return root;
}
