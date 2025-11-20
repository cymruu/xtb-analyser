import { Array, Data, Effect, Equal, Option, Order, pipe } from "effect";
import type { PriceResolver } from ".";
import type { TransactionTimeKey } from "../../domains/stock/types";
import type { BrandedType, TypedEntries } from "../../types";
import type { YahooTicker } from "../yahooFinance/ticker";

export type Currency = BrandedType<string, "Currency">;

export const convertCurrency = (
  from: { currency: string; value: number },
  rate: number,
): number => {
  return from.value * rate;
};

export const createCurrencyYahooTicker = (
  currencyIn: Currency,
  currencyOut: Currency,
) => {
  const tickers = Data.array([
    currencyIn.toUpperCase(),
    currencyOut.toUpperCase(),
  ]);
  const tickersSorted = Data.array(Array.sort(tickers, Order.string));
  const yahooTicker: YahooTicker = `${tickersSorted.join("")}=X` as YahooTicker;

  if (Equal.equals(tickersSorted, tickers)) {
    return { inverseRate: false, yahooTicker };
  }

  return { inverseRate: true, yahooTicker };
};

export const getTotalInCurrency =
  (currencyRateResolver: PriceResolver) =>
  (
    totalsGrouped: Record<
      Currency,
      Array<{
        value: number;
        currency: Currency;
        date: TransactionTimeKey;
      }>
    >,
    currencyOut: Currency,
  ) => {
    const entriesGrouped = Object.entries(totalsGrouped) as TypedEntries<
      typeof totalsGrouped
    >;
    return pipe(
      entriesGrouped,
      Effect.forEach(([currencyIn, entries]) =>
        pipe(
          entries,
          Effect.forEach((entry) => {
            const { inverseRate, yahooTicker } = createCurrencyYahooTicker(
              currencyIn,
              currencyOut,
            );
            if (currencyIn === currencyOut) {
              return Effect.succeed(entry.value);
            }

            return Effect.gen(function* () {
              const priceOption = currencyRateResolver.getPrice(
                yahooTicker,
                entry.date,
              );

              if (Option.isNone(priceOption)) {
                yield* Effect.logWarning(
                  `Price not found for ${yahooTicker} on ${entry.date}. Assuming 0.`,
                );
                return 0;
              }

              const rate = priceOption.value.close;
              return convertCurrency(entry, inverseRate ? 1 / rate : rate);
            });
          }),
          Effect.map((convertedValues) =>
            Array.reduce(convertedValues, 0, (acc, c) => acc + c),
          ),
        ),
      ),
      Effect.map((groupTotals) =>
        Array.reduce(groupTotals, 0, (acc, c) => acc + c),
      ),
    );
  };
