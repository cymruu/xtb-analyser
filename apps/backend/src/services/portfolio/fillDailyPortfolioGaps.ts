import { eachDayOfInterval, formatISO } from "date-fns";
import { Array, Effect, Option } from "effect";

import {
  TransactionTimeKeyCtor,
  type TransactionTimeKey,
} from "../../domains/stock/types";
import { TimeService } from "../time/time";
import type { PortfolioDayElements } from "./types";

export const fillDailyPortfolioGaps = (
  dailyPortfolioStocks: {
    key: TransactionTimeKey;
    current: PortfolioDayElements;
  }[],
) => {
  return Effect.gen(function* () {
    const timeService = yield* TimeService;

    const min = Array.head(dailyPortfolioStocks).pipe(Option.getOrThrow);
    const dailyStocks = Array.reduce(
      dailyPortfolioStocks,
      {} as Record<TransactionTimeKey, { current: PortfolioDayElements }>,
      (acc, v) => {
        acc[v.key] = { current: v.current };
        return acc;
      },
    );

    const range = eachDayOfInterval({
      start: new Date(min.key),
      end: timeService.now(),
    });

    const [_, result] = Array.mapAccum(
      range,
      null as PortfolioDayElements | null,
      (state, n) => {
        const key = TransactionTimeKeyCtor(
          formatISO(n, { representation: "date" }),
        );
        const stock = (dailyStocks[key]?.current ?? state)!;
        return [stock, { key, current: stock }];
      },
    );

    return result;
  });
};
