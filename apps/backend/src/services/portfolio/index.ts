import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";
import { formatISO } from "date-fns";
import { startOfDay } from "date-fns/fp";
import { Array, Effect, GroupBy, pipe, Sink, Stream } from "effect";

import { PrismaClient } from "../../generated/prisma/client";
import { CreatePortfolioRequestBodySchema } from "../../routes/portfolio/index";

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
          return {
            quantity: transaction.quantity, //TODO: handle stock sale (negative quantity)
            time: transaction.time,
            symbol: transaction.symbol,
          } as PortfolioTransaction;
        }),
      );

      const transactionsByDayEffect = Stream.fromIterable(transactions).pipe(
        Stream.groupByKey((transaction) =>
          formatISO(startOfDay(transaction.time), { representation: "date" }),
        ),
        GroupBy.evaluate((key, stream) =>
          stream.pipe(Stream.map((transaction) => ({ key, transaction }))),
        ),
        Stream.run(
          Sink.foldLeft(
            {} as { [key: string]: PortfolioTransaction[] },
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
        Object.entries(transactionsByDay),
        {},
        (state, [key, transactions]) => {
          const current = calculatePortfolioInDay(state, transactions);
          return [current, { key, current }];
        },
      );
      console.dir({ result }, { depth: 5 });

      return result;
    },
  };
};

type PortfolioTransaction = {
  quantity: number;
  time: Date;
  symbol: string;
};

type PortfolioDayElements = {
  [key: string]: number;
};

const calculatePortfolioInDay = (
  previous: PortfolioDayElements,
  transactions: PortfolioTransaction[],
) => {
  return Array.reduce(
    transactions,
    { ...previous } as PortfolioDayElements,
    (acc, curr) => {
      const currentValue = acc[curr.symbol] ?? 0;
      acc[curr.symbol] = currentValue + curr.quantity;

      return acc;
    },
  );
};
