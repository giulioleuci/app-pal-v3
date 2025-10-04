import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { type UserSettingsData, userSettingsSchema } from '@/shared/types';

/**
 * A domain model representing user-specific application settings.
 * Contains theme preferences, unit system, training plan configuration, and dashboard layout.
 */
export class UserSettingsModel extends BaseModel<UserSettingsData> {
  [immerable] = true;
  public readonly profileId: string;
  public readonly themeMode: UserSettingsData['themeMode'];
  public readonly primaryColor: string;
  public readonly secondaryColor: string;
  public readonly unitSystem: UserSettingsData['unitSystem'];
  public readonly bmiFormula: UserSettingsData['bmiFormula'];
  public readonly activeTrainingPlanId: string | null;
  public readonly autoStartRestTimer: boolean;
  public readonly autoStartShortRestTimer: boolean;
  public readonly liftMappings: Record<string, string>;
  public readonly dashboardLayout: UserSettingsData['dashboardLayout'];
  public readonly dashboardVisibility: UserSettingsData['dashboardVisibility'];

  protected constructor(props: UserSettingsData) {
    super(props);
    this.profileId = props.profileId;
    this.themeMode = props.themeMode;
    this.primaryColor = props.primaryColor;
    this.secondaryColor = props.secondaryColor;
    this.unitSystem = props.unitSystem;
    this.bmiFormula = props.bmiFormula;
    this.activeTrainingPlanId = props.activeTrainingPlanId;
    this.autoStartRestTimer = props.autoStartRestTimer;
    this.autoStartShortRestTimer = props.autoStartShortRestTimer;
    this.liftMappings = props.liftMappings;
    this.dashboardLayout = props.dashboardLayout;
    this.dashboardVisibility = props.dashboardVisibility;
  }

  /**
   * Creates a new UserSettingsModel instance from plain data.
   * @param props The user settings data to hydrate from
   * @returns A new UserSettingsModel instance
   */
  public static hydrate(props: UserSettingsData): UserSettingsModel {
    return new UserSettingsModel(props);
  }

  /**
   * Creates a new settings instance with updated theme mode.
   * @param themeMode The new theme mode ('light' or 'dark')
   * @returns A new UserSettingsModel instance with updated theme mode
   */
  cloneWithThemeMode(themeMode: UserSettingsData['themeMode']): UserSettingsModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).themeMode = themeMode;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new settings instance with updated color scheme.
   * @param primaryColor The new primary color (hex format)
   * @param secondaryColor The new secondary color (hex format)
   * @returns A new UserSettingsModel instance with updated colors
   */
  cloneWithColors(primaryColor: string, secondaryColor: string): UserSettingsModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).primaryColor = primaryColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).secondaryColor = secondaryColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new settings instance with updated active training plan.
   * @param planId The ID of the new active training plan (null to deactivate)
   * @returns A new UserSettingsModel instance with updated active training plan
   */
  cloneWithActiveTrainingPlan(planId: string | null): UserSettingsModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).activeTrainingPlanId = planId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new settings instance with updated timer preferences.
   * @param autoStartRestTimer Whether to auto-start rest timers
   * @param autoStartShortRestTimer Whether to auto-start short rest timers
   * @returns A new UserSettingsModel instance with updated timer settings
   */
  cloneWithTimerSettings(
    autoStartRestTimer: boolean,
    autoStartShortRestTimer: boolean
  ): UserSettingsModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).autoStartRestTimer = autoStartRestTimer;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).autoStartShortRestTimer = autoStartShortRestTimer;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new settings instance with updated lift mappings.
   * @param liftMappings The new lift mappings configuration
   * @returns A new UserSettingsModel instance with updated lift mappings
   */
  cloneWithLiftMappings(liftMappings: Record<string, string>): UserSettingsModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).liftMappings = liftMappings;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Creates a new settings instance with updated dashboard configuration.
   * @param layout The new dashboard widget layout
   * @param visibility The new dashboard widget visibility settings
   * @returns A new UserSettingsModel instance with updated dashboard settings
   */
  cloneWithDashboardSettings(
    layout: UserSettingsData['dashboardLayout'],
    visibility: UserSettingsData['dashboardVisibility']
  ): UserSettingsModel {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).dashboardLayout = layout;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).dashboardVisibility = visibility;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });
  }

  /**
   * Checks if the user has an active training plan set.
   * @returns True if there is an active training plan
   */
  hasActiveTrainingPlan(): boolean {
    return this.activeTrainingPlanId !== null;
  }

  /**
   * Checks if auto-start timers are enabled.
   * @returns True if both rest timer types are set to auto-start
   */
  hasAutoTimersEnabled(): boolean {
    return this.autoStartRestTimer && this.autoStartShortRestTimer;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this UserSettingsModel
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain UserSettingsData object
   */
  toPlainObject(): UserSettingsData {
    const {
      id,
      profileId,
      themeMode,
      primaryColor,
      secondaryColor,
      unitSystem,
      bmiFormula,
      activeTrainingPlanId,
      autoStartRestTimer,
      autoStartShortRestTimer,
      liftMappings,
      dashboardLayout,
      dashboardVisibility,
      createdAt,
      updatedAt,
    } = this;
    return {
      id,
      profileId,
      themeMode,
      primaryColor,
      secondaryColor,
      unitSystem,
      bmiFormula,
      activeTrainingPlanId,
      autoStartRestTimer,
      autoStartShortRestTimer,
      liftMappings,
      dashboardLayout,
      dashboardVisibility,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return userSettingsSchema.safeParse(this.toPlainObject());
  }
}
