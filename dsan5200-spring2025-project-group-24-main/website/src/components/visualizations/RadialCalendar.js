import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './RadialCalendar.css';
import { getDayOfYear, getHolidayDays } from '../../d3/radialUtils';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Tooltip, IconButton, useTheme, useMediaQuery } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import getDataPath from '../../utils/getDataPath';

const RadialCalendar = ({ data, years }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [colorBy, setColorBy] = useState('severity');
  const [highlightEid, setHighlightEid] = useState(true);
  const [highlightRamadan, setHighlightRamadan] = useState(true);
  const [activeMotives, setActiveMotives] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [eidDays, setEidDays] = useState([]);
  const [ramadanDays, setRamadanDays] = useState([]);

  // Function to update dimensions
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    // Set a responsive height based on width for the visualization
    // For mobile, make it taller to ensure visibility
    const containerHeight = isMobile 
      ? Math.max(400, containerWidth) 
      : isTablet 
        ? Math.max(500, containerWidth * 0.9)
        : Math.max(600, containerWidth * 0.8);
    
    setDimensions({
      width: containerWidth,
      height: containerHeight
    });
  }, [isMobile, isTablet]);

  // Initialize dimensions and handle resize
  useEffect(() => {
    updateDimensions();
    
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  // Initialize activeMotives with all unique motives
  useEffect(() => {
    if (data && data.length > 0) {
      const uniqueMotives = Array.from(new Set(data.map(d => d.motive))).filter(Boolean);
      setActiveMotives(uniqueMotives);
    }
  }, [data]);

  // Use getDataPath to load holiday data dynamically
  useEffect(() => {
    // Get Eid and Ramadan days
    Promise.all([
      getHolidayDays('eid', getDataPath),
      getHolidayDays('ramadan', getDataPath)
    ]).then(([eid, ramadan]) => {
      console.log('Loaded Eid days:', eid);
      console.log('Loaded Ramadan days:', ramadan);
      setEidDays(eid);
      setRamadanDays(ramadan);
    });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || dimensions.width === 0) return;

    const { width, height } = dimensions;
    // Calculate responsive sizing
    const size = Math.min(width, height);
    const margin = isMobile ? 20 : 40;
    
    // Calculate a responsive radius based on available space
    const maxRadius = (size / 2) - margin;
    const minRadius = isMobile ? 40 : 80;

    const radiusScale = d3.scaleBand()
      .domain(years)
      .range([minRadius, maxRadius])
      .padding(0.2);

    const angleScale = d3.scaleLinear().domain([0, 365]).range([0, 2 * Math.PI]);
    const uniqueMotives = Array.from(new Set(data.map(d => d.motive))).filter(Boolean);

    const colorScales = {
      severity: d3.scaleSequential(d3.interpolateBlues).domain([0, 10]),
      motive: d3.scaleOrdinal(d3.schemeTableau10).domain(uniqueMotives)
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const g = svg
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('width', size)
      .attr('height', size)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);

    // Create tooltip if it doesn't exist
    if (d3.select('#tooltip').empty()) {
      d3.select('body').append('div')
        .attr('id', 'tooltip')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('pointer-events', 'none')
        .style('z-index', 1000);
    }
    
    const tooltip = d3.select('#tooltip');

    // Calculate point size based on available space
    // Smaller on mobile, larger on desktop
    const basePointRadius = isMobile ? 3 : isTablet ? 3.5 : 4;
    const hoverPointRadius = basePointRadius * 1.5;

    // Create month labels (optional for better orientation)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthAngles = months.map((_, i) => (i * 30) + 15); // Approximate middle of each month

    // Add month labels for orientation
    g.selectAll('.month-label')
      .data(months)
      .enter()
      .append('text')
      .attr('transform', (_, i) => {
        const angle = (monthAngles[i] * Math.PI) / 180;
        const radius = maxRadius + (isMobile ? 15 : 25);
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius;
        return `translate(${x}, ${y})`;
      })
      .text(d => isMobile ? d.charAt(0) : d) // Just first letter on mobile
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .style('font-size', isMobile ? '8px' : '10px')
      .style('opacity', 0.7);

    // Add light circular grid lines for each month
    g.selectAll('.month-grid')
      .data(monthAngles)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', d => Math.sin((d * Math.PI) / 180) * maxRadius)
      .attr('y2', d => -Math.cos((d * Math.PI) / 180) * maxRadius)
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Add concentric circles for each year
    g.selectAll('.year-circle')
      .data(years)
      .enter()
      .append('circle')
      .attr('r', d => radiusScale(d))
      .attr('fill', 'none')
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 0.75)
      .attr('opacity', 0.5);

    years.forEach(year => {
      const filtered = data.filter(d =>
        d.year === year &&
        (activeMotives.length === 0 || activeMotives.includes(d.motive))
      );

      const radius = radiusScale(year);
      const group = g.append('g').attr('class', `ring-${year}`);

      group.selectAll('circle')
        .data(filtered)
        .enter()
        .append('circle')
        .attr('r', basePointRadius)
        .attr('transform', d => {
          const angle = angleScale(getDayOfYear(d.date));
          return `rotate(${(angle * 180) / Math.PI - 90}) translate(${radius}, 0)`;
        })
        .attr('fill', d => {
          const val = colorBy === 'severity' ? d.severity : d.motive;
          return colorScales[colorBy](val);
        })
        .attr('fill-opacity', colorBy === 'motive' ? 0.7 : 1)
        .attr('stroke', d => {
          const day = getDayOfYear(d.date);
          
          // Look for an exact match in our holiday data
          const eid = eidDays.some(h => h.year === d.year && Math.abs(h.day - day) <= 1); // Allow 1 day margin for calculation differences
          const ramadan = ramadanDays.some(h => h.year === d.year && Math.abs(h.day - day) <= 1);
          
          // Different colors for Eid and Ramadan, and different based on colorBy mode
          if (highlightEid && eid) {
            return colorBy === 'severity' ? '#8b4b7b' : '#b9609b'; // Purple shades
          } else if (highlightRamadan && ramadan) {
            return colorBy === 'severity' ? '#ff6f00' : '#ffc107'; // Orange/yellow shades
          }
          return 'none';
        })
        .attr('stroke-width', d => {
          const day = getDayOfYear(d.date);
          const eid = eidDays.some(h => h.year === d.year && Math.abs(h.day - day) <= 1);
          const ramadan = ramadanDays.some(h => h.year === d.year && Math.abs(h.day - day) <= 1);
          return (highlightEid && eid) || (highlightRamadan && ramadan) ? 2 : 0;
        })
        .style('opacity', 0)
        .transition()
        .delay((_, i) => i * 3)
        .duration(600)
        .style('opacity', 1);

      // Improved hover functionality
      group.selectAll('circle')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', hoverPointRadius);
            
          tooltip
            .style('opacity', 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 5px; color: #1d4077">${d.summary || 'No summary available'}</div>
              <div><strong>Date:</strong> ${d.date}</div>
              <div><strong>Country:</strong> ${d.country}</div>
              <div><strong>City:</strong> ${d.city || 'Unknown'}</div>
              <div><strong>Actor:</strong> ${d.actor || 'Unknown'}</div>
              <div><strong>Severity:</strong> ${d.severity}</div>
              <div><strong>Motive:</strong> ${d.motive || 'Unspecified'}</div>
            `)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', basePointRadius);
            
          tooltip.style('opacity', 0);
        });
    });

    // Year labels - position adaptively based on available space
    g.selectAll('.year-label')
      .data(years)
      .enter()
      .append('text')
      .attr('y', d => -radiusScale(d) - (isMobile ? 5 : 10))
      .text(d => d)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1d4077')
      .style('font-size', isMobile ? '12px' : '15px')
      .style('font-weight', 'bold');
      
    // Add a subtle outer ring
    g.append('circle')
      .attr('r', maxRadius + 2)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1);
      
  }, [data, colorBy, highlightEid, highlightRamadan, activeMotives, eidDays, ramadanDays, dimensions, isMobile, isTablet, theme]);

  const uniqueMotives = data ? Array.from(new Set(data.map(d => d.motive))).filter(Boolean) : [];

  return (
    <Box mt={6} mb={4} ref={containerRef}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : undefined,
          fontSize: {
            xs: '1rem',
            sm: '1.25rem',
            md: '1.5rem'
          }
        }}
      >
        Calendar of Conflict: Clustering of Humanitarian Attacks
      </Typography>
  
      <Box 
        display="flex" 
        alignItems="center" 
        gap={1} 
        flexWrap="wrap" 
        mb={2}
        sx={{ 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          '& .MuiToggleButtonGroup-root': {
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }
        }}
      >
        <ToggleButtonGroup 
          sx={{ 
            mb: { xs: 2, sm: 0 },
            maxWidth: { xs: '100%', sm: 'auto' }
          }}
        >
          <ToggleButton
            value="eid"
            selected={highlightEid}
            onClick={() => setHighlightEid(!highlightEid)}
            sx={{ 
              backgroundColor: theme => theme.palette.mode === 'dark' 
                ? (highlightEid ? 'rgba(139, 75, 123, 0.15)' : undefined)
                : (highlightEid ? '#f0f0f0' : undefined),
              borderColor: theme => highlightEid 
                ? '#8b4b7b' 
                : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined),
              color: theme => theme.palette.mode === 'dark'
                ? (highlightEid ? '#d4b6ce' : 'rgba(255, 255, 255, 0.7)')
                : (highlightEid ? 'rgba(0, 0, 0, 0.87)' : undefined),
              '&.Mui-selected': { 
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(139, 75, 123, 0.15)'
                  : '#f0f0f0'
              },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Highlight Eid
          </ToggleButton>
          <ToggleButton
            value="ramadan"
            selected={highlightRamadan}
            onClick={() => setHighlightRamadan(!highlightRamadan)}
            sx={{ 
              backgroundColor: theme => theme.palette.mode === 'dark' 
                ? (highlightRamadan ? 'rgba(255, 111, 0, 0.15)' : undefined)
                : (highlightRamadan ? '#f0f0f0' : undefined),
              borderColor: theme => highlightRamadan 
                ? '#ff6f00'
                : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined),
              color: theme => theme.palette.mode === 'dark'
                ? (highlightRamadan ? '#ffd9b3' : 'rgba(255, 255, 255, 0.7)')
                : (highlightRamadan ? 'rgba(0, 0, 0, 0.87)' : undefined),
              '&.Mui-selected': { 
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 111, 0, 0.15)'
                  : '#f0f0f0'
              },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Highlight Ramadan
          </ToggleButton>
        </ToggleButtonGroup>
  
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1} 
          ml={{ xs: 0, sm: 'auto' }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Typography 
            fontWeight="bold"
            sx={{ 
              color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : undefined,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Color by:
          </Typography>
          <ToggleButtonGroup
            value={colorBy}
            exclusive
            onChange={(e, val) => val && setColorBy(val)}
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiToggleButton-root': {
                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                padding: { xs: '4px 8px', sm: '6px 12px' }
              },
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : '#f0f0f0',
                color: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(0, 0, 0, 0.87)'
              }
            }}
          >
            <ToggleButton value="severity">SEVERITY</ToggleButton>
            <ToggleButton value="motive">MOTIVE</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Toggle to color incidents by severity or motive.">
            <IconButton 
              size={isMobile ? "small" : "medium"}
              sx={{ color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined }}
            >
              <InfoOutlinedIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
  
      <Box 
        display="flex" 
        flexWrap="wrap" 
        alignItems="center" 
        gap={1} 
        mb={3}
        sx={{ 
          '& .MuiToggleButton-root': {
            padding: { xs: '2px 6px', sm: '4px 10px' },
            fontSize: { xs: '0.7rem', sm: '0.8rem' }
          }
        }}
      >
        {uniqueMotives.map(motive => (
          <ToggleButton
            key={motive}
            value={motive}
            selected={activeMotives.includes(motive)}
            onClick={() => setActiveMotives(prev =>
              prev.includes(motive)
                ? prev.filter(m => m !== motive)
                : [...prev, motive]
            )}
            sx={{ 
              backgroundColor: theme => theme.palette.mode === 'dark'
                ? (activeMotives.includes(motive) ? 'rgba(255, 255, 255, 0.12)' : undefined)
                : (activeMotives.includes(motive) ? '#f0f0f0' : undefined),
              color: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.7)' 
                : undefined,
              '&.Mui-selected': { 
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : '#f0f0f0',
                color: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(0, 0, 0, 0.87)',
                border: theme => theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.3)' 
                  : '1px solid rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            {motive}
          </ToggleButton>
        ))}
      </Box>
  
      {colorBy === 'severity' && (
        <Box mb={3}>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1, 
              color: theme => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.7)' 
                : 'text.secondary',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            Severity Index
          </Typography>
          <svg width="100%" height="20">
            <defs>
              <linearGradient id="legend-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#deebf7" />
                <stop offset="100%" stopColor="#08306b" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100%" height="20" fill="url(#legend-gradient)" />
            <text 
              x="0" 
              y="35" 
              fontSize={isMobile ? "8" : "10"} 
              fill={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined}
            >
              0
            </text>
            <text 
              x="95%" 
              y="35" 
              fontSize={isMobile ? "8" : "10"} 
              textAnchor="end"
              fill={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined}
            >
              10
            </text>
          </svg>
        </Box>
      )}
  
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          height: dimensions.height,
          overflow: 'visible'
        }}
      >
        <svg 
          ref={svgRef} 
          style={{ 
            maxWidth: '100%', 
            height: 'auto',
            margin: '0 auto' 
          }} 
        />
      </Box>
    </Box>
  );
}

export default RadialCalendar;