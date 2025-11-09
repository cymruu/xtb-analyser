import { formatISO } from "date-fns";
import { startOfDay } from "date-fns/fp";
import { Array, Effect, GroupBy, Match, pipe, Sink, Stream } from "effect";
import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";

import { PrismaClient } from "../../generated/prisma/client";
import { CreatePortfolioRequestBodySchema } from "../../routes/portfolio/index";
import { createPriceServiceMock } from "../price/mock";
import { timeServiceMock } from "../time/time";
import type { TransactionTimeKey, Ticker } from "../../domains/stock/types";
import type { TypedEntries } from "../../types";

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
    async calculatePortfolioDailyValue(operations: ParsedCashOperationRow[]) {
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
      );

      const transactionsByDay = await Effect.runPromise(
        transactionsByDayEffect,
      );

      console.dir({ transactionsByDay }, { depth: 5 });

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
      console.dir({ result }, { depth: 5 });

      const priceIndex = createPriceIndex();
      Array.forEach(Object.values(result), ({ key: date, current }) => {
        Array.forEach(
          Object.entries(current) as TypedEntries<typeof current>,
          ([symbol, amount]) => {
            priceIndex.registerTicker(date, symbol, amount);
          },
        );
      });
      const priceService = createPriceServiceMock(priceIndex.index, {
        timeService: timeServiceMock,
      });
      const prices = priceService.prices;

      console.dir({ index: priceIndex.index, prices }, { depth: 5 });

      return result;
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

export type TickerPriceIndices = {
  [key: Ticker]: Array<{ start: Date; end: Date | null }>;
};

export const createPriceIndex = () => {
  const index: TickerPriceIndices = {};
  const registerTicker = (
    date: TransactionTimeKey,
    symbol: Ticker,
    amount: number,
  ) => {
    const d = new Date(date);
    if (!index[symbol]) index[symbol] = [];

    const tickerPeriods = index[symbol];
    const lastPeriod = tickerPeriods[tickerPeriods.length - 1];

    if (amount > 0) {
      if (!lastPeriod || lastPeriod.end !== null) {
        tickerPeriods.push({ start: d, end: null });
      }
    } else {
      if (lastPeriod && lastPeriod.end === null) {
        lastPeriod.end = d;
      }
    }
  };
  return { index, registerTicker };
};
