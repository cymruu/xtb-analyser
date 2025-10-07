import z from "zod";
import { Effect, pipe } from "effect/index";
import { XTBTimeSchema } from "../utils/XTBTimeSchema";

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
  return ClosedOperationRowSchema.safeParse(row);
};

export const parseClosedOperationHistoryRows = (rows: string[][]) =>
  Effect.partition(rows, (row) =>
    pipe(
      Effect.succeed(row),
      Effect.map(mapClosedOperationRowToObject),
      Effect.map(parseClosedOperationRow),
      Effect.flatMap((parsed) =>
        parsed.success
          ? Effect.succeed(parsed.data!)
          : Effect.fail(parsed.error!),
      ),
    ),
  ).pipe(
    Effect.map(([failures, successes]) => ({
      errors: failures,
      result: successes,
    })),
  );
