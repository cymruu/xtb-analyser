import { describe, expect, it } from "bun:test";
import { Effect, Option } from "effect";

import { createPriceResolver, MissingPriceError } from ".";
import {
  TransactionTimeKeyCtor,
  type TransactionTimeKey,
} from "../../domains/stock/types";
import { YahooTickerCtor, type YahooTicker } from "../yahooFinance/ticker";

const createPricePoint = (dateKey: TransactionTimeKey, symbol: YahooTicker) => {
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
          YahooTickerCtor("PKN"),
        ),
      ]);

      const result = priceResolver.getPrice(
        YahooTickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-01-01"),
      );

      expect(result).toEqual(Option.some(1));
    });

    it("should return Option.none() for a symbol that is not tracked at given date", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN"),
        ),
      ]);

      const result = priceService.getPrice(
        YahooTickerCtor("DINO"),
        TransactionTimeKeyCtor("1970-01-01"),
      );

      expect(result).toEqual(Option.none());
    });

    it("should return Option.none() for a date outside the available data range", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-03"),
          YahooTickerCtor("PKN"),
        ),
      ]);

      const result = priceService.getPrice(
        YahooTickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-02-01"),
      );

      expect(result).toEqual(Option.none());
    });

    describe("LCOF", () => {
      it("should return a previous price for a known symbol ", async () => {
        const priceResolver = createPriceResolver([
          createPricePoint(
            TransactionTimeKeyCtor("1970-01-01"),
            YahooTickerCtor("PKN"),
          ),
        ]);

        const result = priceResolver.getPrice(
          YahooTickerCtor("PKN"),
          TransactionTimeKeyCtor("1970-01-02"),
        );

        expect(result).toEqual(Option.some(1));
      });

      it("should NOT return a price older than 5 days ", async () => {
        const priceResolver = createPriceResolver([
          createPricePoint(
            TransactionTimeKeyCtor("2025-11-10"),
            YahooTickerCtor("PKN"),
          ),
        ]);

        const result = priceResolver.getPrice(
          YahooTickerCtor("PKN"),
          TransactionTimeKeyCtor("2025-11-16"),
        );

        expect(result).toEqual(Option.none());
      });
    });
  });
  describe("calculateValue", () => {
    it("should return the value of portfolio for given date", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN"),
        ),
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("DINO"),
        ),
      ]);

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [YahooTickerCtor("PKN")]: 5,
          [YahooTickerCtor("DINO")]: 10,
        }),
      );

      expect(result).toEqual({ failures: [], value: 15 });
    });

    it("should return errors for missing prices", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN"),
        ),
      ]);

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [YahooTickerCtor("DINO")]: 5,
        }),
      );

      expect(result).toEqual({
        failures: [
          new MissingPriceError({
            symbol: YahooTickerCtor("DINO"),
            date: TransactionTimeKeyCtor("1970-01-01"),
          }),
        ],
        value: 0,
      });
    });
  });
});
