import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { init } from "excelize-wasm";
import { createPortfolioService, createPriceIndex } from ".";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";

const PortfolioService = createPortfolioService({
  prismaClient: null as any,
});

describe("PortfolioService", () => {
  describe("calculatePortfolioDailyValue", () => {
    it("calculatePortfolioDailyValue", async () => {
      const r = await PortfolioService.calculatePortfolioDailyValue([
        {
          id: 1,
          comment: "",
          symbol: "UPS",
          type: "Stock purchase",
          amount: 500,
          quantity: 5,
          time: new Date("1970-01-01"),
        },

        {
          id: 1,
          comment: "",
          symbol: "META",
          type: "Stock purchase",
          amount: 500,
          quantity: 5,
          time: new Date("1970-01-01"),
        },
        {
          id: 1,
          comment: "",
          symbol: "META",
          type: "Stock sale",
          amount: 500,
          quantity: 5,
          time: new Date("1970-01-01"),
        },
      ]);
      console.dir({ r }, { depth: 5 });
    });
  });
});

describe("TickerPriceIndices builder", () => {
  it("starts a new period when a stock appears", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker("1970-01-01", "PKN", 10);

    expect(index["PKN"]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ends an open period when a stock amount goes to zero", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker("1970-01-01", "PKN", 10);
    registerTicker("1970-02-01", "PKN", 0);

    expect(index["PKN"]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
  });

  it("creates multiple periods when a stock is re-added later", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker("1970-01-01", "PKN", 10);
    registerTicker("1970-02-01", "PKN", 0);
    registerTicker("1970-03-01", "PKN", 5);

    expect(index["PKN"]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
      { start: new Date("1970-03-01"), end: null },
    ]);
  });

  it("handles multiple tickers independently", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker("1970-01-01", "PKN", 10);
    registerTicker("1970-01-10", "DINO", 15);
    registerTicker("1970-02-01", "PKN", 0);

    expect(index["PKN"]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
    expect(index["DINO"]).toEqual([
      {
        start: new Date("1970-01-10"),
        end: null,
      },
    ]);
  });

  it("does not duplicate open periods when called repeatedly with positive amount", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker("1970-01-01", "PKN", 10);
    registerTicker("1970-01-05", "PKN", 20);
    registerTicker("1970-01-10", "PKN", 15);

    expect(index["PKN"]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ignores zero updates when no open period exists", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker("1970-01-01", "PKN", 0);

    expect(index["PKN"]).toEqual([]);
  });
});
