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

const StyledWeightDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledConversionChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: '20px',
}));

interface WeightRecordCardProps {
  id: string;
  weight: number;
  date: Date;
  notes?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  'data-testid'?: string;
}

/**
 * Card component for displaying weight record entries in a list.
 * Shows weight with unit conversion, date, trend indicators, and actions.
 *
 * Features:
 * - Displays weight in both kg and lbs
 * - Shows formatted date
 * - Visual trend indicators (up/down/stable)
 * - Provides action menu for view, edit, delete
 * - Handles optional notes display
 * - Hover animations and semantic data-testids
 */
export const WeightRecordCard: React.FC<WeightRecordCardProps> = ({
  id,
  weight,
  date,
  notes,
  trend,
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

  const weightInLbs = (weight * 2.20462).toFixed(1);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return { name: 'TrendingUp' as const, color: 'success.main' };
      case 'decreasing':
        return { name: 'TrendingDown' as const, color: 'error.main' };
      case 'stable':
        return { name: 'TrendingFlat' as const, color: 'text.secondary' };
      default:
        return null;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case 'increasing':
        return t('bodyMetrics.trend.increasing');
      case 'decreasing':
        return t('bodyMetrics.trend.decreasing');
      case 'stable':
        return t('bodyMetrics.trend.stable');
      default:
        return '';
    }
  };

  const trendInfo = getTrendIcon();

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
              {t('bodyMetrics.weightRecord')}
            </Typography>
            {trendInfo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Icon name={trendInfo.name} sx={{ fontSize: '1rem', color: trendInfo.color }} />
                <Typography
                  variant='caption'
                  sx={{ color: trendInfo.color, fontSize: '0.7rem' }}
                  data-testid={`${dataTestId}-trend-label`}
                >
                  {getTrendLabel()}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {formattedDate}
          </Typography>

          <StyledWeightDisplay>
            <Typography
              variant='h4'
              component='div'
              sx={{ fontWeight: 600, color: 'primary.main' }}
              data-testid={`${dataTestId}-weight-kg`}
            >
              {weight}
            </Typography>
            <Typography variant='h6' color='text.secondary'>
              kg
            </Typography>
            <StyledConversionChip
              label={`${weightInLbs} lbs`}
              variant='outlined'
              size='small'
              data-testid={`${dataTestId}-weight-lbs`}
            />
          </StyledWeightDisplay>

          {notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('bodyMetrics.notes')}
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
            {t('bodyMetrics.recorded')}
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
