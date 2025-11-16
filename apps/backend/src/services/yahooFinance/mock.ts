import { eachDayOfInterval } from "date-fns";
import { Effect, Layer, RequestResolver } from "effect";

import { GetHistoricalPrices, YahooFinance } from ".";
import type { Ticker } from "../../domains/stock/types";
import type { TickerPriceIndice } from "../portfolio";

export const YahooFinanceMock = Layer.succeed(YahooFinance, {
  getHistoricalPrices: (ticker: Ticker, indice: TickerPriceIndice) => {
    const resolver = RequestResolver.fromEffect(() =>
      Effect.succeed({
        meta: { symbol: ticker },
        quotes: eachDayOfInterval({
          start: indice.start,
          end: indice.end || new Date(0),
        }).map((date) => ({
          date,
          high: 1,
          low: 1,
          open: 1,
          close: 1,
          volume: 1,
        })),
      }),
    );

    return Effect.request(GetHistoricalPrices({ ticker, indice }), resolver);
  },
});
