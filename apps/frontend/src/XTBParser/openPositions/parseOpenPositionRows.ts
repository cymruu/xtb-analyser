import { isValid, parse } from "date-fns";
import { z } from "zod/v4";
import { XTB_DATE_FORMAT } from "../utils/XTBTimeSchema";

const OpenPositionRowSchema = z.object({
  id: z.coerce.number(),
  symbol: z.string().trim(),
  type: z.literal("BUY"),
  volume: z.coerce.number(),
  open_time: z.string().transform((transaction_date) => {
    const parsed = parse(transaction_date, XTB_DATE_FORMAT, new Date());
    if (!isValid(parsed)) {
      return null;
    }

    return parsed;
  }),
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
