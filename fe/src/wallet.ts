import type { Period } from "./pricing";
import { api, request, base } from "./api";
import type { Requirements } from "./types";
interface Provider {
  request(args: { method: string; params?: unknown[] }): Promise<any>;
}
declare global {
  interface Window {
    ethereum?: Provider;
  }
}
interface Required {
  x402Version: 2;
  resource: { url: string };
  accepts: Requirements[];
  extensions: {
    "domheap-subscription": {
      info: {
        nonce: string;
        validBefore: string;
        ship: string;
        days: number;
        period: Period;
      };
    };
  };
}
export interface Quote {
  id: string;
  ship: string;
  expiresAt: number;
  paymentRequired: Required;
}
export interface Receipt {
  phase: string;
  subscribed: boolean;
  settlement: { transaction: string } | null;
}
export const quote = (ship: string, period: Period) =>
  api<Quote>("quote", { ship, period });
export async function pay(q: Quote): Promise<Receipt> {
  const wallet = window.ethereum;
  if (!wallet)
    throw new Error(
      "Open this page in a browser with an Ethereum wallet to pay.",
    );
  const req = q.paymentRequired.accepts[0];
  const info = q.paymentRequired.extensions["domheap-subscription"].info;
  if (
    req.scheme !== "exact" ||
    !/^eip155:\d+$/.test(req.network) ||
    !req.extra.name ||
    !req.extra.version
  )
    throw new Error(
      "The author needs to finish configuring the token name and version.",
    );
  const chainId = Number(req.network.split(":")[1]);
  const chainHex = `0x${chainId.toString(16)}`;
  if (
    (await wallet.request({ method: "eth_chainId" })).toLowerCase() !== chainHex
  )
    await wallet.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }],
    });
  const accounts = await wallet.request({ method: "eth_requestAccounts" });
  if (!accounts[0]) throw new Error("Choose an account in your wallet.");
  const authorization = {
    from: accounts[0],
    to: req.payTo,
    value: req.amount,
    validAfter: String(Math.max(0, Math.floor(Date.now() / 1000) - 60)),
    validBefore: info.validBefore,
    nonce: info.nonce,
  };
  const typed = {
    domain: {
      name: req.extra.name,
      version: req.extra.version,
      chainId,
      verifyingContract: req.asset,
    },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: authorization,
  };
  const signature = await wallet.request({
    method: "eth_signTypedData_v4",
    params: [accounts[0], JSON.stringify(typed)],
  });
  const payload = {
    x402Version: 2,
    resource: q.paymentRequired.resource,
    accepted: req,
    payload: { signature, authorization },
    extensions: q.paymentRequired.extensions,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const header = btoa(
    Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
  );
  return request<Receipt>(`${base}/api/subscribe/${q.id}`, {}, "POST", {
    "payment-signature": header,
  });
}
