import { Data, Effect, Option } from "effect";
import { init, NewFile } from "excelize-wasm";

import { parseCashOperationRows } from "./cashOperationHistory/parseCashOperationHistoryRows";
import { parseClosedOperationHistoryRows } from "./closedPositionsHistory/parseClosedOperationHistoryRows";
import { findSheetIndexEffect } from "./findSheetIndex";
import { parseHeader } from "./header/parseHeader";
import { parseOpenPositionRows } from "./openPositions/parseOpenPositionsRows";
import { removeXLSXHeaderColumns } from "./utils/removeXLSXHeaderRows";
import { sortParsedResults } from "./utils/parseResult";

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
    const xlsxFile = yield* Effect.try({
      try: () => {
        const result = excelize.OpenReader(bytes);
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      },
      catch: (error) =>
        new CSVParsingError({
          message: (error as Error)?.message || "unknown error",
        }),
    });
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

    const closedPositions = parseClosedOperationHistoryRows(
      removeXLSXHeaderColumns(closedPositionRows),
    );
    const openPositions = parseOpenPositionRows(
      removeXLSXHeaderColumns(openPositionRows),
    );
    const cashOperations = parseCashOperationRows(
      removeXLSXHeaderColumns(cashOperationRows),
    );

    return {
      header,
      closedPositions: yield* sortParsedResults(
        closedPositions,
        (row) => row.open_time,
      ),
      openPositions: yield* sortParsedResults(
        openPositions,
        (row) => row.open_time,
      ),
      cashOperations: yield* sortParsedResults(
        cashOperations,
        (row) => row.time,
      ),
    };
  });
