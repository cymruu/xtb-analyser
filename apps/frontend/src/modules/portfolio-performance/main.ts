import { pipe } from "effect/Function";

import { config } from "../../config";
import {
  createMetricsService,
  getReportableParsingIssues,
  IMetricsService,
} from "../../services/metricsService";
import { checkWASMSupport } from "../../utils/checkWASMSupport";
import { createCSVFile } from "../../utils/createCSVFile";
import { loadExcelize } from "../../utils/loadExcelize";
import { parseCashOperationRowsV2 } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { removeXLSXHeaderColumns } from "../../XTBParser/utils/removeXLSXHeaderRows";
import { removeXLSXSummaryRow } from "../../XTBParser/utils/removeXLSXSummrayRow";
import {
  PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER,
  portfolioTransactionToCSVRow,
} from "./csv";
import { processRows, processRowsV2 } from "./processRows";
import { parseHeader } from "../../XTBParser/header/parseHeader";
import { Effect } from "effect/index";
import { parseClosedOperationHistoryRows } from "../../XTBParser/closedOperationHistory/parseClosedOperationHistoryRows";
import { parseOpenPositionRowsV2 } from "../../XTBParser/openPositions/parseOpenPositionRows";
import { findOpenPositionsSheet } from "../../XTBParser/openPositions/findOpenPositionsSheet";

const dropArea = document.body!;
const errorMessageDiv = document.getElementById("error-message")!;

const withoutHeaderAndSummary = (rows: string[][]) => {
  return pipe(rows, removeXLSXHeaderColumns, removeXLSXSummaryRow);
};

const processFile = async (
  file: File,
  { metricsService }: { metricsService: IMetricsService },
) => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  loadExcelize().then(async (excelize) => {
    const xlsxFile = excelize.OpenReader(bytes);

    const closedPositionSheet = xlsxFile.GetRows("CLOSED POSITION HISTORY");
    if (closedPositionSheet.error) {
      throw closedPositionSheet.error;
    }

    const sheets = xlsxFile.GetSheetList();
    const operationsSheetIndex = findOpenPositionsSheet(sheets.list);

    const openPositionsSheet = xlsxFile.GetRows(
      sheets.list[operationsSheetIndex]!,
    );
    if (openPositionsSheet.error) {
      throw openPositionsSheet.error;
    }

    const header = await Effect.runPromise(
      parseHeader(closedPositionSheet.result.slice(0, 10)),
    );

    console.log({ header });

    const closedOperationsHistoryRows = await Effect.runPromise(
      parseClosedOperationHistoryRows(
        withoutHeaderAndSummary(closedPositionSheet.result),
      ),
    );
    console.log({ closedOperationsHistoryRows });

    const openOperationsHistoryRows = await Effect.runPromise(
      parseOpenPositionRowsV2(
        withoutHeaderAndSummary(openPositionsSheet.result),
      ),
    );
    console.log({ openOperationsHistoryRows });

    const cashOperationHistorySheet = xlsxFile.GetRows(
      "CASH OPERATION HISTORY",
    );
    if (cashOperationHistorySheet.error) {
      throw cashOperationHistorySheet.error;
    }

    const parsedRowsResult = parseCashOperationRowsV2(
      withoutHeaderAndSummary(cashOperationHistorySheet.result),
    );
    console.log({ parsedRowsResult });

    if (parsedRowsResult.errors) {
      const reportableIssues = getReportableParsingIssues(
        parsedRowsResult.errors.flatMap((x) => x.issues),
      );
      if (reportableIssues.length) {
        metricsService.collectMetrics("xlsx_parse_issue", reportableIssues);
      }

      errorMessageDiv.textContent = parsedRowsResult.errors
        .map((err) => err.message)
        .join(" ");

      if (!parsedRowsResult.result) return;
    }

    const b = processRowsV2(
      closedOperationsHistoryRows.result,
      openOperationsHistoryRows.result,
      parsedRowsResult.result,
      {
        currency: header.currency,
      },
    );
    console.log(b);

    const timeStamp = new Date().toISOString();
    const resultFile = createCSVFile({
      fileName: `portfolio_transactions_${timeStamp}.csv`,
      header: PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER,
      csvLines: b
        .map((x) => x.value)
        .flat()
        .map(portfolioTransactionToCSVRow),
    });

    const link = downloadFile(resultFile, resultFile.name);
    link.click();
  });
};

(() => {
  const appConfig = config;
  const metricsService = createMetricsService(appConfig.backendHost);
  metricsService.collectMetrics("page_load", {
    path: window.location.pathname,
  });

  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.style.borderColor = "#333";
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.style.borderColor = "#ccc";
  });

  dropArea.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropArea.style.borderColor = "#ccc";

    const file = event.dataTransfer?.files[0];

    if (
      file &&
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      processFile(file, { metricsService });
    } else {
      errorMessageDiv.textContent = "Please select a valid XLSX file.";
    }
  });

  const WASMEnabled = checkWASMSupport();
  if (!WASMEnabled) {
    errorMessageDiv.innerHTML =
      '<p class="error-message">Your browser does not support WebAssembly (WASM). Please try using a modern browser such as Firefox or Google Chrome.</>';
  }
})();

const downloadFile = (file: File, filename: string): HTMLAnchorElement => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = filename;

  return link;
};
