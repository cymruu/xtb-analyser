import { z } from "zod";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";
import { Array, pipe, Stream } from "effect";

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
    async calculatePortfolioStatus(operations: ParsedCashOperationRow[]) {
      const transactions = pipe(
        Array.filter(operations, (v) => {
          return v.type === "Stock purchase" || v.type === "Stock sale";
        }),
        map((x) => {
          return { quantity: x.quantity, time: x.time };
        }),
      );

      const groupedByDay = Stream.fromIterable(transactions).pipe(
        Stream.groupByKey((transaction) => startOfDay(transaction.time)),
      );
      return transactions;
    },
  };
};
