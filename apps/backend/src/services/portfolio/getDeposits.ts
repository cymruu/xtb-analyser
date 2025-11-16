import { Array, Effect, pipe } from "effect";

import type { ParsedCashOperationRow } from "@xtb-analyser/xtb-csv-parser";
import type { PortfolioDeposit } from "./types";

export const getDeposits = (operations: ParsedCashOperationRow[]) => {
  return Effect.gen(function* () {
    const deposits = pipe(
      Array.filter(operations, (v) => {
        return (
          v.type === "deposit" ||
          // IKE Deposits type is used for both deposits and withdrawals (depending on the account ) D:
          // filter out withdrawals here
          (v.type === "IKE Deposit" && v.amount > 0)
        );
      }),
      Array.map((deposit): PortfolioDeposit => {
        return {
          key: deposit.time,
          value: deposit.amount,
        };
      }),
    );

    return yield* Effect.succeed(deposits);
  });
};
