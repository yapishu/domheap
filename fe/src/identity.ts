import { base } from "./api";
export function login(ship = "") {
  const redirect = `${location.origin}${base}/subscribe${ship ? `?ship=${encodeURIComponent(ship)}` : ""}`;
  return `/~/login?eauth&redirect=${encodeURIComponent(redirect)}`;
}
