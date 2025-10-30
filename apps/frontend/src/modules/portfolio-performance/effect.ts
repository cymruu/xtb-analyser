import { Effect } from "effect/index";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";

import { processRows } from "./processRows";
import { loadExcelizeEffect } from "../../utils/loadExcelize";

type PortfolioPerformanceProgramArgs = { file: File };

export const portfolioPerformanceProgram = ({
  file,
}: PortfolioPerformanceProgramArgs) => {
  return Effect.gen(function* () {
    const excelize = yield* loadExcelizeEffect;
    const arrayBuffer = yield* Effect.promise(() => file.arrayBuffer());
    const bytes = new Uint8Array(arrayBuffer);

    const result = yield* parseCSV(bytes, { excelize });

    const processedRows = yield* processRows(
      result.closedPositions.successes,
      result.openPositions.successes,
      result.cashOperations.successes,
      { currency: result.header.currency },
    );

    return processedRows;
  });
};
