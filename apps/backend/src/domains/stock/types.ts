import type { Brand } from "effect/Brand";

export type Ticker = string & Brand<Ticker>;
export type TransactionTimeKey = string & Brand<TransactionTimeKey>;
