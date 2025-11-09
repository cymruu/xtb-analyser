import { Brand } from "effect";

export type Ticker = string & Brand.Brand<Ticker>;
export const TickerCtor = Brand.nominal<Ticker>();

export type TransactionTimeKey = string & Brand.Brand<TransactionTimeKey>;
export const TransactionTimeKeyCtor = Brand.nominal<TransactionTimeKey>();
