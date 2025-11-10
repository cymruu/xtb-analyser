import { formatISO } from "date-fns";
import { Array, Data, Effect, flow, Option } from "effect";

import type { PortfolioDayElements, TickerPriceIndex } from "../portfolio";
import { type ITimeService } from "../time/time";
import type { Ticker, TransactionTimeKey } from "../../domains/stock/types";
import type { TypedEntries } from "../../types";
import type { createYahooFinance } from "../yahooFinance";

type PriceEntry = {
  symbol: Ticker;
  open: number;
  high: number;
  low: number;
  close: number;
  close_adjusted: number;
  source: "mock" | "yahoo";
};

type PricesByDate = {
  [key: TransactionTimeKey]: {
    [key: Ticker]: PriceEntry;
  };
};
type PricePoint = PriceEntry & { dateKey: TransactionTimeKey };

export class MissingPriceError extends Data.TaggedError("MissingPriceError")<{
  symbol: Ticker;
  date: TransactionTimeKey;
}> {}

export const createPriceService = async (
  priceIndex: TickerPriceIndex,
  {
    timeService,
    yahooFinanceService,
  }: {
    timeService: ITimeService;
    yahooFinanceService: ReturnType<typeof createYahooFinance>;
  },
) => {
  const getPrices = (priceIndex: TickerPriceIndex) => {
    return Effect.partition(
      Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
      flow(([symbol, indices]) => {
        const historicalPrices = yahooFinanceService.getHistoricalPrices(
          symbol,
          {
            start: indices?.[0]?.start || new Date(0),
            end: timeService.now(),
          },
        );
        return Effect.map(historicalPrices, (historicalPrices) => {
          return Array.map(historicalPrices.quotes, (quote) => {
            const dateKey = formatISO(quote.date, {
              representation: "date",
            }) as TransactionTimeKey;

            return <PricePoint>{
              dateKey,
              symbol,
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
  };

  const getPricesByDate = (flatPrices: PricePoint[]) =>
    Array.reduce(flatPrices, {} as PricesByDate, (acc, pricePoint) => {
      const key = pricePoint.dateKey;
      if (!acc[key]) {
        acc[key] = {};
      }

      acc[key][pricePoint.symbol] = {
        symbol: pricePoint.symbol,
        open: pricePoint.open,
        high: pricePoint.high,
        low: pricePoint.low,
        close: pricePoint.close,
        close_adjusted: pricePoint.close_adjusted,
        source: pricePoint.source,
      };

      return acc;
    });

  const { failures, successes: prices } = await Effect.runPromise(
    getPrices(priceIndex),
  );
  console.log({ failures });

  const pricesByDate = getPricesByDate(prices);

  const getPrice = (symbol: Ticker, date: TransactionTimeKey) => {
    const price = pricesByDate[date]?.[symbol];

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
