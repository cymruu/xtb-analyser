import type { YahooTicker } from "../yahooFinance/ticker";
export type { Ticker, TransactionTimeKey } from "../../domains/stock/types";

export type PortfolioTransaction = {
  quantity: number;
  time: Date;
  symbol: YahooTicker;
};

export type PortfolioDayElements = {
  [key: YahooTicker]: number;
};
