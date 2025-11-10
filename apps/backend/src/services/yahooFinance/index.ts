import { Data, Effect, Request, RequestResolver } from "effect";
import YahooFinance from "yahoo-finance2";
import type { ChartResultArray } from "yahoo-finance2/modules/chart";

import { type Ticker } from "../../domains/stock/types";
import type { TickerPriceIndice } from "../portfolio";
import { tickerToYahooTicker } from "./tickerToYahooTicker";

export class GetHistoricalPricesError extends Data.TaggedError(
  "GetHistoricalPricesError",
)<{ message: string; ticker: Ticker; indice: TickerPriceIndice }> {}

export const GetHistoricalPrices = Request.tagged<
  Request.Request<ChartResultArray, GetHistoricalPricesError> & {
    readonly _tag: "GetHistoricalPrices";
  }
>("GetHistoricalPrices");

export interface IYahooFinanceService
  extends ReturnType<typeof createYahooFinance> {}

export const createYahooFinance = () => {
  const yahooFinance = new YahooFinance();
  return {
    getHistoricalPrices: (ticker: Ticker, indice: TickerPriceIndice) => {
      const resolver = RequestResolver.fromEffect(() =>
        Effect.tryPromise({
          try: () =>
            yahooFinance.chart(tickerToYahooTicker(ticker), {
              period1: indice.start,
              period2: indice.end || undefined,
              interval: "1d",
            }),
          catch: (error) => {
            Effect.logWarning(error);
            console.error(error);
            return new GetHistoricalPricesError({
              message: "Error when querying prices from YahooFinance",
              ticker,
              indice,
            });
          },
        }),
      );

      return Effect.request(GetHistoricalPrices({ ticker, indice }), resolver);
    },
  };
};
