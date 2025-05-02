import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import useIncidentMapData from '../../hooks/useIncidentMapData';
import useOverlayData from '../../hooks/useOverlayData';

// Utility function to sample data based on zoom level
const sampleData = (data, zoomLevel = 1, maxPoints = 1000) => {
  if (!data || data.length === 0) return [];
  
  // If data is small enough or zoom is high, return all data
  if (data.length <= maxPoints || zoomLevel >= 4) return data;
  
  // Calculate sampling rate based on zoom level and data size
  const samplingRate = Math.max(1, Math.floor(data.length / (maxPoints * Math.max(0.25, Math.min(1, zoomLevel / 3)))));
  
  // Sample data based on calculated rate
  return data.filter((_, i) => i % samplingRate === 0);
};

// Utility function to create clusters from points
const createClusters = (data, projection, pixelDistance = 20, zoomLevel = 1) => {
  if (!data || data.length === 0 || !projection) return [];
  
  // Adjust distance based on zoom level (smaller clusters at higher zoom)
  const clusterDistance = pixelDistance / Math.max(0.5, Math.min(2, zoomLevel/2));
  
  // Project all points to pixel coordinates
  const points = data.map(d => {
    // Handle different coordinate formats
    const coords = d.Longitude !== undefined 
      ? [d.Longitude, d.Latitude] 
      : [d.lon, d.lat];
    
    const pixel = projection(coords);
    if (!pixel) return null; // Skip points that can't be projected
    
    return {
      ...d,
      px: pixel[0],
      py: pixel[1],
      originalCoords: coords
    };
  }).filter(p => p !== null); // Remove any points that couldn't be projected
  
  // Simple clustering algorithm
  const clusters = [];
  const assigned = new Set();
  
  // For each point not yet assigned to a cluster
  points.forEach((point, i) => {
    if (assigned.has(i)) return;
    
    // Start a new cluster with this point
    const cluster = {
      x: point.px,
      y: point.py,
      count: 1,
      points: [point],
      originalCoords: point.originalCoords
    };
    clusters.push(cluster);
    assigned.add(i);
    
    // Find nearby points to add to this cluster
    points.forEach((otherPoint, j) => {
      if (i === j || assigned.has(j)) return;
      
      const dx = point.px - otherPoint.px;
      const dy = point.py - otherPoint.py;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= clusterDistance) {
        // Add to cluster
        cluster.count += 1;
        cluster.points.push(otherPoint);
        
        // Update cluster center (weighted average)
        cluster.x = (cluster.x * (cluster.count - 1) + otherPoint.px) / cluster.count;
        cluster.y = (cluster.y * (cluster.count - 1) + otherPoint.py) / cluster.count;
        
        assigned.add(j);
      }
    });
  });
  
  return clusters;
};

const TacticalOverlayMap = ({ layers, setSelectedIncident, cities = [] }) => {
  const containerRef = useRef();
  const svgRef = useRef();
  const mapGroupRef = useRef();
  const zoomRef = useRef(null);
  const currentZoomRef = useRef(1);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [currentZoom, setCurrentZoom] = useState(1);
  const [needsUpdate, setNeedsUpdate] = useState({
    incidents: true,
    offensives: true,
    settlements: true,
    cities: true,
    baseMap: true
  });

  const { baseGeo, incidents } = useIncidentMapData();
  const { offensives, settlements } = useOverlayData();

  // Modified resize observer to use more width and create a full-width effect
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleResize = () => {
      // Get the viewport width and use almost all of it
      const viewportWidth = window.innerWidth;
      
      // Use 98% of the viewport width, pushing beyond typical content boundaries
      const width = Math.min(viewportWidth * 0.98, 2400); // Limit max width to 2400px
      
      // Height adjusted to maintain appropriate aspect ratio (typically map is ~1:2 ratio)
      const height = width * 0.5;
      
      setDimensions({ width, height });
    };
    
    // Call immediately
    handleResize();
    
    // Set up the resize observer
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    
    // Set up window resize listener as backup
    window.addEventListener('resize', handleResize);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Memoize projection to avoid recalculating it unnecessarily
  const { projection, path } = useMemo(() => {
    if (!baseGeo || !dimensions.width) return { projection: null, path: null };
    
    const projection = d3.geoNaturalEarth1().fitSize([dimensions.width, dimensions.height], baseGeo);
    const path = d3.geoPath().projection(projection);
    
    return { projection, path };
  }, [baseGeo, dimensions.width, dimensions.height]);

  // First sample data to reduce the dataset size (performance optimization)
  const sampledData = useMemo(() => {
    // Apply sampling based on data size - use higher sampling for very large datasets
    const sampleMaxPoints = {
      incidents: 1500,
      offensives: 500,
      settlements: 700,
      cities: 300
    };
    
    return {
      incidents: sampleData(incidents, currentZoom, sampleMaxPoints.incidents),
      offensives: sampleData(offensives, currentZoom, sampleMaxPoints.offensives),
      settlements: sampleData(settlements, currentZoom, sampleMaxPoints.settlements),
      cities: sampleData(cities, currentZoom, sampleMaxPoints.cities)
    };
  }, [incidents, offensives, settlements, cities, currentZoom]);

  // Then create clusters for visualization (visual optimization)
  const clusteredData = useMemo(() => {
    if (!projection) return {};
    
    // Only cluster at lower zoom levels, show individual points at higher zoom
    const showIndividualPoints = currentZoom >= 3;
    
    return {
      incidents: showIndividualPoints 
        ? sampledData.incidents.map(d => ({ ...d, count: 1, points: [d] }))
        : createClusters(sampledData.incidents, projection, 30, currentZoom),
      
      offensives: showIndividualPoints 
        ? sampledData.offensives.map(d => ({ ...d, count: 1, points: [d] }))
        : createClusters(sampledData.offensives, projection, 30, currentZoom),
      
      settlements: showIndividualPoints 
        ? sampledData.settlements.map(d => ({ ...d, count: 1, points: [d] }))
        : createClusters(sampledData.settlements, projection, 30, currentZoom),
      
      cities: showIndividualPoints
        ? sampledData.cities.map(d => ({ ...d, count: 1, points: [d] }))
        : createClusters(sampledData.cities, projection, 30, currentZoom)
    };
  }, [sampledData, projection, currentZoom]);

  // Debug stats for performance monitoring
  const stats = useMemo(() => {
    return {
      originalCounts: {
        incidents: incidents?.length || 0,
        offensives: offensives?.length || 0,
        settlements: settlements?.length || 0,
        cities: cities?.length || 0
      },
      sampledCounts: {
        incidents: sampledData.incidents?.length || 0,
        offensives: sampledData.offensives?.length || 0,
        settlements: sampledData.settlements?.length || 0,
        cities: sampledData.cities?.length || 0
      },
      clusterCounts: {
        incidents: clusteredData.incidents?.length || 0,
        offensives: clusteredData.offensives?.length || 0,
        settlements: clusteredData.settlements?.length || 0,
        cities: clusteredData.cities?.length || 0
      }
    };
  }, [incidents, offensives, settlements, cities, sampledData, clusteredData]);

  // Initialize SVG and zoom behavior only once
  useEffect(() => {
    if (!svgRef.current || !projection) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create main group for zooming
    const g = svg.append('g');
    mapGroupRef.current = g;
    
    // Create layer groups that will persist
    g.append('g').attr('class', 'base-map-layer');
    g.append('g').attr('class', 'incidents-layer');
    g.append('g').attr('class', 'offensives-layer');
    g.append('g').attr('class', 'settlements-layer');
    g.append('g').attr('class', 'cities-layer');
    
    // Set up zoom behavior only once
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        
        // Update current zoom level and trigger resampling if significant change
        const newZoom = event.transform.k;
        currentZoomRef.current = newZoom;
        
        // Only update if zoom changed significantly (avoid constant updates)
        if (Math.abs(newZoom - currentZoom) > 0.5) {
          setCurrentZoom(newZoom);
          setNeedsUpdate({
            incidents: true,
            offensives: true,
            settlements: true,
            cities: true,
            baseMap: false // Base map doesn't need resampling
          });
        }
      });
    
    svg.call(zoom);
    zoomRef.current = zoom;
    
    // Flag all layers as needing update
    setNeedsUpdate({
      incidents: true,
      offensives: true,
      settlements: true,
      cities: true,
      baseMap: true
    });
    
  }, [projection]); // Only re-run when projection changes

  // Draw base map only when necessary
  useEffect(() => {
    if (!baseGeo || !path || !mapGroupRef.current || !needsUpdate.baseMap) return;
    
    const baseMapLayer = d3.select(mapGroupRef.current.node()).select('.base-map-layer');
    baseMapLayer.selectAll('*').remove();
    
    baseMapLayer.selectAll('path')
      .data(baseGeo.features)
      .join('path')
      .attr('d', path)
      .attr('fill', '#e6f0ff')
      .attr('stroke', '#b3cde0');
    
    // Mark base map as updated
    setNeedsUpdate(prev => ({ ...prev, baseMap: false }));
  }, [baseGeo, path, needsUpdate.baseMap]);

  // Handle zooming to a cluster
  const zoomToCluster = useCallback((cluster) => {
    if (!zoomRef.current || !cluster || !cluster.points || cluster.points.length <= 1 || !projection) return;
    
    // Calculate bounding box of points in the cluster
    const extent = d3.extent(cluster.points, p => {
      const coords = p.Longitude !== undefined 
        ? [p.Longitude, p.Latitude] 
        : [p.lon, p.lat];
      return projection(coords)[0];
    });
    
    const yExtent = d3.extent(cluster.points, p => {
      const coords = p.Longitude !== undefined 
        ? [p.Longitude, p.Latitude] 
        : [p.lon, p.lat];
      return projection(coords)[1];
    });
    
    // Get the SVG dimensions
    const width = dimensions.width;
    const height = dimensions.height;
    
    // Calculate zoom level to show the cluster (with padding)
    const dx = Math.max(30, extent[1] - extent[0]);
    const dy = Math.max(30, yExtent[1] - yExtent[0]);
    const scale = Math.min(
      0.9 * width / dx,
      0.9 * height / dy
    );
    
    // Zoom to the cluster
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(8, Math.max(3, scale))) // Limit scale
          .translate(-(extent[0] + extent[1]) / 2, -(yExtent[0] + yExtent[1]) / 2)
      );
  }, [projection, dimensions]);

  // Update incidents layer
  useEffect(() => {
    if (!projection || !mapGroupRef.current || !needsUpdate.incidents) return;
    if (!clusteredData.incidents || clusteredData.incidents.length === 0) return;
    
    const incidentsLayer = d3.select(mapGroupRef.current.node()).select('.incidents-layer');
    const shouldDisplay = layers.attacks;
    
    // Toggle visibility based on layer control
    incidentsLayer.style('display', shouldDisplay ? null : 'none');
    
    if (shouldDisplay) {
      // Clear previous incidents
      incidentsLayer.selectAll('*').remove();
      
      // Create the marker groups
      const markers = incidentsLayer
        .selectAll('g.incident-marker')
        .data(clusteredData.incidents)
        .join('g')
        .attr('class', 'incident-marker')
        .attr('transform', d => {
          // Handle both individual points and clusters
          const coords = d.originalCoords || (d.Longitude ? [d.Longitude, d.Latitude] : [d.lon, d.lat]);
          const [x, y] = projection(coords);
          return `translate(${x},${y})`;
        })
        .on('click', (_, d) => {
          // If this is a cluster with multiple points, zoom to it
          if (d.count > 1 && d.points && d.points.length > 0) {
            zoomToCluster(d);
          } else if (d.points && d.points.length === 1) {
            // For a single point, show incident details
            const point = d.points[0];
            setSelectedIncident({ ...point, type: 'incident' });
          } else {
            // Fall back to the point itself if it's not a cluster structure
            setSelectedIncident({ ...d, type: 'incident' });
          }
        });
      
      // For individual points (when zoomed in)
      markers.filter(d => d.count === 1)
        .append('circle')
        .attr('r', 4)
        .attr('fill', '#2171B5')
        .attr('stroke', '#08306B')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.85)
        .on('mouseover', function() {
          d3.select(this).attr('r', 6);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 4);
        });
      
      // For clusters (when zoomed out)
      const clusters = markers.filter(d => d.count > 1);
      
      // Circle with size proportional to point count
      clusters.append('circle')
        .attr('r', d => Math.min(20, 4 + Math.sqrt(d.count) * 2))
        .attr('fill', '#2171B5')
        .attr('stroke', '#08306B')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.85)
        .on('mouseover', function() {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.85);
        });
      
      // Add count label for clusters with enough points
      clusters.filter(d => d.count >= 3)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(d => d.count);
    }
    
    // Mark incidents as updated
    setNeedsUpdate(prev => ({ ...prev, incidents: false }));
  }, [clusteredData.incidents, projection, layers.attacks, needsUpdate.incidents, setSelectedIncident, zoomToCluster]);

  // Update offensives layer
  useEffect(() => {
    if (!projection || !mapGroupRef.current || !needsUpdate.offensives) return;
    if (!clusteredData.offensives || clusteredData.offensives.length === 0) return;
    
    const offensivesLayer = d3.select(mapGroupRef.current.node()).select('.offensives-layer');
    const shouldDisplay = layers.offensives;
    
    // Toggle visibility based on layer control
    offensivesLayer.style('display', shouldDisplay ? null : 'none');
    
    if (shouldDisplay) {
      // Clear previous offensives
      offensivesLayer.selectAll('*').remove();
      
      // Create the marker groups
      const markers = offensivesLayer
        .selectAll('g.offensive-marker')
        .data(clusteredData.offensives)
        .join('g')
        .attr('class', 'offensive-marker')
        .attr('transform', d => {
          // Handle both individual points and clusters
          const coords = d.originalCoords || [d.lon, d.lat];
          const [x, y] = projection(coords);
          return `translate(${x},${y})`;
        })
        .on('click', (_, d) => {
          // If this is a cluster with multiple points, zoom to it
          if (d.count > 1 && d.points && d.points.length > 0) {
            zoomToCluster(d);
          } else if (d.points && d.points.length === 1) {
            // For a single point, show offensive details
            const point = d.points[0];
            setSelectedIncident({
              type: 'military',
              name: point.name,
              date: point.date,
              coordinates: [point.lon, point.lat],
            });
          } else {
            // Fall back to the point itself if it's not a cluster structure
            setSelectedIncident({
              type: 'military',
              name: d.name,
              date: d.date,
              coordinates: [d.lon, d.lat],
            });
          }
        });
      
      // For individual points (when zoomed in)
      markers.filter(d => d.count === 1)
        .append('circle')
        .attr('r', 5)
        .attr('fill', '#08306B')
        .attr('opacity', 0.85)
        .on('mouseover', function() {
          d3.select(this).attr('r', 7);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
        });
      
      // For clusters (when zoomed out)
      const clusters = markers.filter(d => d.count > 1);
      
      // Circle with size proportional to point count
      clusters.append('circle')
        .attr('r', d => Math.min(20, 5 + Math.sqrt(d.count) * 2))
        .attr('fill', '#08306B')
        .attr('stroke', '#08306B')
        .attr('stroke-width', 1)
        .attr('opacity', 0.85)
        .on('mouseover', function() {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.85);
        });
      
      // Add count label for clusters with enough points
      clusters.filter(d => d.count >= 3)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(d => d.count);
    }
    
    // Mark offensives as updated
    setNeedsUpdate(prev => ({ ...prev, offensives: false }));
  }, [clusteredData.offensives, projection, layers.offensives, needsUpdate.offensives, setSelectedIncident, zoomToCluster]);

  // Update settlements layer
  useEffect(() => {
    if (!projection || !mapGroupRef.current || !needsUpdate.settlements) return;
    if (!clusteredData.settlements || clusteredData.settlements.length === 0) return;
    
    const settlementsLayer = d3.select(mapGroupRef.current.node()).select('.settlements-layer');
    const shouldDisplay = layers.settlements;
    
    // Toggle visibility based on layer control
    settlementsLayer.style('display', shouldDisplay ? null : 'none');
    
    if (shouldDisplay) {
      // Clear previous settlements
      settlementsLayer.selectAll('*').remove();
      
      // Create the marker groups
      const markers = settlementsLayer
        .selectAll('g.settlement-marker')
        .data(clusteredData.settlements)
        .join('g')
        .attr('class', 'settlement-marker')
        .attr('transform', d => {
          // Handle both individual points and clusters
          const coords = d.originalCoords || [d.lon, d.lat];
          const [x, y] = projection(coords);
          return `translate(${x},${y})`;
        })
        .on('click', (_, d) => {
          // If this is a cluster with multiple points, zoom to it
          if (d.count > 1 && d.points && d.points.length > 0) {
            zoomToCluster(d);
          } else if (d.points && d.points.length === 1) {
            // For a single point, show settlement details
            const point = d.points[0];
            setSelectedIncident({
              type: 'settlement',
              name: point.name || 'Unknown',
              country: point.country || 'Unknown',
              coordinates: [point.lon, point.lat],
            });
          } else {
            // Fall back to the point itself if it's not a cluster structure
            setSelectedIncident({
              type: 'settlement',
              name: d.name || 'Unknown',
              country: d.country || 'Unknown',
              coordinates: [d.lon, d.lat],
            });
          }
        });
      
      // For individual points (when zoomed in)
      markers.filter(d => d.count === 1)
        .append('circle')
        .attr('r', d => Math.sqrt(d.points?.[0]?.density || d.density || 1) * 0.5)
        .attr('fill', '#BFDFFF')
        .attr('stroke', '#6CA0DC')
        .attr('stroke-width', 0.7)
        .on('mouseover', function(_, d) {
          const density = d.points?.[0]?.density || d.density || 1;
          d3.select(this).attr('r', Math.sqrt(density) * 0.7);
        })
        .on('mouseout', function(_, d) {
          const density = d.points?.[0]?.density || d.density || 1;
          d3.select(this).attr('r', Math.sqrt(density) * 0.5);
        });
      
      // For clusters (when zoomed out)
      const clusters = markers.filter(d => d.count > 1);
      
      // Calculate average density for the cluster
      clusters.each(function(d) {
        d.avgDensity = d.points.reduce((sum, p) => sum + (p.density || 1), 0) / d.points.length;
      });
      
      // Circle with size proportional to point count and density
      clusters.append('circle')
        .attr('r', d => Math.min(20, 4 + Math.sqrt(d.count * (d.avgDensity || 1)) * 0.5))
        .attr('fill', '#BFDFFF')
        .attr('stroke', '#6CA0DC')
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)
        .on('mouseover', function(_, d) {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function(_, d) {
          d3.select(this).attr('opacity', 0.9);
        });
      
      // Add count label for clusters with enough points
      clusters.filter(d => d.count >= 3)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', '#08306B')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .text(d => d.count);
    }
    
    // Mark settlements as updated
    setNeedsUpdate(prev => ({ ...prev, settlements: false }));
  }, [clusteredData.settlements, projection, layers.settlements, needsUpdate.settlements, setSelectedIncident, zoomToCluster]);

  // Update cities layer
  useEffect(() => {
    if (!projection || !mapGroupRef.current || !needsUpdate.cities) return;
    if (!clusteredData.cities || clusteredData.cities.length === 0) return;
    
    const citiesLayer = d3.select(mapGroupRef.current.node()).select('.cities-layer');
    const shouldDisplay = layers.cities;
    
    // Toggle visibility based on layer control
    citiesLayer.style('display', shouldDisplay ? null : 'none');
    
    if (shouldDisplay) {
      // Clear previous cities
      citiesLayer.selectAll('*').remove();
      
      // Create the marker groups
      const markers = citiesLayer
        .selectAll('g.city-marker')
        .data(clusteredData.cities)
        .join('g')
        .attr('class', 'city-marker')
        .attr('transform', d => {
          // Handle both individual points and clusters
          const coords = d.originalCoords || [d.lon, d.lat];
          const [x, y] = projection(coords);
          return `translate(${x},${y})`;
        })
        .on('click', (_, d) => {
          // If this is a cluster with multiple points, zoom to it
          if (d.count > 1 && d.points && d.points.length > 0) {
            zoomToCluster(d);
          } else if (d.points && d.points.length === 1) {
            // For a single point, show city details
            const point = d.points[0];
            setSelectedIncident({
              type: 'city',
              name: point.name,
              population: point.population,
              coordinates: [point.lon, point.lat],
            });
          } else {
            // Fall back to the point itself if it's not a cluster structure
            setSelectedIncident({
              type: 'city',
              name: d.name,
              population: d.population,
              coordinates: [d.lon, d.lat],
            });
          }
        });
      
      // For individual points (when zoomed in)
      markers.filter(d => d.count === 1)
        .append('circle')
        .attr('r', 4)
        .attr('fill', 'orange')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.8)
        .on('mouseover', function() {
          d3.select(this).attr('r', 6);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 4);
        });
      
      // For clusters (when zoomed out)
      const clusters = markers.filter(d => d.count > 1);
      
      // Circle with size proportional to point count
      clusters.append('circle')
        .attr('r', d => Math.min(20, 5 + Math.sqrt(d.count) * 1.5))
        .attr('fill', 'orange')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .on('mouseover', function() {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.8);
        });
      
      // Add count label for clusters with enough points
      clusters.filter(d => d.count >= 3)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', '#333')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(d => d.count);
    }
    
    // Mark cities as updated
    setNeedsUpdate(prev => ({ ...prev, cities: false }));
  }, [clusteredData.cities, projection, layers.cities, needsUpdate.cities, setSelectedIncident, zoomToCluster]);

  // Trigger updates when layers are toggled
  useEffect(() => {
    setNeedsUpdate(prev => ({
      ...prev,
      incidents: true,
      offensives: true,
      settlements: true,
      cities: true
    }));
  }, [layers]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100vw',              // Take the full viewport width
        position: 'relative',        // Position relative for absolute positioning
        left: '50%',                 // Center the box
        right: '50%',                // Center the box
        marginLeft: '-50vw',         // Pull back to align with edge of viewport
        marginRight: '-50vw',        // Pull back to align with edge of viewport
        minHeight: '600px',          // Ensure minimum height
        padding: '0 1%',             // Small padding on sides
        boxSizing: 'border-box'      // Include padding in width calculation
      }}
    >
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        style={{ 
          display: 'block',
          width: '100%',
          height: 'auto',
          maxWidth: 'none'            // Allow it to expand beyond usual constraints
        }}
      />
      {/* Optional performance monitor - uncomment for debugging */}
      {/* <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(255,255,255,0.8)', padding: 5, fontSize: '10px', fontFamily: 'monospace' }}>
        Zoom: {currentZoom.toFixed(1)} | 
        Visible: {
          Object.values(clusteredData)
            .reduce((total, layer) => total + (layer?.length || 0), 0)
        } | 
        Reduction: {
          Math.round(
            (1 - Object.values(clusteredData).reduce((total, layer) => total + (layer?.length || 0), 0) / 
             Object.values(stats.originalCounts).reduce((total, count) => total + count, 0)) * 100
          )}%
      </div> */}
    </div>
  );
};

export default React.memo(TacticalOverlayMap);