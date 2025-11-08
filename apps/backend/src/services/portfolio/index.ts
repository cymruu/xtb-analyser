import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";
import { Array, Chunk, Effect, GroupBy, pipe, Record, Stream } from "effect";

import { startOfDay } from "date-fns/fp";
import { map } from "effect/Array";
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
      console.log({ operations });

      const transactions = pipe(
        Array.filter(operations, (v) => {
          return v.type === "Stock purchase" || v.type === "Stock sale";
        }),
        map((transaction) => {
          return {
            quantity: transaction.quantity, //TODO: handle stock sale (negative quantity)
            time: transaction.time,
            symbol: transaction.symbol,
          };
        }),
      );

      console.log({ transactions });

      const transactionsByDay = Stream.fromIterable(transactions).pipe(
        Stream.groupByKey((transaction) => startOfDay(transaction.time)),
      );

      const stream = GroupBy.evaluate(transactionsByDay, (key, stream) =>
        Stream.fromEffect(Stream.runCollect(stream)),
      );

      const results = await Effect.runPromise(Stream.runCollect(stream));

      console.log({ results });
      console.log(JSON.stringify(results));

      return results;
    },
  };
};

type PortfolioDayElement = { [key: string]: number };

type PortfolioDayElements = {
  [key: number]: PortfolioDayElement;
};

const calculatePortfolioInDay = (
  previous: PortfolioDayElement,
  transactions: unknown[],
) => {};
