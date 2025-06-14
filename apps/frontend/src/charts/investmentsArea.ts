import * as d3 from "d3";

export function drawInvestmentsArena(data: { date: Date; amount: number }[]) {
  console.log("drawInvestmentsArena called with data:", data);

  const width = 1600,
    height = 800,
    marginTop = 20,
    marginRight = 30,
    marginBottom = 30,
    marginLeft = 40;

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc(
    d3.extent(data, (d) => d.date),
    [marginLeft, width - marginRight],
  );

  console.log("domain", [0, d3.max(data, (d) => d.amount)]);
  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear(
    [0, d3.max(data, (d) => d.amount)],
    [height - marginBottom, marginTop],
  );

  // Declare the area generator.
  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0(y(0))
    .y1((d) => y(d.amount));

  // Append a path for the area (under the axes).
  svg.append("path").attr("fill", "steelblue").attr("d", area(data));

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    );

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1),
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Daily close ($)"),
    );

  return svg;
}
