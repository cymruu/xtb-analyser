import { processRowStream } from "../../DivTrackerCSVSerializer/stream";
import { parseCashOperationRows } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { config } from "../../config";
import { createMetricsService } from "../../services/metricsService";
import { checkWASMSupport } from "../../utils/checkWASMSupport";
import { loadExcelize } from "../../utils/loadExcelize";

function arrayToReadableStream(array: string[][]): ReadableStream<string[]> {
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < array.length) {
        controller.enqueue(array[index]);
        index++;
      } else {
        controller.close();
      }
    },
  });
}

const processFile = async (file: File, currency: string) => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  loadExcelize().then(async (excelize) => {
    const xlsxFile = excelize.OpenReader(bytes);

    const result = xlsxFile.GetRows("CASH OPERATION HISTORY");
    if (result.error) {
      throw result.error;
    }

    const parsedLines = parseCashOperationRows(result.result);
    const stream = arrayToReadableStream(parsedLines.result);
    const resultFile = await processRowStream(stream, currency);

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

  const dropArea = document.getElementById("drop-area")!;
  const errorMessageDiv = document.getElementById("error-message")!;

  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.style.borderColor = "#333";
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.style.borderColor = "#ccc";
  });

  dropArea.addEventListener("drop", async (event) => {
    const currency = (<HTMLSelectElement>document.getElementById("currency"))
      .value;
    event.preventDefault();
    dropArea.style.borderColor = "#ccc";

    const file = event.dataTransfer?.files[0];

    if (
      file &&
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      processFile(file, currency);
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
