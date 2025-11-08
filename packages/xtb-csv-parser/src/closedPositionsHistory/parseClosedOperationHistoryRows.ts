import { Effect, flow } from "effect/index";
import z from "zod";

import { RowValidationError } from "../utils/RowValidationError";
import { XTBTimeSchema } from "../utils/XTBTimeSchema";
import type { ParseResult } from "../parseResult";

export const KnownClosedPositionTypes = z.enum(["BUY"]);

const ClosedOperationRowSchema = z.object({
  position: z.coerce.number(),
  symbol: z.string(),
  type: KnownClosedPositionTypes,
  volume: z.coerce.number(),
  open_time: XTBTimeSchema,
  open_price: z.coerce.number(),
  close_time: XTBTimeSchema,
  close_price: z.coerce.number(),
  purchase_value: z.coerce.number(),
  sale_value: z.coerce.number(),
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
    _open_origin,
    _close_origin,
    purchase_value,
    sale_value,
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
    purchase_value,
    sale_value,
  };
};

const parseClosedOperationRow = (row: UnparsedClosedOperation) => {
  const parseResult = ClosedOperationRowSchema.safeParse(row);
  if (!parseResult.success) {
    return Effect.fail(
      new RowValidationError({ parseError: parseResult.error }),
    );
  }

  return Effect.succeed(parseResult.data);
};

export const parseClosedOperationHistoryRows = (
  rows: string[][],
): Effect.Effect<ParseResult<ParsedClosedOperation>> =>
  Effect.partition(
    rows,
    flow(mapClosedOperationRowToObject, parseClosedOperationRow),
  ).pipe(
    Effect.map(([failures, successes]) => ({
      failures,
      successes,
    })),
  );
