import { Array } from "effect/index";

//TODO: remove after implementing functional portfolioPerformanceProgram
export const findSheetIndex = (match: RegExp) => (sheets: string[]) => {
  return sheets.findIndex((sheetName) => match.test(sheetName));
};

export const findSheetIndexEffect = (match: RegExp) => (sheets: string[]) =>
  Array.findFirstIndex(sheets, (v) => match.test(v));
