import React, { useEffect, useState, useContext } from 'react';
import { CssBaseline, Container } from '@mui/material';
import * as d3 from 'd3';
import { Routes, Route } from 'react-router-dom';
import { ColorModeContext } from './theme/ColorModeContext';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import Footer from './components/layout/Footer';
import GalleryGrid from './components/GalleryGrid';
import Scrollytelling from './components/Scrollytelling';

import getDataPath from './utils/getDataPath';
import './styles/main.css';

const App = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    year: [],
    motive: [],
    type: [],
    actor: [],
  });

  const { toggleColorMode } = useContext(ColorModeContext);

  useEffect(() => {
        d3.csv(getDataPath('data/full_country_stats_with_sea_level.csv')).then(setData);
        }, []);

  return (
    <>
      <CssBaseline />
      <Header darkMode={false} toggleDarkMode={toggleColorMode} />

      <Routes>
        {/* Homepage route */}
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Container maxWidth="xl" sx={{ scrollSnapType: 'y mandatory', p: 0 }}>
                <Scrollytelling data={data} filters={filters} setFilters={setFilters} />
              </Container>
              <Footer />
            </>
          }
        />

        {/* GalleryGrid route */}
        <Route
          path="/gallerygrid"
          element={
            <>
              <Container maxWidth="xl" sx={{ pt: { xs: 16, md: 20 }, pb: 8 }}>
                <GalleryGrid />
              </Container>
              <Footer />
            </>
          }
        />
      </Routes>
    </>
  );
};

export default App;
