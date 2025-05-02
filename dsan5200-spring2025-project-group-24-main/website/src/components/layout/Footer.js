import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import CollectionsIcon from '@mui/icons-material/Collections';

const Footer = () => {
    return (
        <Box
            sx={{
                mt: 10,
                mb: 4,
                py: 3,
                borderTop: theme => `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2,
                    mb: 3,
                    flexWrap: 'wrap'
                }}
            >
                {/* GitHub Link */}
                <Box
                    component={MuiLink}
                    href="https://github.com/gu-dsan5200/dsan5200-spring2025-project-group-24"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1.5,
                        borderRadius: '4px',
                        border: theme => `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme => theme.palette.background.paper,
                        color: theme => theme.palette.text.primary,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover,
                            borderColor: theme => theme.palette.primary.main
                        }
                    }}
                >
                    <GitHubIcon fontSize="small" />
                    <Typography variant="body1">View on GitHub</Typography>
                </Box>

                {/* EDA Gallery Link */}
                <Box
                    component={MuiLink}
                    href="/gallerygrid"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1.5,
                        borderRadius: '4px',
                        border: theme => `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme => theme.palette.background.paper,
                        color: theme => theme.palette.text.primary,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover,
                            borderColor: theme => theme.palette.primary.main
                        }
                    }}
                >
                    <CollectionsIcon fontSize="small" />
                    <Typography variant="body1">EDA Gallery</Typography>
                </Box>

                {/* Sea Level Visualization Link */}
                <Box
                    component={MuiLink}
                    href="/sealevel_visualization.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1.5,
                        borderRadius: '4px',
                        border: theme => `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme => theme.palette.background.paper,
                        color: theme => theme.palette.text.primary,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover,
                            borderColor: theme => theme.palette.primary.main
                        }
                    }}
                >
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body1">Sea Level Visualization QMD</Typography>
                </Box>

                {/* Temperature Visualization Link */}
                <Box
                    component={MuiLink}
                    href="/temperature_visualization.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 3,
                        py: 1.5,
                        borderRadius: '4px',
                        border: theme => `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme => theme.palette.background.paper,
                        color: theme => theme.palette.text.primary,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover,
                            borderColor: theme => theme.palette.primary.main
                        }
                    }}
                >
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body1">Temperature Visualization QMD</Typography>
                </Box>
            </Box>

            {/* Copyright Text */}
            <Box>
                <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{
                        textAlign: 'center',
                        opacity: 0.8
                    }}
                >
                    © {new Date().getFullYear()} DSAN Scholarship Project. Built with D3, React, and Material UI.
                </Typography>
            </Box>
        </Box>
    );
};

export default Footer;
