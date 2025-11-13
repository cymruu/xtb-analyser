import type { BrandedType } from "../../types";

export type Ticker = BrandedType<string, "Ticker">;
export const TickerCtor = (s: string): Ticker => s as Ticker;

export type TransactionTimeKey = BrandedType<string, "TransactionTimeKey">;
export const TransactionTimeKeyCtor = (s: string): TransactionTimeKey =>
  s as TransactionTimeKey;
