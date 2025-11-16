import { IMetricsService } from "../../services/metricsService";
import { drawChart } from "./drawChart";

export type RenderContext = {
  deposits: { key: string; value: number }[];
  withdrawals: { key: string; value: number }[];
  value: { key: string; value: number }[];
};

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

    let renderContext: RenderContext = {
      deposits: [],
      withdrawals: [],
      value: [],
    };

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
