import { Brand } from "effect";
import { TickerCtor, type Ticker } from "../../domains/stock/types";

export type YahooTicker = string & Brand.Brand<YahooTicker>;
const YahooTickerCtor = Brand.nominal<YahooTicker>();

export const tickerToYahooTicker = (ticker: Ticker): YahooTicker => {
  const TICKER_MAP: Record<Ticker, YahooTicker> = {
    [TickerCtor("VOW1.DE")]: YahooTickerCtor("VOW.DE"),
  };

  if (TICKER_MAP[ticker]) {
    return TICKER_MAP[ticker];
  }

  const [symbol, exchange] = ticker.split(".");
  if (exchange === "PL") {
    return YahooTickerCtor(`${symbol}.WA`);
  }

  if (exchange === "US") {
    return YahooTickerCtor(symbol!);
  }

  if (exchange === "UK") {
    return YahooTickerCtor(`${symbol}.GB`);
  }

  if (exchange === "FI") {
    return YahooTickerCtor(`${symbol}.HE`);
  }

  return YahooTickerCtor(ticker);
};
