import { endOfDay, formatISO } from "date-fns";
import { eachDayOfInterval } from "date-fns/fp";
import { Array, Data, Effect, Option, Sink, Stream } from "effect";

import type { PortfolioDayElements, TickerPriceIndices } from "../portfolio";
import { type ITimeService } from "../time/time";
import type { Ticker, TransactionTimeKey } from "../../domains/stock/types";
import type { TypedEntries } from "../../types";

/*
 *  | SYMBOL | datetimedate | open | high | low | close | close adjusted | price_source
 */

type PriceEntry = {
  symbol: Ticker;
  open: number;
  high: number;
  low: number;
  close: number;
  close_adjusted: number;
  price_source: "mock" | "yahoo";
};

type Prices = {
  [key: TransactionTimeKey]: {
    [key: Ticker]: PriceEntry;
  };
};

export class MissingPriceError extends Data.TaggedError("MissingPriceError")<{
  symbol: Ticker;
  date: TransactionTimeKey;
}> {}

export const createPriceServiceMock = (
  priceIndex: TickerPriceIndices,
  {
    timeService,
  }: {
    timeService: ITimeService;
  },
) => {
  const prices: Prices = {};
  const getPrices = (priceIndex: TickerPriceIndices) => {
    Array.fromIterable(
      Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
    ).forEach(([symbol, indices]) => {
      Array.fromIterable(indices).forEach((index) => {
        const intervals = eachDayOfInterval({
          start: index.start,
          end: index.end ?? endOfDay(timeService.now()),
        });
        intervals.forEach((date) => {
          const key = formatISO(date, {
            representation: "date",
          }) as TransactionTimeKey;
          if (!prices[key]) {
            prices[key] = {};
          }

          prices[key][symbol] = {
            symbol,
            open: 1,
            high: 1,
            low: 1,
            close: 1,
            close_adjusted: 1,
            price_source: "mock",
          };
        });
      });
    });
  };
  getPrices(priceIndex);
  const getPrice = (symbol: Ticker, date: TransactionTimeKey) => {
    const price = prices[date]?.[symbol];

    if (!price) {
      // TODO: implement LOCF
      return Option.none();
    }
    return Option.some(price.close);
  };

  return {
    prices,
    getPrice,
    calculateValue: (
      date: TransactionTimeKey,
      portfolio: PortfolioDayElements,
    ) => {
      return Effect.partition(
        Object.entries(portfolio) as TypedEntries<typeof portfolio>,
        ([ticker, amount]) => {
          const priceOption = getPrice(ticker, date);

          return Option.match(priceOption, {
            onNone: () => {
              return Effect.fail(
                new MissingPriceError({
                  symbol: ticker,
                  date,
                }),
              );
            },
            onSome(v) {
              return Effect.succeed(v * amount);
            },
          });
        },
      ).pipe(
        Effect.map(([failures, successes]) => ({
          failures,
          value: Array.reduce(successes, 0, (acc, v) => acc + v),
        })),
      );
    },
  };
};
