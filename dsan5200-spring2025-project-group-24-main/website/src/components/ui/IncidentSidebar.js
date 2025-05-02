// src/components/ui/IncidentSidebar.js
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const IncidentSidebar = ({ incident, onClose }) => {
  if (!incident) return null;  // If no incident is selected, render nothing

  // Ensure that coordinates are properly handled
  const hasCoordinates = incident.coordinates && incident.coordinates.length === 2;
  const latitude = hasCoordinates ? incident.coordinates[1] : 'N/A';
  const longitude = hasCoordinates ? incident.coordinates[0] : 'N/A';

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '10%',
        right: '2%',
        width: 300,
        backgroundColor: 'white',
        padding: 2,
        boxShadow: 3,
        borderRadius: 2,
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <IconButton
        edge="end"
        color="inherit"
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
        }}
      >
        <CloseIcon />
      </IconButton>

      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {incident.type === 'settlement' && 'Civilian Settlement'}
        {incident.type === 'military' && 'Military Offensive'}
        {incident.type === 'incident' && 'Security Incident'}
      </Typography>

      {/* Show civilian settlement information */}
      {incident.type === 'settlement' && (
        <>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Name:</strong> {incident.name}
          </Typography>
          <Typography variant="body2">
            <strong>Country:</strong> {incident.country}
          </Typography>
          <Typography variant="body2">
            <strong>Coordinates:</strong> Lat: {latitude}, Lon: {longitude}
          </Typography>
        </>
      )}

      {/* Show military incident details */}
      {incident.type === 'military' && (
        <>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Name:</strong> {incident.name}
          </Typography>
          <Typography variant="body2">
            <strong>Date:</strong> {incident.date}
          </Typography>
          <Typography variant="body2">
            <strong>Coordinates:</strong> Lat: {latitude}, Lon: {longitude}
          </Typography>
        </>
      )}

      {/* Show regular incident details */}
      {incident.type === 'incident' && (
        <>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Description:</strong> {incident.description}
          </Typography>
          <Typography variant="body2">
            <strong>Coordinates:</strong> Lat: {latitude}, Lon: {longitude}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default IncidentSidebar;
