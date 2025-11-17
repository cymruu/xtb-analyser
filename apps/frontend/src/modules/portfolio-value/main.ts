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
  const loader = document.getElementById("loader")!;
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
    loader.style.display = "block";
    const file = event.dataTransfer?.files[0];
    if (!file) {
      return (errorMessageDiv.innerHTML = "invalid files");
    }
    metricsService.collectMetrics("files_dropped", { count: 1 });
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = new URL("/portfolio/xtb-file", appConfig.backendHost!);
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    loader.style.display = "none";

    if (response.status !== 200) {
      const requestId = response.headers.get("X-Request-Id");

      errorMessageDiv.innerHTML = `[${response.status}] - ${response.statusText}. Please reach out for assistance. Please provide following code with your request ${requestId}`;
      return;
    }
    const data = await response.json();

    renderer.setRenderContext(data);
    renderer.render();
  });
})();
