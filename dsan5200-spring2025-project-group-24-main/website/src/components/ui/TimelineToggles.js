// src/components/ui/TimelineToggles.js
import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import { timelineLayerColors } from '../../theme/themeUtils';

const TimelineToggles = ({ filters, setFilters }) => {
  const theme = useTheme();
  const colors = timelineLayerColors(theme);

  const toggleOptions = [
    { key: 'showCasualties', label: 'CASUALTIES', color: colors.casualties },
    { key: 'showHolidays', label: 'RELIGIOUS HOLIDAYS', color: colors.holidays },
    { key: 'showSpikePeriods', label: 'SPIKE PERIODS', color: colors.spikes },
    { key: 'showTotalIncidents', label: 'TOTAL INCIDENTS', color: colors.total }
  ];

  const visibleKeys = toggleOptions
    .filter(opt => filters[opt.key])
    .map(opt => opt.key);

  const handleToggle = (event, newKeys) => {
    if (!newKeys.length) return;
    const updated = {};
    toggleOptions.forEach(({ key }) => {
      updated[key] = newKeys.includes(key);
    });
    setFilters(updated);
  };

  return (
    <Box display="flex" justifyContent="center" width="100%" mb={2}>
      <ToggleButtonGroup
        value={visibleKeys}
        onChange={handleToggle}
        aria-label="timeline layer visibility"
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
        {toggleOptions.map(({ key, label }) => (
          <ToggleButton
            key={key}
            value={key}
            sx={{
              flex: 1,
              py: 2,
              px: 2,
              color: theme.palette.text.primary,
              backgroundColor: visibleKeys.includes(key)
                ? theme.palette.action.selected
                : theme.palette.background.paper,
              '&:hover': {
                backgroundColor: visibleKeys.includes(key)
                  ? theme.palette.action.selected
                  : theme.palette.action.hover,
              },
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default TimelineToggles;