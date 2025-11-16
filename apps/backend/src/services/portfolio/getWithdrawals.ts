import { Array, Effect, pipe } from "effect";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";
import type { PortfolioWithdrawal } from "./types";

export const getWithdrawals = (operations: ParsedCashOperationRow[]) => {
  return Effect.gen(function* () {
    const withdrawals = pipe(
      Array.filter(operations, (v) => {
        return v.type === "withdrawal";
      }),
      Array.map((deposit): PortfolioWithdrawal => {
        return {
          key: deposit.time,
          value: deposit.amount,
        };
      }),
    );

    return yield* Effect.succeed(withdrawals);
  });
};
