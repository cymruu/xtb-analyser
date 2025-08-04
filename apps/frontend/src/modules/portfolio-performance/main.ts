import { processRows } from "./stream";
import {
  parseCashOperationRows,
  parseCashOperationRowsV2,
} from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { config } from "../../config";
import { createMetricsService } from "../../services/metricsService";
import { checkWASMSupport } from "../../utils/checkWASMSupport";
import { loadExcelize } from "../../utils/loadExcelize";

const dropArea = document.body!;
const errorMessageDiv = document.getElementById("error-message")!;

const processFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  loadExcelize().then(async (excelize) => {
    const xlsxFile = excelize.OpenReader(bytes);

    const result = xlsxFile.GetRows("CASH OPERATION HISTORY");
    if (result.error) {
      throw result.error;
    }

    //TODO: add utility to remove XTB header and footer rows
    const parsedRowsResult = parseCashOperationRowsV2(result.result);
    console.log({ parsedRowsResult });

    if (parsedRowsResult.errors) {
      errorMessageDiv.textContent = parsedRowsResult.errors
        .map((err) => err.message)
        .join(" ");
      return;
    }
    const resultFile = await processRows(parsedRowsResult.result);

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
      processFile(file);
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
