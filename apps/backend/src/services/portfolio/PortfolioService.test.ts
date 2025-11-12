import { describe, expect, it } from "bun:test";
import { Effect, Logger, LogLevel } from "effect";
import { init } from "excelize-wasm";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";

import { createPortfolioService, createPriceIndex } from ".";
import { TickerCtor, TransactionTimeKeyCtor } from "../../domains/stock/types";
import { prismaClient } from "../../lib/db";
import { YahooFinanceMock } from "../yahooFinance/mock";
import { TimeServiceLive, TimeServiceMock } from "../time/time";
import { YahooFinanceLive } from "../yahooFinance";
import { YahooPriceRepositoryMock } from "../../repositories/yahooPrice/mock";
import { fillDailyPortfolioGaps } from "./fillDailyPortfolioGaps";

const PortfolioService = createPortfolioService({
  prismaClient,
});

describe("PortfolioService", () => {
  describe("calculatePortfolioDailyValue", () => {
    it("b", async () => {
      const file = Bun.file(
        "/Users/filipbachul/Downloads/account_2888512_en_xlsx_2005-12-31_2025-11-08/account_2888512_en_xlsx_2005-12-31_2025-11-08.xlsx",
      );
      const excelize = await init(
        "./node_modules/excelize-wasm/excelize.wasm.gz",
      );
      const parsed = await Effect.runPromise(
        parseCSV(await file.bytes(), { excelize }),
      );

      const r = PortfolioService.calculatePortfolioDailyValue(
        parsed.cashOperations.successes,
      );

      const result = await Effect.runPromise(
        r.pipe(
          Logger.withMinimumLogLevel(LogLevel.Debug),
          Effect.provide(YahooFinanceLive),
          Effect.provide(YahooPriceRepositoryMock),
          Effect.provide(TimeServiceLive),
        ),
      );

      const a = Bun.file("out.json");
      a.write(JSON.stringify(result));

      console.log({ result });
    });

    it.skip("calculatePortfolioDailyValue", async () => {
      const effect = PortfolioService.calculatePortfolioDailyValue([
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
        {
          id: 1,
          comment: "",
          symbol: "UPS",
          type: "Stock purchase",
          amount: 500,
          quantity: 50,
          time: new Date("1970-01-05"),
        },
      ]);

      const result = await Effect.runPromise(
        effect.pipe(
          Logger.withMinimumLogLevel(LogLevel.Debug),
          Effect.provide(YahooFinanceMock),
          Effect.provide(TimeServiceLive),
          Effect.provide(YahooPriceRepositoryMock),
        ),
      );

      console.dir({ result }, { depth: 5 });
    });
  });
});

describe("createPriceIndex", () => {
  it("starts a new period when a stock appears", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [TickerCtor("PKN")]: 10,
        },
      },
    ]);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ends an open period when a stock amount goes to zero", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [TickerCtor("PKN")]: 10,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-02-01"),
        current: {
          [TickerCtor("PKN")]: 0,
        },
      },
    ]);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
  });

  it("creates multiple periods when a stock is re-added later", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [TickerCtor("PKN")]: 10,
        },
      },

      {
        key: TransactionTimeKeyCtor("1970-02-01"),
        current: {
          [TickerCtor("PKN")]: 0,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-03-01"),
        current: {
          [TickerCtor("PKN")]: 5,
        },
      },
    ]);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
      { start: new Date("1970-03-01"), end: null },
    ]);
  });

  it("handles multiple tickers independently", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [TickerCtor("PKN")]: 10,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-10"),
        current: {
          [TickerCtor("DINO")]: 15,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-02-01"),
        current: {
          [TickerCtor("PKN")]: 0,
        },
      },
    ]);

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

  it("does not duplicate open periods when called repeatedly with positive amount", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [TickerCtor("PKN")]: 10,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: {
          [TickerCtor("PKN")]: 20,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-10"),
        current: {
          [TickerCtor("PKN")]: 15,
        },
      },
    ]);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ignores zero updates when no open period exists", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [TickerCtor("PKN")]: 0,
        },
      },
    ]);

    expect(index[TickerCtor("PKN")]).toEqual([]);
  });
});

describe("fillDailyPortfolioGaps", () => {
  it("should fill missing gaps", async () => {
    const effect = fillDailyPortfolioGaps([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [TickerCtor("PKN")]: 6 },
      },
    ]);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-01-06")))),
    );

    expect(result).toMatchObject([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-02"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-03"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-04"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [TickerCtor("PKN")]: 6 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-06"),
        current: { [TickerCtor("PKN")]: 6 },
      },
    ]);
  });

  it("should not add extra record if last entry is from today", async () => {
    const effect = fillDailyPortfolioGaps([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [TickerCtor("PKN")]: 6 },
      },
    ]);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-01-05")))),
    );

    expect(result).toMatchObject([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-02"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-03"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-04"),
        current: { [TickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [TickerCtor("PKN")]: 6 },
      },
    ]);
  });
});
