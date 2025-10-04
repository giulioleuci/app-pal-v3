import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/shared/components/Icon';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
  cursor: 'pointer',
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  justifyContent: 'space-between',
}));

const StyledMetricsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const StyledMetricRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

interface MaxLogCardProps {
  id: string;
  exerciseId: string;
  exerciseName?: string;
  weightEnteredByUser: number;
  reps: number;
  estimated1RM: number;
  date: Date;
  notes?: string;
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  'data-testid'?: string;
}

/**
 * Card component for displaying max log records in a list.
 * Shows key metrics, estimated 1RM, and provides action menu.
 *
 * Features:
 * - Displays lift weight, reps, and estimated 1RM
 * - Shows exercise name and date formatted
 * - Provides action menu for view, edit, delete
 * - Visual indicators for direct 1RM attempts (1 rep)
 * - Hover animations and semantic data-testids
 */
export const MaxLogCard: React.FC<MaxLogCardProps> = ({
  id,
  exerciseId,
  exerciseName = 'Unknown Exercise',
  weightEnteredByUser,
  reps,
  estimated1RM,
  date,
  notes,
  onViewDetails,
  onEdit,
  onDelete,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    handleMenuClose();
    onViewDetails?.(id);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(id);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(id);
  };

  const handleCardClick = () => {
    onViewDetails?.(id);
  };

  const isDirect1RM = reps === 1;
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  return (
    <>
      <StyledCard onClick={handleCardClick} data-testid={dataTestId}>
        <StyledCardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Typography variant='h6' component='h3' sx={{ fontWeight: 600 }}>
              {exerciseName}
            </Typography>
            {isDirect1RM && (
              <Chip
                label='1RM'
                color='primary'
                size='small'
                sx={{ ml: 1 }}
                data-testid={`${dataTestId}-direct-1rm-chip`}
              />
            )}
          </Box>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {formattedDate}
          </Typography>

          <StyledMetricsContainer>
            <StyledMetricRow>
              <Typography variant='body2' color='text.secondary'>
                {t('maxLog.weight')}
              </Typography>
              <Typography variant='body1' fontWeight={500}>
                {weightEnteredByUser} kg
              </Typography>
            </StyledMetricRow>

            <StyledMetricRow>
              <Typography variant='body2' color='text.secondary'>
                {t('maxLog.reps')}
              </Typography>
              <Typography variant='body1' fontWeight={500}>
                {reps}
              </Typography>
            </StyledMetricRow>

            <StyledMetricRow>
              <Typography variant='body2' color='text.secondary'>
                {t('maxLog.estimated1RM')}
              </Typography>
              <Typography
                variant='body1'
                fontWeight={600}
                color='primary.main'
                data-testid={`${dataTestId}-estimated-1rm`}
              >
                {estimated1RM.toFixed(1)} kg
              </Typography>
            </StyledMetricRow>
          </StyledMetricsContainer>

          {notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('maxLog.notes')}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  mt: 0.5,
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
                data-testid={`${dataTestId}-notes`}
              >
                {notes}
              </Typography>
            </Box>
          )}
        </StyledCardContent>

        <StyledCardActions>
          <Typography variant='body2' color='text.secondary'>
            {isDirect1RM
              ? t('maxLog.directAttempt')
              : t('maxLog.calculatedFrom', { weight: weightEnteredByUser, reps })}
          </Typography>

          <IconButton
            size='small'
            onClick={handleMenuOpen}
            aria-label={t('common.actions')}
            data-testid={`${dataTestId}-menu-button`}
          >
            <Icon name='MoreVert' />
          </IconButton>
        </StyledCardActions>
      </StyledCard>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        data-testid={`${dataTestId}-action-menu`}
      >
        <MenuItem onClick={handleViewDetails} data-testid={`${dataTestId}-view-action`}>
          <Icon name='Visibility' sx={{ mr: 1 }} />
          {t('common.view')}
        </MenuItem>
        <MenuItem onClick={handleEdit} data-testid={`${dataTestId}-edit-action`}>
          <Icon name='Edit' sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleDelete} data-testid={`${dataTestId}-delete-action`}>
          <Icon name='Delete' sx={{ mr: 1, color: 'error.main' }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
    </>
  );
};
