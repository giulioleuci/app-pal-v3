// Import common icons
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ErrorIcon from '@mui/icons-material/Error';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FilterListIcon from '@mui/icons-material/FilterList';
import WorkoutIcon from '@mui/icons-material/FitnessCenter';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WarningIcon from '@mui/icons-material/Warning';
import { SvgIcon, SvgIconProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const iconMap = {
  add: AddIcon,
  'arrow-back': ArrowBackIcon,
  'arrow-forward': ArrowForwardIcon,
  calendar: CalendarIcon,
  check: CheckIcon,
  close: CloseIcon,
  dashboard: DashboardIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  error: ErrorIcon,
  favorite: FavoriteIcon,
  'filter-list': FilterListIcon,
  home: HomeIcon,
  info: InfoIcon,
  menu: MenuIcon,
  'more-vert': MoreVertIcon,
  person: PersonIcon,
  refresh: RefreshIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  share: ShareIcon,
  star: StarIcon,
  timer: TimerIcon,
  'trending-up': TrendingUpIcon,
  visibility: VisibilityIcon,
  'visibility-off': VisibilityOffIcon,
  warning: WarningIcon,
  workout: WorkoutIcon,
} as const;

export type IconName = keyof typeof iconMap;

const StyledSvgIcon = styled(SvgIcon, {
  shouldForwardProp: (prop) => prop !== 'interactive',
})<{ interactive?: boolean }>(({ theme, interactive }) => ({
  transition: theme.transitions.create(['color', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  ...(interactive && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'scale(1.1)',
      opacity: 0.8,
    },
  }),
}));

export interface IconProps extends Omit<SvgIconProps, 'children'> {
  /**
   * The name of the icon to display
   */
  name: IconName;
  /**
   * Whether the icon should have interactive hover effects
   */
  interactive?: boolean;
  /**
   * Test identifier for the icon
   */
  'data-testid'?: string;
}

/**
 * A generic icon component that provides a consistent interface for using icons
 * throughout the application. Uses Material-UI icons with centralized theming
 * and optional interactive behavior.
 *
 * @example
 * ```tsx
 * <Icon name="add" color="primary" />
 * <Icon name="edit" interactive />
 * <Icon name="delete" color="error" fontSize="large" />
 * ```
 */
export const Icon = ({ name, interactive = false, 'data-testid': testId, ...props }: IconProps) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return (
    <StyledSvgIcon
      component={IconComponent}
      interactive={interactive}
      data-testid={testId || `icon-${name}`}
      {...props}
    />
  );
};

/**
 * Hook to get all available icon names
 * Useful for documentation and development tools
 */
export const useAvailableIcons = (): IconName[] => {
  return Object.keys(iconMap) as IconName[];
};
