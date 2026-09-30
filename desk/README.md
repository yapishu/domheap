# Domheap

Domheap is an Urbit publication and reading room. Each ship publishes one private `%notes` notebook. Notebook entries appear as posts immediately; opening a post reads the current notebook and checks the reader's ship against the publisher's access list.

Put `<<<paywall>>>` in a note to end its public preview. The backend splits the source before serializing a response. The index always uses the public side, including for an author. Owners and ships with an unexpired or permanent grant can request the full post. Keep the source notebook private and unshared in Notes: its members can read the full source independently of Domheap. Making the source available elsewhere defeats the publication's access boundary.

The reading room stores followed ship identities and subscribes to change notifications over Ames. A post is fetched through a one-shot watch when opened. Remote bodies are relayed to the browser without entering Domheap's persistent application state. The browser uses no content cache or local storage for articles. Urbit's event log records delivered events, and a reader can retain anything already delivered; a subscription cannot retract a copy.

## Build and install

Requirements: Zig 0.15, Git 2.25+, Node 22+, npm, and a ship running the current `%notes` application. `build.zig` pins its Hoon dependencies by Git commit. npm dependencies are locked in `fe/package-lock.json`.

From the repository root:

```sh
zig build
zig build -Ddesk=/path/to/pier/domheap
```

The build runs `npm ci`, checks TypeScript, compiles the frontend into `desk/web`, and assembles Hoon and pinned dependencies into `zig-out`. Both directories are generated and ignored. Vite emits lowercase hashes for Clay-compatible filenames. Fonts and scripts are served by the ship.

Create and mount the desk from the dojo if it does not exist:

```hoon
|merge %domheap our %base
|mount %domheap
```

After copying the build into the mounted desk:

```hoon
|commit %domheap
|install our %domheap
```

For a running installation, `|commit %domheap` updates the agents. Both API and fileserver agents restore their Eyre bindings in `on-load`. Persistent state is loaded strictly; an invalid state does not silently reset the publication or access list.

Open `/apps/domheap/`. Your own ship opens to **Reading room**; public visitors open the publication. Under **Settings → Publication**, select a private notebook, give the publication a title, and add its description and about text. Blank avatar and header fields use the ship's profile images. The editor writes directly to Notes, checks revisions when editing bodies, and supports Markdown and rich text. **Saving publishes**; the selected notebook contains published posts.

Under **Subscribers**, grant a ship access for a number of days, use zero for permanent access, or revoke a grant. Paid and free members use the same backend read check. Under **Reading room**, follow another author's ship. A follow adds it to the feed; paid access is separately controlled by that author.

## Identity

Public pages work anonymously. Browser subscribers sign in using Eyre's eauth flow, which redirects them to their own ship for authorization. Domheap takes the reader identity from Gall's `src.bowl`, never from a query parameter or request body. Native readers arrive over Ames with the same authenticated ship identity. The local owner alone can change settings, members, payments, or follows.

Mutating HTTP requests require `x-domheap: 1`; owner mutations also require local Eyre authentication. The API exposes no cross-origin permissions and returns `Cache-Control: no-store`. Article HTML is sanitized before rendering. Pretext lays out the public and native reader's visible text lines using self-hosted fonts.

## Payments

Payments use x402 v2, exact EVM/EIP-3009 transfers. Configure an HTTPS facilitator URL, publication origin, chain identifier, token contract, receiving wallet, token decimals, token signing name/version, per-term prices, and quote lifetime. Prices start at $5/month; day, week, and year equivalents calculate automatically and can be overridden individually. Terms grant 1, 7, 30, or 365 days respectively. Disabling payments keeps the configured prices. HTTP loopback URLs are accepted for local development. Cloudflare is not required. The facilitator may be self-hosted; it needs RPC access and a gas-paying wallet to verify and broadcast token transfers.

The browser supports an injected EVM wallet and asks for one signed transfer per purchase or renewal. There are no automatic recurring charges. The author must choose a token supporting `transferWithAuthorization` and an x402 v2 facilitator implementing `/verify` and `/settle`. Hosted facilitators requiring proprietary authentication need an author-operated gateway; credentials are not shipped to the browser.

Each quote snapshots the price, network, recipient, duration, facilitator, and a random EIP-3009 nonce bound to the reader's ship. The server checks the signed payload against that snapshot, verifies it with the facilitator, settles once, and grants access only on a confirmed receipt. Existing timed subscriptions extend from their expiry; permanent grants stay permanent. Transaction/network pairs are remembered to prevent redemption twice.

An ambiguous settlement stays pending, including after a reload. Another payment for that ship is blocked while confirmation is unresolved. Under **Payments → Payment activity**, the author can record a confirmed transaction after checking its on-chain receipt and authorization with the facilitator. Recording a receipt sends no additional payment. Never record an unconfirmed transfer. If an authorization expires unused, the author can confirm that fact on chain and close the pending payment to permit a new purchase. A manual free grant is also available while investigating a payment.

See [the reusable x402 library](lib/x402/README.md) for its independent API.

## Source layout

- `app/domheap.hoon`: lifecycle adapter; `lib/domheap/core.hoon`: event routing.
- `lib/domheap/{notes,profile,content,view,json}.hoon`: live source reads and public projections.
- `lib/domheap/{access,admin,payments,peer,events,http}.hoon`: ACLs, settings, payment lifecycle, Ames reads, invalidations, HTTP responses.
- `sur/domheap.hoon`: persistent schema, excluding remote post bodies.
- `sur/x402.hoon`, `lib/x402/*`: app-independent x402 types, codecs, protocol checks, transport, and optional EVM helpers.
- `app/domheap-fileserver.hoon`: static assets served from Clay with the publication API kept separate.
- `../fe/src`: modular TypeScript screens, Pretext renderer, editor, wallet, API, and theme.

## Verification

Run pure Hoon invariants on the installed desk:

```hoon
+domheap!domheap-vectors
+domheap!domheap-migration-vectors
+domheap!domheap-payment-vectors
```

The live HTTP tests in `fe/test` accept cookie-jar paths through environment variables. They are opt-in and use a designated development post containing a supplied secret marker. Payment tests use an in-process mock facilitator on loopback and make no chain transactions. See [frontend development and tests](../fe/README.md).
