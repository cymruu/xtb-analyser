import type { Ticker } from "../../domains/stock/types";
export type { Ticker } from "../../domains/stock/types";
export type { TransactionTimeKey } from "../../domains/stock/types";

export type PortfolioTransaction = {
  quantity: number;
  time: Date;
  symbol: Ticker;
};

export type PortfolioDayElements = {
  [key: Ticker]: number;
};
