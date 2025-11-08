import { Effect, flow } from "effect";
import z, { ZodError } from "zod";

import type { ParseResult } from "../utils/parseResult";
import { RowValidationError } from "../utils/RowValidationError";
import { XTBTimeSchema } from "../utils/XTBTimeSchema";
import { parseQuantity } from "./parseQuantity";

const ReportableZodIssueInternalCode = "REPORTABLE_ISSUE";

const CashOperationRowSchemaBase = z
  .object({
    id: z.coerce.number(),
    type: z.enum([
      "deposit",
      "IKE Deposit",
      "Free-funds Interest Tax",
      "Free-funds Interest",
      "withdrawal",
      "DIVIDENT",
      "Dividend equivalent",
      "Withholding Tax",
      "close trade",
      "Adjustment Fee",
      "swap",
      "Sec Fee",
      "tax IFTT",
      "transfer",
    ]),
    time: XTBTimeSchema,
    comment: z.string(),
    symbol: z.string(),
    amount: z.coerce.number(),
  })
  .strict();

const CashOperationRowSchemaStockPurchase = CashOperationRowSchemaBase.extend({
  type: z.literal("Stock purchase"),
}).transform((v) => ({ ...v, quantity: parseQuantity(v.comment) }));

const CashOperationRowSchemaStockSale = CashOperationRowSchemaBase.extend({
  type: z.literal("Stock sale"),
}).transform((v) => ({ ...v, quantity: parseQuantity(v.comment) }));

const CashOperationRowSchema = z.discriminatedUnion("type", [
  CashOperationRowSchemaBase,
  CashOperationRowSchemaStockPurchase,
  CashOperationRowSchemaStockSale,
]);

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
    // Zod does not allow to use `superRefine` on union, therefore we need to handle the error manually
    if (parseResult.error.issues[0]?.code === "invalid_union") {
      return Effect.fail(
        new RowValidationError({
          parseError: {
            issues: [
              {
                internal_code: ReportableZodIssueInternalCode,
                message: "invalid type",
                path: ["type"],
                value: row.type,
                code: "invalid_value",
                values: [
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
                ],
              },
            ],
          } as unknown as ZodError,
        }),
      );
    }

    return Effect.fail(
      new RowValidationError({ parseError: parseResult.error }),
    );
  }

  return Effect.succeed(parseResult.data);
};

export const parseCashOperationRows = (
  rows: string[][],
): Effect.Effect<ParseResult<ParsedCashOperationRow>> =>
  Effect.partition(
    rows,
    flow(mapCashOperationRowToObject, parseCashOperationRow),
  ).pipe(
    Effect.map(([failures, successes]) => ({
      failures,
      successes,
    })),
  );
