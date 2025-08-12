import { Effect, Option } from "effect/index";

export type ParsedHeader = {
  currency: string;
};

export const parseHeader = (rows: string[][]) =>
  Effect.succeed(() =>
    rows.flatMap((row, i) =>
      row.map((cell, j) => ({ cell, rowIndex: i, colIndex: j })),
    ),
  ).pipe(
    Effect.map((flattenedCells) =>
      Option.fromNullable(
        flattenedCells().find(({ cell }) => cell === "Currency"),
      ),
    ),
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.fail(new Error("not found")),
        onSome: (v) => {
          const currency = rows[v.rowIndex + 1][v.colIndex];
          return Effect.succeed({ currency });
        },
      }),
    ),
  );
