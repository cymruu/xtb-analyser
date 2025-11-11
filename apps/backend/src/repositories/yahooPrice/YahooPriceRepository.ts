import { Effect } from "effect";
import type { PrismaClient } from "../../generated/prisma/client";
import type { createPriceService } from "../../services/price";

export const createYahooPriceRepository = ({
  prismaClient,
}: {
  prismaClient: PrismaClient;
}) => {
  const saveBulkPrices = (
    pricesEffect: ReturnType<typeof createPriceService>["getPricesEffect"],
  ) => {
    return Effect.flatMap(pricesEffect, ({ successes }) =>
      Effect.tryPromise({
        try: () =>
          prismaClient.yahooPrice.createMany({
            data: successes
              .filter((x) => x.close)
              .map((price) => ({
                close: price.close,
                symbol: price.symbol,
                datetime: new Date(price.dateKey),
                open: price.open,
                high: price.high,
                low: price.low,
                close_adj: price.close_adjusted,
              })),
          }),

        catch: (error) => {
          Effect.logError(error);
          console.error(error);
        },
      }),
    );
  };

  return { saveBulkPrices };
};
