import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { init } from "excelize-wasm";
import { createPortfolioService, createPriceIndex } from ".";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";
import {
  TickerCtor,
  TransactionTimeKeyCtor,
  type Ticker,
  type TransactionTimeKey,
} from "../../domains/stock/types";

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

    registerTicker(
      "1970-01-01" as TransactionTimeKey,
      TickerCtor("PKN") as Ticker,
      10,
    );

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ends an open period when a stock amount goes to zero", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker(TransactionTimeKeyCtor("1970-01-01"), TickerCtor("PKN"), 10);
    registerTicker(TransactionTimeKeyCtor("1970-02-01"), TickerCtor("PKN"), 0);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
  });

  it("creates multiple periods when a stock is re-added later", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker(TransactionTimeKeyCtor("1970-01-01"), TickerCtor("PKN"), 10);
    registerTicker(TransactionTimeKeyCtor("1970-02-01"), TickerCtor("PKN"), 0);
    registerTicker(TransactionTimeKeyCtor("1970-03-01"), TickerCtor("PKN"), 5);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
      { start: new Date("1970-03-01"), end: null },
    ]);
  });

  it("handles multiple tickers independently", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker(TransactionTimeKeyCtor("1970-01-01"), TickerCtor("PKN"), 10);
    registerTicker(
      TransactionTimeKeyCtor("1970-01-10"),
      TickerCtor("DINO"),
      15,
    );
    registerTicker(TransactionTimeKeyCtor("1970-02-01"), TickerCtor("PKN"), 0);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
    expect(index[TickerCtor("DINO")]).toEqual([
      {
        start: new Date("1970-01-10"),
        end: null,
      },
    ]);
  });

  it("does not duplicate open periods when called repeatedly with positive amount", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker(TransactionTimeKeyCtor("1970-01-01"), TickerCtor("PKN"), 10);
    registerTicker(TransactionTimeKeyCtor("1970-01-05"), TickerCtor("PKN"), 20);
    registerTicker(TransactionTimeKeyCtor("1970-01-10"), TickerCtor("PKN"), 15);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ignores zero updates when no open period exists", () => {
    const { index, registerTicker } = createPriceIndex();

    registerTicker(TransactionTimeKeyCtor("1970-01-01"), TickerCtor("PKN"), 0);

    expect(index[TickerCtor("PKN")]).toEqual([]);
  });
});
