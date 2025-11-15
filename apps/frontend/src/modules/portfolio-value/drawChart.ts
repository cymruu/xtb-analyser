import * as Plot from "@observablehq/plot";
import { RenderContext, Renderer } from "./renderer";

import { parseISO } from "date-fns";

export function drawChart(
  renderContext: RenderContext,
  renderer: Renderer,
  settings: {},
) {
  const data = renderContext;
  console.log("drawChart called with data:", renderContext);

  const mappedData = data.map((x) => ({
    date: parseISO(x.key),
    value: x.value,
  }));

  const plot = Plot.plot({
    marginLeft: 70,
    width: window.screen.width,
    y: {
      grid: true,
    },
    marks: [
      Plot.areaY(mappedData, { x: "date", y: "value", fillOpacity: 0.3 }),
      Plot.lineY(mappedData, { x: "date", y: "value" }),
      Plot.rectY([], {
        x: "date",
        y: "value",
        interval: "week",
      }),
      Plot.crosshairX(mappedData, { x: "date", y: "value" }),
      Plot.ruleY([0]),
    ],
  });

  return plot;
}
