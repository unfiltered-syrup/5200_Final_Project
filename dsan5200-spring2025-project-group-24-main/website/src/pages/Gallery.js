// src/pages/Gallery.js
import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import GalleryGrid from '../components/GalleryGrid';
import { motion } from 'framer-motion';

const GalleryPage = () => {
  return (
    <Container maxWidth="lg">
      <Box mt={6} mb={2}>
        <Button component={Link} to="/" variant="outlined" color="primary">
          ← Back to Home
        </Button>
      </Box>

      <Box mt={2} mb={4} textAlign="center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" gutterBottom>
            EDA Gallery
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Browse visual insights from the exploratory data analysis
          </Typography>
        </motion.div>
      </Box>

      <Box>
        <GalleryGrid animateOnScroll={true} />
      </Box>
    </Container>
  );
};

export default GalleryPage;