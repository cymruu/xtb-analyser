import { Effect } from "effect/index";
import { config } from "../../config";
import { createMetricsService } from "../../services/metricsService";
import { checkWASMSupport } from "../../utils/checkWASMSupport";
import { createCSVFile } from "../../utils/createCSVFile";
import {
  PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER,
  portfolioTransactionToCSVRow,
} from "./csv";
import { portfolioPerformanceProgram } from "./effect";

const dropArea = document.body!;
const errorMessageDiv = document.getElementById("error-message")!;

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
      const processedRows = await Effect.runPromise(
        portfolioPerformanceProgram({ file }),
      );
      const timeStamp = new Date().toISOString();
      const resultFile = createCSVFile({
        fileName: `portfolio_transactions_${timeStamp}.csv`,
        header: PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER,
        csvLines: processedRows
          .map((x) => x.value)
          .flat()
          .map(portfolioTransactionToCSVRow),
      });

      const link = downloadFile(resultFile, resultFile.name);
      link.click();
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
