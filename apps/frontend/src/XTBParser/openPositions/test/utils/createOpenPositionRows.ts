import { createOpenPositionRow } from "./createOpenPositionRow";

export const createOpenPositionRows = (
  count: number,
  extraRows: string[][] = [],
): string[][] => [
  ...Array.from({ length: count }).map((_, i) => createOpenPositionRow(i)),
];
