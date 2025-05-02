import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

// Simple rectangle-overlap detection
function overlaps(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

const margin = { top: 30, right: 80, bottom: 80, left: 90 };

const Timeline = ({ data }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const highlightGroupRef = useRef(null);
  const didAnimate = useRef(false);
  const tooltipRef = useRef(null);
  const theme = useTheme();

  // State variables
  const [keyEvents, setKeyEvents] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [clickedEventSynopsis, setClickedEventSynopsis] = useState('');
  const [dimensions, setDimensions] = useState({ width: 2000, height: 700 });
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Create and clean up tooltip
  useEffect(() => {
    d3.selectAll('.timeline-tooltip').remove();
    const tooltipDiv = d3
      .select('body')
      .append('div')
      .attr('class', 'timeline-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('opacity', '0')
      .style('background', '#f8f8f8')
      .style('color', '#333')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('box-shadow', '0 2px 10px rgba(0,0,0,0.2)')
      .style('border', '1px solid #ddd')
      .style('font-size', '12px')
      .style('max-width', '250px');
    
    tooltipRef.current = tooltipDiv;
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
      }
    };
  }, []);

  // Load key events once
  useEffect(() => {
    fetch('/data/keyEvents.json')
      .then(res => res.json())
      .then(setKeyEvents)
      .catch(err => console.error('Error loading key events:', err));
  }, []);

  // Responsive dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const width = Math.min(viewportWidth * 0.98, 2400);
      const height = Math.max(600, width * 0.45);
      setDimensions({ width, height });
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Main chart effect
  useEffect(() => {
    if (!data?.length) return;
    const animateNow = !didAnimate.current || animationTrigger > 0;
    const tooltip = tooltipRef.current;

    // Group data by year
    const grouped = d3
      .rollups(data, v => v.length, d => +d.Year)
      .sort((a, b) => a[0] - b[0]);

    const { width, height } = dimensions;
    const plottingWidth = width - margin.left - margin.right;
    const lineDuration = 10000; // slow line animation

    // Clear any existing SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .style('width', '100%')
      .style('height', 'auto')
      .style('display', 'block');
    svg.selectAll('*').remove();

    // Create scales
    const minYear = grouped[0][0];
    const maxYear = grouped[grouped.length - 1][0];
    const paddedMinYear = minYear - 1;
    const paddedMaxYear = maxYear + 1;

    const xScale = d3
      .scaleLinear()
      .domain([paddedMinYear, paddedMaxYear])
      .range([margin.left, width - margin.right]);
    const yMax = d3.max(grouped, d => d[1]) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Draw the line
    const lineGenerator = d3
      .line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    const linePath = svg
      .append('path')
      .datum(grouped)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.custom?.chartAccent || '#1976d2')
      .attr('stroke-width', 2)
      .attr('d', lineGenerator(grouped));

    if (animateNow) {
      const totalLength = linePath.node().getTotalLength();
      linePath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(lineDuration)
        .ease(d3.easeCubic)
        .attr('stroke-dashoffset', 0);
    }

    // Draw circles
    const circles = svg
      .selectAll('circle')
      .data(grouped)
      .join('circle')
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .attr('r', animateNow ? 0 : 4)
      .attr('fill', theme.palette.custom?.chartAccent || '#1976d2');

    if (animateNow) {
      circles
        .transition()
        .delay(d => ((xScale(d[0]) - margin.left) / plottingWidth) * lineDuration * 0.7)
        .duration(800)
        .attr('r', 4);
    }

    // Interactions on circles
    circles
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', 6);
        const matchingEvents = keyEvents.filter(e => +e.year === d[0]);
        const labelContent = matchingEvents.length
          ? `<br/><em>${matchingEvents.map(e => e.label).join(', ')}</em>`
          : '';
        if (tooltip) {
          tooltip
            .html(
              `<strong style="font-size: 14px;">${d[0]}</strong>
               <br/><span style="font-weight: 500;">${d[1]} incidents</span>${labelContent}`
            )
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`)
            .style('visibility', 'visible')
            .style('opacity', '1');
        }
        setActiveYear(d[0]);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('r', 4);
        if (tooltip) {
          tooltip.style('visibility', 'hidden').style('opacity', '0');
        }
        setActiveYear(null);
      });

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('fill', theme.palette.text?.primary || '#000')
      .style('font-size', '14px');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', theme.palette.text?.primary || '#000')
      .style('font-size', '14px');

    // Axis titles
    svg
      .append('text')
      .attr('class', 'x-axis-title')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .style('fill', theme.palette.text?.primary || '#000')
      .style('font-size', '16px')
      .style('font-weight', '500')
      .text('Year');

    svg
      .append('text')
      .attr('class', 'y-axis-title')
      .attr('text-anchor', 'middle')
      .attr(
        'transform',
        `translate(${margin.left - 45}, ${height / 2}) rotate(-90)`
      )
      .style('fill', theme.palette.text?.primary || '#000')
      .style('font-size', '16px')
      .style('font-weight', '500')
      .text('Number of Incidents');

    highlightGroupRef.current = svg.append('g').attr('class', 'highlight-group');

    // =========================================================================
    // UPDATED: Group events by year & place labels with better spacing & lines
    // =========================================================================
    const annotations = svg.append('g').attr('class', 'annotations');
    const validEvents = (keyEvents || []).filter(e => {
      const y = +e.year;
      return y >= minYear && y <= maxYear;
    });
    const eventsByYear = d3.groups(validEvents, e => +e.year).sort((a, b) => a[0] - b[0]);

    const placedLabels = [];

    eventsByYear.forEach(([year, events], yearIndex) => {
      const yearData = grouped.find(g => g[0] === year);
      if (!yearData) return;
      const incidents = yearData[1];

      const dataX = xScale(year);
      const dataY = yScale(incidents);
      const lineBottom = height - margin.bottom;

      // Calculate initial top line height a bit above data point
      let lineTop = dataY - 30;
      const labelSpacing = 28;

      const direction = yearIndex % 2 === 0 ? 'left' : 'right';

      events.forEach((ev, i) => {
        let labelY;
      
        // Let 2016 events stack
        const allowStacking = year === 2016 && events.length === 2;

        // Manually nudge the 2017 event higher to separate from 2016 cluster
        const isNorthKivu = ev.label.includes('North Kivu UN Base Attack');

        if (isNorthKivu) {
          labelY = dataY - 40; // bump it higher than normal
        } else if (allowStacking) {
          labelY = dataY - 30;
        } else {
          labelY = dataY - 30 - i * labelSpacing;
        }
      
        const label = annotations
          .append('text')
          .attr('class', 'annotation-text')
          .attr('text-anchor', 'end')
          .attr('x', dataX)
          .attr('y', labelY)
          .attr('fill', theme.palette.text?.primary || '#000')
          .style('font-size', '14px')
          .style('cursor', 'pointer')
          .text(ev.label)
          .attr('opacity', 0);
      
        // Collision detection loop
        while (true) {
          const node = label.node();
          if (!node) break;
          const bbox = node.getBBox();
          const labelBox = {
            x: +label.attr('x') - bbox.width / 2,
            y: +label.attr('y') - bbox.height,
            width: bbox.width,
            height: bbox.height,
          };
      
          let hasCollision = placedLabels.some(placed => overlaps(labelBox, placed));
          if (hasCollision) {
            labelY -= 20;
            label.attr('y', labelY);
          } else {
            placedLabels.push(labelBox);
            break;
          }
        }
      
        if (labelY < lineTop) {
          lineTop = labelY - 10;
        }
      
        // Hover, click, animate — unchanged...
        label
          .on('mouseover', event => {
            tooltip
              .html(
                `<strong style="font-size: 14px;">${ev.year}</strong><br/>
                 <span style="font-weight: 500;">${ev.label}</span>`
              )
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY - 28}px`)
              .style('visibility', 'visible')
              .style('opacity', '1');
          })
          .on('mouseout', () => {
            tooltip.style('visibility', 'hidden').style('opacity', '0');
          })
          .on('click', event => {
            event.stopPropagation();
            setClickedEventSynopsis(ev.synopsis || ev.description || '(No synopsis available)');
          });
      
        if (animateNow) {
          label
            .transition()
            .delay(((dataX - margin.left) / plottingWidth) * lineDuration * 0.85)
            .duration(800)
            .attr('opacity', 1);
        } else {
          label.attr('opacity', 1);
        }
      });

      // Draw dashed line from above topmost label down to x-axis
      const dashLine = annotations
        .append('line')
        .attr('class', 'annotation-line')
        .attr('x1', dataX)
        .attr('x2', dataX)
        .attr('y1', lineBottom)
        .attr('y2', lineTop)
        .attr('stroke', '#999')
        .attr('stroke-dasharray', '4,2')
        .attr('stroke-width', 1)
        .attr('opacity', 0);

      if (animateNow) {
        dashLine
          .transition()
          .delay(((dataX - margin.left) / plottingWidth) * lineDuration * 0.8)
          .duration(800)
          .attr('opacity', 1);
      } else {
        dashLine.attr('opacity', 1);
      }
    });

    if (animateNow) didAnimate.current = true;
  }, [data, keyEvents, dimensions, theme, animationTrigger]);

  // Global hover highlight
  useEffect(() => {
    d3.select(svgRef.current).selectAll('.active-year-highlight').remove();
    if (activeYear == null || !data?.length) return;

    const { width, height } = dimensions;
    const grouped = d3
      .rollups(data, v => v.length, d => +d.Year)
      .sort((a, b) => a[0] - b[0]);

    const minYear = grouped[0][0];
    const maxYear = grouped[grouped.length - 1][0];
    const paddedMinYear = minYear - 1;
    const paddedMaxYear = maxYear + 1;
    
    const xScale = d3
      .scaleLinear()
      .domain([paddedMinYear, paddedMaxYear])
      .range([margin.left, width - margin.right]);

    const idx = grouped.findIndex(d => d[0] === activeYear);
    if (idx === -1) return;
    const years = grouped.map(d => d[0]);
    let leftBoundary, rightBoundary;
    if (idx === 0) {
      leftBoundary = margin.left;
    } else {
      leftBoundary = xScale((years[idx - 1] + activeYear) / 2);
    }
    if (idx === years.length - 1) {
      rightBoundary = width - margin.right;
    } else {
      rightBoundary = xScale((activeYear + years[idx + 1]) / 2);
    }

    const count = grouped[idx][1];
    const yMax = d3.max(grouped, d => d[1]) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const curveY = yScale(count);
    d3.select(svgRef.current)
      .append('rect')
      .attr('class', 'active-year-highlight')
      .attr('x', leftBoundary)
      .attr('y', curveY)
      .attr('width', rightBoundary - leftBoundary)
      .attr('height', height - margin.bottom - curveY)
      .attr('fill', theme.palette.error?.main || '#f44336')
      .attr('opacity', 0.3);
  }, [activeYear, data, dimensions, theme]);

  const handleReplayAnimation = () => {
    setAnimationTrigger(prev => prev + 1);
  };

  return (
    <Box
      sx={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        paddingLeft: '16px',
        paddingRight: '16px',
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          px: 2
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ mb: 2 }}>
          Incidents Over Time
        </Typography>
        <Button
          variant="outlined"
          onClick={handleReplayAnimation}
          sx={{ height: 'fit-content', mb: 2 }}
        >
          Replay Animation
        </Button>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          display: 'block',
          overflow: 'hidden'
        }}
      >
        <svg
          ref={svgRef}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Box>

      <Dialog
        open={Boolean(clickedEventSynopsis)}
        onClose={() => setClickedEventSynopsis('')}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Event Synopsis</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {clickedEventSynopsis}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClickedEventSynopsis('')}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Timeline;
