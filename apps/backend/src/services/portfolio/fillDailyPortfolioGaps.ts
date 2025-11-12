import { Array } from "effect";
import type { PortfolioDayElements } from ".";
import {
  TransactionTimeKeyCtor,
  type TransactionTimeKey,
} from "../../domains/stock/types";
import { addDays, formatISO } from "date-fns";

const fillGap = (
  currentRecord: { key: TransactionTimeKey; current: PortfolioDayElements },
  nextRecord: { key: TransactionTimeKey; current: PortfolioDayElements },
): { key: TransactionTimeKey; current: PortfolioDayElements }[] => {
  const filledRecords = [];
  let currentDate = new Date(currentRecord.key);
  const nextDate = new Date(nextRecord.key);

  while (currentDate < nextDate) {
    currentDate = addDays(currentDate, 1);

    if (currentDate >= nextDate) {
      break;
    }

    filledRecords.push({
      key: TransactionTimeKeyCtor(
        formatISO(currentDate, { representation: "date" }),
      ),
      current: currentRecord.current,
    });
  }

  return filledRecords;
};

export const fillDailyPortfolioGaps = (
  dailyPortfolioStocks: {
    key: TransactionTimeKey;
    current: PortfolioDayElements;
  }[],
) => {
  return Array.reduce(
    dailyPortfolioStocks,
    [] as {
      key: TransactionTimeKey;
      current: PortfolioDayElements;
    }[],
    (acc, curr, index) => {
      acc.push(curr);
      if (index < dailyPortfolioStocks.length - 1) {
        const nextRecord = dailyPortfolioStocks[index + 1]!;
        const gapRecords = fillGap(curr, nextRecord);
        acc.push(...gapRecords);
      }
      return acc;
    },
  );
};
