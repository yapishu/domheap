# Domheap

<img width="904" height="923" alt="image" src="https://github.com/user-attachments/assets/c6a27fd3-b064-4005-95f3-437c16ddd3e9" />


An Urbit publishing app with subscriptions and a feed of publications from other ships.

- Publishes posts from a selected private `%notes` notebook.
- Provides a public post index, about page, avatar, and header image.
- Uses `<<<paywall>>>` to separate public previews from subscriber content. The server checks access before sending the full post.
- Supports ship-based access through eauth or Ames, paid subscriptions, and manual access grants.
- Fetches followed publications from their ships without storing a post archive in the reader's app state.
- Includes Markdown and rich text editing, Pretext rendering, and day/night themes.
- Uses reusable x402 Hoon libraries. Payments require a configured facilitator and supported token; Cloudflare is not required.

Build with Zig 0.15, Node 22+, and Git:

```sh
zig build -Ddesk=/path/to/pier/domheap
```

Commit and install `%domheap` on the ship, then open `/apps/domheap/`. Requires `%notes`.

See [installation and configuration](desk/README.md). Payments need a testnet settlement check before use with real funds.
