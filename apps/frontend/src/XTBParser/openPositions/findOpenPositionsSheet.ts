import { findSheetIndex, findSheetIndexEffect } from "../findSheetIndex";

const OPEN_POSITIONS_SHEET_REGEX = /^OPEN POSITION \d+$/;

export const findOpenPositionsSheet = findSheetIndex(
  OPEN_POSITIONS_SHEET_REGEX,
);

export const findOpenPositionsSheetEffect = findSheetIndexEffect(
  OPEN_POSITIONS_SHEET_REGEX,
);
