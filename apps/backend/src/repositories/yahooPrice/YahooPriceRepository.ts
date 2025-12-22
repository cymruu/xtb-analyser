import { Array, Context, Data, Effect, Layer } from "effect";

import { endOfDay, startOfDay } from "date-fns";
import { and, eq, gte, lte, or, SQL, sql } from "drizzle-orm";
import type { MySqlRawQueryResult } from "drizzle-orm/mysql2";
import { db } from "../../drizzle/db";
import { yahooPrice } from "../../drizzle/schema";
import type { TickerPriceIndex } from "../../services/portfolio/priceIndex";
import type { YahooPrice } from "../../services/price";
import { TimeService } from "../../services/time/time";
import type { TypedEntries } from "../../types";
import { DatabaseURL } from "./config";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  error: unknown;
}> { }

export class YahooPriceRepository extends Context.Tag("YahooPriceRepository")<
  YahooPriceRepository,
  {
    getPricesFromDb(
      priceIndex: TickerPriceIndex,
    ): Effect.Effect<
      Awaited<typeof yahooPrice.$inferSelect[]>,
      DatabaseError
    >;
    saveBulkPrices(
      prices: YahooPrice[],
    ): Effect.Effect<
      Awaited<MySqlRawQueryResult>,
      DatabaseError
    >;
  }
>() { }

export type DbPrice = Awaited<
  typeof yahooPrice.$inferSelect
>

export const YahooPriceRepositoryLive = Layer.effect(
  YahooPriceRepository,
  Effect.gen(function*() {
    const timeService = yield* TimeService;
    yield* DatabaseURL;

    return {
      getPricesFromDb: (
        priceIndex: TickerPriceIndex,
      ) => {
        const whereFilter = Array.reduce(
          Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
          [] as (SQL | undefined)[],
          (acc, [symbol, indices]) => {
            const symbolFilter = eq(yahooPrice.symbol, symbol)
            const datetimeLowerFilter = gte(yahooPrice.datetime, indices[0]?.start || new Date(0))
            const datetimeUpperFilter = lte(yahooPrice.datetime, indices[indices.length - 1]?.end || endOfDay(timeService.now()))


            const filter = and(symbolFilter, datetimeLowerFilter, datetimeUpperFilter)
            acc.push(filter)
            return acc;
          },
        );

        return Effect.tryPromise({
          try: () =>
            db.select().from(yahooPrice).where(or(...whereFilter))
          ,
          catch: (error) => new DatabaseError({ error }),
        });
      },
      saveBulkPrices: (prices: YahooPrice[]) => {
        return Effect.tryPromise({
          try: () => {
            const closePrices = Array.filter(prices, (price) => !!price.close);

            return db.insert(yahooPrice).values(

              Array.map(closePrices, (price) => ({
                currency: price.currency,
                close: price.close,
                symbol: price.ticker,
                datetime: startOfDay(price.date),
                open: price.open,
                high: price.high,
                low: price.low,
                close_adj: price.close_adjusted,
                createdAt: timeService.now(),
                updatedAt: timeService.now(),
                closeAdj: price.close_adjusted
              }))
            ).onDuplicateKeyUpdate({ 'set': { 'id': sql`id` } })

          },

          catch: (error) => {
            return new DatabaseError({ error });
          },
        });
      },
    };
  }),
);
