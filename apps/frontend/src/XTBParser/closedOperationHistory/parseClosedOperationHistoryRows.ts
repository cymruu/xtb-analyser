import { isValid, parse } from "date-fns";
import z from "zod";
import { XTB_DATE_FORMAT } from "../openPositions/parseOpenPositionRows";
import { Effect } from "effect/index";

const timeSchema = z.string().transform((transaction_date, ctx) => {
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
});

const ClosedOperationRowSchema = z.object({
  position: z.number(),
  symbol: z.string(),
  type: z.enum(["BUY", "SELL"]),
  volume: z.coerce.number(),
  open_time: timeSchema,
  open_price: z.coerce.number(),
  close_time: timeSchema,
  close_price: z.coerce.number(),
});

export type ParsedClosedOperation = z.infer<typeof ClosedOperationRowSchema>;

type UnparsedClosedOperation = { [K in keyof ParsedClosedOperation]: unknown };

const mapClosedOperationRowToObject = (
  row: string[],
): UnparsedClosedOperation => {
  const [
    _empty_cell,
    position,
    symbol,
    type,
    volume,
    open_time,
    open_price,
    close_time,
    close_price,
  ] = row;

  return {
    position,
    symbol,
    type,
    volume,
    open_time,
    open_price,
    close_time,
    close_price,
  };
};

const parseClosedOperationRow = (row: UnparsedClosedOperation) => {
  return ClosedOperationRowSchema.safeParse(row);
};

export const parseClosedOperationHistoryRows = (rows: string[][]) =>
  Effect.forEach(rows, (row) =>
    Effect.succeed(row).pipe(
      Effect.map(mapClosedOperationRowToObject),
      Effect.map(parseClosedOperationRow),
    ),
  ).pipe(
    Effect.map((parsedRows) => {
      const groupedResults = Object.groupBy(parsedRows, (v) =>
        v.success ? "ok" : "nok",
      );

      return {
        errors: (groupedResults.nok || []).map((row) => row.error!),
        result: (groupedResults.ok || []).map((row) => row.data!),
      };
    }),
  );
