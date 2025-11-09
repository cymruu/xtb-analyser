import { prismaClient } from "../lib/db/index";
import { createPortfolioService } from "./portfolio";
import { type ITimeService, timeService } from "./time/time";

export type IServices = {
  time: ITimeService;
  portfolio: ReturnType<typeof createPortfolioService>;
};

export const createServices = async (): Promise<IServices> => {
  return {
    time: timeService,
    portfolio: createPortfolioService({ prismaClient }),
  };
};
