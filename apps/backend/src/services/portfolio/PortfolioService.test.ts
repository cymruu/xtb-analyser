import { describe, expect, it } from "bun:test";
import { createPortfolioService } from ".";

const PortfolioService = createPortfolioService({
  prismaClient: null as any,
});

describe("PortfolioService", () => {
  describe("calculatePortfolioDailyValue", () => {
    it("a", async () => {
      const r = await PortfolioService.calculatePortfolioDailyValue([
        {
          id: 1,
          comment: "",
          symbol: "UPS",
          type: "Stock purchase",
          amount: 500,
          quantity: 5,
          time: new Date("2025-11-08"),
        },

        {
          id: 1,
          comment: "",
          symbol: "META",
          type: "Stock purchase",
          amount: 500,
          quantity: 5,
          time: new Date("2025-11-08"),
        },
        {
          id: 1,
          comment: "",
          symbol: "META",
          type: "Stock purchase",
          amount: 500,
          quantity: 5,
          time: new Date("2025-11-09"),
        },
      ]);
      console.log({ r });
    });
  });
});
