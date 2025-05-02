// src/d3/timelineUtils.js
export const parseTimelineData = (rows) => {
    return rows.map(d => ({
      date: new Date(d.date),
      casualties: +d.casualties || 0,
      incidents: +d.incidents || 0,
      holiday: d.holiday === true || d.holiday === 'true',
      spike: d.spike === true || d.spike === 'true',
    }));
  };
  
