import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { createPortfolioService, createPriceIndex } from ".";

import { TickerCtor, TransactionTimeKeyCtor } from "../../domains/stock/types";

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

describe("createPriceIndex", () => {
  it("starts a new period when a stock appears", async () => {
    const effect = createPriceIndex(
      Effect.succeed([
        {
          key: TransactionTimeKeyCtor("1970-01-01"),
          current: {
            [TickerCtor("PKN")]: 10,
          },
        },
      ]),
    );

    const index = await Effect.runPromise(effect);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ends an open period when a stock amount goes to zero", async () => {
    const effect = createPriceIndex(
      Effect.succeed([
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
      ]),
    );

    const index = await Effect.runPromise(effect);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
    ]);
  });

  it("creates multiple periods when a stock is re-added later", async () => {
    const effect = createPriceIndex(
      Effect.succeed([
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
      ]),
    );

    const index = await Effect.runPromise(effect);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: new Date("1970-02-01"),
      },
      { start: new Date("1970-03-01"), end: null },
    ]);
  });

  it("handles multiple tickers independently", async () => {
    const effect = createPriceIndex(
      Effect.succeed([
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
      ]),
    );

    const index = await Effect.runPromise(effect);

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
    const effect = createPriceIndex(
      Effect.succeed([
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
      ]),
    );

    const index = await Effect.runPromise(effect);

    expect(index[TickerCtor("PKN")]).toEqual([
      {
        start: new Date("1970-01-01"),
        end: null,
      },
    ]);
  });

  it("ignores zero updates when no open period exists", async () => {
    const effect = createPriceIndex(
      Effect.succeed([
        {
          key: TransactionTimeKeyCtor("1970-01-01"),
          current: {
            [TickerCtor("PKN")]: 0,
          },
        },
      ]),
    );

    const index = await Effect.runPromise(effect);

    expect(index[TickerCtor("PKN")]).toEqual([]);
  });
});
