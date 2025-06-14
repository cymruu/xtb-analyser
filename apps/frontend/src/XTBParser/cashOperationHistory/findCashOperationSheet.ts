import { findSheetIndex } from "../findSheetIndex";

const OPEN_POSITIONS_SHEET_REGEX = /^CASH OPERATION HISTORY$/;

export const findCashOperationSheet = findSheetIndex(
  OPEN_POSITIONS_SHEET_REGEX,
);
