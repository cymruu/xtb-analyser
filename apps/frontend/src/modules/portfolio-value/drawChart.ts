import * as Plot from "@observablehq/plot";
import { RenderContext, Renderer } from "./renderer";

import data from "./response.json";
import { eachDayOfInterval, subDays } from "date-fns";

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

  console.log(mappedData);

  const plot = Plot.areaY(mappedData, { x: "date", y: "value" }).plot();

  return plot;
}
