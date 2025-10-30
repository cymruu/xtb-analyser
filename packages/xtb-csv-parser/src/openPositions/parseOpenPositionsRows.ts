import { z } from "zod/v4";
import { XTBTimeSchema } from "../utils/XTBTimeSchema";
import { Effect, flow } from "effect/index";
import { RowValidationError } from "../utils/RowValidationError";

const OpenPositionRowSchema = z.object({
  id: z.coerce.number(),
  symbol: z.string().trim(),
  type: z.literal("BUY"),
  volume: z.coerce.number(),
  open_time: XTBTimeSchema,
  open_price: z.coerce.number(),
  market_price: z.coerce.number(),
  purchase_value: z.coerce.number(),
  profit: z.coerce.number(),
});

export type ParsedOpenPositionRow = z.infer<typeof OpenPositionRowSchema>;

type UnparsedOpenPositionRow = {
  [K in keyof ParsedOpenPositionRow]: unknown;
};

const mapOpenPositionRowToObject = (row: string[]): UnparsedOpenPositionRow => {
  const [
    _empty_cell,
    id,
    symbol,
    type,
    volume,
    open_time,
    open_price,
    market_price,
    purchase_value,
    _sl,
    _tp,
    _margin,
    _commission,
    _swap,
    _rollover,
    profit,
    _comment,
  ] = row;

  return {
    id,
    symbol,
    type,
    volume,
    open_time,
    open_price,
    market_price,
    purchase_value,
    profit,
  };
};

const parseOpenPositionRow = (row: UnparsedOpenPositionRow) => {
  const parseResult = OpenPositionRowSchema.safeParse(row);
  if (!parseResult.success) {
    return Effect.fail(
      new RowValidationError({ parseError: parseResult.error }),
    );
  }

  return Effect.succeed(parseResult.data);
};

export const parseOpenPositionRows = (rows: string[][]) =>
  Effect.partition(
    rows,
    flow(mapOpenPositionRowToObject, parseOpenPositionRow),
  ).pipe(
    Effect.map(([failures, successes]) => ({
      failures,
      successes,
    })),
  );
