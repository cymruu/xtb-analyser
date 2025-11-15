import * as Plot from "@observablehq/plot";
import { RenderContext, Renderer } from "./renderer";

export function drawChart(
  renderContext: RenderContext,
  renderer: Renderer,
  settings: {},
) {
  const data = renderContext;
  console.log("drawChart called with data:", renderContext);

  const mappedData = data.map((x) => ({
    date: new Date(x.key),
    value: x.value,
  }));

  const dots = [{ date: new Date("2025-01-01"), value: 1000 }];
  const deposits = [{ date: new Date("2025-01-01"), value: 1000 }];

  const plot = Plot.plot({
    marginLeft: 70,
    width: window.screen.width,
    y: {
      grid: true,
    },
    marks: [
      Plot.areaY(mappedData, { x: "date", y: "value", fillOpacity: 0.3 }),
      Plot.lineY(mappedData, { x: "date", y: "value" }),
      Plot.rectY(deposits, {
        x: "date",
        y: "value",
        interval: "week",
      }),
      Plot.dot(
        [{ date: new Date("2025-01-01"), value: 1000 }],
        Plot.pointer({ x: "date", y: "value", fill: "red", r: 8 }),
      ),
      Plot.dot(
        dots,
        Plot.pointer({ x: "date", y: "value", fill: "red", r: 8 }),
      ),
      Plot.dot(dots, { x: "date", y: "value", tip: "xy" }),
      Plot.crosshairX(mappedData, { x: "date", y: "value" }),
      Plot.ruleY([0]),
    ],
  });

  return plot;
}
