import * as d3 from "d3";
import { ProcessFileSettings } from "../processFile";

export type PortfolioTreemapNode = {
  symbol: string;
  market_value: number;
  market_price: number;
  open_price: number;
  children?: PortfolioTreemapNode[];
  percentage_of_total?: number;
  percentage_gross_profit?: number;
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
    d.data.percentage_of_total = (d!.value / root!.value) * 100;
  });
  root.each((d) => {
    d.data.percentage_gross_profit =
      ((d!.data.market_price - d!.data.open_price) / d!.data.open_price) * 100;
  });

  const minProfit = d3.min(
    root.leaves().map((x) => x.data.percentage_gross_profit || 0),
  );
  const maxProfit = d3.max(
    root.leaves().map((x) => x.data.percentage_gross_profit || 0),
  );

  const colorScale = d3
    .scaleDiverging()
    // The domain defines the input range: [min_value, central_value, max_value]
    // We want 0 to be the central point (where color transitions)
    .domain([Math.min(0, minProfit), 0, Math.max(0, maxProfit)])
    // The interpolator defines the color range.
    // d3.interpolateRdYlGn goes from Red (low) -> Yellow (mid) -> Green (high)
    .interpolator(d3.interpolateRdYlGn);

  d3.treemap<PortfolioTreemapNode>().size([width, height]).padding(4)(root);

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
    .style("fill", (d) => colorScale(d.data.percentage_gross_profit));

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
        .text(`${d.data.symbol} `);

      if (!settings.hideValue) {
        textElement
          .append("tspan")
          .attr("x", d.x0 + 5)
          .attr("dy", "1.2em")
          .text(`Value: ${d.value?.toFixed(2)} `);
      }

      textElement
        .append("tspan")
        .attr("x", d.x0 + 5)
        .attr("dy", "1.2em")
        .text(`${d.data!.percentage_of_total.toFixed(2)}% of total portfolio `);

      if (!settings.hideValue) {
        textElement
          .append("tspan")
          .attr("x", d.x0 + 5)
          .attr("dy", "1.2em")
          .text(`Gross profit or lose: ${d.value?.toFixed(2)} `);
      }

      textElement
        .append("tspan")
        .attr("x", d.x0 + 5)
        .attr("dy", "1.2em")
        .text(`${d.data!.percentage_gross_profit.toFixed(2)}% profit`);
    });

  return svg;
};
