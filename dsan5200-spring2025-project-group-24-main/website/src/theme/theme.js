// src/theme/theme.js
import { createTheme } from '@mui/material/styles';

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: {
              default: '#f7f9fa',
              paper: '#ffffff'
            },
            text: {
              primary: '#212121', // Using the exact color you specified
              secondary: '#555555'
            },
            custom: {
              tooltipBg: '#ffffff',
              tooltipText: '#333333',
              chartAccent: '#3A88B2',
              danger: '#D85F5F'
            }
          }
        : {
            background: {
              default: '#121212',
              paper: '#1e1e1e'
            },
            text: {
              primary: '#f2f2f2',
              secondary: '#cccccc'
            },
            custom: {
              tooltipBg: '#2a2a2a',
              tooltipText: '#efefef',
              chartAccent: '#5AA8CF',
              danger: '#FF6666'
            }
          })
    },
    typography: {
      fontFamily:
        '"GT-Zirkon-Regular", "Neue Haas Unica Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: 20,
      body1: {
        fontSize: '20opx',
        lineHeight: '1.6', // or you could use a numeric value (e.g., 1.6)
        fontFamily: '"GT-Zirkon-Regular", sans-serif'
      },
      // Updated Heading Styles using CSS Variables
      h1: {
        fontSize: 'var(--h00)', // 3.5rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h2: {
        fontSize: 'var(--h1)', // 2.5rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h3: {
        fontSize: 'var(--h2)', // 1.5rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h4: {
        fontSize: 'var(--h3)', // 1rem
        fontWeight: 600,
        lineHeight: 1.2
      },
      h5: {
        fontSize: 'var(--h4)', // 0.875rem
        fontWeight: 500,
        lineHeight: 1.3
      },
      h6: {
        fontSize: 'var(--h5)', // 0.75 rem
        fontWeight: 500,
        lineHeight: 1.3
      }
    }
  });

export default getTheme;

