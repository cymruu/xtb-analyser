import { describe, expect, it } from "bun:test";
import { Option } from "effect";

import { createPriceServiceMock } from "./mock";
import { timeServiceMock } from "../time/time";
import { TickerCtor, TransactionTimeKeyCtor } from "../../domains/stock/types";

describe("priceService", () => {
  it("should return the price for a known symbol and date in the range", async () => {
    const priceService = createPriceServiceMock(
      {
        [TickerCtor("PKN")]: [
          { start: new Date(0), end: new Date("1970-01-01") },
        ],
      },
      {
        timeService: timeServiceMock,
      },
    );

    const result = priceService.getPrice(
      TickerCtor("PKN"),
      TransactionTimeKeyCtor("1970-01-01"),
    );

    expect(result).toEqual(Option.some(1));
  });

  it("should return Option.none() for a symbol that is not tracked at given date", async () => {
    const priceService = createPriceServiceMock(
      {
        [TickerCtor("PKN")]: [
          { start: new Date(0), end: new Date("1970-02-01") },
        ],
      },
      {
        timeService: timeServiceMock,
      },
    );

    const result = priceService.getPrice(
      TickerCtor("DINO"),
      TransactionTimeKeyCtor("1970-01-01"),
    );

    expect(result).toEqual(Option.none());
  });

  it("should return Option.none() for a date outside the available data range", async () => {
    const priceService = createPriceServiceMock(
      {
        [TickerCtor("PKN")]: [
          { start: new Date(0), end: new Date("1970-01-03") },
        ],
      },
      {
        timeService: timeServiceMock,
      },
    );

    const result = priceService.getPrice(
      TickerCtor("PKN"),
      TransactionTimeKeyCtor("1970-02-01"),
    );

    expect(result).toEqual(Option.none());
  });
});
