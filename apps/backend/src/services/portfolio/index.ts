import { formatISO } from "date-fns";
import { startOfDay } from "date-fns/fp";
import {
  Array,
  Effect,
  Either,
  GroupBy,
  Match,
  pipe,
  Sink,
  Stream,
} from "effect";
import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";

import { CreatePortfolioRequestBodySchema } from "../../routes/portfolio/index";
import type { TypedEntries } from "../../types";
import { createPriceResolver, fetchPrices } from "../price";
import { YahooPriceRepository } from "../../repositories/yahooPrice/YahooPriceRepository";
import { fillDailyPortfolioGaps } from "./fillDailyPortfolioGaps";
import { mapYahooPriceToPricePoint } from "./mapYahooPriceToPricePoint";
import type { PortfolioDayElements, PortfolioTransaction } from "./types";
import { tickerToYahooTicker } from "../yahooFinance/ticker.ts";
import type { Ticker, TransactionTimeKey } from "../../domains/stock/types.ts";
import { createMissingPricesIndex, createPriceIndex } from "./priceIndex.ts";

export const createPortfolioService = () => {
  return {
    async create(
      portfolioPayload: z.infer<typeof CreatePortfolioRequestBodySchema>,
    ) {},
    calculatePortfolioDailyValue(operations: ParsedCashOperationRow[]) {
      return Effect.gen(function* () {
        const yahooPriceRepository = yield* YahooPriceRepository;

        const transactions = pipe(
          Array.filter(operations, (v) => {
            return v.type === "Stock purchase" || v.type === "Stock sale";
          }),
          Array.map((transaction): PortfolioTransaction => {
            const quantityMultiplier = Match.value(transaction.type).pipe(
              Match.when("Stock purchase", () => 1),
              Match.when("Stock sale", () => -1),
              Match.exhaustive,
            );

            const quantity = transaction.quantity * quantityMultiplier;
            return {
              quantity,
              time: transaction.time,
              symbol: tickerToYahooTicker(transaction.symbol as Ticker),
            };
          }),
        );

        const transactionsByDay = yield* Stream.fromIterable(transactions).pipe(
          Stream.groupByKey(
            (transaction) =>
              formatISO(startOfDay(transaction.time), {
                representation: "date",
              }) as TransactionTimeKey,
          ),
          GroupBy.evaluate((key, stream) =>
            stream.pipe(Stream.map((transaction) => ({ key, transaction }))),
          ),
          Stream.run(
            Sink.foldLeft(
              {} as {
                [key: TransactionTimeKey]: PortfolioTransaction[];
              },
              (acc, curr) => {
                if (!acc[curr.key]) {
                  acc[curr.key] = [curr.transaction];
                  return acc;
                }

                acc[curr.key]!.push(curr.transaction);
                return acc;
              },
            ),
          ),
        );
        yield* Effect.logDebug("transactionsByDay", transactionsByDay);

        const [_, dailyPortfolioStocks] = Array.mapAccum(
          Object.entries(transactionsByDay) as TypedEntries<
            typeof transactionsByDay
          >,
          {},
          (state, [key, transactions]) => {
            const current = calculatePortfolioInDay(state, transactions);
            return [current, { key, current }];
          },
        );
        yield* Effect.logDebug(
          "Calculated dailyPortfolioStocks",
          dailyPortfolioStocks,
        );

        const priceIndex = createPriceIndex(dailyPortfolioStocks);
        yield* Effect.logDebug("Created price index", priceIndex);

        const dbPrices =
          yield* yahooPriceRepository.getPricesFromDb(priceIndex);

        yield* Effect.logDebug(
          `Retrieved ${dbPrices.length} prices from db cache`,
        );

        const missingPriceIndex = yield* createMissingPricesIndex(
          priceIndex,
          dbPrices,
        );
        yield* Effect.logDebug("Created missingPriceIndex", missingPriceIndex);

        const prices = yield* fetchPrices(missingPriceIndex);
        const pricePoints = Array.map(
          prices.successes,
          mapYahooPriceToPricePoint,
        );
        const priceResolver = createPriceResolver(pricePoints);

        const effects = pipe(
          fillDailyPortfolioGaps(dailyPortfolioStocks),
          Effect.map((v) => {
            return Array.map(v, ({ key, current }) => {
              return priceResolver.calculateValue(key, current);
            });
          }),
          Effect.flatMap(Effect.all),
        );

        const saveResult = yield* Effect.either(
          yahooPriceRepository.saveBulkPrices(prices.successes),
        );
        if (Either.isLeft(saveResult)) {
          yield* Effect.logError(
            "Error saving prices to database",
            saveResult.left,
          );
        } else {
          yield* Effect.logDebug("saved prices to database", saveResult.right);
        }

        return yield* effects;
      });
    },
  };
};

const PRECISION = 10 ^ 2;

const calculatePortfolioInDay = (
  previous: PortfolioDayElements,
  transactions: PortfolioTransaction[],
) => {
  return Array.reduce(
    transactions,
    { ...previous } as PortfolioDayElements,
    (acc, curr) => {
      const currentValue = acc[curr.symbol] ?? 0;
      acc[curr.symbol] =
        Math.round(
          (currentValue + curr.quantity + Number.EPSILON) * PRECISION,
        ) / PRECISION;

      return acc;
    },
  );
};
