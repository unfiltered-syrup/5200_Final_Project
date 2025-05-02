// TacticalTimeline.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useTheme, Box, Typography } from '@mui/material';
import TimelineToggles from '../ui/TimelineToggles';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';
import { timelineLayerColors } from '../../theme/themeUtils';
import getDataPath from '../../utils/getDataPath'; // adjust path if needed

const TacticalTimeline = ({ onWeekClick }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const theme = useTheme();
  const tooltipRef = useRef();
  const colors = timelineLayerColors(theme);
  const [data, setData] = useState([]);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlayTrends, setOverlayTrends] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const intervalRef = useRef(null);
  const zoomRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  const [filters, setFilters] = useState({
    showCasualties: true,
    showHolidays: true,
    showSpikePeriods: true,
    showTotalIncidents: true
  });

  useEffect(() => {
    d3.json(getDataPath('data/merged_timeline.json'))
      .then(json => {
        const parsed = json.map(d => ({
          date: new Date(d.date),
          casualties: +d.casualties || 0,
          incidents: +d.incidents || 0,
          holiday: d.holiday === true,
          spike: d.spike === true,
        }));
        setData(parsed);
      })
      .catch(err => console.error('Failed to load merged_timeline.json:', err));
  }, []);

  // Calculate size based on container
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    // Set a min-height but allow it to grow with the container if needed
    const containerHeight = Math.max(450, containerRef.current.clientHeight);
    
    setDimensions({
      width: containerWidth,
      height: containerHeight
    });
  }, []);

  // Initialize and handle resize events
  useEffect(() => {
    updateDimensions();
    
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  // Define margin with responsive values
  const getMargins = useCallback(() => {
    // Base margins
    const baseMargin = { top: 50, right: 30, bottom: 55, left: 60 };
    
    // For very small screens, reduce margins
    if (dimensions.width < 500) {
      return { 
        top: baseMargin.top, 
        right: Math.max(10, baseMargin.right - 10), 
        bottom: baseMargin.bottom, 
        left: Math.max(30, baseMargin.left - 15) 
      };
    }
    
    return baseMargin;
  }, [dimensions.width]);
  
  // Main chart rendering effect
  useEffect(() => {
    if (!data.length || dimensions.width === 0) return;

    const margin = getMargins();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('class', 'chart-container')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.casualties, d.incidents))])
      .nice()
      .range([chartHeight, 0]);

    // Create axes
    const xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));

    // Responsive font sizes based on container width
    const titleFontSize = Math.max(18, Math.min(30, width / 40)); // Increased from (14, 25, width/40)
    const labelFontSize = Math.max(18, Math.min(25, width / 60)); // Increased from (10, 14, width/70)
    
    // Add labels and title
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2},${chartHeight + 45})`)
      .style('text-anchor', 'middle')
      .style('fill', theme.palette.text.primary)
      .style('font-size', `${labelFontSize}px`)
      .style('font-weight', '600') 
      .text('Date');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -45)
      .style('text-anchor', 'middle')
      .style('fill', theme.palette.text.primary)
      .style('font-size', `${labelFontSize}px`)
      .style('font-weight', '600') 
      .text('Incident Count');

    // Responsive title that truncates for small screens
    const fullTitle = 'Timeline of Incidents and Casualties by Week, with Spikes and Holidays Highlighted';
    const truncatedTitle = width < 700 ? 'Timeline of Incidents and Casualties' : fullTitle;
    
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .style('font-size', `${titleFontSize}px`)
      .style('font-weight', '600')
      .style('fill', theme.palette.text.primary)
      .text(truncatedTitle);

    // Initialize tooltip
    tooltipRef.current = createTooltip(theme);

    // Create a group for all data elements
    const chartElements = g.append('g')
      .attr('class', 'chart-elements');

    // Add a background with manual drag handling for panning
    const dragBehavior = d3.drag()
      .on('start', function(event) {
        d3.select(this).attr('cursor', 'grabbing');
      })
      .on('drag', function(event) {
        // Get current transform
        const currentTransform = d3.zoomTransform(svg.node());
        
        // Apply the translation directly to the zoom transform
        svg.call(
          zoom.transform,
          d3.zoomIdentity
            .translate(currentTransform.x + event.dx, currentTransform.y + event.dy)
            .scale(currentTransform.k)
        );
      })
      .on('end', function() {
        d3.select(this).attr('cursor', 'move');
      });
      
    chartElements.append('rect')
      .attr('class', 'background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('opacity', 0)
      .style('cursor', 'move')
      .call(dragBehavior)
      .on('click', (event) => {
        // Only reset selection if it's a simple click (not at the end of a drag)
        if (!event.defaultPrevented) {
          resetSelection();
        }
      })
      .on('dblclick', (event) => {
        // Double-click to reset zoom
        event.preventDefault();
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });

    // Draw holiday indicators
    if (filters.showHolidays) {
      chartElements.selectAll('.holiday-rect')
        .data(data.filter(d => d.holiday))
        .enter().append('rect')
        .attr('class', 'holiday-rect')
        .attr('x', d => x(d.date) - 3)
        .attr('y', 0)
        .attr('width', 6)
        .attr('height', chartHeight)
        .attr('fill', colors.holidays)
        .attr('opacity', 0.25);
    }

    // Draw spike period indicators
    if (filters.showSpikePeriods) {
      chartElements.selectAll('.spike-rect')
        .data(data.filter(d => d.spike))
        .enter().append('rect')
        .attr('class', 'spike-rect')
        .attr('x', d => x(d.date) - 3)
        .attr('y', 0)
        .attr('width', 6)
        .attr('height', chartHeight)
        .attr('fill', colors.spikes)
        .attr('opacity', 0.20);
    }

    // Adaptive bar width based on data density and chart width
    const barWidth = Math.max(3, Math.min(6, chartWidth / (data.length / 2)));
    const barOffset = barWidth / 2;

    // Draw casualty bars (pillars)
    if (filters.showCasualties) {
      chartElements.selectAll('.casualty-bar')
        .data(data)
        .enter().append('rect')
        .attr('class', d => `casualty-bar bar-${d.date.getTime()}`)
        .attr('x', d => x(d.date) - barOffset)
        .attr('y', d => y(d.casualties))
        .attr('width', barWidth)
        .attr('height', d => chartHeight - y(d.casualties))
        .attr('fill', d => selectedPillar && selectedPillar.date.getTime() === d.date.getTime() 
          ? theme.palette.secondary.main 
          : colors.casualties)
        .attr('stroke', d => selectedPillar && selectedPillar.date.getTime() === d.date.getTime() 
          ? theme.palette.secondary.dark 
          : 'none')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          if (!selectedPillar) {
            d3.select(event.currentTarget)
              .attr('fill', theme.palette.secondary.light);
          }
          
          showTooltip(
            tooltipRef.current,
            event,
            `<div><strong>${d3.timeFormat('%b %d, %Y')(d.date)}</strong></div>
             <div style="color:${colors.casualties}">Casualties: ${d.casualties}</div>
             <div style="color:${colors.total}">Incidents: ${d.incidents}</div>
             ${d.holiday ? `<div style="color:${colors.holidays}">Holiday Period</div>` : ''}
             ${d.spike ? `<div style="color:${colors.spikes}">Spike Period</div>` : ''}`
          );
        })
        .on('mouseout', (event, d) => {
          if (!selectedPillar || selectedPillar.date.getTime() !== d.date.getTime()) {
            d3.select(event.currentTarget)
              .attr('fill', colors.casualties);
          }
          
          if (!selectedPillar) {
            hideTooltip(tooltipRef.current);
          }
        })
        .on('click', function(event, d) {
          // Prevent any default behavior
          event.preventDefault();
          // Mark event as handled to prevent other handlers
          event.stopPropagation();
          
          // Explicitly set pointer events to 'none' for the background during this click
          // This ensures zoom behaviors won't interfere
          chartElements.select('.background')
            .style('pointer-events', 'none');
            
          // Call selectPillar
          selectPillar(d);
          
          // Restore pointer events after a short delay
          setTimeout(() => {
            chartElements.select('.background')
              .style('pointer-events', 'auto');
          }, 100);
        });
    }

    // Draw total incidents as navy blue pillars (instead of a line)
    if (filters.showTotalIncidents) {
      chartElements.selectAll('.incident-bar')
        .data(data)
        .enter().append('rect')
        .attr('class', d => `incident-bar bar-incident-${d.date.getTime()}`)
        .attr('x', d => x(d.date) + (barWidth > 5 ? 4 : 2)) // Position to the right of casualty bars, adaptive spacing
        .attr('y', d => y(d.incidents))
        .attr('width', barWidth - 1) // Slightly narrower than casualty bars
        .attr('height', d => chartHeight - y(d.incidents))
        .attr('fill', colors.total || 'navy') // Use navy blue color
        .attr('stroke', 'none')
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .attr('fill', d3.color(colors.total || 'navy').brighter(0.5));
          
          showTooltip(
            tooltipRef.current,
            event,
            `<div><strong>${d3.timeFormat('%b %d, %Y')(d.date)}</strong></div>
             <div style="color:${colors.total}">Total Incidents: ${d.incidents}</div>
             ${d.holiday ? `<div style="color:${colors.holidays}">Holiday Period</div>` : ''}
             ${d.spike ? `<div style="color:${colors.spikes}">Spike Period</div>` : ''}`
          );
        })
        .on('mouseout', (event, d) => {
          d3.select(event.currentTarget)
            .attr('fill', colors.total || 'navy');
          
          hideTooltip(tooltipRef.current);
        });
    }

    // Draw overlay trends
    if (overlayTrends) {
      const years = Array.from(new Set(data.map(d => d.date.getFullYear()))).sort();
      const yearColor = d3.scaleOrdinal()
        .domain(years)
        .range(d3.schemeBlues[years.length >= 5 ? 9 : 5].slice(-years.length));

      years.forEach(year => {
        const yearData = data.filter(d => d.date.getFullYear() === year);
        const line = d3.line()
          .x(d => x(d.date))
          .y(d => y(d.incidents))
          .curve(d3.curveMonotoneX);

        chartElements.append('path')
          .datum(yearData)
          .attr('class', `overlay-trend overlay-trend-${year}`)
          .attr('fill', 'none')
          .attr('stroke', yearColor(year))
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.8)
          .attr('d', line);
      });
    }

    // Responsive info box size
    const infoBoxWidth = Math.min(180, chartWidth * 0.3);
    const infoBoxHeight = 100;
    const infoFontSize = Math.max(10, Math.min(14, width / 70));

    // Add an info box for selected pillar
    const infoBox = g.append('g')
      .attr('class', 'info-box')
      .attr('transform', `translate(${chartWidth - infoBoxWidth - 10}, 10)`)
      .style('opacity', selectedPillar ? 1 : 0);
    
    infoBox.append('rect')
      .attr('width', infoBoxWidth)
      .attr('height', infoBoxHeight)
      .attr('fill', theme.palette.background.paper)
      .attr('stroke', theme.palette.divider)
      .attr('rx', 4);
    
    // Info box text with responsive size
    infoBox.append('text')
      .attr('class', 'info-date')
      .attr('x', 10)
      .attr('y', 25)
      .style('font-weight', 'bold')
      .style('font-size', `${infoFontSize}px`)
      .style('fill', theme.palette.text.primary)
      .text(selectedPillar 
        ? d3.timeFormat('%B %d, %Y')(selectedPillar.date) 
        : '');
    
    infoBox.append('text')
      .attr('class', 'info-casualties')
      .attr('x', 10)
      .attr('y', 50)
      .style('font-size', `${infoFontSize}px`)
      .style('fill', colors.casualties)
      .text(selectedPillar 
        ? `Casualties: ${selectedPillar.casualties}` 
        : '');
        
    infoBox.append('text')
      .attr('class', 'info-incidents')
      .attr('x', 10)
      .attr('y', 70)
      .style('font-size', `${infoFontSize}px`)
      .style('fill', colors.total)
      .text(selectedPillar 
        ? `Incidents: ${selectedPillar.incidents}` 
        : '');
    
    // Add additional context
    if (selectedPillar) {
      const extraInfo = [];

      if (selectedPillar.holiday) extraInfo.push('Holiday period');
      if (selectedPillar.spike) extraInfo.push('Spike in activity');

      if (extraInfo.length) {
        infoBox.append('text')
          .attr('class', 'info-context')
          .attr('x', 10)
          .attr('y', 90)
          .style('font-size', `${infoFontSize}px`)
          .style('fill', theme.palette.text.secondary)
          .style('font-style', 'italic')
          .text(extraInfo.join(' • '));
      }
    }
    
    // Responsive zoom control positioning and size
    const controlButtonSize = Math.max(20, Math.min(25, width / 40));
    const controlSpacing = Math.max(5, Math.min(10, width / 100));
    
    // Add zoom controls
    const zoomControls = g.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${chartWidth - (controlButtonSize * 3 + controlSpacing * 2)}, ${chartHeight - controlButtonSize - 5})`);
    
    // Zoom in button
    zoomControls.append('rect')
      .attr('class', 'zoom-in-btn')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', controlButtonSize)
      .attr('height', controlButtonSize)
      .attr('rx', 3)
      .attr('fill', theme.palette.background.paper)
      .attr('stroke', theme.palette.divider)
      .style('cursor', 'pointer')
      .on('click', (event) => {
        svg.transition()
          .duration(300)
          .call(zoom.scaleBy, 1.5);
      });
    
    zoomControls.append('text')
      .attr('x', controlButtonSize / 2)
      .attr('y', controlButtonSize / 2 + 1)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', `${controlButtonSize * 0.6}px`)
      .style('font-weight', 'bold')
      .style('user-select', 'none')
      .text('+');
    
    // Zoom out button
    zoomControls.append('rect')
      .attr('class', 'zoom-out-btn')
      .attr('x', controlButtonSize + controlSpacing)
      .attr('y', 0)
      .attr('width', controlButtonSize)
      .attr('height', controlButtonSize)
      .attr('rx', 3)
      .attr('fill', theme.palette.background.paper)
      .attr('stroke', theme.palette.divider)
      .style('cursor', 'pointer')
      .on('click', (event) => {
        svg.transition()
          .duration(300)
          .call(zoom.scaleBy, 0.75);
      });
    
    zoomControls.append('text')
      .attr('x', controlButtonSize + controlSpacing + controlButtonSize / 2)
      .attr('y', controlButtonSize / 2 + 1)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', `${controlButtonSize * 0.6}px`)
      .style('font-weight', 'bold')
      .style('user-select', 'none')
      .text('−');
    
    // Reset zoom button
    zoomControls.append('rect')
      .attr('class', 'reset-zoom-btn')
      .attr('x', (controlButtonSize + controlSpacing) * 2)
      .attr('y', 0)
      .attr('width', controlButtonSize)
      .attr('height', controlButtonSize)
      .attr('rx', 3)
      .attr('fill', theme.palette.background.paper)
      .attr('stroke', theme.palette.divider)
      .style('cursor', 'pointer')
      .on('click', (event) => {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });
    
    zoomControls.append('text')
      .attr('x', (controlButtonSize + controlSpacing) * 2 + controlButtonSize / 2)
      .attr('y', controlButtonSize / 2 + 1)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', `${controlButtonSize * 0.5}px`)
      .style('user-select', 'none')
      .text('🔍');

    // Setup zoom behavior with stronger filtering
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[-width, -height], [width * 2, height * 2]])
      .extent([[0, 0], [width, height]])
      .filter(event => {
        // CRITICAL: Completely disable mousedown/touchstart events from triggering zoom
        // This ensures pillar clicks don't get captured by zoom at all
        if (event.type === 'mousedown' || event.type === 'touchstart') {
          return false; // Never handle these events in zoom
        }
        // Only allow wheel events for zooming
        return event.type === 'wheel';
      })
      .on('zoom', (event) => {
        const { transform } = event;
        const newX = transform.rescaleX(x);
        
        // Update x-axis
        xAxis.call(d3.axisBottom(newX));
        
        // Update all data elements
        chartElements.selectAll('.holiday-rect')
          .attr('x', d => newX(d.date) - barOffset)
          .attr('width', barWidth);
        
        chartElements.selectAll('.spike-rect')
          .attr('x', d => newX(d.date) - barOffset)
          .attr('width', barWidth);
        
        chartElements.selectAll('.casualty-bar')
          .attr('x', d => newX(d.date) - barOffset)
          .attr('width', barWidth);
          
        // Update incident bars
        chartElements.selectAll('.incident-bar')
          .attr('x', d => newX(d.date) + (barWidth > 5 ? 4 : 2))
          .attr('width', barWidth - 1);
        
        chartElements.selectAll('.overlay-trend').each(function() {
          const year = this.getAttribute('class').split('-').pop();
          const yearData = data.filter(d => d.date.getFullYear() === +year);
          
          d3.select(this).attr('d', d3.line()
            .x(d => newX(d.date))
            .y(d => y(d.incidents))
            .curve(d3.curveMonotoneX)(yearData));
        });
        
        // Update the visible date range
        const domain = newX.domain();
        const visibleStart = d3.timeDay.floor(domain[0]);
        const visibleEnd = d3.timeDay.ceil(domain[1]);
        
        // If we have a selected pillar, ensure the info box stays in view
        if (selectedPillar) {
          const pointDate = selectedPillar.date;
          // Check if the selected point is still in the visible range
          if (pointDate >= visibleStart && pointDate <= visibleEnd) {
            // Keep info box visible
            g.select('.info-box').style('opacity', 1);
          } else {
            // Optionally fade the info box if the selected point is scrolled out of view
            g.select('.info-box').style('opacity', 0.7);
          }
        }
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    // Function to handle selecting a pillar
    function selectPillar(pillar) {
      setSelectedPillar(pillar);
      
      // Update the info box
      infoBox.style('opacity', 1);
      
      infoBox.select('.info-date')
        .text(d3.timeFormat('%B %d, %Y')(pillar.date));
      
      infoBox.select('.info-casualties')
        .text(`Casualties: ${pillar.casualties}`);
        
      infoBox.select('.info-incidents')
        .text(`Incidents: ${pillar.incidents}`);
      
      // Update additional context
      const extraInfo = [];
      if (pillar.holiday) extraInfo.push('Holiday period');
      if (pillar.spike) extraInfo.push('Spike in activity');
      
      infoBox.select('.info-context').remove();
      
      if (extraInfo.length) {
        infoBox.append('text')
          .attr('class', 'info-context')
          .attr('x', 10)
          .attr('y', 90)
          .style('font-size', `${infoFontSize}px`)
          .style('fill', theme.palette.text.secondary)
          .style('font-style', 'italic')
          .text(extraInfo.join(' • '));
      }
      
      // Call the week click callback
      const weekStart = d3.timeMonday(pillar.date);
      const weekEnd = d3.timeDay.offset(weekStart, 6);
      onWeekClick?.(weekStart, weekEnd);
      
      // Update all casualty bars
      chartElements.selectAll('.casualty-bar')
        .attr('fill', d => d.date.getTime() === pillar.date.getTime() 
          ? theme.palette.secondary.main 
          : colors.casualties)
        .attr('stroke', d => d.date.getTime() === pillar.date.getTime() 
          ? theme.palette.secondary.dark 
          : 'none');
          
      // Generate tooltip content
      const tooltipContent = `
        <div><strong>${d3.timeFormat('%b %d, %Y')(pillar.date)}</strong></div>
        <div style="color:${colors.casualties}">Casualties: ${pillar.casualties}</div>
        <div style="color:${colors.total}">Incidents: ${pillar.incidents}</div>
        ${pillar.holiday ? `<div style="color:${colors.holidays}">Holiday Period</div>` : ''}
        ${pillar.spike ? `<div style="color:${colors.spikes}">Spike Period</div>` : ''}
      `;
      
      // Create a fake event object with clientX and clientY
      // so we can position the tooltip at a fixed position near the info box
      const fakeEvent = {
        clientX: margin.left + chartWidth - 250,
        clientY: margin.top + 50
      };
      
      try {
        if (tooltipRef.current) {
          // Use the provided showTooltip function
          showTooltip(tooltipRef.current, fakeEvent, tooltipContent);
        }
      } catch (err) {
        console.warn('Error showing tooltip:', err);
      }
    }
  }, [data, filters, theme, overlayTrends, selectedPillar, onWeekClick, dimensions, getMargins]);

  // Function to reset selection
  const resetSelection = () => {
    setSelectedPillar(null);
    
    // Reset highlighting on all elements
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      
      svg.selectAll('.casualty-bar')
        .attr('fill', colors.casualties)
        .attr('stroke', 'none');
      
      svg.select('.info-box')
        .style('opacity', 0);
      
      // Hide tooltip - safely
      try {
        if (tooltipRef.current) {
          hideTooltip(tooltipRef.current);
        }
      } catch (err) {
        console.warn('Error hiding tooltip:', err);
        // Fallback if hideTooltip fails
        if (tooltipRef.current && tooltipRef.current.style) {
          tooltipRef.current.style.opacity = '0';
          tooltipRef.current.style.display = 'none';
        }
      }
      
      // Reset zoom
      svg.transition().duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity);
      
      // Reset data selection
      onWeekClick?.(null, null);
    }
  };
  
  // Function to zoom to a specific date
  const zoomToDate = (date, scale = 8) => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const margin = getMargins();
    const chartWidth = dimensions.width - margin.left - margin.right;
    
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, chartWidth]);
    
    // Calculate the center position
    const centerX = x(date);
    
    // Calculate the transform
    const tx = chartWidth / 2 - centerX * scale;
    
    // Apply the transform with animation
    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(tx, 0).scale(scale)
      );
  };

  const handleExportSvg = () => {
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const svgWithNS = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const blob = new Blob([svgWithNS], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tactical-timeline.svg';
    link.click();
  };

  return (
    <Box 
      width="100%" 
      display="flex" 
      flexDirection="column" 
      alignItems="center"
      ref={containerRef}
      sx={{ minHeight: '250px', height: '100%' }}
    >
      {/* Add TimelineToggles component at the top */}
      <TimelineToggles 
        filters={filters}
        setFilters={setFilters}
      />

      <Box 
        width="100%" 
        display="flex" 
        justifyContent="center" 
        my={2} 
        sx={{ flexGrow: 1, minHeight: '300px', maxHeight: '600px'}}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '90%', maxHeight: '600px' }}></svg>
      </Box>

      <Box width="100%" mt={0}>
        <Box 
          display="flex" 
          alignItems="center" 
          width="100%" 
          justifyContent="flex-start" 
          ml={2}
          sx={{
            '@media (max-width: 600px)': {
              ml: 1
            }
          }}
        >
          <Box 
            component="span" 
            display="inline-flex" 
            alignItems="center" 
            justifyContent="center" 
            width={24} 
            height={24} 
            border={`2px solid ${theme.palette.text.primary}`} 
            mr={1.5} 
            sx={{ 
              backgroundColor: 'transparent', 
              cursor: 'pointer',
              '@media (max-width: 600px)': {
                width: 20,
                height: 20,
                mr: 1
              }
            }} 
            onClick={() => setOverlayTrends(!overlayTrends)}
          >
            {overlayTrends && <Box width={14} height={14} bgcolor={theme.palette.text.primary} />}
          </Box>
          <Typography 
            variant="body" 
            sx={{ 
              cursor: 'pointer',
              '@media (max-width: 600px)': {
                fontSize: '0.8rem'
              }
            }} 
            onClick={() => setOverlayTrends(!overlayTrends)}
          >
            Overlay Yearly Trends
          </Typography>
        </Box>

        <Box 
          display="flex" 
          justifyContent="space-between" 
          width="100%" 
          mt={2} 
          px={2}
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box 
            display="flex" 
            gap={2}
            sx={{
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            <Box 
              component="button" 
              onClick={handleExportSvg} 
              sx={{ 
                border: `1px solid ${theme.palette.primary.main}`, 
                color: theme.palette.primary.main, 
                backgroundColor: 'transparent', 
                borderRadius: '4px', 
                padding: '8px 20px', 
                cursor: 'pointer', 
                fontWeight: 500, 
                fontSize: '0.9rem', 
                '&:hover': { 
                  backgroundColor: `${theme.palette.primary.main}10` 
                },
                '@media (max-width: 600px)': {
                  padding: '6px 12px',
                  fontSize: '0.8rem'
                }
              }}
            >
              EXPORT SVG
            </Box>
          </Box>

          <Box 
            display="flex" 
            gap={2}
            sx={{
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          >
            <Box 
              component="button" 
              onClick={resetSelection} 
              sx={{ 
                border: `1px solid ${theme.palette.primary.main}`, 
                color: theme.palette.primary.main, 
                backgroundColor: 'transparent', 
                borderRadius: '4px', 
                padding: '8px 20px', 
                cursor: 'pointer', 
                fontWeight: 500, 
                fontSize: '0.9rem', 
                '&:hover': { 
                  backgroundColor: `${theme.palette.primary.main}10` 
                },
                '@media (max-width: 600px)': {
                  padding: '6px 12px',
                  fontSize: '0.8rem'
                }
              }}
            >
              RESET VIEW
            </Box>
            <Box 
              component="div" 
              sx={{ 
                color: selectedPillar ? theme.palette.text.primary : theme.palette.text.disabled,
                padding: '8px 20px',
                fontWeight: 500,
                fontSize: '0.9rem',
                border: `1px solid ${selectedPillar ? theme.palette.divider : theme.palette.action.disabledBackground}`,
                borderRadius: '4px',
                backgroundColor: theme.palette.background.paper,
                '@media (max-width: 600px)': {
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  maxWidth: '200px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }}
            >
              {selectedPillar 
                ? `${d3.timeFormat('%b %d, %Y')(selectedPillar.date)} • Casualties: ${selectedPillar.casualties}`
                : 'No selection'}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TacticalTimeline;