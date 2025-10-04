import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// --- English Resources ---
import common_en from './en/common.json';
import domain_en from './en/domain.json';
import errors_en from './en/errors.json';
import analysis_en from './en/features/analysis.json';
import bodyMetrics_en from './en/features/body-metrics.json';
import conflictResolution_en from './en/features/conflict-resolution.json';
import dashboard_en from './en/features/dashboard.json';
import exercises_en from './en/features/exercises.json';
import maxLog_en from './en/features/max-log.json';
import onboarding_en from './en/features/onboarding.json';
import planEditor_en from './en/features/plan-editor.json';
import plans_en from './en/features/plans.json';
import profile_en from './en/features/profile.json';
import settings_en from './en/features/settings.json';
import workout_en from './en/features/workout.json';
import forms_en from './en/forms.json';
// --- Italian Resources ---
import common_it from './it/common.json';
import domain_it from './it/domain.json';
import errors_it from './it/errors.json';
import analysis_it from './it/features/analysis.json';
import bodyMetrics_it from './it/features/body-metrics.json';
import conflictResolution_it from './it/features/conflict-resolution.json';
import dashboard_it from './it/features/dashboard.json';
import exercises_it from './it/features/exercises.json';
import maxLog_it from './it/features/max-log.json';
import onboarding_it from './it/features/onboarding.json';
import planEditor_it from './it/features/plan-editor.json';
import plans_it from './it/features/plans.json';
import profile_it from './it/features/profile.json';
import settings_it from './it/features/settings.json';
import workout_it from './it/features/workout.json';
import forms_it from './it/forms.json';

/**
 * Internationalization configuration for the Blueprint Fitness application.
 * Supports English and Italian languages with a stratified namespace structure.
 */
const resources = {
  en: {
    common: common_en,
    domain: domain_en,
    errors: errors_en,
    forms: forms_en,
    'features.analysis': analysis_en,
    'features.body-metrics': bodyMetrics_en,
    'features.conflict-resolution': conflictResolution_en,
    'features.dashboard': dashboard_en,
    'features.exercises': exercises_en,
    'features.max-log': maxLog_en,
    'features.onboarding': onboarding_en,
    'features.plan-editor': planEditor_en,
    'features.plans': plans_en,
    'features.profile': profile_en,
    'features.settings': settings_en,
    'features.workout': workout_en,
  },
  it: {
    common: common_it,
    domain: domain_it,
    errors: errors_it,
    forms: forms_it,
    'features.analysis': analysis_it,
    'features.body-metrics': bodyMetrics_it,
    'features.conflict-resolution': conflictResolution_it,
    'features.dashboard': dashboard_it,
    'features.exercises': exercises_it,
    'features.max-log': maxLog_it,
    'features.onboarding': onboarding_it,
    'features.plan-editor': planEditor_it,
    'features.plans': plans_it,
    'features.profile': profile_it,
    'features.settings': settings_it,
    'features.workout': workout_it,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'it', // Set Italian as the default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safes from xss
    format: (value, format, lng) => {
      if (value instanceof Date) {
        return new Intl.DateTimeFormat(lng).format(value);
      }
      if (typeof value === 'number') {
        return new Intl.NumberFormat(lng).format(value);
      }
      return value;
    },
  },
  // Define namespaces
  ns: [
    'common',
    'domain',
    'errors',
    'forms',
    'features.analysis',
    'features.body-metrics',
    'features.conflict-resolution',
    'features.dashboard',
    'features.exercises',
    'features.max-log',
    'features.onboarding',
    'features.plan-editor',
    'features.plans',
    'features.profile',
    'features.settings',
    'features.workout',
  ],
  defaultNS: 'common',
  fallbackNS: 'common',
});

export default i18n;
export { useAppTranslation } from './useAppTranslation';
