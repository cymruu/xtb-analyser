import { Array, Effect, Order } from "effect";

import type { RowValidationError } from "./utils/RowValidationError";

export type ParseResult<T> = {
  failures: RowValidationError[];
  successes: T[];
};

export const sortParsedResults = <T>(
  parsedResult: Effect.Effect<ParseResult<T>>,
  sortFn: (row: T) => Date,
) =>
  Effect.map(parsedResult, (result) => {
    result.successes = Array.sort(
      result.successes,
      Order.mapInput(Order.Date, sortFn),
    );
    return result;
  });
