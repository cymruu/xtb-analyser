import { Context, Data, Effect, Layer, Request, RequestResolver } from "effect";
import YahooFinanceClient from "yahoo-finance2";
import type { ChartResultArray } from "yahoo-finance2/modules/chart";

import { type Ticker } from "../../domains/stock/types";
import type { TickerPriceIndice } from "../portfolio";
import { tickerToYahooTicker } from "./ticker";

export class GetHistoricalPricesError extends Data.TaggedError(
  "GetHistoricalPricesError",
)<{ message: string; ticker: Ticker; indice: TickerPriceIndice }> {}

export const GetHistoricalPrices = Request.tagged<
  Request.Request<ChartResultArray, GetHistoricalPricesError> & {
    readonly _tag: "GetHistoricalPrices";
  }
>("GetHistoricalPrices");

export class YahooFinance extends Context.Tag("YahooFinanceLive")<
  YahooFinance,
  {
    getHistoricalPrices: (
      ticker: Ticker,
      indice: TickerPriceIndice,
    ) => Effect.Effect<ChartResultArray, GetHistoricalPricesError>;
  }
>() {}

export const YahooFinanceLive = Layer.effect(
  YahooFinance,
  Effect.gen(function* () {
    const yahooFinance = new YahooFinanceClient();
    return {
      getHistoricalPrices: (ticker: Ticker, indice: TickerPriceIndice) => {
        const yahooTicker = tickerToYahooTicker(ticker);
        const resolver = RequestResolver.fromEffect(() =>
          Effect.tryPromise({
            try: () =>
              yahooFinance.chart(yahooTicker, {
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

        return Effect.request(
          GetHistoricalPrices({ ticker, indice }),
          resolver,
        );
      },
    };
  }),
);
