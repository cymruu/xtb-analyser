import { z } from "zod/v4";
import { XTBTimeSchema } from "../utils/XTBTimeSchema";
import { Effect } from "effect/index";

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

type ParseOpenPositionRowsResult = {
  result: ParsedOpenPositionRow[];
  error: string | null;
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
  return OpenPositionRowSchema.safeParse(row);
};

export const parseOpenPositionRows = (
  rows: string[][],
): ParseOpenPositionRowsResult => {
  const data = rows.map(mapOpenPositionRowToObject).map(parseOpenPositionRow);

  const groupedResults = Object.groupBy(data, (v) =>
    v.success ? "ok" : "nok",
  );

  if (data.length === 0) {
    return { error: "No valid rows found", result: [] };
  }

  return {
    error: null,
    result: (groupedResults.ok || []).map((row) => row.data!),
  };
};

export const parseOpenPositionRowsV2 = (rows: string[][]) =>
  Effect.forEach(rows, (row) =>
    Effect.succeed(row).pipe(
      Effect.map(mapOpenPositionRowToObject),
      Effect.map(parseOpenPositionRow),
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
