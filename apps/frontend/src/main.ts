import { drawTreemap } from "./charts/drawTreemap";
import { checkWASMSupport } from "./checkWASMSupport";
import { processFiles } from "./processFiles";

const container = document.getElementById("container");
const dropArea = document.body!;
const errorMessageDiv = document.getElementById("error-message")!;
const configControls = document.getElementsByClassName("extra-config-control");

const getSettings = () => {
  const hideValue = (<HTMLInputElement>document.getElementById("hide_value"))
    .checked;

  const settings = { hideValue };

  return settings;
};

const renderTreemap = async (files: FileList | null) => {
  if (!files) {
    errorMessageDiv.textContent = "Please drop a file to render the treemap.";
    return;
  }
  const result = await processFiles(files);

  if (!result.ok) {
    errorMessageDiv.textContent = result.error.message;
    return;
  }
  const svg = drawTreemap(result.treeMapData, getSettings());
  container!.firstChild?.remove();
  container!.append(svg.node()!);
};

(() => {
  let fileListRef: FileList | null = null;

  for (const control of configControls) {
    control.addEventListener("change", () => {
      renderTreemap(fileListRef);
    });
  }

  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  dropArea.addEventListener("drop", async (event) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    fileListRef = files || null;
    renderTreemap(fileListRef);
  });

  const isWASMEnabled = checkWASMSupport();
  if (!isWASMEnabled) {
    errorMessageDiv.innerHTML =
      '<p class="error-message">Your browser does not support WebAssembly (WASM). Please try using a modern browser such as Firefox or Google Chrome.</>';
  }
})();
