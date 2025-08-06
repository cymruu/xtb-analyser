import { isValid, parse } from "date-fns";
import z, { ZodError } from "zod";
import { XTB_DATE_FORMAT } from "../openPositions/parseOpenPositionRows";
import { ReportableZodIssueInternalCode } from "../../services/metricsService";

type TransactionIdCell = string;
type TransactionTypeCell = string;
type TransactionTimeCell = string;
type TransactioCommentCell = string;
type TransactionSymbolCell = string;
type TransactionAmountCel = string;

type ParsedCashOperationLine = [
  TransactionIdCell,
  TransactionTypeCell,
  TransactionTimeCell,
  TransactioCommentCell,
  TransactionSymbolCell,
  TransactionAmountCel,
];

type ParseCashOperationRowsResult = {
  result: ParsedCashOperationLine[];
  error: string | null;
};

export const parseCashOperationRows = (
  rows: string[][],
): ParseCashOperationRowsResult => {
  // data starts at row 12
  const data = rows.splice(11).map((row) => {
    const [
      _empty_cell,
      transaction_id,
      transaction_type,
      transaction_time,
      transaction_comment,
      transaction_symbol,
      transaction_amount,
    ] = row;

    const parsedRow: ParsedCashOperationLine = [
      transaction_id,
      transaction_type,
      transaction_time,
      transaction_comment,
      transaction_symbol,
      transaction_amount,
    ];
    return parsedRow;
  });

  return {
    error: null,
    result: data,
  };
};

const KnownTypes = z.enum([
  "deposit",
  "IKE Deposit",
  "Free-funds Interest Tax",
  "Free-funds Interest",
  "withdrawal",
  "DIVIDENT",
  "Withholding Tax",
  "close trade",
  "Stock sale",
  "Stock purchase",
  "Dividend equivalent",
  "Adjustment Fee",
  "swap",
]);

const CashOperationRowSchema = z.object({
  id: z.coerce.number(),
  type: z.string().superRefine((v, ctx) => {
    if (!KnownTypes.safeParse(v).success) {
      ctx.addIssue({
        internal_code: ReportableZodIssueInternalCode,
        value: v,
        code: "invalid_value",
        values: KnownTypes.options,
      });
    }
  }),
  time: z.string().transform((transaction_date, ctx) => {
    const parsed = parse(transaction_date, XTB_DATE_FORMAT, new Date());
    if (!isValid(parsed)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid date",
        path: ["time"],
      });
      return z.NEVER;
    }

    return parsed;
  }),
  comment: z.string(),
  symbol: z.string(),
  amount: z.coerce.number(),
});

export type ParsedCashOperationRow = z.infer<typeof CashOperationRowSchema>;

type UnparsedCashOperationRow = {
  [K in keyof ParsedCashOperationRow]: unknown;
};

type ParsedCashOperationRowsResult = {
  result: ParsedCashOperationRow[];
  errors: ZodError<ParsedCashOperationRow>[];
};

const mapCashoperationRowToObject = (
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

const parseOpenPositionRow = (row: UnparsedCashOperationRow) => {
  return CashOperationRowSchema.safeParse(row);
};

export const parseCashOperationRowsV2 = (
  rows: string[][],
): ParsedCashOperationRowsResult => {
  const data = rows.map(mapCashoperationRowToObject).map(parseOpenPositionRow);

  const groupedResults = Object.groupBy(data, (v) =>
    v.success ? "ok" : "nok",
  );

  return {
    errors: (groupedResults.nok || []).map((row) => row.error!),
    result: (groupedResults.ok || []).map((row) => row.data!),
  };
};
