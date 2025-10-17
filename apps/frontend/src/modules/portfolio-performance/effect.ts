import { Effect } from "effect/index";
import { loadExcelizeEffect } from "../../utils/loadExcelize";
import { parseCashOperationRowsV3 } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseClosedOperationHistoryRows } from "../../XTBParser/closedOperationHistory/parseClosedOperationHistoryRows";
import { parseHeader } from "../../XTBParser/header/parseHeader";
import { findOpenPositionsSheetEffect } from "../../XTBParser/openPositions/findOpenPositionsSheet";
import { parseOpenPositionRowsV2 } from "../../XTBParser/openPositions/parseOpenPositionRows";
import { processRowsV3 } from "./processRows";

type PortfolioPerformanceProgramArgs = { file: File };

export const portfolioPerformanceProgram = ({
  file,
}: PortfolioPerformanceProgramArgs) => {
  return Effect.gen(function* () {
    const arrayBuffer = yield* Effect.promise(() => file.arrayBuffer());
    const bytes = new Uint8Array(arrayBuffer);

    const excelize = yield* loadExcelizeEffect;

    const xlsxFile = yield* Effect.try(() => excelize.OpenReader(bytes));

    // load sheets
    const closedPositionSheet = xlsxFile.GetRows("CLOSED POSITION HISTORY");
    if (closedPositionSheet.error) {
      return yield* Effect.fail("Unable to find CLOSED POSITION HISTORY sheet");
    }

    const sheets = xlsxFile.GetSheetList();
    const operationsSheetIndex = yield* findOpenPositionsSheetEffect(
      sheets.list,
    );

    const openPositionsSheet = xlsxFile.GetRows(
      sheets.list[operationsSheetIndex]!,
    );
    if (openPositionsSheet.error) {
      return yield* Effect.fail("unable to find Open Position Sheet");
    }

    const cashOperationHistorySheet = xlsxFile.GetRows(
      "CASH OPERATION HISTORY",
    );
    if (cashOperationHistorySheet.error) {
      return yield* Effect.fail("unable to find Cash Operation History sheet");
    }

    // parse data
    const header = yield* parseHeader(openPositionsSheet.result);
    const closedOperationHistoryRows = yield* parseClosedOperationHistoryRows(
      closedPositionSheet.result,
    );

    const openOperationsHistoryRows = yield* parseOpenPositionRowsV2(
      openPositionsSheet.result,
    );
    const cashOperationRows = yield* parseCashOperationRowsV3(
      cashOperationHistorySheet.result,
    );

    const processedRows = yield* processRowsV3(
      closedOperationHistoryRows.result,
      openOperationsHistoryRows.result,
      cashOperationRows.result,
      { currency: header.currency },
    );

    console.log({
      header,
      closedOperationHistoryRows,
      openOperationsHistoryRows,
      cashOperationRows,
      processedRows,
    });

    console.log({ sheets });

    return processedRows;
  });
};
