import { endOfDay, formatISO } from "date-fns";
import { eachDayOfInterval } from "date-fns/fp";
import { Array, Option } from "effect";

import type { TickerPriceIndices } from "../portfolio";
import { type ITimeService } from "../time/time";

/*
 *  | SYMBOL | datetimedate | open | high | low | close | close adjusted | price_source
 */

type PriceEntry = {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  close_adjusted: number;
  price_source: "mock" | "yahoo" | "stoq";
};

type Prices = {
  [key: string]: /*Date*/ {
    [key: string]: /*symbol*/ PriceEntry;
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
    Array.fromIterable(Object.entries(priceIndex)).forEach(
      ([symbol, indices]) => {
        Array.fromIterable(indices).forEach((index) => {
          const intervals = eachDayOfInterval({
            start: index.start,
            end: index.end ?? endOfDay(timeService.now()),
          });
          intervals.forEach((date) => {
            const key = formatISO(date, { representation: "date" });
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
      },
    );
  };
  getPrices(priceIndex);

  return {
    prices,
    getPrice: (symbol: string, date: string) => {
      const price = prices[date]?.[symbol];

      if (!price) {
        // TODO: implement LOCF
        return Option.none();
      }
      return Option.some(price.close);
    },
  };
};
