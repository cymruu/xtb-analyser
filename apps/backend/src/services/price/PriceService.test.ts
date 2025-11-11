import { describe, expect, it } from "bun:test";
import { Effect, Option } from "effect";

import { createPriceService, MissingPriceError } from ".";
import { TickerCtor, TransactionTimeKeyCtor } from "../../domains/stock/types";
import { timeServiceMock } from "../time/time";
import { createYahooFinanceMock } from "../yahooFinance/mock";

const yahooFinanceService = createYahooFinanceMock();

describe("priceService", () => {
  describe("getPrice", () => {
    it("should return the price for a known symbol and date in the range", async () => {
      const priceService = createPriceService(
        Effect.succeed({
          [TickerCtor("PKN")]: [
            { start: new Date(0), end: new Date("1970-01-01") },
          ],
        }),
        {
          timeService: timeServiceMock,
          yahooFinanceService,
        },
      );

      const effect = priceService.getPrice(
        TickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-01-01"),
      );
      const result = await Effect.runPromise(effect);

      expect(result).toEqual(Option.some(1));
    });

    it("should return Option.none() for a symbol that is not tracked at given date", async () => {
      const priceService = createPriceService(
        Effect.succeed({
          [TickerCtor("PKN")]: [
            { start: new Date(0), end: new Date("1970-02-01") },
          ],
        }),
        {
          timeService: timeServiceMock,
          yahooFinanceService,
        },
      );

      const effect = priceService.getPrice(
        TickerCtor("DINO"),
        TransactionTimeKeyCtor("1970-01-01"),
      );
      const result = await Effect.runPromise(effect);

      expect(result).toEqual(Option.none());
    });

    it("should return Option.none() for a date outside the available data range", async () => {
      const priceService = createPriceService(
        Effect.succeed({
          [TickerCtor("PKN")]: [
            { start: new Date(0), end: new Date("1970-01-03") },
          ],
        }),
        {
          timeService: timeServiceMock,

          yahooFinanceService,
        },
      );

      const effect = priceService.getPrice(
        TickerCtor("PKN"),
        TransactionTimeKeyCtor("1970-02-01"),
      );
      const result = await Effect.runPromise(effect);

      expect(result).toEqual(Option.none());
    });

    //TODO: LCOF tests
  });
  describe("calculateValue", () => {
    it("should return the value of portfolio for given date", async () => {
      const priceService = createPriceService(
        Effect.succeed({
          [TickerCtor("PKN")]: [
            { start: new Date(0), end: new Date("1970-01-01") },
          ],
          [TickerCtor("DINO")]: [
            { start: new Date(0), end: new Date("1970-01-01") },
          ],
        }),
        {
          timeService: timeServiceMock,
          yahooFinanceService,
        },
      );

      const result = await Effect.runPromise(
        priceService.calculateValue(TransactionTimeKeyCtor("1970-01-01"), {
          [TickerCtor("PKN")]: 5,
          [TickerCtor("DINO")]: 10,
        }),
      );

      expect(result).toEqual({ failures: [], value: 15 });
    });

    it("should return errors for missing prices", async () => {
      const priceService = createPriceService(
        Effect.succeed({
          [TickerCtor("PKN")]: [
            { start: new Date(0), end: new Date("1970-01-01") },
          ],
        }),
        {
          timeService: timeServiceMock,
          yahooFinanceService,
        },
      );

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
