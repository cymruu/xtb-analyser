import * as Plot from "@observablehq/plot";
import { RenderContext, Renderer } from "./renderer";

import data from "./response.json";
import { eachDayOfInterval, subDays, eachMonthOfInterval } from "date-fns";

export function drawChart(
  renderContext: RenderContext,
  renderer: Renderer,
  settings: {},
) {
  console.log("drawChart called with data:", renderContext);
  console.log(data);

  const mappedData = eachDayOfInterval({
    start: subDays(new Date(), data.length - 1),
    end: new Date(),
  }).map((date, i) => {
    console.log(data[i]);

    return { date, value: data[i].value };
  });

  const deposits = eachMonthOfInterval({
    start: subDays(new Date(), data.length - 1),
    end: new Date(),
  }).map((date, i) => {
    return { date, value: i * 1000 };
  });

  console.log({ mappedData, deposits });

  const plot = Plot.plot({
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

      // Plot.crosshairX(mappedData, { x: "date", y: "value" }),
      Plot.ruleY([0]),
    ],
  });

  return plot;
}
