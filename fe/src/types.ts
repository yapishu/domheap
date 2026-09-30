import type { Prices } from "./pricing";
export interface Publication {
  title: string;
  description: string;
  about: string;
  avatar: string;
  cover: string;
  host: string;
  configured: boolean;
}
export interface Post {
  id: string;
  title: string;
  body: string;
  paid: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  revision: number;
}
export interface Requirements {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: { name?: string; version?: string; [key: string]: unknown };
}
export interface Plan {
  enabled: boolean;
  prices: Prices;
  decimals: number;
  origin: string;
  requirements: Requirements;
}
export interface Session {
  host: string;
  viewer: string;
  owner: boolean;
  subscribed: boolean;
  expiresAt: number | null;
  permanent: boolean;
  plan: Plan | null;
}
export interface Notebook {
  name: string;
  host: string;
  title: string;
  rootFolderId: string;
  visibility: string;
}
export interface Member {
  ship: string;
  expiresAt: number | null;
  source: string;
  active: boolean;
}
export interface PaymentRecord {
  nonce: string;
  payer: string | null;
  id: string;
  ship: string;
  phase: string;
  expiresAt: number;
  requirements: Requirements;
  settlement: { transaction: string; errorReason?: string } | null;
}
export interface Author {
  payments: PaymentRecord[];
  publication: Publication;
  notebook: string | null;
  avatarOverride: string;
  coverOverride: string;
  notesAvailable: boolean;
  notebooks: Notebook[];
  members: Member[];
  following: string[];
  plan: Plan | null;
  facilitator: string;
  origin: string;
}
export interface Index {
  publication: Publication;
  posts: Post[];
}
