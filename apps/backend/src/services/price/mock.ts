import { endOfDay, formatISO } from "date-fns";
import { eachDayOfInterval } from "date-fns/fp";
import { Array, Option } from "effect";

import type { TickerPriceIndices } from "../portfolio";
import { type ITimeService } from "../time/time";
import type { Ticker, TransactionTimeKey } from "../../domains/stock/types";
import type { TypedEntries } from "../../types";

/*
 *  | SYMBOL | datetimedate | open | high | low | close | close adjusted | price_source
 */

type PriceEntry = {
  symbol: Ticker;
  open: number;
  high: number;
  low: number;
  close: number;
  close_adjusted: number;
  price_source: "mock" | "yahoo" | "stoq";
};

type Prices = {
  [key: TransactionTimeKey]: {
    [key: Ticker]: PriceEntry;
  };
};

export const createPriceServiceMock = (
  priceIndex: TickerPriceIndices,
  {
    timeService,
  }: {
    timeService: ITimeService;
  },
) => {
  const prices: Prices = {};
  const getPrices = (priceIndex: TickerPriceIndices) => {
    Array.fromIterable(
      Object.entries(priceIndex) as TypedEntries<typeof priceIndex>,
    ).forEach(([symbol, indices]) => {
      Array.fromIterable(indices).forEach((index) => {
        const intervals = eachDayOfInterval({
          start: index.start,
          end: index.end ?? endOfDay(timeService.now()),
        });
        intervals.forEach((date) => {
          const key = formatISO(date, {
            representation: "date",
          }) as TransactionTimeKey;
          if (!prices[key]) {
            prices[key] = {};
          }

          prices[key][symbol] = {
            symbol,
            open: 1,
            high: 1,
            low: 1,
            close: 1,
            close_adjusted: 1,
            price_source: "mock",
          };
        });
      });
    });
  };
  getPrices(priceIndex);

  return {
    prices,
    getPrice: (symbol: Ticker, date: TransactionTimeKey) => {
      const price = prices[date]?.[symbol];

      if (!price) {
        // TODO: implement LOCF
        return Option.none();
      }
      return Option.some(price.close);
    },
  };
};
