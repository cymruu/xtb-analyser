import { Context, Data, Effect, Layer, Request, RequestResolver } from "effect";
import YahooFinanceClient from "yahoo-finance2";
import type { ChartResultArray } from "yahoo-finance2/modules/chart";

import type { TickerPriceIndice } from "../portfolio/priceIndex";
import { type YahooTicker } from "./ticker";

export class GetHistoricalPricesError extends Data.TaggedError(
  "GetHistoricalPricesError",
)<{
  message: string;
  ticker: YahooTicker;
  indice: TickerPriceIndice;
  error: unknown;
}> {}

export const GetHistoricalPrices = Request.tagged<
  Request.Request<ChartResultArray, GetHistoricalPricesError> & {
    readonly _tag: "GetHistoricalPrices";
  }
>("GetHistoricalPrices");

export class YahooFinance extends Context.Tag("YahooFinanceLive")<
  YahooFinance,
  {
    getHistoricalPrices: (
      ticker: YahooTicker,
      indice: TickerPriceIndice,
    ) => Effect.Effect<ChartResultArray, GetHistoricalPricesError>;
  }
>() {}

export const YahooFinanceLive = Layer.effect(
  YahooFinance,
  Effect.gen(function* () {
    const yahooFinance = new YahooFinanceClient();
    return {
      getHistoricalPrices: (ticker: YahooTicker, indice: TickerPriceIndice) => {
        const resolver = RequestResolver.fromEffect(() =>
          Effect.tryPromise({
            try: () =>
              yahooFinance.chart(ticker, {
                period1: indice.start,
                period2: indice.end || undefined,
                interval: "1d",
              }),
            catch: (error) => {
              return new GetHistoricalPricesError({
                message: "Error when querying prices from YahooFinance",
                ticker,
                indice,
                error,
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
