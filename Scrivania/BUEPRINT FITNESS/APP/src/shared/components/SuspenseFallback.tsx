import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import React from 'react';

export interface SuspenseFallbackProps {
  /**
   * The type of layout to render for the skeleton
   * @default 'default'
   */
  variant?: 'default' | 'dashboard' | 'list' | 'form';
}

/**
 * A full-page loading component that renders appropriate skeleton layouts
 * for different page types while content is being loaded.
 */
export const SuspenseFallback = ({ variant = 'default' }: SuspenseFallbackProps) => {
  const renderSkeletonContent = () => {
    switch (variant) {
      case 'dashboard':
        return (
          <Grid container spacing={3}>
            {/* Header stats */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {[...Array(3)].map((_, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            {/* Main content area */}
            <Grid item xs={12} md={8}>
              <Skeleton variant='rectangular' height={400} sx={{ borderRadius: 2 }} />
            </Grid>
            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant='rectangular' height={200} sx={{ borderRadius: 2 }} />
                <Skeleton variant='rectangular' height={150} sx={{ borderRadius: 2 }} />
              </Box>
            </Grid>
          </Grid>
        );

      case 'list':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <Skeleton variant='text' height={40} width='60%' />
            {/* List items */}
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} variant='rectangular' height={80} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        );

      case 'form':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
            {/* Form title */}
            <Skeleton variant='text' height={32} width='40%' />
            {/* Form fields */}
            {[...Array(4)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Skeleton variant='text' height={20} width='30%' />
                <Skeleton variant='rectangular' height={56} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Skeleton variant='rectangular' height={36} width={80} sx={{ borderRadius: 1 }} />
              <Skeleton variant='rectangular' height={36} width={100} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        );

      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Page header */}
            <Skeleton variant='text' height={32} width='50%' />
            {/* Content blocks */}
            <Skeleton variant='rectangular' height={200} sx={{ borderRadius: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Skeleton variant='rectangular' height={150} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Skeleton variant='rectangular' height={150} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Container maxWidth='lg' sx={{ py: 3 }} data-testid='suspense-fallback-component'>
      {renderSkeletonContent()}
    </Container>
  );
};
