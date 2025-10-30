import { Data, Effect, Option } from "effect";
import { init, NewFile } from "excelize-wasm";
import { parseCashOperationRows } from "./cashOperationHistory/parseCashOperationHistoryRows";
import { parseClosedOperationHistoryRows } from "./closedPositionsHistory/parseClosedOperationHistoryRows";
import { findSheetIndexEffect } from "./findSheetIndex";
import { parseHeader } from "./header/parseHeader";
import { parseOpenPositionRows } from "./openPositions/parseOpenPositionsRows";
import { removeXLSXHeaderColumns } from "./utils/removeXLSXHeaderRows";

const CLOSED_POSITIONS_SHEET_NAME = "CLOSED POSITION HISTORY";
const OPEN_POSITIONS_SHEET_REGEX = /^OPEN POSITION \d+$/;
const CASH_OPERATIONS_SHEET_NAME = "CASH OPERATION HISTORY";

const findOpenPositionsSheetEffect = findSheetIndexEffect(
  OPEN_POSITIONS_SHEET_REGEX,
);

class CSVParsingError extends Data.TaggedError("CSVParsingError")<{
  message: string;
}> {}

const createGetSheetRows = (xlsxFile: NewFile) => (sheetName: string) => {
  const result = xlsxFile.GetRows(sheetName);
  if (result.error) {
    return Effect.fail(
      new CSVParsingError({ message: `Unable to open ${sheetName} sheet` }),
    );
  }
  return Effect.succeed(result.result);
};

export const parseCSV = (
  bytes: Uint8Array,
  { excelize }: { excelize: Awaited<ReturnType<typeof init>> },
) =>
  Effect.gen(function* () {
    const xlsxFile = yield* Effect.try(() => excelize.OpenReader(bytes));
    const getSheetRows = createGetSheetRows(xlsxFile);

    const closedPositionRows = yield* getSheetRows(CLOSED_POSITIONS_SHEET_NAME);
    const header = yield* parseHeader(closedPositionRows);

    const sheetList = xlsxFile.GetSheetList().list;
    const openPositionsSheetIndexOption =
      findOpenPositionsSheetEffect(sheetList);
    if (Option.isNone(openPositionsSheetIndexOption)) {
      return yield* Effect.fail(
        new CSVParsingError({ message: "Unable to open OPEN POSITIONS sheet" }),
      );
    }
    const openPositionRows = yield* getSheetRows(
      sheetList[openPositionsSheetIndexOption.value]!,
    );
    const cashOperationRows = yield* getSheetRows(CASH_OPERATIONS_SHEET_NAME);

    const closedPositions = yield* parseClosedOperationHistoryRows(
      removeXLSXHeaderColumns(closedPositionRows),
    );
    const openPositions = yield* parseOpenPositionRows(
      removeXLSXHeaderColumns(openPositionRows),
    );
    const cashOperations = yield* parseCashOperationRows(
      removeXLSXHeaderColumns(cashOperationRows),
    );

    return {
      header,
      closedPositions,
      openPositions,
      cashOperations,
    };
  });
