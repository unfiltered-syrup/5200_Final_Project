// src/components/NarrativeContainer.js
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const NarrativeContainer = styled(Box)(({ theme }) => ({
  maxWidth: '800px',                     // Comfortable reading width
  margin: '0.5rem auto',                   // Vertical spacing + horizontal centering
  padding: theme.spacing(1.5),           // Less padding than before
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),           // Smaller padding on mobile
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  textAlign: 'left',
}));

export default NarrativeContainer;
