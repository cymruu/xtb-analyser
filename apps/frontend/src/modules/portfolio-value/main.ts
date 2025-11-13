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

  const renderer = createRenderer({ metricsService })({
    container,
    getSettings: () => ({}),
  });

  renderer.render();
})();
