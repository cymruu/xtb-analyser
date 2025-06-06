import * as d3 from "d3";
import { ProcessFileSettings } from "../processFile";

export type PortfolioTreemapNode = {
  symbol: string;
  market_value: number;
  children?: PortfolioTreemapNode[];
  percentage?: number;
};

export const portfolioSummaryPieChart = (
  data: PortfolioTreemapNode,
  settings: ProcessFileSettings,
) => {
  const width = 2 * 640;
  const height = 2 * 400;

  // Create the SVG container.
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const root = d3
    .hierarchy(data)
    .sum(function (d) {
      return d.market_value;
    })
    .sort((a, b) => d3.descending(a.data.market_value, b.data.market_value));

  root.each((d) => {
    d.data.percentage = (d!.value / root!.value) * 100;
  });

  d3.treemap<PortfolioTreemapNode>().size([width, height]).padding(4)(root);
  const color = d3.scaleOrdinal(
    root!.children.map((d) => d.data.symbol),
    d3.schemeCategory10,
  );

  const cell = svg.selectAll("g").data(root.leaves()).enter().append("g");

  cell
    .append("rect")
    .attr("x", function (d) {
      return d.x0;
    })
    .attr("y", function (d) {
      return d.y0;
    })
    .attr("width", function (d) {
      return d.x1 - d.x0;
    })
    .attr("height", function (d) {
      return d.y1 - d.y0;
    })
    .style("stroke", "black")
    .style("fill", (d) => color(d.data.symbol));

  cell
    .append("text")
    .attr("x", function (d) {
      return d.x0 + 10;
    })
    .attr("y", function (d) {
      return d.y0 + 15;
    })
    .attr("fill", "black")
    .each(function (d) {
      const textElement = d3.select(this);

      textElement
        .append("tspan")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("x", d.x0 + 5)
        .attr("dy", "0.3em")
        .text(`${d.data.symbol}`);

      if (!settings.hideValue) {
        textElement
          .append("tspan")
          .attr("x", d.x0 + 5)
          .attr("dy", "1.2em")
          .text(`Value: ${d.value?.toFixed(2)}`);
      }

      // Line 3: percentage
      textElement
        .append("tspan")
        .attr("x", d.x0 + 5)
        .attr("dy", "1.2em")
        .text(`${d.data!.percentage.toFixed(2)}%`);
    });

  return svg;
};
