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
import { CreatePortfolioRequestBodySchema } from "../../routes/portfolio/index";
import type { TypedEntries } from "../../types";
import { createPriceResolver, fetchPrices, type PricePoint } from "../price";
import { YahooPriceRepository } from "../../repositories/yahooPrice/YahooPriceRepository";
import { fillDailyPortfolioGaps } from "./fillDailyPortfolioGaps";

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
        const yahooPriceRepository = yield* YahooPriceRepository;

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
          Effect.tap((transactionsByDay) => {
            return Effect.logDebug(
              "Calculated transactionsByDay",
              transactionsByDay,
            );
          }),
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

        const pricesFromDb: PricePoint[] = yield* pipe(
          yahooPriceRepository.getPricesFromDb(priceIndex),
          Effect.map((prices) =>
            pipe(
              prices,
              Array.map((price) => {
                return {
                  symbol: price.symbol, //TODO: this is in fact YahooTicker
                  open: price.open,
                  high: price.high,
                  low: price.low,
                  close: price.close,
                  close_adjusted: price.close_adj,
                  source: "yahoo",
                  dateKey: formatISO(price.datetime, {
                    representation: "date",
                  }),
                } as PricePoint;
              }),
            ),
          ),
        );

        const prices = yield* fetchPrices(priceIndex);
        const priceResolver = createPriceResolver(prices.successes);

        const effects = Array.map(
          fillDailyPortfolioGaps(dailyPortfolioStocks),

          ({ key, current }) => {
            return priceResolver.calculateValue(key, current);
          },
        );

        return yield* Effect.all(effects);
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
