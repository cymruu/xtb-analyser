import { formatISO } from "date-fns";
import type { PricePoint, YahooPrice } from "../price";
import type { TransactionTimeKey } from "../../domains/stock/types";

export const mapYahooPriceToPricePoint = (
  yahooPrice: YahooPrice,
): PricePoint => {
  const dateKey = formatISO(yahooPrice.date, {
    representation: "date",
  }) as TransactionTimeKey;

  return {
    symbol: yahooPrice.xtbTicker,
    dateKey,
    open: yahooPrice.open,
    high: yahooPrice.high,
    low: yahooPrice.low,
    close: yahooPrice.close,
    close_adjusted: yahooPrice.close_adjusted,
    source: "yahoo",
  };
};
