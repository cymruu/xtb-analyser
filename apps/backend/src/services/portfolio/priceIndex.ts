import { addDays, isAfter, isEqual, startOfDay, subDays } from "date-fns";
import { Array, Effect, Option, pipe } from "effect";

import type { TransactionTimeKey } from "../../domains/stock/types";
import type { PrismaClient } from "../../generated/prisma/client";
import type { TypedEntries } from "../../types";
import { TimeService } from "../time/time";
import type { YahooTicker } from "../yahooFinance/ticker";
import type { PortfolioDayElements } from "./types";

export type TickerPriceIndice = { start: Date; end: Date | null };

export type TickerPriceIndex = {
  [key: YahooTicker]: Array<TickerPriceIndice>;
};

export const createPriceIndex = (
  dailyPortfolioStocksEffect: {
    key: TransactionTimeKey;
    current: PortfolioDayElements;
  }[],
) => {
  const flattenedDailyStocks = pipe(
    dailyPortfolioStocksEffect,
    Array.flatMap((v) =>
      (Object.entries(v.current) as TypedEntries<typeof v.current>).map(
        ([symbol, amount]) => ({
          key: v.key,
          symbol,
          amount,
        }),
      ),
    ),
  );

  return pipe(
    flattenedDailyStocks,
    Array.reduce({} as TickerPriceIndex, (index, curr) => {
      const d = new Date(curr.key);
      if (!index[curr.symbol]) index[curr.symbol] = [];

      const tickerPeriods = index[curr.symbol]!;
      const lastPeriod = tickerPeriods[tickerPeriods.length - 1];

      if (curr.amount > 0) {
        if (!lastPeriod || lastPeriod.end !== null) {
          tickerPeriods.push({ start: d, end: null });
        }
      } else {
        if (lastPeriod && lastPeriod.end === null) {
          lastPeriod.end = d;
        }
      }

      return index;
    }),
  );
};

export const createMissingPricesIndex = (
  priceIndex: TickerPriceIndex,
  dbPrices: Awaited<ReturnType<PrismaClient["yahooPrice"]["findMany"]>>,
) => {
  return Effect.gen(function* () {
    const timeService = yield* TimeService;

    const clamped = Array.reduce(
      Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
      {} as TickerPriceIndex,
      (acc, [key, indices]) => {
        const start = Array.head(indices).pipe(Option.getOrThrow);
        const end = Array.last(indices).pipe(Option.getOrThrow);

        acc[key] = [
          {
            start: start.start,
            end: end.end || subDays(startOfDay(timeService.now()), 1),
          },
        ];

        return acc;
      },
    );

    return yield* pipe(
      Effect.reduce(dbPrices, clamped, (acc, curr) => {
        const ticker = curr.symbol as YahooTicker;
        const indiceOption = Array.head(acc[ticker] || []);

        return Option.match(indiceOption, {
          onNone: () => {
            return Effect.succeed(acc);
          },
          onSome: function (indice) {
            if (indice.start < curr.datetime) {
              indice.start = addDays(curr.datetime, 1);
            }

            if (
              indice.end &&
              (isAfter(indice.start, indice.end) ||
                isEqual(indice.start, indice!.end))
            ) {
              delete acc[ticker];
            }
            return Effect.succeed(acc);
          },
        });
      }),
    );
  });
};
