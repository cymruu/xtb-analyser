import * as Plot from "@observablehq/plot";
import { RenderContext, Renderer } from "./renderer";

export function drawChart(
  renderContext: RenderContext,
  renderer: Renderer,
  settings: {},
) {
  console.log("drawChart called with data:", renderContext);
  const { value, deposits, withdrawals } = renderContext;

  const mappedValue = value.map((x) => ({
    date: new Date(x.key),
    value: x.value,
  }));

  const mappedDeposits = deposits.map((x) => ({
    date: new Date(x.key),
    value: x.value,
  }));
  const mappedWithdrawals = withdrawals.map((x) => ({
    date: new Date(x.key),
    value: x.value,
  }));

  const plot = Plot.plot({
    marginLeft: 70,
    width: window.screen.width,
    y: {
      grid: true,
    },
    marks: [
      Plot.areaY(mappedValue, { x: "date", y: "value", fillOpacity: 0.3 }),
      Plot.lineY(mappedValue, { x: "date", y: "value" }),
      Plot.rectY(mappedDeposits, {
        x: "date",
        y: "value",
        interval: "week",
      }),
      Plot.rectY(mappedWithdrawals, {
        x: "date",
        y: "value",
        interval: "week",
        fill: "red",
      }),
      Plot.crosshairX(mappedValue, { x: "date", y: "value" }),
      Plot.ruleY([0]),
    ],
  });

  return plot;
}
