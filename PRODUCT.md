# Domheap

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Ship owners publish a journal. Readers follow publications from their own ships or read a publisher's public website.

## Product Purpose

Domheap turns a designated `%notes` notebook into one publication per ship, with a public index and about page and ship-identity subscriptions.

## Positioning

The publisher's Urbit ship owns the publication, source notebook, and subscription ACL. Reader ships request current content from its source instead of keeping a post archive.

## Operating Context

The application installs as an Urbit desk. Zig assembles pinned desk dependencies and the frontend. A fileserver agent serves the bundled web assets. The development ship is ~lux.

## Capabilities and Constraints

- Publication title, description, about page, avatar, and header; images default to the ship's profile.
- Notebook entries become posts automatically. `<<<paywall>>>` separates the public preview from subscriber content.
- The publisher checks access before sending protected content over HTTP or Ames.
- Browser readers authenticate with Eyre eauth; native readers use their ship identity.
- Authors manage subscribers manually, including free grants, expiry, and revocation.
- A reusable x402 Hoon library implements payment transport independently of publication policy. Cloudflare is not a required service.
- Both public and native reading use Pretext. Day and neutral charcoal night themes fill the viewport. Background updates preserve an unchanged visible page.
- The local owner opens into Reading room. Publication stays the public entry; author tools are labeled Settings.
- Subscription prices cover day, week, month, and year, starting at $5/month, with automatic equivalents and individual overrides.
- Frontend and backend use small, legible modules. Hoon comments explain behavior and security boundaries.
- Application code lives under `desk/` or `fe/`. Generated web assets are excluded from tracked files.
- A built-in rich text editor is optional if it remains straightforward.

## Brand Commitments

Clean, restrained, literate, and suitable for serious writing. The publication's own identity leads the public site.

## Evidence on Hand

The local Tlon `%notes`, Urbit Eyre eauth, Boox Pretext/fileserver, Matrix fileserver, and Urbit Agent Harness repositories supply implementation references. No actual publication copy or artwork is supplied.

## Open Decisions

The frontend uses lightweight TypeScript. The optional design-workflow question does not establish a standing preference. Payment recipient, chain, asset, subscription price, and facilitator are configured by each author; no live payment configuration is supplied.

## Product Principles

1. Access decisions stay with the publisher.
2. Reading puts the author's words first.
3. Paid and complimentary access share one visible, manageable policy.
4. Runtime services are explicit and replaceable.
