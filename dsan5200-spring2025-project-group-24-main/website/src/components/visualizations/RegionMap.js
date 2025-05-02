import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Typography, useTheme } from '@mui/material';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';

const RegionMap = ({ data, filters, setSelectedIncident, clearSelectedIncident, setFilters }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const mapGroupRef = useRef();
  const tooltip = useRef();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Define motive color scale
  const motiveColor = d3.scaleOrdinal()
    .domain(['Political', 'Economic', 'Symbolic', 'Incidental', 'Unknown'])
    .range(isDark
      ? ['#90CAF9', '#81D4FA', '#B39DDB', '#E0E0E0', '#BDBDBD']
      : ['#0D47A1', '#1976D2', '#64B5F6', '#B3E5FC', '#90A4AE']);

  const [worldData, setWorldData] = useState(null);
  const [dims, setDims] = useState({ width: 800, height: 520 });
  const [countryStats, setCountryStats] = useState({ total: 0, avg: 0 });
  // ✅ 1. Track Multiple Selections using arrays
  const [selectedDots, setSelectedDots] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [incidentDetails, setIncidentDetails] = useState(null);

  let zoom;
  let svg;

  // Load the topojson world file.
  useEffect(() => {
    fetch('/world-110m.json')
      .then(res => res.json())
      .then(setWorldData)
      .catch(console.error);
  }, []);

  // Listen for external events to clear selection
  useEffect(() => {
    const handleClear = () => {
      setSelectedCountries([]);
      setCountryStats({ total: 0, avg: 0 });
      setSelectedDots([]);
      setIncidentDetails(null);

      // Reset styles
      d3.select(svgRef.current).selectAll('.country-path')
        .attr('stroke', theme.palette.divider)
        .attr('stroke-width', 0.5);

      d3.select(svgRef.current).selectAll('.incident-dot')
        .classed('selected-dot', false)
        .attr('r', 4)
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
    };

    document.addEventListener('clear-region-selection', handleClear);
    return () => document.removeEventListener('clear-region-selection', handleClear);
  }, [theme]);

  // Handle container resize with the new aspect ratio
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      // Changed aspect ratio from 0.5 to 0.65 to make the map taller
      setDims({ width: w, height: w * 0.65 });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Main effect: render map, interactive elements, legends, and attach zoom behavior.
  useEffect(() => {
    if (!worldData || !data.length) return;
    tooltip.current = createTooltip(theme);

    // Prepare incident counts per country for coloring.
    const counts = d3.rollups(data, v => v.length, d => d['Country']);
    const countMap = new Map(counts);
    const maxCount = d3.max(counts, d => d[1]);

    const { width, height } = dims;
    const margin = { top: 30, right: 20, bottom: 30, left: 20 };
    const projection = d3.geoMercator()
      .scale((width / 640) * 100)
      .translate([width / 2, height / 1.5]);
    const path = d3.geoPath(projection);

    const colorScale = d3.scaleQuantize()
      .domain([0, maxCount || 1])
      .range(isDark
        ? ['#263238', '#37474F', '#455A64', '#546E7A', '#607D8B', '#78909C', '#90A4AE']
        : ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1565C0']);

    // Initialize svg.
    svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('cursor', 'grab');

    // Clear previous elements.
    svg.selectAll('*').remove();

    // Add an invisible background rectangle to capture zoom events.
    const background = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    // Create a group to hold the map elements.
    const mapGroup = svg.append('g').attr('ref', mapGroupRef);

    // Attach a custom dblclick handler to reset zoom.
    svg.on('dblclick', function (event) {
      event.stopPropagation();
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      // Optionally reapply selected highlighting
      selectedCountries.forEach(country => {
        mapGroup.selectAll('.country-path')
          .filter(d => d.properties.name === country)
          .attr('stroke', theme.palette.custom.chartAccent)
          .attr('stroke-width', 2);
      });
    });

    // Draw countries.
    const countries = topojson.feature(worldData, worldData.objects.countries).features;
    mapGroup.selectAll('.country-path')
      .data(countries)
      .join('path')
      .attr('class', 'country-path')
      .attr('d', path)
      .attr('fill', d => {
        const c = countMap.get(d.properties.name) || 0;
        return c === 0 ? (isDark ? '#2b2b2b' : '#f0f0f0') : colorScale(c);
      })
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        const name = d.properties.name;
        const total = countMap.get(name) || 0;
        const years = d3.extent(data, v => +v['Year']);
        const avg = ((total) / (years[1] - years[0] + 1)).toFixed(1);
        showTooltip(
          tooltip.current,
          event,
          `<div style="padding: 8px;">
            <strong style="font-size: 14px; color: ${theme.palette.primary.main}">${name}</strong><br/>
            <div style="margin-top: 5px;">
              <strong>${total}</strong> total incidents<br/>
              <strong>${avg}</strong> incidents per year<br/>
              <span style="font-size: 12px; font-style: italic;">Click for more details</span>
            </div>
           </div>`
        );
        d3.select(event.currentTarget)
          .attr('stroke', theme.palette.primary.main)
          .attr('stroke-width', 1.5);
      })
      .on('mouseout', (event, d) => {
        const name = d.properties.name;
        const c = countMap.get(name) || 0;
        if (!selectedCountries.includes(name)) {
          d3.select(event.currentTarget)
            .attr('fill', c === 0 ? (isDark ? '#2b2b2b' : '#f0f0f0') : colorScale(c))
            .attr('stroke', theme.palette.divider)
            .attr('stroke-width', 0.5);
        }
        hideTooltip(tooltip.current);
      })
      // Country click handler.
      .on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        const name = d.properties.name;
        const isAlreadySelected = selectedCountries.includes(name);
        if (isAlreadySelected) {
          setSelectedCountries(prev => prev.filter(c => c !== name));
        } else {
          setSelectedCountries(prev => [...prev, name]);
        }
      });

    // Filter data based on filters.
    const filteredData = data.filter(d => {
      const year = +d['Year'];
      const timestamp = new Date(d['Date'] || d['date'] || d['Incident Date']);
      const inYear = !filters.year.length || filters.year.includes(year);
      const inMotive = !filters.motive.length || filters.motive.includes(d['Motive']);
      const inType = !filters.type.length || filters.type.includes(d['Means of attack']);
      const inActor = !filters.actor.length || filters.actor.includes(d['Actor type']);
      const inDateRange = !filters.dateRange?.length ||
        (timestamp >= new Date(filters.dateRange[0]) && timestamp <= new Date(filters.dateRange[1]));
      return inYear && inMotive && inType && inActor && inDateRange;
    });

    // Draw incident dots.
    mapGroup.selectAll('.incident-dot')
      .data(filteredData)
      .join('circle')
      .attr('class', 'incident-dot')
      .attr('cx', d => projection([+d.Longitude, +d.Latitude])[0])
      .attr('cy', d => projection([+d.Longitude, +d.Latitude])[1])
      .attr('r', 4)
      .attr('fill', d => {
        const baseColor = motiveColor(d['Motive'] || 'Unknown');
        return baseColor;
      })
      .attr('fill-opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.8)
      .on('mouseover', (event, d) => {
        const motive = d['Motive'] || 'Unknown';
        const actor = d['ActorType'] || 'Unspecified';
        const color = motiveColor(motive);
        const date = d['Date'] || d['Incident Date'] || 'Unknown date';
        showTooltip(tooltip.current, event, `
          <div style="padding: 8px; border-left: 4px solid ${color}; background-color: ${isDark ? '#424242' : '#FFFFFF'};">
            <strong style="font-size: 14px; color: ${color}">${d['Country']}</strong><br/>
            <div style="margin-top: 5px; font-size: 13px;">
              <strong>Date:</strong> ${date}<br/>
              <strong>Motive:</strong> ${motive}<br/>
              <strong>Actor:</strong> ${actor}<br/>
              <strong>Means:</strong> ${d['Means of attack'] || 'Unknown'}<br/>
              <span style="font-size: 12px; font-style: italic;">Click for details</span>
            </div>
          </div>
        `);
        d3.select(event.currentTarget)
          .attr('r', 6)
          .attr('fill-opacity', 1)
          .attr('stroke', theme.palette.primary.main)
          .attr('stroke-width', 1.5);
      })
      .on('mouseout', (event) => {
        if (!event.currentTarget.classList.contains('selected-dot')) {
          d3.select(event.currentTarget)
            .attr('r', 4)
            .attr('fill-opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
        }
        hideTooltip(tooltip.current);
      })
      // Incident dot click handler.
      .on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        const isAlreadySelected = selectedDots.some(dot =>
          dot.Latitude === d.Latitude && dot.Longitude === d.Longitude
        );
        if (isAlreadySelected) {
          setSelectedDots(prev => prev.filter(dot =>
            !(dot.Latitude === d.Latitude && dot.Longitude === d.Longitude)
          ));
        } else {
          setSelectedDots(prev => [...prev, d]);
          // Optional: zoom to dot.
          const [x, y] = projection([+d.Longitude, +d.Latitude]);
          svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(width / 2 - x * 3, height / 2 - y * 3).scale(3));
        }
      });

    // Setup zoom behavior and attach it to the background rectangle.
    zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', ({ transform }) => {
        mapGroup.attr('transform', transform);
      })
      .on('start', () => svg.style('cursor', 'grabbing'))
      .on('end', () => svg.style('cursor', 'grab'))
      .filter(event => !event.defaultPrevented);
    
    background.call(zoom)
      .on('dblclick.zoom', null)
      .on('click.zoom', null);

    // Legend for incident counts.
    const legendWidth = 200, legendHeight = 8;
    const legendX = width - margin.right - legendWidth;
    const legendY = height - margin.bottom + 10;
    const legendScale = d3.scaleLinear().domain([0, maxCount || 1]).range([0, legendWidth]);
    const legendData = d3.range(0, maxCount, maxCount / legendWidth);

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX},${legendY})`);
    legend.selectAll('rect')
      .data(legendData)
      .join('rect')
      .attr('x', d => legendScale(d))
      .attr('width', 1)
      .attr('height', legendHeight)
      .attr('fill', d => colorScale(d));

    legend.append('text')
      .attr('x', 0)
      .attr('y', -4)
      .text('Incidents')
      .style('fill', theme.palette.text.primary)
      .style('font-size', '16px');
      
    // Legend for motives.
    const motiveLegend = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom + 10})`);
    const motives = ['Political', 'Economic', 'Symbolic', 'Incidental', 'Unknown'];
    motives.forEach((motive, i) => {
      const x = i * 90;
      motiveLegend.append('circle')
        .attr('cx', x)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', motiveColor(motive))
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
      motiveLegend.append('text')
        .attr('x', x + 10)
        .attr('y', 4)
        .text(motive)
        .style('fill', theme.palette.text.primary)
        .style('font-size', '16px');
    });
  }, [worldData, data, dims, theme, filters, setSelectedIncident, clearSelectedIncident, selectedCountries, selectedDots]);

  return (
    <Box ref={containerRef} mt={6} mb={2}>
      <Typography variant="h4" gutterBottom>
        Where Are Incidents Happening?
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom sx={{ paddingBottom: 8 }}>
        Scroll to zoom, drag to pan, click a country or incident dot to view details. Double‑click to reset zoom. Click a selected element again to deselect it.
      </Typography>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />

      {/* Render detail cards for selected countries */}
      {selectedCountries.map((country) => {
        const total = data.filter(d => d.Country === country).length;
        const years = d3.extent(data, d => +d.Year);
        const avg = ((total) / (years[1] - years[0] + 1)).toFixed(1);
        return (
          <Box key={country} mt={2} sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            boxShadow: 1,
            borderLeft: `4px solid ${theme.palette.primary.main}`
          }}>
            <Typography variant="body1" fontWeight={600}>{country}</Typography>
            <Typography variant="body1">
              Total Incidents: <strong>{total}</strong>
            </Typography>
            <Typography variant="body1">
              Avg per Year: <strong>{avg}</strong>
            </Typography>
          </Box>
        );
      })}

      {/* Render detail cards for selected incidents */}
      {selectedDots.map((incident, i) => (
        <Box key={`${incident.Latitude}-${incident.Longitude}-${i}`} mt={2} sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          boxShadow: 1,
          borderLeft: `4px solid ${theme.palette.secondary.main}`
        }}>
          <Typography variant="body1" fontWeight={600}>Incident in {incident.Country}</Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            mt: 1
          }}>
            <Typography variant="body1">
              <strong>Date:</strong> {incident.Date || incident['Incident Date'] || 'Unknown date'}
            </Typography>
            <Typography variant="body1">
              <strong>Year:</strong> {incident.Year}
            </Typography>
            <Typography variant="body1">
              <strong>Motive:</strong> {incident.Motive || 'Unknown'}
            </Typography>
            <Typography variant="body1">
              <strong>Actor:</strong> {incident.ActorType || 'Unspecified'}
            </Typography>
            <Typography variant="body1">
              <strong>Means:</strong> {incident['Means of attack'] || 'Unknown'}
            </Typography>
            <Typography variant="body1">
              <strong>Location:</strong> {incident.Location || incident.City || 'Unknown location'}
            </Typography>
          </Box>
          {incident.Description && (
            <Box mt={1}>
              <Typography variant="body1">
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                {incident.Description}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default RegionMap;
