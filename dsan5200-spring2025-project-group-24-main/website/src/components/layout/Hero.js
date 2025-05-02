import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <Box
      id="intro"
      sx={{
        height: '70vh', // Adjust height for horizontal image look
        width: '100%',
        backgroundImage: `url(${require('../../assets/images/hero-bg.jpg')})`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textShadow: '0 2px 8px rgba(0,0,0,0.7)', 
      }}
    >
      {/* Overlay for better contrast */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', // Darker overlay for better readability
        }}
      />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ fontWeight: 'bold', color: 'white' }}
          >
            Navigating Turbulence
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ mb: 4, fontWeight: 'bold', color: 'white' }} // Thicker secondary text
          >
            4,337 Security Incidents Affecting Humanitarian Work (1997–2024)
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ maxWidth: 600, margin: '0 auto', fontWeight: '500', color: 'white' }} // Thicker secondary text
          >
            We analyzed over two decades of data to understand where, when, and why humanitarian workers face rising risks.
          </Typography>
          {/* Removed the Play Video button */}
          <Box mt={4}>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Typography variant="h6">↓ Scroll to explore</Typography>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Hero;
