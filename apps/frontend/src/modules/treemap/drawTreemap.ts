import * as d3 from "d3";
import { DrawTreemapSettings } from "./main";
import { RenderContext, Renderer } from "./renderer";

const formatNumber = d3.format(".2f");

const createMakeTileLabels =
  ({ hideValue }: DrawTreemapSettings) =>
  (d) => {
    return [
      d.data.name,
      `${formatNumber(d.data.weight * 100)}% of the account`,
      `${formatNumber(d.data.performance * 100)}% profit`,
      ...(!hideValue
        ? [
            `Value: ${formatNumber(d.data.value)}`,
            `${formatNumber(d.data.grossProfit)} gross profit`,
          ]
        : []),
    ];
  };

export function drawTreemap(
  renderContext: RenderContext,
  renderer: Renderer,
  settings: DrawTreemapSettings,
) {
  console.log("drawTreemap called with data:", renderContext);

  const width = 1600,
    height = 800;

  const root = d3
    .hierarchy(renderContext.render)
    .sum((d) => d.value)
    .sort((a, b) => d3.descending(a.value, b.value));

  const color = d3.scaleOrdinal(
    root.children.map((d) => d.name),
    d3.schemeTableau10,
  );

  const fontSize = d3.scaleSqrt().range([15, 50]); // range of font sizes

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

  const treemap = d3
    .treemap()
    .tile(d3.treemapBinary)
    .size([width, height])
    .paddingTop(28)
    .paddingRight(5)
    .paddingInner(2)
    .round(true)(root);

  fontSize.domain([
    d3.min(treemap.descendants(), (d) => (d.x1 - d.x0) * (d.y1 - d.y0)),
    d3.max(treemap.descendants(), (d) => (d.x1 - d.x0) * (d.y1 - d.y0)),
  ]);

  const makeTileLabels = createMakeTileLabels(settings);

  const colorScale = d3
    .scaleDiverging()
    // The domain defines the input range: [min_value, central_value, max_value]
    // We want 0 to be the central point (where color transitions)
    .domain([-0.3, 0, 0.3])
    .interpolator(d3.interpolateRdYlGn);

  // Add a cell for each leaf of the hierarchy.
  const leaf = svg
    .selectAll("g")
    .data(treemap.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  // Append a tooltip.
  leaf.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .reverse()
        .map((d) => d.data.name)
        .join(" > ")}`,
  );

  // Append a color rectangle.
  leaf
    .append("rect")
    .attr("id", (d) => `rect-${d.data.name}`)
    .attr("fill", (d) => {
      return colorScale(d.data.performance || 0);
    })
    .attr("fill-opacity", 0.6)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf
    .append("text")
    .selectAll("tspan")
    .data(makeTileLabels)
    .join("tspan")
    .attr("x", 3)
    .attr("y", (d, i) => `${1.1 + i * 1}em`)
    .attr("fill-opacity", (d, i) => (i === 0 ? null : 0.7))
    .style("font", function (d) {
      const parentData = d3.select(this.parentNode).datum();

      return `${fontSize((parentData.x1 - parentData.x0) * (parentData.y1 - parentData.y0))}px sans-serif`;
    })
    .text((d) => {
      return d.toString();
    });

  // Add title
  svg
    .selectAll("titles")
    .data(
      root.data.name === "root"
        ? root.descendants().filter(function (d) {
            return d.depth == 1;
          })
        : [],
    )
    .enter()
    .append("text")
    .attr("x", function (d) {
      return d.x0;
    })
    .attr("y", function (d) {
      return d.y0 + 21;
    })
    .text(function (d) {
      return d.data.name;
    })
    .attr("font-size", "19px")
    .attr("fill", function (d) {
      return color(d.data.name);
    })
    .style("cursor", "pointer")
    .on("click", function (e, d) {
      console.log("title clicked", { e, d });
      renderer.setRenderContext({ root: renderContext.root, render: d.data });
      renderer.render();
    });

  svg
    .selectAll(".back-button") // Use a specific class for selection
    .data(root.data.name !== "root" ? [root] : []) // Bind data only if not at root
    .join((enter) =>
      enter
        .append("text")
        .attr("class", "back-button")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0 + 21)
        .text("← Back")
        .attr("font-size", "18px")
        .style("cursor", "pointer")
        .on("click", function (e, d) {
          console.log("Back button clicked", { e, d });
          renderer.setRenderContext({
            root: renderContext.root,
            render: renderContext.root,
          });
          renderer.render();
        }),
    );

  return svg;
}
