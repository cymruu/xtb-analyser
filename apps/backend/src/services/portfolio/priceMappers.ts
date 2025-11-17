import { formatISO } from "date-fns";
import type { PricePoint, YahooPrice } from "../price";
import type { TransactionTimeKey } from "../../domains/stock/types";
import type { YahooTicker } from "../yahooFinance/ticker";
import type { DbPrice } from "../../repositories/yahooPrice/YahooPriceRepository";

export const mapYahooPriceToPricePoint = (
  yahooPrice: YahooPrice,
): PricePoint => {
  const dateKey = formatISO(yahooPrice.date, {
    representation: "date",
  }) as TransactionTimeKey;

  return {
    symbol: yahooPrice.ticker,
    dateKey,
    open: yahooPrice.open,
    high: yahooPrice.high,
    low: yahooPrice.low,
    close: yahooPrice.close,
    close_adjusted: yahooPrice.close_adjusted,
    source: "yahoo",
  };
};

export const mapDbPriceToPricePoint = (price: DbPrice): PricePoint => {
  return {
    dateKey: formatISO(price.datetime, {
      representation: "date",
    }) as TransactionTimeKey,
    symbol: price.symbol as YahooTicker,
    open: price.open,
    high: price.high,
    low: price.low,
    close: price.close,
    close_adjusted: price.close_adj,
    source: "yahoo",
  };
};
