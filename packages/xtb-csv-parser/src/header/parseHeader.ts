import { Array, Data, Effect, Option, pipe } from "effect/index";

type XTBCSVHeader = {
  currency: string;
  account: string;
};

export class HeaderParsingError extends Data.TaggedError("HeaderParsingError")<{
  message: string;
}> {}

const findRowAndColumnIndex = (lookup: string) => (rows: string[][]) =>
  Array.findFirst(rows, (row, rowIndex) => {
    const colIndexOption = Array.findFirstIndex(row, (v) => v === lookup);

    return Option.map(colIndexOption, (colIndex) => ({
      rowIndex: rowIndex,
      colIndex: colIndex,
    }));
  });

const getValueBelowHeader = (rows: string[][], lookup: string) =>
  pipe(
    findRowAndColumnIndex(lookup)(rows),
    Option.match({
      onNone: () =>
        Effect.fail(
          new HeaderParsingError({ message: `${lookup} not found in header` }),
        ),
      onSome: ({ rowIndex, colIndex }) => {
        const value = rows[rowIndex + 1]?.[colIndex];
        return value
          ? Effect.succeed(value)
          : Effect.fail(
              new HeaderParsingError({
                message: `${lookup} value not found in header`,
              }),
            );
      },
    }),
  );

export const parseHeader = (
  rows: string[][],
): Effect.Effect<XTBCSVHeader, HeaderParsingError, never> =>
  Effect.gen(function* () {
    const currency = yield* getValueBelowHeader(rows, "Currency");
    const account = yield* getValueBelowHeader(rows, "Account");

    return { currency, account };
  });
