// src/components/visualizations/InteractiveIncidentMap.js
import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import useIncidentMapData from "../../hooks/useIncidentMapData";
import IncidentTooltip from "../components/ui/IncidentTooltip";
import IncidentSidebar from "../components/ui/IncidentSidebar";

const InteractiveIncidentMap = () => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const { baseGeo, incidents } = useIncidentMapData();

  useEffect(() => {
    if (!baseGeo || !incidents) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const projection = d3.geoNaturalEarth1().fitSize([width, height], baseGeo);
    const path = d3.geoPath().projection(projection);

    // Draw map base
    svg
      .append("g")
      .selectAll("path")
      .data(baseGeo.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#e0e0e0")
      .attr("stroke", "#999");

    // Draw incident dots
    svg
      .append("g")
      .selectAll("circle")
      .data(incidents)
      .join("circle")
      .attr("cx", (d) => projection([d.lon, d.lat])[0])
      .attr("cy", (d) => projection([d.lon, d.lat])[1])
      .attr("r", 3)
      .attr("fill", "#0077cc")
      .on("mouseover", (event, d) => {
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: `${d.country} (${d.date}) - ${d.actor}`,
        });
      })
      .on("mouseout", () => setTooltip(null))
      .on("click", (_, d) => setSelectedIncident(d));
  }, [baseGeo, incidents]);

  return (
    <div className="relative w-full h-[600px]">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && <IncidentTooltip {...tooltip} />}
      {selectedIncident && (
        <IncidentSidebar
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
};

export default InteractiveIncidentMap;
