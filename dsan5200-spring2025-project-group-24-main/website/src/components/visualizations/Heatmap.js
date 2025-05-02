// src/components/visualizations/Heatmap.js

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Typography, useTheme } from '@mui/material';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';

const Heatmap = ({ data }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltip = useRef();
  const theme = useTheme();

  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [worldData, setWorldData] = useState(null);

  // Load the TopoJSON from public/world-110m.json
  useEffect(() => {
    fetch('/world-110m.json')
      .then(res => res.json())
      .then(setWorldData)
      .catch(err => console.error("Error loading map data:", err));
  }, []);

  // Responsiveness
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        setDimensions({ width: newWidth, height: newWidth * 0.5 });
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!data?.length || !worldData) return;

    tooltip.current = createTooltip(theme);

    // 1) Aggregate counts by country
    const counts = d3.rollups(
      data,
      v => v.length,
      d => d.country  // adjust to your exact field name
    );
    const countMap = new Map(counts);

    // 2) Color scale
    const maxCount = d3.max(counts, d => d[1]);
    const color = d3.scaleSequential(d3.interpolateReds).domain([0, maxCount]);

    // 3) Projection & path
    const { width, height } = dimensions;
    const margin = { top: 30, right: 80, bottom: 30, left: 60 };
    const projection = d3.geoMercator()
      .scale((width / 640) * 100)
      .translate([width / 2, height / 1.5]);
    const path = d3.geoPath(projection);

    // 4) Draw
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    svg.append('g')
      .selectAll('path')
      .data(countries)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const c = countMap.get(d.properties.name) || 0;
        return color(c);
      })
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        const c = countMap.get(d.properties.name) || 0;
        showTooltip(
          tooltip.current,
          event,
          `<strong>${d.properties.name}</strong><br/>${c} incidents`
        );
      })
      .on('mouseout', () => hideTooltip(tooltip.current));

    // 5) Legend
    const legendWidth = 200;
    const legendHeight = 8;
    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, legendWidth]);

    const legendData = d3.range(0, maxCount, maxCount / legendWidth);

    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right - legendWidth}, ${height - margin.bottom + 15})`);

    legend.selectAll('rect')
      .data(legendData)
      .join('rect')
      .attr('x', d => legendScale(d))
      .attr('width', 1)
      .attr('height', legendHeight)
      .attr('fill', d => color(d));

    legend.append('text')
      .attr('x', 0)
      .attr('y', -4)
      .text('Incidents')
      .style('fill', theme.palette.text.primary)
      .style('font-size', '12px');

  }, [data, worldData, dimensions, theme]);

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Global Incident Hotspots
      </Typography>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
    </Box>
  );
};

export default Heatmap;
