import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { Icon } from '@/shared/components/Icon';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

export interface ProfileSwitcherProps {
  /**
   * List of available profiles
   */
  profiles: ProfileModel[];
  /**
   * ID of the currently active profile
   */
  activeProfileId: string | null;
  /**
   * Callback when a profile is selected
   */
  onProfileSelect: (profileId: string) => void;
  /**
   * Callback when the create profile action is triggered
   */
  onCreateProfile: () => void;
  /**
   * Callback when the delete profile action is triggered
   */
  onDeleteProfile?: (profileId: string) => void;
  /**
   * Whether deletion is allowed (e.g., when there are multiple profiles)
   */
  canDelete?: boolean;
}

/**
 * A profile switcher component that displays the active profile
 * and provides a dropdown menu to switch between profiles or create new ones.
 */
export const ProfileSwitcher = ({
  profiles,
  activeProfileId,
  onProfileSelect,
  onCreateProfile,
  onDeleteProfile,
  canDelete = false,
}: ProfileSwitcherProps) => {
  const { t } = useAppTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileSelect = (profileId: string) => {
    onProfileSelect(profileId);
    handleClose();
  };

  const handleCreateProfile = () => {
    onCreateProfile();
    handleClose();
  };

  const handleDeleteProfile = (profileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDeleteProfile) {
      onDeleteProfile(profileId);
    }
    handleClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!activeProfile) {
    return null;
  }

  return (
    <Box data-testid='profile-switcher-component'>
      <IconButton
        onClick={handleClick}
        data-testid='profile-switcher-trigger'
        sx={{
          p: 0.5,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Stack direction='row' alignItems='center' spacing={1}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
            }}
            data-testid='profile-switcher-avatar'
          >
            {getInitials(activeProfile.name)}
          </Avatar>

          {profiles.length > 1 && (
            <Icon
              name='keyboard-arrow-down'
              sx={{
                fontSize: 16,
                color: 'text.secondary',
                transition: 'transform 0.2s',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </Stack>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        data-testid='profile-switcher-menu'
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            maxWidth: 280,
          },
        }}
      >
        {/* Current Profile Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant='caption' color='text.secondary'>
            {t('profile.switcher.currentProfile')}
          </Typography>
        </Box>

        {/* Profile List */}
        {profiles.map((profile) => (
          <MenuItem
            key={profile.id}
            onClick={() => handleProfileSelect(profile.id)}
            selected={profile.id === activeProfileId}
            data-testid={`profile-switcher-item-${profile.id}`}
            sx={{
              py: 1,
              minHeight: 48,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: profile.id === activeProfileId ? 'primary.main' : 'grey.400',
                  fontSize: '0.75rem',
                }}
              >
                {getInitials(profile.name)}
              </Avatar>
            </ListItemIcon>

            <ListItemText primary={profile.name} sx={{ flex: 1 }} />

            <Stack direction='row' alignItems='center' spacing={0.5}>
              {profile.id === activeProfileId && (
                <Chip
                  label={t('profile.switcher.active')}
                  size='small'
                  color='primary'
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              )}

              {profile.isNew() && (
                <Chip
                  label={t('profile.switcher.new')}
                  size='small'
                  color='success'
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              )}

              {canDelete && onDeleteProfile && profile.id !== activeProfileId && (
                <IconButton
                  size='small'
                  onClick={(event) => handleDeleteProfile(profile.id, event)}
                  data-testid={`profile-switcher-delete-${profile.id}`}
                  sx={{
                    opacity: 0.6,
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'error.light',
                      color: 'error.main',
                    },
                  }}
                >
                  <Icon name='delete' sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Stack>
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Create Profile Action */}
        <MenuItem
          onClick={handleCreateProfile}
          data-testid='profile-switcher-create'
          sx={{
            py: 1.5,
            color: 'primary.main',
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Icon name='add' sx={{ color: 'primary.main', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary={t('profile.switcher.createNew')} />
        </MenuItem>
      </Menu>
    </Box>
  );
};
