import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Box,
  Typography,
  useTheme,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';

const TopCountriesBarChart = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const theme = useTheme();

  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState(['killed', 'wounded', 'kidnapped']);
  const [selectedYear, setSelectedYear] = useState('All');
  const [topN, setTopN] = useState(10);

  const isDark = theme.palette.mode === 'dark';

  const colorPalette = {
    killed: isDark ? '#6CA0DC' : '#08306B',            // Killed → blue (matches timeline)
    wounded: isDark ? '#88A2BF' : '#2171B5',           // Wounded → medium blue
    kidnapped: isDark ? '#92BCEA' : '#6BAED6',         // Kidnapped → light blue
  };

  const years = useMemo(() => {
    const yearSet = new Set();
    data?.forEach(d => {
      if (d['Year']) yearSet.add(d['Year']);
    });
    return ['All', ...Array.from(yearSet).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    return data?.filter(d =>
      (selectedYear === 'All' || d['Year'] === selectedYear)
    ) || [];
  }, [data, selectedYear]);

  useEffect(() => {
    if (!filteredData || filteredData.length === 0 || visibleKeys.length === 0) return;
    if (!tooltipRef.current) tooltipRef.current = createTooltip(theme);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const countryCounts = d3.rollups(
      filteredData,
      v => v.length,
      d => d['Country']
    )
      .filter(d => d[0])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(d => d[0]);

    const metrics = filteredData
      .filter(d => countryCounts.includes(d['Country']))
      .reduce((acc, d) => {
        const c = d['Country'];
        if (!acc[c]) acc[c] = { country: c, killed: 0, wounded: 0, kidnapped: 0 };
        acc[c].killed += +d['Total killed'] || 0;
        acc[c].wounded += +d['Total wounded'] || 0;
        acc[c].kidnapped += +d['Total kidnapped'] || 0;
        return acc;
      }, {});

    const dataset = countryCounts.map(c => metrics[c]);

    const stack = d3.stack().keys(visibleKeys);
    const series = stack(dataset);

    const containerWidth = svgRef.current.parentNode.clientWidth;
    const width = containerWidth;
    const height = 40 * dataset.length + 100;
    const margin = { top: 30, right: 20, bottom: 50, left: 160 };

    const xMax = d3.max(dataset, d => visibleKeys.reduce((sum, k) => sum + (d[k] || 0), 0)) || 1;
    const x = d3.scaleLinear()
      .domain([0, xMax])
      .range([margin.left, width - margin.right])
      .nice();

    const y = d3.scaleBand()
      .domain(countryCounts)
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    const color = d3.scaleOrdinal()
      .domain(visibleKeys)
      .range(visibleKeys.map(key => colorPalette[key]));

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const bars = svg.append('g')
      .selectAll('g')
      .data(series, d => d.key)
      .join('g')
      .attr('fill', d => color(d.key));

    bars.selectAll('rect')
      .data(d => d)
      .join(
        enter => enter.append('rect')
          .attr('x', d => x(d[0]))
          .attr('y', d => y(d.data.country))
          .attr('width', d => x(d[1]) - x(d[0]))
          .attr('height', y.bandwidth())
          .attr('opacity', 0)
          .transition()
          .duration(500)
          .attr('opacity', 1),
        update => update.transition().duration(500)
          .attr('x', d => x(d[0]))
          .attr('width', d => x(d[1]) - x(d[0]))
          .attr('y', d => y(d.data.country))
          .attr('height', y.bandwidth()),
        exit => exit.transition().duration(300).attr('opacity', 0).remove()
      )
      .on('mouseover', (event, d) => {
        const info = d.data;
        setHoveredCountry(info);
        showTooltip(
          tooltipRef.current,
          event,
          `<strong>${info.country}</strong><br/>
           Killed: ${info.killed}<br/>
           Wounded: ${info.wounded}<br/>
           Kidnapped: ${info.kidnapped}`
        );
        d3.select(event.currentTarget).attr('opacity', 0.7);
      })
      .on('mouseout', (event) => {
        hideTooltip(tooltipRef.current);
        setHoveredCountry(null);
        d3.select(event.currentTarget).attr('opacity', 1);
      });

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('fill', theme.palette.text.primary)
      .style('font-size', '12px');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', theme.palette.text.primary)
      .style('font-size', '12px');

    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top - 20})`);
    series.map(s => s.key).forEach((key, i) => {
      const g = legend.append('g').attr('transform', `translate(${i * 150},0)`);
      g.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(key));
      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(key.charAt(0).toUpperCase() + key.slice(1))
        .style('fill', theme.palette.text.primary)
        .style('font-size', '12px');
    });

  }, [filteredData, theme, visibleKeys, topN]);

  return (
    <Box mt={6} mb={5}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Top {topN} Countries by Incident Impact
      </Typography>

      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <FormControl size="small">
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={e => setSelectedYear(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {years.map(year => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Top N</InputLabel>
          <Select
            value={topN}
            label="Top N"
            onChange={e => setTopN(Number(e.target.value))}
            sx={{ minWidth: 120 }}
          >
            {[10, 20, 50].map(n => (
              <MenuItem key={n} value={n}>Top {n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={visibleKeys}
          onChange={(e, newKeys) => {
            if (newKeys.length > 0) setVisibleKeys(newKeys);
          }}
          aria-label="metrics"
          sx={{ ml: 'auto', mb: 0 }}
        >
          {['killed', 'wounded', 'kidnapped'].map(key => (
            <ToggleButton
              key={key}
              value={key}
              sx={{
                color: visibleKeys.includes(key) ? '#fff' : colorPalette[key],
                backgroundColor: visibleKeys.includes(key) ? colorPalette[key] : 'transparent',
                border: `1px solid ${colorPalette[key]}`,
                '&:hover': {
                  backgroundColor: visibleKeys.includes(key)
                    ? colorPalette[key]
                    : `${colorPalette[key]}22`,
                },
              }}
            >
              {key.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
    </Box>
  );
};

export default TopCountriesBarChart;