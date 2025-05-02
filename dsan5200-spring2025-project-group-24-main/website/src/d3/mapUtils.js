// helper functions like projection setup, color scales, etc. - for projections, topojson helpers

// TODO: Update after EDA

import * as d3 from 'd3';

// Create and return a responsive geoPath with a Mercator projection
export const getGeoPath = (width, height, scale = 120) => {
  const projection = d3.geoMercator()
    .scale(scale)
    .translate([width / 2, height / 1.5]);

  return d3.geoPath().projection(projection);
};

// Optional: Match TopoJSON ISO country ID with incident count map
export const getColorScale = (incidentCounts) => {
  const maxCount = d3.max(Array.from(incidentCounts.values()));
  return d3.scaleSequential(d3.interpolateReds).domain([0, maxCount]);
};
