import { periods, fromAtomic, termDays, type Period } from "./pricing";
import { api } from "./api";
import { el, link, button, field, status, message } from "./dom";
import { login } from "./identity";
import { quote, pay, type Quote, type Receipt } from "./wallet";
import type { Publication, Session } from "./types";
export function subscribeScreen(
  main: HTMLElement,
  publication: Publication,
  session: Session,
  refresh: () => void,
) {
  main.className = "subscribe-main";
  const desired =
    new URLSearchParams(location.search).get("ship") ??
    (session.subscribed || session.expiresAt !== null ? session.viewer : "");
  main.append(
    link(publication.title, "publication", "back-link"),
    el("h1", {}, "Subscribe"),
    el(
      "p",
      { class: "intro" },
      "Sign in with your ship to subscribe and read subscriber posts.",
    ),
  );
  if (session.subscribed) {
    main.append(
      el("p", { class: "notice" }, `You have access as ${session.viewer}.`),
      link("Read the latest", "publication", "button primary"),
    );
    if (session.permanent || session.owner) return;
  }
  const form = el("form", { class: "settings-form" }),
    ship = field(
      "Your ship",
      "ship",
      desired,
      "text",
      "Sign in through your ship to establish your identity.",
    ),
    note = status();
  form.append(
    ship,
    el(
      "button",
      { type: "submit", class: "primary" },
      desired === session.viewer ? "Continue to payment" : "Sign in with Urbit",
    ),
  );
  if (session.plan) {
    const terms = el(
      "fieldset",
      { class: "subscription-terms" },
      el("legend", {}, "Choose your term"),
    );
    for (const period of periods) {
      const radio = el("input", {
        type: "radio",
        name: "period",
        value: period,
      });
      radio.checked = period === "month";
      terms.append(
        el(
          "label",
          { class: "term-option" },
          radio,
          el(
            "span",
            {},
            `$${fromAtomic(session.plan.prices[period], session.plan.decimals)} / ${period}`,
            el("small", {}, `${termDays[period]} days of access`),
          ),
        ),
      );
    }
    form.insertBefore(terms, form.lastChild);
  }
  main.append(form, note);
  if (!session.plan)
    main.append(
      el(
        "p",
        { class: "notice" },
        "Paid subscriptions are not enabled. Contact the author to request access.",
      ),
    );
  form.onsubmit = async (event) => {
    event.preventDefault();
    const who = String(new FormData(form).get("ship")).trim();
    if (who !== session.viewer || !desired) {
      location.href = login(who);
      return;
    }
    if (!session.plan) {
      note.textContent = "Contact the author for a free access grant.";
      return;
    }
    const submit = form.querySelector("button")!;
    submit.disabled = true;
    try {
      const q = await quote(
        who,
        String(new FormData(form).get("period")) as Period,
      );
      showQuote(main, q, note, refresh);
    } catch (error) {
      note.textContent = message(error);
      submit.disabled = false;
    }
  };
  const pending = sessionStorage.getItem("domheap-payment");
  if (pending && desired === session.viewer) {
    main.append(
      button("Check pending payment", async () => {
        try {
          const receipt = await api<Receipt>(`payment/${pending}`);
          note.textContent =
            receipt.phase === "paid"
              ? "Payment confirmed. You have access."
              : `Payment status: ${receipt.phase}. ${receipt.phase === "settling" ? "Ask the author to check settlement before paying again." : ""}`;
          if (receipt.phase === "paid") refresh();
        } catch (e) {
          note.textContent = message(e);
        }
      }),
    );
  }
}
function showQuote(
  main: HTMLElement,
  q: Quote,
  note: HTMLElement,
  refresh: () => void,
) {
  const req = q.paymentRequired.accepts[0],
    info = q.paymentRequired.extensions["domheap-subscription"].info;
  const panel = el(
    "section",
    { class: "payment-review" },
    el("h2", {}, "Review your subscription"),
    el(
      "dl",
      {},
      el("dt", {}, "Ship"),
      el("dd", {}, q.ship),
      el("dt", {}, "Access"),
      el("dd", {}, `${info.days} days`),
      el("dt", {}, "Amount (base units)"),
      el("dd", {}, req.amount),
      el("dt", {}, "Token contract"),
      el("dd", { class: "address" }, req.asset),
      el("dt", {}, "Network"),
      el("dd", {}, req.network),
      el("dt", {}, "Recipient"),
      el("dd", { class: "address" }, req.payTo),
    ),
    el(
      "p",
      { class: "muted" },
      "This is a one-time transfer. Renewals require your approval. Review the amount and token in your wallet.",
    ),
  );
  const confirm = button(
    "Approve in wallet",
    async () => {
      confirm.disabled = true;
      sessionStorage.setItem("domheap-payment", q.id);
      note.textContent = "Waiting for your wallet…";
      try {
        const result = await pay(q);
        if (result.phase === "paid") {
          sessionStorage.removeItem("domheap-payment");
          refresh();
        } else
          note.textContent =
            "Payment is being confirmed. Use Check pending payment before trying again.";
      } catch (error) {
        note.textContent =
          message(error) +
          " Check the payment status before starting another payment.";
      }
      panel.append(
        button("Check payment status", async () => {
          try {
            const receipt = await api<Receipt>(`payment/${q.id}`);
            note.textContent = `Payment status: ${receipt.phase}.`;
            if (receipt.phase === "paid") refresh();
          } catch (e) {
            note.textContent = message(e);
          }
        }),
      );
    },
    "primary",
  );
  panel.append(confirm);
  main.append(panel);
}
