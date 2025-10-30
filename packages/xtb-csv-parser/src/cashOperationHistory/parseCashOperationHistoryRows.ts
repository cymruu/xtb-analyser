import { Effect, flow } from "effect";
import z from "zod";

import { RowValidationError } from "../utils/RowValidationError";
import { XTBTimeSchema } from "../utils/XTBTimeSchema";

export const KnownCashOperationTypes = z.enum([
  "deposit",
  "IKE Deposit",
  "Free-funds Interest Tax",
  "Free-funds Interest",
  "withdrawal",
  "DIVIDENT",
  "Dividend equivalent",
  "Withholding Tax",
  "close trade",
  "Stock sale",
  "Stock purchase",
  "Adjustment Fee",
  "swap",
  "Sec Fee",
  "tax IFTT",
  "transfer",
]);

const ReportableZodIssueInternalCode = "REPORTABLE_ISSUE";

const CashOperationRowSchema = z.object({
  id: z.coerce.number(),
  type: z.string().superRefine((v, ctx) => {
    if (!KnownCashOperationTypes.safeParse(v).success) {
      ctx.addIssue({
        internal_code: ReportableZodIssueInternalCode,
        value: v,
        code: "invalid_value",
        values: KnownCashOperationTypes.options,
      });
    }
  }),
  time: XTBTimeSchema,
  comment: z.string(),
  symbol: z.string(),
  amount: z.coerce.number(),
});

export type ParsedCashOperationRow = z.infer<typeof CashOperationRowSchema>;

type UnparsedCashOperationRow = {
  [K in keyof ParsedCashOperationRow]: unknown;
};

const mapCashOperationRowToObject = (
  row: string[],
): UnparsedCashOperationRow => {
  const [_empty_cell, id, type, time, comment, symbol, amount] = row;

  return {
    id,
    type,
    time,
    comment,
    symbol,
    amount,
  };
};

const parseCashOperationRow = (row: UnparsedCashOperationRow) => {
  const parseResult = CashOperationRowSchema.safeParse(row);
  if (!parseResult.success) {
    return Effect.fail(
      new RowValidationError({ parseError: parseResult.error }),
    );
  }

  return Effect.succeed(parseResult.data);
};

export const parseCashOperationRows = (rows: string[][]) =>
  Effect.partition(
    rows,
    flow(mapCashOperationRowToObject, parseCashOperationRow),
  ).pipe(
    Effect.map(([failures, successes]) => ({
      failures,
      successes,
    })),
  );
