import { randomUUIDv7 } from "bun";

import { createPortfolioService } from ".";
import { ITimeService } from "../time/time";
import { Portfolio } from "../../generated/prisma/client";

export const createPortfolioServiceMock = (deps: {
  timeService: ITimeService;
}): ReturnType<typeof createPortfolioService> => {
  let lastPortfolioId = 0;
  const portfolios: Portfolio[] = [];

  return {
    async create(portfolioPayload) {
      const portfolio = {
        id: ++lastPortfolioId,
        uuid: randomUUIDv7(),
        createdAt: deps.timeService.now(),
        updatedAt: deps.timeService.now(),
        ...portfolioPayload,
      };
      portfolios.push(portfolio);

      return portfolio;
    },
  };
};
