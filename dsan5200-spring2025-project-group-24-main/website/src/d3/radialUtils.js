import * as d3 from 'd3';

// Utility to get day of year
export function getDayOfYear(dateStr) {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Hardcoded Eid and Ramadan dates for fallback in case CSV loading fails
// These are the actual dates for Eid al-Fitr and Eid al-Adha for 2020-2023
const hardcodedHolidays = {
  eid: [
    // Eid al-Fitr dates
    { year: 2020, day: getDayOfYear('2020-05-24'), type: 'eid' },
    { year: 2021, day: getDayOfYear('2021-05-13'), type: 'eid' },
    { year: 2022, day: getDayOfYear('2022-05-03'), type: 'eid' },
    { year: 2023, day: getDayOfYear('2023-04-21'), type: 'eid' },
    // Eid al-Adha dates
    { year: 2020, day: getDayOfYear('2020-07-31'), type: 'eid' },
    { year: 2021, day: getDayOfYear('2021-07-20'), type: 'eid' },
    { year: 2022, day: getDayOfYear('2022-07-10'), type: 'eid' },
    { year: 2023, day: getDayOfYear('2023-06-28'), type: 'eid' },
  ],
  ramadan: [
    // Ramadan start and end dates
    { year: 2020, day: getDayOfYear('2020-04-24'), type: 'ramadan' },
    { year: 2020, day: getDayOfYear('2020-05-23'), type: 'ramadan' },
    { year: 2021, day: getDayOfYear('2021-04-13'), type: 'ramadan' },
    { year: 2021, day: getDayOfYear('2021-05-12'), type: 'ramadan' },
    { year: 2022, day: getDayOfYear('2022-04-02'), type: 'ramadan' },
    { year: 2022, day: getDayOfYear('2022-05-02'), type: 'ramadan' },
    { year: 2023, day: getDayOfYear('2023-03-23'), type: 'ramadan' },
    { year: 2023, day: getDayOfYear('2023-04-20'), type: 'ramadan' },
  ]
};

// Load holidays data from CSV using the provided getDataPath function
export function getHolidayDays(type, getDataPath) {
  // Use getDataPath to generate the correct path to CSV data
  const csvPath = getDataPath('data/Eid_and_Ramadan_Highlight_Days.csv');
  
  return d3.csv(csvPath)
    .then(raw => {
      console.log(`Raw holiday data for ${type}:`, raw.slice(0, 5)); // Log first 5 items
      
      const filteredDays = raw
        .filter(d => d.type === type)
        .map(d => ({
          year: parseInt(d.year),
          day: parseInt(d.day),
          type: d.type
        }));
      
      // Check if we have data for all years
      const years = [2020, 2021, 2022, 2023];
      const missingYears = years.filter(year => 
        !filteredDays.some(d => d.year === year)
      );
      
      if (missingYears.length > 0) {
        console.warn(`Missing ${type} data for years:`, missingYears);
        console.warn('Using hardcoded holidays as fallback for missing years');
        
        // Add hardcoded data for missing years
        const hardcodedForType = hardcodedHolidays[type];
        missingYears.forEach(year => {
          const hardcodedForYear = hardcodedForType.filter(d => d.year === year);
          filteredDays.push(...hardcodedForYear);
        });
      }
      
      console.log(`Processed ${type} holiday data:`, filteredDays);
      return filteredDays;
    })
    .catch(error => {
      console.error(`Error loading holiday data for ${type}:`, error);
      console.warn('Using hardcoded holidays as fallback');
      return hardcodedHolidays[type];
    });
}

// Utility function to check if a date is within a range of days from a target date
export function isDateWithinRange(dateStr, targetDateStr, range = 7) {
  const date = new Date(dateStr);
  const targetDate = new Date(targetDateStr);
  const dayMillis = 24 * 60 * 60 * 1000;
  
  return Math.abs(targetDate - date) <= range * dayMillis;
}