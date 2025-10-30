import { Array } from "effect/index";

export const findSheetIndexEffect = (match: RegExp) => (sheets: string[]) =>
  Array.findFirstIndex(sheets, (v) => match.test(v));
