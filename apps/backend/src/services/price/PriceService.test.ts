import { describe, expect, it } from "bun:test";
import { Effect, Logger, LogLevel, Option } from "effect";

import { createPriceResolver, MissingPriceError, type PricePoint } from ".";
import {
  TransactionTimeKeyCtor,
  type TransactionTimeKey,
} from "../../domains/stock/types";
import { YahooTickerCtor, type YahooTicker } from "../yahooFinance/ticker";
import { getTotalInCurrency, type Currency } from "./currencyConversion";

const createPricePoint = (
  dateKey: TransactionTimeKey,
  symbol: YahooTicker,
  currency: Currency,
) => {
  return {
    dateKey,
    symbol,
    currency,
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
          "PLN" as Currency,
        ),
      ]);

      const result = priceResolver.getPrice(
        YahooTickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-01-01"),
      );

      expect(result).toMatchObject(
        Option.some({
          symbol: "PKN",
          currency: "PLN",
          close: 1,
          source: "mock",
        }),
      );
    });

    it("should return Option.none() for a symbol that is not tracked at given date", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN"),
          "PLN" as Currency,
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
          "PLN" as Currency,
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
            "PLN" as Currency,
          ),
        ]);

        const result = priceResolver.getPrice(
          YahooTickerCtor("PKN"),
          TransactionTimeKeyCtor("1970-01-02"),
        );

        expect(result).toMatchObject(
          Option.some({
            symbol: "PKN",
            currency: "PLN",
            close: 1,
            source: "mock",
          }),
        );
      });

      it("should NOT return a price older than 5 days ", async () => {
        const priceResolver = createPriceResolver([
          createPricePoint(
            TransactionTimeKeyCtor("2025-11-10"),
            YahooTickerCtor("PKN"),
            "PLN" as Currency,
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
    it("should return aggregated totals of portfolio for given date", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN"),
          "PLN" as Currency,
        ),
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("DINO"),
          "PLN" as Currency,
        ),
      ]);

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [YahooTickerCtor("PKN")]: 5,
          [YahooTickerCtor("DINO")]: 10,
        }),
      );

      expect(result).toEqual({
        failures: [],
        total: {
          ["PLN" as Currency]: [
            {
              currency: "PLN" as Currency,
              value: 5,
              date: TransactionTimeKeyCtor("1970-01-01"),
            },
            {
              currency: "PLN" as Currency,
              value: 10,
              date: TransactionTimeKeyCtor("1970-01-01"),
            },
          ],
        },
      });
    });

    it("should return aggregated currencies", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN.WA"),
          "PLN" as Currency,
        ),
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("DINO.WA"),
          "PLN" as Currency,
        ),
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("NOKIAN.FI"),
          "EUR" as Currency,
        ),
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("NVDA"),
          "USD" as Currency,
        ),
      ]);

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [YahooTickerCtor("PKN.WA")]: 5,
          [YahooTickerCtor("DINO.WA")]: 10,
          [YahooTickerCtor("NOKIAN.FI")]: 44,
          [YahooTickerCtor("NVDA")]: 144,
        }),
      );

      expect(result).toEqual({
        failures: [],
        total: {
          ["PLN" as Currency]: [
            {
              currency: "PLN" as Currency,
              value: 5,
              date: TransactionTimeKeyCtor("1970-01-01"),
            },
            {
              currency: "PLN" as Currency,
              value: 10,
              date: TransactionTimeKeyCtor("1970-01-01"),
            },
          ],
          ["EUR" as Currency]: [
            {
              currency: "EUR" as Currency,
              value: 44,
              date: TransactionTimeKeyCtor("1970-01-01"),
            },
          ],
          ["USD" as Currency]: [
            {
              currency: "USD" as Currency,
              value: 144,
              date: TransactionTimeKeyCtor("1970-01-01"),
            },
          ],
        },
      });
    });

    it("should return errors for missing prices", async () => {
      const priceService = createPriceResolver([
        createPricePoint(
          TransactionTimeKeyCtor("1970-01-01"),
          YahooTickerCtor("PKN"),
          "PLN" as Currency,
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
        total: {},
      });
    });
  });

  describe("getTotalInCurrency", () => {
    it("should apply the conversion rate when the ticker order matches the input", async () => {
      const currencyRateResolver = createPriceResolver([
        {
          close: 0.5,
          dateKey: TransactionTimeKeyCtor("1970-01-01"),
          symbol: YahooTickerCtor("PLNUSD=X"),
        } as PricePoint,
      ]);
      const effect = getTotalInCurrency(currencyRateResolver)(
        {
          ["PLN" as Currency]: [
            {
              currency: "PLN" as Currency,
              date: "1970-01-01" as TransactionTimeKey,
              value: 100,
            },
            {
              currency: "PLN" as Currency,
              date: "1970-01-02" as TransactionTimeKey,
              value: 100,
            },
          ],
        },
        "USD" as Currency,
      );

      const result = await Effect.runPromise(
        effect.pipe(Logger.withMinimumLogLevel(LogLevel.Debug)),
      );

      expect(result).toEqual(100);
    });

    it("should apply the inverse rate (1/rate) when the input order is the reverse of the standard ticker order", async () => {
      const currencyRateResolver = createPriceResolver([
        {
          close: 0.5,
          dateKey: TransactionTimeKeyCtor("1970-01-01"),
          symbol: YahooTickerCtor("PLNUSD=X"),
        } as PricePoint,
      ]);
      const effect = getTotalInCurrency(currencyRateResolver)(
        {
          ["USD" as Currency]: [
            {
              currency: "USD" as Currency,
              date: "1970-01-01" as TransactionTimeKey,
              value: 100,
            },
            {
              currency: "USD" as Currency,
              date: "1970-01-02" as TransactionTimeKey,
              value: 100,
            },
          ],
        },
        "PLN" as Currency,
      );

      const result = await Effect.runPromise(
        effect.pipe(Logger.withMinimumLogLevel(LogLevel.Debug)),
      );

      expect(result).toEqual(400);
    });

    it("should correctly sum amounts when input and target currencies are identical", async () => {
      const currencyRateResolver = createPriceResolver([]);
      const effect = getTotalInCurrency(currencyRateResolver)(
        {
          ["USD" as Currency]: [
            {
              currency: "USD" as Currency,
              date: "1970-01-01" as TransactionTimeKey,
              value: 100,
            },
            {
              currency: "USD" as Currency,
              date: "1970-01-02" as TransactionTimeKey,
              value: 100,
            },
          ],
        },
        "USD" as Currency,
      );

      const result = await Effect.runPromise(
        effect.pipe(Logger.withMinimumLogLevel(LogLevel.Debug)),
      );

      expect(result).toEqual(200);
    });
  });
});
