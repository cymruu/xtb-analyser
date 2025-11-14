import { describe, expect, it } from "bun:test";
import { Effect, Logger, LogLevel } from "effect";
import { init } from "excelize-wasm";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";

import { TransactionTimeKeyCtor } from "../../domains/stock/types";
import { YahooPriceRepositoryMock } from "../../repositories/yahooPrice/mock";
import { YahooPriceRepositoryLive } from "../../repositories/yahooPrice/YahooPriceRepository";
import { TimeServiceLive, TimeServiceMock } from "../time/time";
import { YahooFinanceLive } from "../yahooFinance";
import { YahooFinanceMock } from "../yahooFinance/mock";
import { YahooTickerCtor } from "../yahooFinance/ticker";
import { calculatePortfolioDailyValue } from "./calculatePortfolioDailyValue";
import { fillDailyPortfolioGaps } from "./fillDailyPortfolioGaps";
import { createMissingPricesIndex, createPriceIndex } from "./priceIndex";

describe("PortfolioService", () => {
  describe("calculatePortfolioDailyValue", () => {
    it.if(!process.env.CI)("b", async () => {
      const file = Bun.file(
        "/Users/filipbachul/Downloads/account_2888512_en_xlsx_2005-12-31_2025-11-08/account_2888512_en_xlsx_2005-12-31_2025-11-08.xlsx",
      );
      const excelize = await init(
        "./node_modules/excelize-wasm/excelize.wasm.gz",
      );
      const parsed = await Effect.runPromise(
        parseCSV(await file.bytes(), { excelize }),
      );

      const effect = calculatePortfolioDailyValue(
        parsed.cashOperations.successes,
      );

      const result = await Effect.runPromise(
        effect.pipe(
          Logger.withMinimumLogLevel(LogLevel.Debug),
          Effect.provide(YahooFinanceLive),
          Effect.provide(YahooPriceRepositoryLive),
          Effect.provide(TimeServiceLive),
        ),
      );

      const a = Bun.file("out2.json");
      a.write(JSON.stringify(result));
    });

    it("calculatePortfolioDailyValue", async () => {
      const effect = calculatePortfolioDailyValue([
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
          type: "Stock purchase",
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
          [YahooTickerCtor("PKN")]: 10,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([
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
          [YahooTickerCtor("PKN")]: 10,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-02-01"),
        current: {
          [YahooTickerCtor("PKN")]: 0,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([
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
          [YahooTickerCtor("PKN")]: 10,
        },
      },

      {
        key: TransactionTimeKeyCtor("1970-02-01"),
        current: {
          [YahooTickerCtor("PKN")]: 0,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-03-01"),
        current: {
          [YahooTickerCtor("PKN")]: 5,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([
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
          [YahooTickerCtor("PKN")]: 10,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-10"),
        current: {
          [YahooTickerCtor("DINO")]: 15,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-02-01"),
        current: {
          [YahooTickerCtor("PKN")]: 0,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
    expect(index[YahooTickerCtor("DINO")]).toEqual([
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
          [YahooTickerCtor("PKN")]: 10,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: {
          [YahooTickerCtor("PKN")]: 20,
        },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-10"),
        current: {
          [YahooTickerCtor("PKN")]: 15,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([
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
          [YahooTickerCtor("PKN")]: 0,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([]);
  });

  it("ignores zero updates when no open period exists", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: {
          [YahooTickerCtor("PKN")]: 0,
        },
      },
    ]);

    expect(index[YahooTickerCtor("PKN")]).toEqual([]);
  });
});

describe("createMissingPricesIndex", () => {
  it("should return the full clamped range to the day before when dbPrices is empty", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("2025-01-01"),
        current: { [YahooTickerCtor("PKN")]: 10 },
      },
      {
        key: TransactionTimeKeyCtor("2025-01-05"),
        current: { [YahooTickerCtor("PKN")]: 15 },
      },
    ]);

    const effect = createMissingPricesIndex(index, []);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("2025-01-05")))),
    );

    expect(result).toEqual({
      [YahooTickerCtor("PKN")]: [
        { start: new Date("2025-01-01"), end: new Date("2025-01-04") },
      ],
    });
  });

  it("should NOT update the start date if the latest dbPrice is older than the required range start", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("2025-02-01"),
        current: { [YahooTickerCtor("AAPL")]: 100 },
      },
      {
        key: TransactionTimeKeyCtor("2025-02-10"),
        current: { [YahooTickerCtor("AAPL")]: 105 },
      },
    ]);

    const effect = createMissingPricesIndex(index, [
      { symbol: "AAPL", datetime: new Date("2025-01-15") } as any,
    ]);
    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("2025-04-01")))),
    );

    expect(result).toEqual({
      [YahooTickerCtor("AAPL")]: [
        { start: new Date("2025-02-01"), end: new Date("2025-03-31") },
      ],
    });
  });

  it("should update the start date to the latest +1 one day existing dbPrice datetime", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("2025-03-01"),
        current: { [YahooTickerCtor("PKN")]: 10 },
      },
      {
        key: TransactionTimeKeyCtor("2025-03-31"),
        current: { [YahooTickerCtor("PKN")]: 15 },
      },
    ]);

    const effect = createMissingPricesIndex(index, [
      { symbol: "PKN", datetime: new Date("2025-03-10") },
      { symbol: "PKN", datetime: new Date("2025-03-15") },
    ] as any);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("2025-04-01")))),
    );

    expect(result).toEqual({
      [YahooTickerCtor("PKN")]: [
        { start: new Date("2025-03-16"), end: new Date("2025-03-31") },
      ],
    });
  });

  it("should remove entry from index if all prices exist", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [YahooTickerCtor("PKN")]: 10 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-03"),
        current: { [YahooTickerCtor("PKN")]: -10 },
      },
    ]);

    const effect = createMissingPricesIndex(index, [
      { symbol: "PKN", datetime: new Date("1970-01-01") },
      { symbol: "PKN", datetime: new Date("1970-01-02") },
      { symbol: "PKN", datetime: new Date("1970-01-03") },
    ] as any);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date(0)))),
    );

    expect(result).toEqual({});
  });

  it("should clamp indice if some prices exist", async () => {
    const index = createPriceIndex([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [YahooTickerCtor("PKN")]: 10 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-15"),
        current: { [YahooTickerCtor("PKN")]: -10 },
      },
    ]);

    const effect = createMissingPricesIndex(index, [
      { symbol: "PKN", datetime: new Date("1970-01-01") },
      { symbol: "PKN", datetime: new Date("1970-01-02") },
    ] as any);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date(0)))),
    );

    expect(result).toEqual({
      [YahooTickerCtor("PKN")]: [
        { start: new Date("1970-01-03"), end: new Date("1970-01-15") },
      ],
    });
  });
});

describe("fillDailyPortfolioGaps", () => {
  it("should fill missing gaps", async () => {
    const effect = fillDailyPortfolioGaps([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [YahooTickerCtor("PKN")]: 6 },
      },
    ]);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-01-06")))),
    );

    expect(result).toMatchObject([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-02"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-03"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-04"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [YahooTickerCtor("PKN")]: 6 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-06"),
        current: { [YahooTickerCtor("PKN")]: 6 },
      },
    ]);
  });

  it("should NOT add extra record if last entry is from today", async () => {
    const effect = fillDailyPortfolioGaps([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [YahooTickerCtor("PKN")]: 6 },
      },
    ]);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-01-05")))),
    );

    expect(result).toMatchObject([
      {
        key: TransactionTimeKeyCtor("1970-01-01"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-02"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-03"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-04"),
        current: { [YahooTickerCtor("PKN")]: 5 },
      },
      {
        key: TransactionTimeKeyCtor("1970-01-05"),
        current: { [YahooTickerCtor("PKN")]: 6 },
      },
    ]);
  });
});
