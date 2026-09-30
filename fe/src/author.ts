import { priceFields } from "./price-fields";
import { periods, toAtomic } from "./pricing";
import { action } from "./api";
import { notesRequest as request } from "./notes";
import { el, field, button, status, submit, date, link, message } from "./dom";
import type { Author } from "./types";
export function authorNav(active: string) {
  return el(
    "nav",
    { class: "tabs", "aria-label": "Settings" },
    ...["publication", "writing", "subscribers", "payments"].map((name) =>
      link(
        name[0].toUpperCase() + name.slice(1),
        `author/${name}`,
        name === active ? "selected" : "",
      ),
    ),
  );
}
export function publicationForm(a: Author, reload: () => void) {
  const note = status();
  const form = el("form", { class: "settings-form" });
  const select = el(
    "select",
    { name: "notebook", id: "notebook" },
    el("option", { value: "" }, "Choose a notebook"),
  );
  a.notebooks
    .filter((n) => n.host === a.publication.host && n.visibility === "private")
    .forEach((n) => select.append(el("option", { value: n.name }, n.title)));
  select.value = a.notebook ?? "";
  form.append(
    field("Publication title", "title", a.publication.title),
    field("A short description", "description", a.publication.description),
    el(
      "label",
      { class: "field", for: "notebook" },
      el("span", {}, "Publish from"),
      select,
      el(
        "small",
        {},
        "Every note in this notebook is a post. Keep it unshared in Notes; notebook members can read the full source.",
      ),
    ),
    field("About this publication", "about", a.publication.about, "textarea"),
    field(
      "Avatar URL",
      "avatar",
      a.avatarOverride,
      "url",
      "Leave blank to use your ship’s profile.",
    ),
    field(
      "Header image URL",
      "cover",
      a.coverOverride,
      "url",
      "Leave blank to use your ship’s profile.",
    ),
    el("button", { type: "submit", class: "primary" }, "Save publication"),
    note,
  );
  void submit(form, note, async (data) => {
    await action("configure", Object.fromEntries(data));
    reload();
  });
  const create = button("Create a private notebook", async () => {
    create.disabled = true;
    try {
      await request("/notes/~/v1/notebooks", {
        title: `${a.publication.title} — posts`,
      });
      reload();
    } catch (error) {
      note.textContent = message(error);
    } finally {
      create.disabled = false;
    }
  });
  return el(
    "section",
    {},
    el("h1", {}, "Your publication"),
    !a.notesAvailable
      ? el(
          "p",
          { class: "notice" },
          "Install and start %notes to publish from a notebook.",
        )
      : null,
    form,
    create,
  );
}
export function subscribers(a: Author, reload: () => void) {
  const form = el("form", { class: "inline-form" }),
    note = status();
  form.append(
    field("Ship", "ship", "", "text", "For example, ~sampel-palnet"),
    field(
      "Access for (days)",
      "days",
      "30",
      "number",
      "Use 0 for permanent access.",
    ),
    el("button", { type: "submit", class: "primary" }, "Grant access"),
  );
  void submit(form, note, async (data) => {
    await action("grant", {
      ship: data.get("ship"),
      days: Number(data.get("days")),
    });
    reload();
  });
  const list = el("div", { class: "member-list" });
  if (!a.members.length)
    list.append(
      el(
        "p",
        { class: "empty" },
        "No subscribers yet. Invite a reader with a free grant.",
      ),
    );
  for (const m of a.members) {
    const row = el(
      "div",
      { class: "member-row" },
      el(
        "div",
        {},
        el("strong", {}, m.ship),
        el(
          "small",
          {},
          `${m.source === "gift" ? "Granted" : "Paid"} · ${m.expiresAt ? `${m.active ? "Until" : "Expired"} ${date(m.expiresAt)}` : "Permanent"}`,
        ),
      ),
    );
    row.append(
      button("Revoke", async () => {
        try {
          await action("revoke", { ship: m.ship });
          reload();
        } catch (e) {
          note.textContent = message(e);
        }
      }),
    );
    list.append(row);
  }
  return el(
    "section",
    {},
    el("h1", {}, "Subscribers"),
    el(
      "p",
      { class: "intro" },
      "Give a ship access, with or without a payment. Revoking access applies to its next read.",
    ),
    form,
    note,
    list,
  );
}
export function paymentSettings(a: Author, reload: () => void) {
  const form = el("form", { class: "settings-form" }),
    note = status(),
    req = a.plan?.requirements;
  const enabled = el("input", { type: "checkbox", name: "enabled" });
  enabled.checked = !!a.plan?.enabled;
  form.append(
    el("label", { class: "check" }, enabled, "Accept paid subscriptions"),
    el(
      "p",
      { class: "muted" },
      "Payments use x402 exact transfers with an EIP-3009 token. Readers approve each renewal. Your facilitator verifies and settles payments; it can be self-hosted.",
    ),
    field(
      "Public origin",
      "origin",
      a.origin,
      "url",
      "Your publication’s HTTPS origin, without a trailing slash.",
    ),
    field(
      "Facilitator URL",
      "facilitator",
      a.facilitator,
      "url",
      "An x402 v2 facilitator base URL, without a trailing slash.",
    ),
    priceFields(a.plan),
    field(
      "Token decimals",
      "decimals",
      String(a.plan?.decimals ?? 6),
      "number",
      "Prices use a USD-pegged token. Match its decimals to convert dollars into exact token units.",
    ),
    field(
      "Network",
      "network",
      req?.network ?? "",
      "text",
      "CAIP-2 identifier, for example eip155:8453.",
    ),
    field("Token contract", "asset", req?.asset ?? ""),
    field("Receiving wallet", "payTo", req?.payTo ?? ""),
    field("Token signing name", "name", req?.extra.name ?? "USDC"),
    field("Token signing version", "version", req?.extra.version ?? "2"),
    field(
      "Quote lifetime (seconds)",
      "timeout",
      String(req?.maxTimeoutSeconds ?? 300),
      "number",
    ),
    el("button", { type: "submit", class: "primary" }, "Save payments"),
    note,
  );
  void submit(form, note, async (data) => {
    const get = (key: string) => String(data.get(key) ?? "");
    await action("payments", {
      enabled: enabled.checked,
      facilitator: get("facilitator"),
      origin: get("origin"),
      decimals: Number(get("decimals")),
      prices: Object.fromEntries(
        periods.map((period) => [
          period,
          toAtomic(get(`price-${period}`), Number(get("decimals"))),
        ]),
      ),
      requirements: {
        scheme: "exact",
        network: get("network"),
        amount: toAtomic(get("price-month"), Number(get("decimals"))),
        asset: get("asset"),
        payTo: get("payTo"),
        maxTimeoutSeconds: Number(get("timeout")),
        extra: { name: get("name"), version: get("version") },
      },
    });
    reload();
  });
  const pending = el(
    "details",
    { class: "payment-history" },
    el("summary", {}, "Payment activity"),
  );
  for (const payment of a.payments
    .filter((p) => p.phase !== "offered")
    .sort((a, b) => b.expiresAt - a.expiresAt)) {
    const row = el(
      "div",
      { class: "payment-record" },
      el("h3", {}, payment.ship),
      el(
        "p",
        { class: "muted" },
        `${payment.phase} · ${payment.requirements.amount} base units · ${payment.requirements.network}`,
      ),
    );
    if (payment.settlement?.transaction)
      row.append(el("p", { class: "address" }, payment.settlement.transaction));
    if (payment.phase === "settling") {
      row.append(
        el(
          "dl",
          {},
          el("dt", {}, "Payer"),
          el("dd", { class: "address" }, payment.payer ?? "Unknown"),
          el("dt", {}, "Token"),
          el("dd", { class: "address" }, payment.requirements.asset),
          el("dt", {}, "Recipient"),
          el("dd", { class: "address" }, payment.requirements.payTo),
          el("dt", {}, "Authorization nonce"),
          el("dd", { class: "address" }, payment.nonce),
        ),
      );

      const reconcile = el("form", { class: "settings-form" }),
        result = status();
      reconcile.append(
        el(
          "p",
          {},
          "Check this transfer with your facilitator and on chain before recording it. Confirm the token, payer, recipient, amount, and authorization nonce. This action grants access without sending another payment.",
        ),
        field(
          "Confirmed transaction hash",
          `transaction-${payment.id}`,
          payment.settlement?.transaction ?? "",
        ),
        el("button", { type: "submit" }, "Record confirmed payment"),
        result,
      );
      void submit(reconcile, result, async (data) => {
        await action("reconcile", {
          id: payment.id,
          transaction: data.get(`transaction-${payment.id}`),
        });
        reload();
      });
      row.append(reconcile);
      if (payment.expiresAt < Date.now()) {
        row.append(
          button("Confirm expired and unpaid", async () => {
            if (
              !confirm(
                "Confirm on chain that this authorization expired unused. This will allow the reader to start another payment.",
              )
            )
              return;
            try {
              await action("close-payment", { id: payment.id });
              reload();
            } catch (error) {
              result.textContent = message(error);
            }
          }),
        );
      }
    }
    pending.append(row);
  }
  if (pending.childElementCount === 1)
    pending.append(
      el(
        "p",
        { class: "muted" },
        "Completed and pending payments appear here.",
      ),
    );
  return el("section", {}, el("h1", {}, "Paid subscriptions"), form, pending);
}
