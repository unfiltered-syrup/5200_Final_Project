import React, { useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Typography
} from '@mui/material';

const IncidentFilterPanel = ({ filters, setFilters, yearOptions, motiveOptions, typeOptions, actorOptions }) => {

  // Utility to remove blank/empty options
  const sanitize = (arr) => arr.filter(v => v && String(v).trim() !== '');

  // All options cleaned and sorted
  const allOptions = {
    year: sanitize(yearOptions).sort((a, b) => a - b),
    motive: sanitize(motiveOptions).sort(),
    type: sanitize(typeOptions).sort(),
    actor: sanitize(actorOptions).sort()
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    if (value.includes('All')) {
      setFilters(prev => ({ ...prev, [field]: allOptions[field] }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const categories = [
    { label: 'Year', field: 'year' },
    { label: 'Motive', field: 'motive' },
    { label: 'Type', field: 'type' },
    { label: 'Actor', field: 'actor' }
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
      {categories.map(({ label, field }) => {
        const options = allOptions[field];
        const selected = filters[field];

        return (
          <FormControl key={field} fullWidth sx={{ minWidth: 180, flex: 1 }}>
            <InputLabel>{label}</InputLabel>
            <Select
              multiple
              value={selected}
              onChange={handleChange(field)}
              input={<OutlinedInput label={label} />}
              renderValue={(selected) =>
                selected.length === options.length
                  ? `All ${label}s`
                  : selected.join(', ')
              }
            >
              <MenuItem value="All">
                <Checkbox checked={selected.length === options.length} />
                <ListItemText primary={`Select All ${label}s`} />
              </MenuItem>

              {options.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">No options available</Typography>
                </MenuItem>
              ) : (
                options.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    <Checkbox checked={selected.includes(opt)} />
                    <ListItemText primary={String(opt)} />
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        );
      })}
    </Box>
  );
};

export default IncidentFilterPanel;
