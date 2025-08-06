import { pipe } from "fp-ts/lib/function";

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
import { PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER } from "./csv";
import { processRows } from "./processRows";

const dropArea = document.body!;
const errorMessageDiv = document.getElementById("error-message")!;

const processFile = async (
  file: File,
  { metricsService }: { metricsService: IMetricsService },
) => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  loadExcelize().then(async (excelize) => {
    const xlsxFile = excelize.OpenReader(bytes);

    const result = xlsxFile.GetRows("CASH OPERATION HISTORY");
    if (result.error) {
      throw result.error;
    }

    const rowsWithoutHeaderAndSummary = pipe(
      result.result,
      removeXLSXHeaderColumns,
      removeXLSXSummaryRow,
    );
    const parsedRowsResult = parseCashOperationRowsV2(
      rowsWithoutHeaderAndSummary,
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
    const csvLines = await processRows(parsedRowsResult.result);

    console.log({ csvLines });
    const resultFile = createCSVFile({
      fileName: "test.csv",
      header: PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER,
      csvLines,
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
