// src/components/ui/LayerToggles.js
import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from '@mui/material';

const LayerToggles = ({ showMilitary, showSettlements, showIncidents, showCities, onToggle }) => {
  const theme = useTheme();
  
  // Define the toggle options and their colors
  const toggleOptions = [
    { key: 'attacks', label: 'INCIDENT MARKERS', active: showIncidents, color: '#2171B5' },
    { key: 'offensives', label: 'MILITARY OFFENSIVES', active: showMilitary, color: '#08306B' },
    { key: 'settlements', label: 'CIVILIAN SETTLEMENTS', active: showSettlements, color: '#6CA0DC' },
  ];
  
  // Get currently active keys
  const visibleKeys = toggleOptions
    .filter(opt => opt.active)
    .map(opt => opt.key);
  
  const handleToggle = (event, newKeys) => {
    // Prevent deselecting all layers
    if (!newKeys.length) return;
    
    // Calculate which layers changed
    toggleOptions.forEach(option => {
      const wasActive = visibleKeys.includes(option.key);
      const isNowActive = newKeys.includes(option.key);
      
      // If the state changed, call the toggle handler
      if (wasActive !== isNowActive) {
        onToggle(option.key);
      }
    });
  };
  
  return (
    <Box 
      sx={{ 
        width: '100%',
        mb: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 600, mb: 4}}
      >
        Tactical Risk Assessment: Visualizing Humanitarian Exposure Zones
      </Typography>
      
      <ToggleButtonGroup
        value={visibleKeys}
        onChange={handleToggle}
        aria-label="map layer visibility"
        sx={{
          width: '100%',
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
        {toggleOptions.map(({ key, label, color }) => (
          <ToggleButton
            key={key}
            value={key}
            sx={{
              flex: 1,
              py: 1.2,
              px: 2,
              color: visibleKeys.includes(key) ? '#fff' : color,
              backgroundColor: visibleKeys.includes(key) ? color : 'transparent',
              '&:hover': {
                backgroundColor: visibleKeys.includes(key)
                  ? color
                  : `${color}22`, // Add transparency to hover color
              },
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default LayerToggles;