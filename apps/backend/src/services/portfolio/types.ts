import type { YahooTicker } from "../yahooFinance/ticker";

export type PortfolioTransaction = {
  quantity: number;
  time: Date;
  symbol: YahooTicker;
};

export type PortfolioDayElements = {
  [key: YahooTicker]: number;
};

export type PortfolioDeposit = {
  key: Date;
  value: number;
};

export type PortfolioWithdrawal = {
  key: Date;
  value: number;
};
