import { IMetricsService } from "../../services/metricsService";
import { drawChart } from "./drawChart";

export type RenderContext = {};
export type Renderer = ReturnType<ReturnType<typeof createRenderer>>;
export const createRenderer =
  (deps: { metricsService: IMetricsService }) =>
  ({
    container,
    getSettings,
  }: {
    container: HTMLElement | null;
    getSettings: () => {};
  }) => {
    if (!container) {
      throw new Error("Container element is not defined.");
    }

    let renderContext: RenderContext = {};

    return {
      setRenderContext(newRendererContext: RenderContext) {
        renderContext = newRendererContext;
      },
      render() {
        deps.metricsService.collectMetrics("render", {
          name: "chart",
          settings: {},
        });

        const svg = drawChart(renderContext, this, {});
        container!.append(svg!);
      },
    };
  };
