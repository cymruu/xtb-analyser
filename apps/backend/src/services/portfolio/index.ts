import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";
import { Array, Effect, GroupBy, pipe, Sink, Stream } from "effect";

import { startOfDay } from "date-fns/fp";
import { map } from "effect/Array";
import { PrismaClient } from "../../generated/prisma/client";
import { CreatePortfolioRequestBodySchema } from "../../routes/portfolio/index";
import { format, formatISO } from "date-fns";

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
        map((transaction) => {
          return {
            quantity: transaction.quantity, //TODO: handle stock sale (negative quantity)
            time: transaction.time,
            symbol: transaction.symbol,
          } as PortfolioTransaction;
        }),
      );

      const transactionsByDay = Stream.fromIterable(transactions).pipe(
        Stream.groupByKey((transaction) =>
          formatISO(startOfDay(transaction.time), { representation: "date" }),
        ),
        GroupBy.evaluate((key, stream) =>
          stream.pipe(Stream.map((transaction) => ({ key, transaction }))),
        ),
        Stream.run(
          Sink.foldLeft(
            {} as { [key: string]: { transactions: unknown[] } },
            (acc, curr) => {
              if (!acc[curr.key]) {
                acc[curr.key] = { transactions: [curr.transaction] };
                return acc;
              }

              acc[curr.key]!.transactions.push(curr.transaction);
              return acc;
            },
          ),
        ),
      );

      const results = await Effect.runPromise(transactionsByDay);

      console.log({ results });
      console.log(JSON.stringify(results));

      return results;
    },
  };
};

type PortfolioTransaction = {
  quantity: number;
  time: Date;
  symbol: string;
};

type PortfolioDayElement = { [key: string]: number };

type PortfolioDayElements = {
  [key: number]: PortfolioDayElement;
};

const calculatePortfolioInDay = (
  previous: PortfolioDayElements,
  transactions: PortfolioTransaction[],
) => {
  const current = { ...previous };

  return current;
};
