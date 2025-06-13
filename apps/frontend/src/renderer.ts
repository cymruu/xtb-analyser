import { drawTreemap } from "./charts/drawTreemap";
import { DrawTreemapSettings } from "./main";
import { metricsService } from "./metricsService";

//TODO: find a nice house for this type
export type TreemapLeaf = {
  name: string;
  children?: TreemapLeaf[];
  [key: string]: unknown;
};

export type RenderContext = {
  root: TreemapLeaf | null;
  render: TreemapLeaf | null;
};

export type Renderer = ReturnType<typeof createRenderer>;
export const createRenderer = ({
  container,
  getSettings,
}: {
  container: HTMLElement | null;
  getSettings: () => DrawTreemapSettings;
}) => {
  if (!container) {
    throw new Error("Container element is not defined.");
  }

  let renderContext: RenderContext = { root: null, render: null };

  return {
    setRenderContext(newRendererContext: RenderContext) {
      console.log("setting render context", newRendererContext);

      renderContext = newRendererContext;
    },
    render() {
      if (!renderContext.root || !renderContext.render) {
        throw new Error("Render context is not properly initialized.");
      }
      const settings = getSettings();

      metricsService.collectMetrics("render", {
        settings,
        //TODO: introduce TreemapLeafRoot type
        count: renderContext.root?.children?.length,
      });

      const svg = drawTreemap(renderContext, this, settings);
      container!.firstChild?.remove();
      container!.append(svg.node()!);
    },
  };
};
