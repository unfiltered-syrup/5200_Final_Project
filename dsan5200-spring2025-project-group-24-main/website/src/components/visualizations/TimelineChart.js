// src/components/visualizations/TimelineChart.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  useTheme, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import './TimelineChart.css';

const TimelineChart = ({ data, onEventClick }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const zoomRef = useRef();
  const [activeTypes, setActiveTypes] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedActor, setSelectedActor] = useState('All');

  const filteredActors = useMemo(() => {
    const regionFiltered = selectedRegion === 'All'
      ? data
      : data.filter(d => d.region === selectedRegion);
    return ['All', ...Array.from(new Set(regionFiltered.map(d => d.actor_type))).filter(Boolean).sort()];
  }, [data, selectedRegion]);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Enhanced color palette with better contrast and visibility
  const colorMap = isDarkMode
  ? {
      "Shock Event": "#64B5F6",        // Light blue
      "Foreign Military": "#90A4AE",   // Light grey
      "Shock Event + Foreign Military": "#81D4FA", // Lighter blue
      "Casualty": "#4FC3F7",           // Sky blue
      "Disruption": "#80CBC4",         // Light teal
      "Casualty + Disruption": "#4DB6AC" // Teal
    }
  : {
      "Shock Event": "#1976D2",        // Medium blue
      "Foreign Military": "#546E7A",   // Blue-grey
      "Shock Event + Foreign Military": "#0288D1", // Darker blue
      "Casualty": "#0097A7",           // Cyan
      "Disruption": "#00796B",         // Teal
      "Casualty + Disruption": "#00695C" // Dark teal
    };

  const colorScale = d3.scaleOrdinal()
    .domain(Object.keys(colorMap))
    .range(Object.values(colorMap));

  // Extract timeline types for toggle buttons
  const timelineTypes = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Array.from(new Set(data.map(d => d.timeline_type))).sort();
  }, [data]);

  // Initialize active types on first render
  useEffect(() => {
    if (timelineTypes.length > 0 && activeTypes.length === 0) {
      setActiveTypes(timelineTypes);
    }
  }, [timelineTypes, activeTypes]);

  // Create tooltip div on component mount
  useEffect(() => {
    // Create a tooltip div that will stay in the DOM
    tooltipRef.current = d3.select('body')
      .append('div')
      .attr('class', 'timeline-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', isDarkMode ? '#333' : 'white')
      .style('color', isDarkMode ? 'white' : 'black')
      .style('border', `1px solid ${isDarkMode ? '#555' : '#ddd'}`)
      .style('border-radius', '4px')
      .style('padding', '10px')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.1)')
      .style('z-index', 1000);

    // Clean up tooltip on unmount
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
      }
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Define margins - increased left margin for y-axis labels
    const margin = { top: 70, right: 30, bottom: 65, left: 70 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    // Create a clip path to ensure elements stay within bounds
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-area-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Ensure proper date parsing and sorting
    const parsedData = data.map(d => ({
      ...d,
      date: d.date instanceof Date ? d.date : new Date(d.date),
      fatalities: +d.fatalities || 0
    })).sort((a, b) => a.date - b.date);

    // Filter data based on user selections
    const filteredData = parsedData.filter(d =>
      activeTypes.includes(d.timeline_type) &&
      (selectedRegion === 'All' || d.region === selectedRegion) &&
      (selectedActor === 'All' || d.actor_type === selectedActor)
    );

    // If no data matches the filters, show a message
    if (filteredData.length === 0) {
      container.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', theme.palette.text.secondary)
        .text('No data matches the selected filters');
      return;
    }

    // Ensure the x domain covers the full date range of the dataset,
    // not just the filtered data, to avoid jumps when changing filters
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([0, width])
      .nice();

    // Add padding to the y domain for better visualization
    const yMax = d3.max(filteredData, d => d.fatalities);
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Add 10% padding at the top
      .nice()
      .range([height, 0]);

    // Create a group for the clipped content
    const chartArea = container.append('g')
      .attr('clip-path', 'url(#chart-area-clip)');

    // Add x-axis with ticks
    const xAxisGroup = container.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`);
      
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(2))
      .tickFormat(d3.timeFormat('%Y'));
      
    xAxisGroup.call(xAxis);

    // Improve x-axis labels readability
    xAxisGroup.selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Add y-axis with grid lines
    const yAxisGroup = container.append('g')
      .attr('class', 'y-axis');
      
    const yAxis = d3.axisLeft(yScale);
    yAxisGroup.call(yAxis);

    // Add y-axis grid lines for better readability
    yAxisGroup.selectAll('g.tick')
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('stroke', theme.palette.divider)
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-width', 0.5);

    // Add axis labels
    container.append('text')
      .attr('transform', `translate(${width / 2}, ${height + 60})`)
      .style('text-anchor', 'middle')
      .style('fill', theme.palette.text.secondary)
      .text('Year');

    container.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)  // Increased negative value to move left
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .style('fill', theme.palette.text.secondary)
      .text('Fatalities');

    // Create a separate line generator for each type to handle gaps better
    const grouped = d3.groups(filteredData, d => d.timeline_type);

    // Create a group for each event type
    const eventGroups = chartArea.selectAll('.event-group')
      .data(grouped)
      .enter()
      .append('g')
      .attr('class', d => `event-group event-${d[0].replace(/\s+/g, '-').toLowerCase()}`);

    // Draw lines with increased stroke width
    eventGroups.append('path')
      .attr('fill', 'none')
      .attr('stroke', ([key]) => colorScale(key))
      .attr('stroke-width', 3)
      .attr('class', d => `line-group ${activeTypes.includes(d[0]) ? 'active' : 'inactive'}`)
      .attr('d', ([, values]) => {
        return d3.line()
          .x(d => xScale(d.date))
          .y(d => yScale(d.fatalities))
          .curve(d3.curveMonotoneX) // Use monotone curve for smoother lines
          (values.sort((a, b) => a.date - b.date));
      })
      .style('opacity', d => activeTypes.includes(d[0]) ? 0.9 : 0.3) // Adjusted opacity
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 5)
          .style('opacity', 1);
      })
      .on('mouseout', function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .style('opacity', activeTypes.includes(d[0]) ? 0.9 : 0.3);
      });

    // Add dots for each data point with improved visibility
    eventGroups.each(function([groupKey, values]) {
      d3.select(this)
        .selectAll('.dot')
        .data(values)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.fatalities))
        .attr('r', 4) // Dot size
        .attr('fill', colorScale(groupKey))
        .attr('stroke', isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)') // Add subtle stroke
        .attr('stroke-width', 1.5)
        .style('opacity', activeTypes.includes(groupKey) ? 0.9 : 0.3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Prevent bubbling to avoid conflicts
          event.stopPropagation();
          
          // Enlarge the dot on hover
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 9)
            .style('opacity', 1);
            
          // Show tooltip with more detailed information
          const dateStr = d.date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          
          tooltipRef.current
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`)
            .html(
              `<div style="font-weight:bold; color:${colorScale(groupKey)}; margin-bottom:4px;">
                ${groupKey}
              </div>
              <div style="margin-bottom:3px;"><b>Date:</b> ${dateStr}</div>
              <div style="margin-bottom:3px;"><b>Fatalities:</b> ${d.fatalities}</div>
              <div style="margin-bottom:3px;"><b>Region:</b> ${d.region || 'N/A'}</div>
              <div><b>Description:</b> ${d.description || 'No description available'}</div>`
            )
            .transition()
            .duration(200)
            .style('opacity', 0.9);
        })
        .on('mouseout', function() {
          // Restore the dot size on mouseout
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4) // Reset to original size
            .style('opacity', activeTypes.includes(groupKey) ? 0.9 : 0.3);
            
          // Hide tooltip
          tooltipRef.current
            .transition()
            .duration(500)
            .style('opacity', 0);
        })
    });

    // Zoom behavior with improved handling
    const zoom = d3.zoom()
      .scaleExtent([1, 30])  // Increased from 20 to 30 for deeper zoom
      .extent([[0, 0], [width, height]])
      .translateExtent([[0, -Infinity], [width, Infinity]])  // Allow vertical panning beyond chart
      .on('zoom', (event) => {
        const transform = event.transform;
        const newXScale = transform.rescaleX(xScale);
        
        // Update x-axis
        xAxisGroup.call(
          d3.axisBottom(newXScale)
            .ticks(d3.timeYear.every(2))
            .tickFormat(d3.timeFormat('%Y'))
        );
          
        // Improve readability of rotated tick labels
        xAxisGroup.selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-45)');

        // Update lines
        chartArea.selectAll('.line-group')
          .attr('d', function() {
            const groupKey = d3.select(this.parentNode).datum()[0];
            const values = d3.select(this.parentNode).datum()[1];
            return d3.line()
              .x(d => newXScale(d.date))
              .y(d => yScale(d.fatalities))
              .curve(d3.curveMonotoneX)
              (values.sort((a, b) => a.date - b.date));
          });

        // Update dots
        chartArea.selectAll('.dot')
          .attr('cx', d => newXScale(d.date))
          .attr('cy', d => yScale(d.fatalities));
      });

    zoomRef.current = zoom;
    
    // Apply zoom to the container element only
    svg.call(zoom)
      .on("wheel", event => {
        event.preventDefault();  // Prevent default scrolling
      });

    // Add zoom instructions
    svg.append('text')
      .attr('x', (width - margin.right))
      .attr('y', height + margin.top + 62)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', theme.palette.text.secondary)
      .text('Scroll to zoom, drag to pan');

  }, [data, activeTypes, selectedRegion, selectedActor, colorScale, theme, isDarkMode]);

  // Handle toggling event types
  const handleTypeToggle = (event, newTypes) => {
    // Prevent deselecting all types
    if (newTypes.length === 0) return;
    setActiveTypes(newTypes);
  };

  return (
    <div className="timeline-container">
      <Box 
        sx={{ 
          width: '100%',
          mb: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Event Type Toggles */}
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, mb: 5, mt: 2}}
        >
          Security Incidents Over Time: Fatalities and Event Types (1997-2024)
        </Typography>
        
        <ToggleButtonGroup
          value={activeTypes}
          onChange={handleTypeToggle}
          aria-label="event type visibility"
          sx={{
            width: '90%',
            maxWidth: '1200px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            '& .MuiToggleButtonGroup-grouped': {
              m: 0,
              border: 0,
              borderRight: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
              '&:last-of-type': {
                borderRight: 0,
              },
            },
          }}
        >
          {timelineTypes.map(type => (
            <ToggleButton
              key={type}
              value={type}
              sx={{
                flex: 1,
                py: 1.2,
                px: 2,
                color: activeTypes.includes(type) ? '#fff' : colorMap[type],
                backgroundColor: activeTypes.includes(type) ? colorMap[type] : 'transparent',
                '&:hover': {
                  backgroundColor: activeTypes.includes(type)
                    ? colorMap[type]
                    : `${colorMap[type]}22`, // Add transparency to hover color
                },
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {type.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        
        {/* Region and Actor Type Filters */}
        <Box 
          sx={{ 
            display: 'flex', 
            width: '100%', 
            maxWidth: '1200px', 
            mt: 5,
            gap: 2,
            flexWrap: { xs: 'wrap', md: 'nowrap' }
          }}
        >
          <FormControl 
            fullWidth 
            size="small"
            sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}
          >
            <InputLabel id="region-select-label">Region</InputLabel>
            <Select
              labelId="region-select-label"
              id="region-select"
              value={selectedRegion}
              label="Region"
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <MenuItem value="All">All Regions</MenuItem>
              {Array.from(new Set(data.map(d => d.region))).filter(Boolean).sort().map(region => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl 
            fullWidth 
            size="small"
            sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}
          >
            <InputLabel id="actor-select-label">Actor Type</InputLabel>
            <Select
              labelId="actor-select-label"
              id="actor-select"
              value={selectedActor}
              label="Actor Type"
              onChange={(e) => setSelectedActor(e.target.value)}
            >
              {filteredActors.map(actor => (
                <MenuItem key={actor} value={actor}>{actor}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <svg ref={svgRef} className="timeline-svg"></svg>
    </div>
  );
};

export default TimelineChart;