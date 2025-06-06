import { checkWASMSupport } from "./checkWASMSupport";
import { processFile } from "./processFile";

(() => {
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
    event.preventDefault();
    dropArea.style.borderColor = "#ccc";
    const file = event.dataTransfer?.files[0];

    const hideValue = (<HTMLInputElement>document.getElementById("hide_value"))
      .checked;

    const settings = { hideValue };

    if (
      file &&
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      processFile(file, settings);
    } else {
      errorMessageDiv.textContent = "Please select a valid XLSX file.";
    }
  });

  const isWASMEnabled = checkWASMSupport();
  if (!isWASMEnabled) {
    errorMessageDiv.innerHTML =
      '<p class="error-message">Your browser does not support WebAssembly (WASM). Please try using a modern browser such as Firefox or Google Chrome.</>';
  }
})();
