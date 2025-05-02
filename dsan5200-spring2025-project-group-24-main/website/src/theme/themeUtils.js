// src/theme/themeUtils.js
export const getCurrentTheme = (theme) => {
  if (!theme) return 'light';
  return theme.palette.mode;
};

export const timelineLayerColors = (theme) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    casualties: isDark ? '#4FC3F7' : '#1565C0',   // cool bright blue (lighter/more cyan)
    holidays:   isDark ? '#B3E5FC' : '#BBDEFB',   // soft light pastel blue
    spikes:     isDark ? '#1976D2' : '#0D47A1',   // darker, bold navy for contrast
    total:      isDark ? '#0A2342' : '#102A43',   // deep slate/navy for total line
  };
};
