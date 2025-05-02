import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  useTheme,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createTooltip, showTooltip, hideTooltip } from '../d3/tooltipUtils';
import { motion } from 'framer-motion';

const GalleryGrid = () => {
  const [images, setImages] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const tooltipRef = useRef();
  const theme = useTheme();

  useEffect(() => {
    fetch('/galleryData.json')
      .then(res => res.json())
      .then(setImages);
  }, []);

  useEffect(() => {
    tooltipRef.current = createTooltip();
  }, []);

  const types = ['All', ...new Set(images.map(img => img.type))];
  const categories = ['All', ...new Set(images.map(img => img.category))];

  const filtered = images.filter(img => {
    return (
      (selectedType === 'All' || img.type === selectedType) &&
      (selectedCategory === 'All' || img.category === selectedCategory)
    );
  });

  return (
    <Box sx={{ mt: { xs: 16, md: 5 }, px: 2 }}>
      <Divider sx={{ mb: 3, bgcolor: 'grey.300' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1} mb={3}>
          {types.map(type => (
            <Chip
              key={type}
              label={type}
              variant={selectedType === type ? 'filled' : 'outlined'}
              color="primary" // Blue theme
              onClick={() => setSelectedType(type)}
            />
          ))}
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1} mb={4}>
          {categories.map(cat => (
            <Chip
              key={cat}
              label={cat}
              variant={selectedCategory === cat ? 'filled' : 'outlined'}
              color="success" // Green theme
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </Box>
      </motion.div>

      <Divider sx={{ mb: 3, bgcolor: 'grey.300' }} />

      <Grid container spacing={3}>
        {filtered.map((img, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <Box
                sx={{
                  border: `1px solid ${theme.palette.grey[300]}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? theme.palette.grey[900]
                    : '#f0f4f8', // soft blue-grey
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: `0 4px 20px rgba(66, 165, 245, 0.3)` // light blue hover
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) =>
                  showTooltip(tooltipRef.current, e, `<strong>${img.title}</strong><br/>${img.description}`)
                }
                onMouseLeave={() => hideTooltip(tooltipRef.current)}
                onClick={() => {
                  setSelectedImage(img);
                  setOpen(true);
                }}
              >
                <img
                  src={img.src}
                  alt={img.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />

                <Box p={1}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {img.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.grey[600] }} noWrap>
                    {img.category}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Image Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedImage.title}
              <IconButton onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                style={{ width: '100%', borderRadius: 8 }}
              />
              <Typography variant="body2" mt={2}>
                {selectedImage.description}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GalleryGrid;
