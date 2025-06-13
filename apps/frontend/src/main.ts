import { checkWASMSupport } from "./checkWASMSupport";
import { processFiles } from "./processFiles";
import { createRenderer } from "./renderer";

const container = document.getElementById("container");
const dropArea = document.body!;
const errorMessageDiv = document.getElementById("error-message")!;
const configControls = document.getElementsByClassName("extra-config-control");

export type DrawTreemapSettings = { hideValue: boolean };

const getSettings = (): DrawTreemapSettings => {
  const hideValue = (<HTMLInputElement>document.getElementById("hide_value"))
    .checked;

  const settings = { hideValue };

  return settings;
};

const processFilesAndAnalyse = async (files: FileList | null) => {
  if (!files) {
    errorMessageDiv.textContent = "Please drop a file to render the treemap.";
    return;
  }
  const result = await processFiles(files);

  if (!result.ok) {
    errorMessageDiv.textContent = result.error.message;
    return;
  }

  return {
    root: result.treeMapData,
    render: result.treeMapData,
  };
};

(() => {
  const renderer = createRenderer({ container, getSettings });

  for (const control of configControls) {
    control.addEventListener("change", () => {
      renderer.render();
    });
  }

  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  dropArea.addEventListener("drop", async (event) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    const fileListRef = files || null;
    const renderContext = await processFilesAndAnalyse(fileListRef);
    if (renderContext) {
      renderer.setRenderContext(renderContext);
      renderer.render();
    }
  });

  const isWASMEnabled = checkWASMSupport();
  if (!isWASMEnabled) {
    errorMessageDiv.innerHTML =
      '<p class="error-message">Your browser does not support WebAssembly (WASM). Please try using a modern browser such as Firefox or Google Chrome.</>';
  }
})();
