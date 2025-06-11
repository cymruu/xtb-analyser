import { checkWASMSupport } from "./checkWASMSupport";
import { processFile } from "./processFile";

const getSettings = () => {
  const hideValue = (<HTMLInputElement>document.getElementById("hide_value"))
    .checked;

  const settings = { hideValue };

  return settings;
};

(() => {
  let fileRef: File | null = null;
  const dropArea = document.body!;
  const errorMessageDiv = document.getElementById("error-message")!;
  const configControls = document.getElementsByClassName(
    "extra-config-control",
  );

  for (const control of configControls) {
    control.addEventListener("change", () => {
      if (fileRef) {
        processFile(fileRef, getSettings());
      }
    });
  }

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
      fileRef = file;
      processFile(file, getSettings());
    } else {
      errorMessageDiv.textContent = "Please select a valid XLSX file.";
    }
  });

  const container = document.getElementById("container");

  const isWASMEnabled = checkWASMSupport();
  if (!isWASMEnabled) {
    errorMessageDiv.innerHTML =
      '<p class="error-message">Your browser does not support WebAssembly (WASM). Please try using a modern browser such as Firefox or Google Chrome.</>';
  }
})();
