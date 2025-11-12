import { formatISO } from "date-fns";
import { startOfDay } from "date-fns/fp";
import { Array, Effect, GroupBy, Match, pipe, Sink, Stream } from "effect";
import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";

import {
  type Ticker,
  type TransactionTimeKey,
} from "../../domains/stock/types";
import { PrismaClient } from "../../generated/prisma/client";
import { createYahooPriceRepository } from "../../repositories/yahooPrice/YahooPriceRepository";
import { CreatePortfolioRequestBodySchema } from "../../routes/portfolio/index";
import type { TypedEntries } from "../../types";
import { timeService } from "../time/time";
import { createPriceResolver, fetchPrices } from "../price";
import { provide } from "effect/Layer";

type PortfolioServiceDeps = { prismaClient: PrismaClient };

export const createPortfolioService = ({
  prismaClient,
}: PortfolioServiceDeps) => {
  return {
    async create(
      portfolioPayload: z.infer<typeof CreatePortfolioRequestBodySchema>,
    ) {
      const result = await prismaClient.portfolio.create({
        data: {
          schemaVersion: "1",
          schema: portfolioPayload,
        },
      });

      return result;
    },
    calculatePortfolioDailyValue(operations: ParsedCashOperationRow[]) {
      return Effect.gen(function* () {
        const transactions = pipe(
          Array.filter(operations, (v) => {
            return v.type === "Stock purchase" || v.type === "Stock sale";
          }),
          Array.map((transaction) => {
            const quantityMultiplier = Match.value(transaction.type).pipe(
              Match.when("Stock purchase", () => 1),
              Match.when("Stock sale", () => -1),
              Match.exhaustive,
            );

            const quantity = transaction.quantity * quantityMultiplier;
            return {
              quantity,
              time: transaction.time,
              symbol: transaction.symbol,
            } as PortfolioTransaction;
          }),
        );

        const transactionsByDayEffect = Stream.fromIterable(transactions).pipe(
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
          Effect.tap((transactionsByDay) => {
            return Effect.logDebug(
              "Calculated transactionsByDay",
              transactionsByDay,
            );
          }),
        );

        const dailyPortfolioStocksEffect = pipe(
          transactionsByDayEffect,
          Effect.map((transactionsByDay) => {
            const [_, result] = Array.mapAccum(
              Object.entries(transactionsByDay) as TypedEntries<
                typeof transactionsByDay
              >,
              {},
              (state, [key, transactions]) => {
                const current = calculatePortfolioInDay(state, transactions);
                return [current, { key, current }];
              },
            );
            return result;
          }),
          Effect.tap((dailyPortfolioStocks) => {
            return Effect.logDebug(
              "Calculated dailyPortfolioStocks",
              dailyPortfolioStocks,
            );
          }),
        );

        const priceIndexEffect = createPriceIndex(
          dailyPortfolioStocksEffect,
        ).pipe(
          Effect.tap((index) => Effect.logDebug("Created price index", index)),
        );

        const prices = yield* fetchPrices(priceIndexEffect);
        const priceResolver = createPriceResolver(prices.successes);

        return [
          priceResolver.getPrice("UPS", "2020-12-12"),
          priceResolver.getPrice("META", "2020-12-12"),
        ];
      });
    },
  };
};

type PortfolioTransaction = {
  quantity: number;
  time: Date;
  symbol: Ticker;
};

export type PortfolioDayElements = {
  [key: Ticker]: number;
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

export type TickerPriceIndice = { start: Date; end: Date | null };

export type TickerPriceIndex = {
  [key: Ticker]: Array<TickerPriceIndice>;
};

export const createPriceIndex = (
  dailyPortfolioStocksEffect: Effect.Effect<
    {
      key: TransactionTimeKey;
      current: PortfolioDayElements;
    }[],
    never,
    never
  >, // TODO: create a type for it
) =>
  pipe(
    Effect.map(dailyPortfolioStocksEffect, (dailyPortfolioStocks) => {
      return dailyPortfolioStocks.flatMap((v) =>
        (Object.entries(v.current) as TypedEntries<typeof v.current>).map(
          ([symbol, amount]) => ({
            key: v.key,
            symbol,
            amount,
          }),
        ),
      );
    }),
    Effect.andThen((flattenedDailyStocks) => {
      return Array.reduce(
        flattenedDailyStocks,
        {} as TickerPriceIndex,
        (index, curr) => {
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
        },
      );
    }),
  );
