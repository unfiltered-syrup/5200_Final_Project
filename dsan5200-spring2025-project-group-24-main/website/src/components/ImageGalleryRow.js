import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const ImageGalleryRow = () => {
  // Image data with sources and captions
  const images = [
    {
      src: '/images/general/gazaBombs.png',
      alt: 'Gaza Bombing',
      caption: 'Palestinians inspect the rubble of a school turned UN-run shelter targeted by an Israeli air strike. [Fatima Shbair/AP Photo]'
    },
    {
      src: '/images/general/congo.png',
      alt: 'Congo UN Protest',
      caption: 'Congolese protesters are seen inside the United Nations Mission for the Stabilisation of Congo (MONUSCO) after several were killed when UN peacekeepers opened fire in eastern DR Congo [Glody Murhabazi, AFP]'
    },
    {
      src: '/images/general/afganistan.png',
      alt: 'Afghanistan Attack',
      caption: 'Five security personnel killed in an attack on the Kabul-Jalalabad Road while escorting a United Nation\'s convoy. [AP]'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Box sx={{ width: '100%', px: 2, pb: 1, mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          {images.map((image, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  boxShadow: 3,
                  height: { xs: '250px', md: '300px' },
                  width: '100%',
                  backgroundColor: 'background.paper',
                }}
              >
                <Box
                  component="img"
                  src={image.src}
                  alt={image.alt}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                component="p"
                align="center"
                sx={{
                  mt: 1.5,
                  px: 1,
                  fontStyle: 'italic',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  lineHeight: 1.3,
                }}
              >
                {image.caption}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </motion.div>
  );
};

export default ImageGalleryRow;