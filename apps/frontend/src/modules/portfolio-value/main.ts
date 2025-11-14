import { config } from "../../config";
import { createMetricsService } from "../../services/metricsService";
import { createRenderer } from "./renderer";

(() => {
  const appConfig = config;
  const metricsService = createMetricsService(appConfig.backendHost);

  metricsService.collectMetrics("page_load", {
    path: window.location.pathname,
  });

  const container = document.getElementById("container");
  const dropArea = document.body!;
  const errorMessageDiv = document.getElementById("error-message")!;
  if (!appConfig.backendHost) {
    return (errorMessageDiv.innerHTML = "backendHost not configured");
  }

  const renderer = createRenderer({ metricsService })({
    container,
    getSettings: () => ({}),
  });

  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  dropArea.addEventListener("drop", async (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file) {
      return (errorMessageDiv.innerHTML = "invalid files");
    }
    metricsService.collectMetrics("files_dropped", { count: 1 });
    console.log("dropped files", { files: file });
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = new URL("/portfolio/xtb-file", appConfig.backendHost!);
    return fetch(endpoint, {
      method: "POST",
      body: formData,
    });
  });

  renderer.render();
})();
