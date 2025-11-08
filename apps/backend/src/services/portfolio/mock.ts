import { randomUUIDv7 } from "bun";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";

import { createPortfolioService } from ".";
import type { Portfolio } from "../../generated/prisma/client";
import type { ITimeService } from "../time/time";

export const createPortfolioServiceMock = (deps: {
  timeService: ITimeService;
}): ReturnType<typeof createPortfolioService> => {
  const portfolios: Portfolio[] = [];

  return {
    async create(portfolioPayload) {
      const portfolio = {
        id: portfolios.length + 1,
        uuid: randomUUIDv7(),
        createdAt: deps.timeService.now(),
        updatedAt: deps.timeService.now(),
        ...portfolioPayload,
      };
      portfolios.push(portfolio);

      return portfolio;
    },
    calculatePortfolioDailyValue: function (
      operations: ParsedCashOperationRow[],
    ) {
      throw new Error("Function not implemented.");
    },
  };
};
