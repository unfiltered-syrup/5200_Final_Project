import React, { useState, useEffect } from 'react';
import TimelineChart from './TimelineChart';
import IncidentSidebar from '../ui/IncidentSidebar';
import { Box, Typography, CircularProgress } from '@mui/material';

const TimelineSection = () => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/data/timeline_combined.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch timeline data: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setTimelineData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load timeline data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleEventClick = (eventData) => {
    console.log("Event clicked:", eventData); // Debug logging
    
    const formattedIncident = {
      Country: eventData.country,
      Year: new Date(eventData.date).getFullYear(),
      Date: new Date(eventData.date).toDateString(),
      Motive: eventData.description,
      'Incident Type': eventData.timeline_type,
      ActorType: eventData.actor_type || 'N/A',
      Notes: eventData.description,
      Region: eventData.region || 'N/A',
      Fatalities: eventData.fatalities || 0
    };
    setSelectedIncident(formattedIncident);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          Error loading timeline data: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TimelineChart data={timelineData} onEventClick={handleEventClick} />
      {selectedIncident && (
        <IncidentSidebar
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </Box>
  );
};

export default TimelineSection;