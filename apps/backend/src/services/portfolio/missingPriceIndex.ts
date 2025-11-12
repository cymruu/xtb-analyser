import { Array, Effect, Option, pipe } from "effect";
import type { TickerPriceIndex } from ".";
import type { PrismaClient } from "../../generated/prisma/client";
import type { TypedEntries } from "../../types";
import { TickerCtor } from "../../domains/stock/types";
import { addDays, isEqual } from "date-fns";

export const createMissingPricesIndex = (
  priceIndex: TickerPriceIndex,
  dbPrices: Awaited<ReturnType<PrismaClient["yahooPrice"]["findMany"]>>,
) => {
  return Effect.gen(function* () {
    const clamped = Array.reduce(
      Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
      {} as TickerPriceIndex,
      (acc, [key, indices]) => {
        const start = Array.head(indices).pipe(Option.getOrThrow);
        const end = Array.last(indices).pipe(Option.getOrThrow);

        acc[key] = [{ start: start.start, end: end.end }];

        return acc;
      },
    );

    return yield* pipe(
      Effect.reduce(dbPrices, clamped, (acc, curr) => {
        const ticker = TickerCtor(curr.symbol);
        const indiceOption = Array.head(acc[ticker] || []);

        return Option.match(indiceOption, {
          onNone: () => {
            return Effect.succeed(acc);
          },
          onSome: function (indice) {
            if (indice.start < curr.datetime) {
              indice.start = addDays(curr.datetime, 1);
            }

            if (indice.end && isEqual(indice.start, indice.end)) {
              delete acc[ticker];
            }
            return Effect.succeed(acc);
          },
        });
      }),
    );
  });
};
