# Frontend

The frontend is a small TypeScript/Vite application. Publication views, the reading room, author settings, pricing, subscriptions, wallet signing, the editor, and Pretext layout live in separate modules under `src`.

```sh
npm ci
npm run build
npm run dev
```

The development server proxies the application API, Notes, and Eyre to `localhost:8080`. Production assets are generated into `../desk/web`; `zig build` performs the complete installation build from the repository root. The editor is loaded on demand. Fonts and application scripts are bundled and self-hosted.

The local owner opens into Reading room. Publication and About remain public routes; Settings contains publication details, writing, subscribers, and payments. Theme preference is the only value kept in local storage. Session storage holds an outstanding payment ID for recovery, never a signature or article body. Background invalidations build a new view off-screen and only replace the visible page if its content changes.

Tabs share one live-update stream through a Web Lock and BroadcastChannel. The channel carries invalidations only. Closing its tab releases the stream and lets another tab take over. Browsers without these coordination APIs use periodic revalidation. Foreground navigation shows a loading state, and bounded requests surface a retry action when the ship does not respond.

Prices begin at $5/month. Automatic equivalents use 365 days, 52 weeks, or 12 months per year and round to cents: $0.16/day, $1.15/week, and $60/year. Choose a basis, then override individual prices using **Set separately**. Access lasts 1, 7, 30, or 365 days respectively. The displayed dollar price assumes the configured token tracks USD. Token decimals determine exact integer payment amounts; no floating-point arithmetic handles the signed amount. Disabling payment acceptance retains configured prices.

The editor preserves Markdown by default. Rich text supports paragraphs, headings, inline emphasis, links, code, lists, blockquotes, and the paywall node. Switch back to Markdown for source constructs outside the rich editor's supported vocabulary. Saving publishes immediately. Notes revision conflicts leave the unsaved draft on screen and require the author to merge changes.

## Tests

```sh
npm test
```

Pure pricing tests run normally. Live ship tests are opt-in. Run each live suite against dedicated development fixtures; they change test grants and payment configuration.

```sh
DOMHEAP_OWNER_COOKIES=/tmp/owner.cookies \
DOMHEAP_GUEST_COOKIES=/tmp/guest.cookies \
DOMHEAP_TEST_POST=211 \
DOMHEAP_TEST_SECRET=PRIVATE-CONTENT-SENTINEL \
node --test test/access.test.mjs

DOMHEAP_OWNER_COOKIES=/tmp/owner.cookies \
DOMHEAP_GUEST_COOKIES=/tmp/guest.cookies \
DOMHEAP_TEST_PAYMENTS=1 \
node --test test/payments.test.mjs
```

The payment test starts a local mock facilitator on `127.0.0.1:4020`. It exercises challenge headers, payload mismatch rejection, successful settlement, idempotence, verification failure, ambiguous settlement, reconciliation, and permanent-grant preservation. It neither broadcasts transactions nor verifies actual wallet signatures. A live facilitator and wallet still need a testnet acceptance run before taking real payments.

`DOMHEAP_ORIGIN` selects the author ship (default `http://localhost:8080`). Cookie jars use curl's format and stay outside the repository. `test/browser.mjs` captures desktop/mobile/day/night screenshots under the ignored `.impeccable/review` directory. `test/refresh.mjs` checks unchanged refreshes and viewport background coverage. `test/editor.mjs` checks rich-text paywall serialization, publication, and revision conflicts, then removes its own temporary note.

`test/navigation.mjs` checks navigation with eight tabs, shared-stream ownership and handoff, browser back, slow responses, timeouts, and retry. It requires `DOMHEAP_OWNER_COOKIES` and changes no ship data.

The federation test accepts `DOMHEAP_PUBLISHER_ORIGIN`, `DOMHEAP_READER_ORIGIN`, `DOMHEAP_PUBLISHER_COOKIES`, `DOMHEAP_READER_COOKIES`, `DOMHEAP_TEST_POST`, and `DOMHEAP_TEST_SECRET`. It grants and revokes the reader's access on a designated test post and checks live Ames responses.
