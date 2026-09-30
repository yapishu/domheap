# x402 v2 for Hoon

These libraries have no Domheap, Notes, publication, or membership dependencies. Copy `sur/x402.hoon` and `lib/x402/*.hoon` into a desk, or pin them as remote build imports. Policy and persistent payment state belong to the consuming agent.

- `sur/x402`: requirements, resources, payment-required challenges, payments, verification results, and settlement receipts.
- `x402-json`: strict JSON decoders and encoders. Decoders bail on invalid shapes; call them inside `mule` at an untrusted boundary. The types preserve scheme-specific payloads, `extra`, and extension objects as JSON.
- `x402-protocol`: Base64 payment-header encoding/decoding, v2 header names, exact requirements matching, and settlement/network validation. Header decoding is bounded. A generic payment resource is optional; an application can require and bind it to its own URL.
- `x402-transport`: facilitator request bodies and Iris cards for `/verify` and `/settle`. HTTPS URLs and local HTTP loopback are accepted. Redirects and automatic retries are disabled. Settlement retry policy belongs to the application because a lost response may follow a successful transfer.
- `x402-evm`: optional EIP-3009 address/signature shape checks, hexadecimal nonce encoding, and authorization binding. It does not perform secp256k1 signature recovery or on-chain validation; those belong to the facilitator.

A consuming agent:

1. Constructs a `required:x402` challenge and responds with status 402 and `required-header:x402-protocol` when payment is absent.
2. Decodes `PAYMENT-SIGNATURE`, checks `matches:x402-protocol`, and applies its own resource/nonce policy.
3. Sends a `card:x402-transport` with a unique wire and `%verify`, using the payment and snapshotted requirements.
4. Parses the Iris response through `de-verification:x402-json` and only proceeds when `valid` is true. Validate the returned payer for the chosen scheme.
5. Sends `%settle` once, parses `de-settlement:x402-json`, checks `settled:x402-protocol`, and records the transaction before fulfilling the resource.
6. Returns `response-header:x402-protocol` with the settlement receipt. Persist enough state to reject replay and reconcile ambiguous outcomes without blindly resending settlement.

The reference policy in `../domheap/payments.hoon` implements this lifecycle with ship-bound quotes. It is deliberately outside this library: other Urbit applications can charge for a resource, a time window, or another entitlement without inheriting publication semantics.

The wire format follows the [x402 v2 specification](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md), [HTTP transport](https://github.com/x402-foundation/x402/blob/main/specs/transports-v2/http.md), and [exact EVM scheme](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md). No Cloudflare account or service is part of the protocol.
