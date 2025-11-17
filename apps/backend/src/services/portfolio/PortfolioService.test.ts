import { describe, expect, it } from "bun:test";
import { Effect } from "effect";

import { TransactionTimeKeyCtor } from "../../domains/stock/types";
import type { Currency } from "../price/currencyConversion";
import { TimeServiceMock } from "../time/time";
import { YahooTickerCtor } from "../yahooFinance/ticker";
import { fillDailyPortfolioGaps } from "./fillDailyPortfolioGaps";
import {
  createCurrencyIndex,
  createMissingPricesIndex,
  createPriceIndex,
} from "./priceIndex";

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

    expect(index[YahooTickerCtor("PKN")]).toEqual(undefined);
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

describe("createCurrencyIndex", () => {
  it("should return empty index if all elements are in base currency", async () => {
    const effect = createCurrencyIndex("PLN" as Currency, [
      { currency: "PLN", dateKey: new Date(0) } as any,
      { currency: "PLN", dateKey: new Date(0) } as any,
    ]);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-05-01")))),
    );

    expect(result).toEqual({});
  });

  it("should return empty index if allPrices array is empty", async () => {
    const effect = createCurrencyIndex("PLN" as Currency, []);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-05-01")))),
    );

    expect(result).toEqual({});
  });

  it("should create correct tickers and date ranges for multiple currencies", async () => {
    const effect = createCurrencyIndex("PLN" as Currency, [
      { currency: "GBP", dateKey: new Date("1970-03-12") } as any,
      { currency: "PLN", dateKey: new Date("1970-04-01") } as any,
      { currency: "EUR", dateKey: new Date("1970-04-03") } as any,
      { currency: "EUR", dateKey: new Date("1970-04-03") } as any,
    ]);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(TimeServiceMock(new Date("1970-05-02")))),
    );

    expect(result).toEqual({
      [YahooTickerCtor("GBPPLN=X")]: [
        {
          start: new Date("1970-03-12"),
          end: new Date("1970-05-01"),
        },
      ],
      [YahooTickerCtor("EURPLN=X")]: [
        { start: new Date("1970-03-12"), end: new Date("1970-05-01") },
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
