import { createApp } from "../../src/app";
import { createPortfolioServiceMock } from "../../src/services/portfolio/mock.ts";
import { timeServiceMock } from "../../src/services/time/time";

export const createTestApp = async () => {
  return createApp({
    time: timeServiceMock,
    portfolio: createPortfolioServiceMock({ timeService: timeServiceMock }),
  });
};
