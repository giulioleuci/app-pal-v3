import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { animations } from '@/app/animations';
import { Icon } from '@/shared/components/Icon';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

interface WelcomeFormData {
  name: string;
}

export interface WelcomeWizardProps {
  /**
   * Callback when the form is completed
   */
  onComplete: (name: string) => void;
  /**
   * Whether the profile creation is in progress
   */
  isCreating: boolean;
}

/**
 * A welcome wizard component for new user onboarding.
 * Allows users to enter their name to create their first profile.
 */
export const WelcomeWizard = ({ onComplete, isCreating }: WelcomeWizardProps) => {
  const { t } = useAppTranslation();

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<WelcomeFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  const nameValidation = useMemo(
    () => ({
      required: t('profile.validation.nameRequired'),
      minLength: {
        value: 2,
        message: t('profile.validation.nameMinLength'),
      },
      maxLength: {
        value: 50,
        message: t('profile.validation.nameMaxLength'),
      },
    }),
    [t]
  );

  const onSubmit = (data: WelcomeFormData) => {
    onComplete(data.name.trim());
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
      data-testid='welcome-wizard-component'
    >
      <motion.div
        initial='hidden'
        animate='visible'
        variants={animations.fadeInUp}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            overflow: 'visible',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4} alignItems='center'>
              {/* Welcome Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                <Icon
                  name='person'
                  sx={{
                    fontSize: 32,
                    color: 'primary.main',
                  }}
                />
              </Box>

              {/* Welcome Text */}
              <Stack spacing={1} alignItems='center' sx={{ textAlign: 'center' }}>
                <Typography
                  variant='h4'
                  component='h1'
                  fontWeight='bold'
                  data-testid='welcome-wizard-title'
                >
                  {t('profile.welcome.title')}
                </Typography>

                <Typography
                  variant='body1'
                  color='text.secondary'
                  data-testid='welcome-wizard-subtitle'
                >
                  {t('profile.welcome.subtitle')}
                </Typography>
              </Stack>

              {/* Form */}
              <Box
                component='form'
                onSubmit={handleSubmit(onSubmit)}
                sx={{ width: '100%' }}
                data-testid='welcome-wizard-form'
              >
                <Stack spacing={3}>
                  <TextFieldElement
                    name='name'
                    control={control}
                    label={t('profile.fields.name')}
                    fullWidth
                    autoFocus
                    disabled={isCreating}
                    data-testid='welcome-wizard-name-input'
                    validation={nameValidation}
                  />

                  <Button
                    type='submit'
                    variant='contained'
                    size='large'
                    fullWidth
                    disabled={isCreating || !isValid}
                    data-testid='welcome-wizard-submit'
                    startIcon={isCreating ? <CircularProgress size={16} /> : undefined}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {isCreating ? t('profile.welcome.creating') : t('profile.welcome.getStarted')}
                  </Button>
                </Stack>
              </Box>

              {/* Helper Text */}
              <Typography
                variant='caption'
                color='text.secondary'
                align='center'
                data-testid='welcome-wizard-helper'
              >
                {t('profile.welcome.helper')}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};
