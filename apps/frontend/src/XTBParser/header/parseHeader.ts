import { Array, Effect, Option, pipe } from "effect/index";

export type ParsedHeader = {
  currency: string;
};

const findRowAndColumnIndex = (lookup: string) => (rows: string[][]) =>
  Array.findFirst(rows, (row, rowIndex) => {
    const colIndexOption = Array.findFirstIndex(row, (v) => v === lookup);

    return Option.map(colIndexOption, (colIndex) => ({
      rowIndex: rowIndex,
      colIndex: colIndex,
    }));
  });

export const parseHeader = (rows: string[][]) =>
  pipe(
    findRowAndColumnIndex("Currency")(rows),
    Option.match({
      onNone: () => Effect.fail("Currency not found in header"),
      onSome: ({ rowIndex, colIndex }) => {
        const currencyRow = rows[rowIndex + 1];
        const currencyValue = currencyRow?.[colIndex];

        if (!currencyValue) {
          return Effect.fail("Currency value not found in header");
        }

        return Effect.succeed({ currency: currencyValue });
      },
    }),
  );
