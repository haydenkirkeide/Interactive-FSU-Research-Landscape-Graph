import * as d3 from "d3";

const FSU_GARNET = "#782F40";

export function drawGraph(svgElement, data) {
  const width = svgElement.clientWidth;
  const height = svgElement.clientHeight;

  const nodes = data.nodes.map(d => ({ ...d, id: String(d.id) }));
  const links = data.links.map(d => ({ ...d, source: String(d.source), target: String(d.target) }));

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  const g = svg.append("g");
  const tooltip = d3.select("#tooltip");

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(30))
    .force("charge", d3.forceManyBody().strength(-40))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05));

  const link = g.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

  // Bonus: tooltip
  const node = g.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 4)
    .attr("fill", FSU_GARNET)
    .call(drag(simulation))
    .on("mouseover", (event, d) => {
      const authors = d.authors ?? [];
      const shown = authors.slice(0, 5).join(", ") +
                    (authors.length > 5 ? `, +${authors.length - 5} more` : "");
      tooltip
        .html(
          `<strong>${esc(truncate(d.title ?? "Untitled", 100))}</strong><br/>` +
          `Year: ${d.year ?? "Unknown"}<br/>` +
          `Venue: ${esc(truncate(d.venue ?? "Unknown", 60))}<br/>` +
          `Authors: ${esc(truncate(shown || "Unknown", 120))}`
        )
        .style("opacity", 1);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top", (event.pageY - 36) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
  });

  // Zoom and pan
  const zoom = d3.zoom()
    .scaleExtent([0.05, 20])
    .on("zoom", event => g.attr("transform", event.transform));
  svg.call(zoom);

  // Zoom-to-fit
  let fitted = false;
  simulation.on("end", () => {
    if (fitted) return;
    fitted = true;
    const [x0, x1] = d3.extent(nodes, d => d.x);
    const [y0, y1] = d3.extent(nodes, d => d.y);
    const pad = 40;
    const scale = Math.min(
      (width - 2 * pad) / (x1 - x0 || 1),
      (height - 2 * pad) / (y1 - y0 || 1)
    );
    const tx = width / 2 - scale * (x0 + x1) / 2;
    const ty = height / 2 - scale * (y0 + y1) / 2;
    svg.transition().duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  });

  // Returned caller can stop the simulation on unmount
  return () => simulation.stop();
}

function drag(simulation) {
  return d3.drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

// Escape text before putting it in tooltip's HTML (titles may contain < or &)
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Truncate
function truncate(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}