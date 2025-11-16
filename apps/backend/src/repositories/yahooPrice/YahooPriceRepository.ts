import { Array, Context, Data, Effect, Layer } from "effect";

import { endOfDay, startOfDay } from "date-fns";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { prismaClient } from "../../lib/db";
import type { TickerPriceIndex } from "../../services/portfolio/priceIndex";
import type { YahooPrice } from "../../services/price";
import { TimeService } from "../../services/time/time";
import type { TypedEntries } from "../../types";
import { DatabaseURL } from "./config";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  error: unknown;
}> {}

export class YahooPriceRepository extends Context.Tag("YahooPriceRepository")<
  YahooPriceRepository,
  {
    getPricesFromDb(
      priceIndex: TickerPriceIndex,
    ): Effect.Effect<
      Awaited<ReturnType<PrismaClient["yahooPrice"]["findMany"]>>,
      DatabaseError
    >;
    saveBulkPrices(
      prices: YahooPrice[],
    ): Effect.Effect<
      Awaited<ReturnType<PrismaClient["yahooPrice"]["createMany"]>>,
      DatabaseError
    >;
  }
>() {}

export const YahooPriceRepositoryLive = Layer.effect(
  YahooPriceRepository,
  Effect.gen(function* () {
    const timeService = yield* TimeService;
    yield* DatabaseURL;

    return {
      getPricesFromDb: (
        priceIndex: TickerPriceIndex,
      ): Effect.Effect<
        Awaited<ReturnType<PrismaClient["yahooPrice"]["findMany"]>>,
        DatabaseError
      > => {
        const whereFilter = Array.reduce(
          Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
          [] as Prisma.YahooPriceWhereInput[],
          (acc, [symbol, indices]) => {
            const elementFilter = {
              symbol,
              datetime: {
                gte: indices[0]?.start || new Date(0),
                lte:
                  indices[indices.length - 1]?.end ||
                  endOfDay(timeService.now()),
              },
            };
            acc.push(elementFilter);
            return acc;
          },
        );

        return Effect.tryPromise({
          try: () =>
            prismaClient.yahooPrice.findMany({
              where: { OR: whereFilter },
            }),

          catch: (error) => new DatabaseError({ error }),
        });
      },
      saveBulkPrices: (prices: YahooPrice[]) => {
        return Effect.tryPromise({
          try: () => {
            const closePrices = Array.filter(prices, (price) => !!price.close);

            return prismaClient.yahooPrice.createMany({
              skipDuplicates: true,
              data: Array.map(closePrices, (price) => ({
                currency: price.currency,
                close: price.close,
                symbol: price.ticker,
                datetime: startOfDay(price.date),
                open: price.open,
                high: price.high,
                low: price.low,
                close_adj: price.close_adjusted,
              })),
            });
          },

          catch: (error) => {
            return new DatabaseError({ error });
          },
        });
      },
    };
  }),
);
