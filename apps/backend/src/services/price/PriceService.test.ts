import { describe, expect, it } from "bun:test";
import { Effect, Option } from "effect";

import { createPriceResolver, MissingPriceError } from ".";
import {
  TickerCtor,
  TransactionTimeKeyCtor,
  type Ticker,
  type TransactionTimeKey,
} from "../../domains/stock/types";

const createPricePoint = (dateKey: TransactionTimeKey, symbol: Ticker) => {
  return {
    dateKey,
    symbol,
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    close_adjusted: 1,
    source: "mock",
  } as const;
};

describe("priceResolver", () => {
  describe("getPrice", () => {
    it("should return the price for a known symbol and date in the range", async () => {
      const priceResolver = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          TickerCtor("PKN"),
        ),
      ]);

      const result = priceResolver.getPrice(
        TickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-01-01"),
      );

      expect(result).toEqual(Option.some(1));
    });

    it("should return Option.none() for a symbol that is not tracked at given date", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          TickerCtor("PKN"),
        ),
      ]);

      const result = priceService.getPrice(
        TickerCtor("DINO"),
        TransactionTimeKeyCtor("1970-01-01"),
      );

      expect(result).toEqual(Option.none());
    });

    it("should return Option.none() for a date outside the available data range", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-03"),
          TickerCtor("PKN"),
        ),
      ]);

      const result = priceService.getPrice(
        TickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-02-01"),
      );

      expect(result).toEqual(Option.none());
    });

    //TODO: LCOF tests
  });
  describe("calculateValue", () => {
    it("should return the value of portfolio for given date", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          TickerCtor("PKN"),
        ),
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          TickerCtor("DINO"),
        ),
      ]);

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [TickerCtor("PKN")]: 5,
          [TickerCtor("DINO")]: 10,
        }),
      );

      expect(result).toEqual({ failures: [], value: 15 });
    });

    it("should return errors for missing prices", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          TickerCtor("PKN"),
        ),
      ]);

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [TickerCtor("DINO")]: 5,
        }),
      );

      expect(result).toEqual({
        failures: [
          new MissingPriceError({
            symbol: TickerCtor("DINO"),
            date: TransactionTimeKeyCtor("1970-01-01"),
          }),
        ],
        value: 0,
      });
    });
  });
});
