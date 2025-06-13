import { drawTreemap } from "./charts/drawTreemap";
import { DrawTreemapSettings } from "./main";

export type RenderContext = { root: unknown | null; render: unknown | null };

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

      const svg = drawTreemap(renderContext, this, getSettings());
      container!.firstChild?.remove();
      container!.append(svg.node()!);
    },
  };
};
