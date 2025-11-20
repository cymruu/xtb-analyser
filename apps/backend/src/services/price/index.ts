import { Array, Data, Effect, flow, Option, pipe } from "effect";

import { eachDayOfInterval, endOfDay, formatISO, subDays } from "date-fns";
import {
  TransactionTimeKeyCtor,
  type TransactionTimeKey,
} from "../../domains/stock/types";
import type { TypedEntries } from "../../types";
import type { TickerPriceIndex } from "../portfolio/priceIndex";
import type { PortfolioDayElements } from "../portfolio/types";
import { TimeService } from "../time/time";
import { YahooFinance } from "../yahooFinance";
import type { YahooTicker } from "../yahooFinance/ticker";
import type { Currency } from "./currencyConversion";

type PriceEntry = {
  symbol: YahooTicker;
  currency: Currency;
  open: number;
  high: number;
  low: number;
  close: number;
  close_adjusted: number;
  source: "mock" | "yahoo";
};

type PricesByDate = {
  [key: TransactionTimeKey]: {
    [key: YahooTicker]: PriceEntry;
  };
};
export type PricePoint = PriceEntry & { dateKey: TransactionTimeKey };

export class MissingPriceError extends Data.TaggedError("MissingPriceError")<{
  symbol: YahooTicker;
  date: TransactionTimeKey;
}> {}

export type YahooPrice = {
  currency: string;
  date: Date;
  ticker: YahooTicker;
  open: number;
  high: number;
  low: number;
  close: number;
  close_adjusted: number;
};

export const fetchPrices = (priceIndex: TickerPriceIndex) =>
  Effect.gen(function* () {
    const yahooFinanceService = yield* YahooFinance;
    const timeService = yield* TimeService;

    return yield* Effect.partition(
      Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
      flow(([symbol, indices]) => {
        const dataRange = {
          start: indices?.[0]?.start || new Date(0),
          end: endOfDay(subDays(timeService.now(), 1)),
        }; // clamp to the day before today, to avoiding fetching incomplete data
        const historicalPrices = pipe(
          Effect.logDebug(`Requesting YahooFinance historical prices`, {
            ticker: symbol,
            indices: dataRange,
          }),
          Effect.andThen(() =>
            yahooFinanceService.getHistoricalPrices(symbol, dataRange),
          ),
        );
        return Effect.map(historicalPrices, (historicalPrices) => {
          return Array.map(historicalPrices.quotes, (quote) => {
            return <YahooPrice>{
              currency: historicalPrices.meta.currency,
              date: quote.date,
              ticker: historicalPrices.meta.symbol as YahooTicker,
              open: quote.open,
              high: quote.high,
              low: quote.low,
              close: quote.close,
              close_adjusted: quote.adjclose || null,
              source: "yahoo",
            };
          });
        });
      }),
    ).pipe(
      Effect.map(([failures, successes]) => {
        return { failures, successes: Array.flatten(successes) };
      }),
    );
  });

export type PriceResolver = ReturnType<typeof createPriceResolver>;
export const createPriceResolver = (flatPrices: PricePoint[]) => {
  const pricesByDate = Array.reduce(
    flatPrices,
    {} as PricesByDate,
    (acc, pricePoint) => {
      const key = pricePoint.dateKey;
      if (!acc[key]) {
        acc[key] = {};
      }

      acc[key][pricePoint.symbol] = {
        symbol: pricePoint.symbol,
        currency: pricePoint.currency,
        open: pricePoint.open,
        high: pricePoint.high,
        low: pricePoint.low,
        close: pricePoint.close,
        close_adjusted: pricePoint.close_adjusted,
        source: pricePoint.source,
      };

      return acc;
    },
  );

  const getPrice = (symbol: YahooTicker, date: TransactionTimeKey) => {
    const price = pricesByDate[date]?.[symbol];
    if (!price) {
      const lookup = Array.map(
        eachDayOfInterval({
          start: subDays(new Date(date), 5), // search for a price 5 days back
          end: new Date(date),
        }),
        (date) => {
          const key = TransactionTimeKeyCtor(
            formatISO(date, { representation: "date" }),
          );
          const v = pricesByDate[key]?.[symbol];
          if (!v) {
            return Option.none();
          }
          return Option.some(v);
        },
      );
      return pipe(lookup, Array.findFirst(Option.isSome), Option.flatten);
    }
    return Option.some(price);
  };

  const calculateValue = (
    date: TransactionTimeKey,
    portfolio: PortfolioDayElements,
  ) => {
    return Effect.partition(
      Object.entries(portfolio) as TypedEntries<typeof portfolio>,
      ([ticker, amount]) => {
        return Option.match(getPrice(ticker, date), {
          onNone: () => {
            return Effect.fail(
              new MissingPriceError({
                symbol: ticker,
                date,
              }),
            );
          },
          onSome(v) {
            return Effect.succeed({
              value: v.close * amount,
              currency: v.currency,
              date: date,
            });
          },
        });
      },
    ).pipe(
      Effect.map(([failures, successes]) => ({
        failures,
        total: Array.groupBy(successes, (x) => x.currency),
      })),
    );
  };

  return { getPrice, calculateValue };
};
