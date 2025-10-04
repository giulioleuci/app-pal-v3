import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the env module with test values
vi.mock('../../env', () => ({
  env: {
    VITE_DEFAULT_THEME_MODE: 'light',
    VITE_DEFAULT_PRIMARY_COLOR: '#3b82f6',
    VITE_DEFAULT_SECONDARY_COLOR: '#6366f1',
  },
}));

import { useThemeStore } from '..';

// Test constants for expected default values
const DEFAULT_THEME_MODE = 'light';
const DEFAULT_PRIMARY_COLOR = '#3b82f6';
const DEFAULT_SECONDARY_COLOR = '#6366f1';

describe('themeStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useThemeStore.getState().resetToDefaults();
  });

  describe('initial state', () => {
    it('should initialize with default values from env', () => {
      const state = useThemeStore.getState();

      expect(state.mode).toBe(DEFAULT_THEME_MODE);
      expect(state.primaryColor).toBe(DEFAULT_PRIMARY_COLOR);
      expect(state.secondaryColor).toBe(DEFAULT_SECONDARY_COLOR);
    });

    it('should have all required methods', () => {
      const state = useThemeStore.getState();

      expect(typeof state.setMode).toBe('function');
      expect(typeof state.setPrimaryColor).toBe('function');
      expect(typeof state.setSecondaryColor).toBe('function');
      expect(typeof state.toggleMode).toBe('function');
      expect(typeof state.resetToDefaults).toBe('function');
    });
  });

  describe('setMode', () => {
    it('should set theme mode to light', () => {
      const { setMode } = useThemeStore.getState();

      setMode('light');

      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('should set theme mode to dark', () => {
      const { setMode } = useThemeStore.getState();

      setMode('dark');

      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('should update only the mode property', () => {
      const { setMode } = useThemeStore.getState();
      const initialPrimaryColor = useThemeStore.getState().primaryColor;
      const initialSecondaryColor = useThemeStore.getState().secondaryColor;

      setMode('dark');

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.primaryColor).toBe(initialPrimaryColor);
      expect(state.secondaryColor).toBe(initialSecondaryColor);
    });
  });

  describe('setPrimaryColor', () => {
    it('should set primary color to a valid hex color', () => {
      const { setPrimaryColor } = useThemeStore.getState();
      const newColor = '#ff5733';

      setPrimaryColor(newColor);

      expect(useThemeStore.getState().primaryColor).toBe(newColor);
    });

    it('should accept any string as primary color', () => {
      const { setPrimaryColor } = useThemeStore.getState();
      const customColor = 'rgb(255, 0, 0)';

      setPrimaryColor(customColor);

      expect(useThemeStore.getState().primaryColor).toBe(customColor);
    });

    it('should update only the primaryColor property', () => {
      const { setPrimaryColor } = useThemeStore.getState();
      const initialMode = useThemeStore.getState().mode;
      const initialSecondaryColor = useThemeStore.getState().secondaryColor;

      setPrimaryColor('#ff5733');

      const state = useThemeStore.getState();
      expect(state.primaryColor).toBe('#ff5733');
      expect(state.mode).toBe(initialMode);
      expect(state.secondaryColor).toBe(initialSecondaryColor);
    });
  });

  describe('setSecondaryColor', () => {
    it('should set secondary color to a valid hex color', () => {
      const { setSecondaryColor } = useThemeStore.getState();
      const newColor = '#33c3f0';

      setSecondaryColor(newColor);

      expect(useThemeStore.getState().secondaryColor).toBe(newColor);
    });

    it('should accept any string as secondary color', () => {
      const { setSecondaryColor } = useThemeStore.getState();
      const customColor = 'hsl(240, 100%, 50%)';

      setSecondaryColor(customColor);

      expect(useThemeStore.getState().secondaryColor).toBe(customColor);
    });

    it('should update only the secondaryColor property', () => {
      const { setSecondaryColor } = useThemeStore.getState();
      const initialMode = useThemeStore.getState().mode;
      const initialPrimaryColor = useThemeStore.getState().primaryColor;

      setSecondaryColor('#33c3f0');

      const state = useThemeStore.getState();
      expect(state.secondaryColor).toBe('#33c3f0');
      expect(state.mode).toBe(initialMode);
      expect(state.primaryColor).toBe(initialPrimaryColor);
    });
  });

  describe('toggleMode', () => {
    it('should toggle from light to dark mode', () => {
      const { setMode, toggleMode } = useThemeStore.getState();

      // Ensure we start in light mode
      setMode('light');
      expect(useThemeStore.getState().mode).toBe('light');

      toggleMode();

      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('should toggle from dark to light mode', () => {
      const { setMode, toggleMode } = useThemeStore.getState();

      // Ensure we start in dark mode
      setMode('dark');
      expect(useThemeStore.getState().mode).toBe('dark');

      toggleMode();

      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('should toggle multiple times correctly', () => {
      const { setMode, toggleMode } = useThemeStore.getState();

      // Start with light mode
      setMode('light');
      expect(useThemeStore.getState().mode).toBe('light');

      // Toggle to dark
      toggleMode();
      expect(useThemeStore.getState().mode).toBe('dark');

      // Toggle back to light
      toggleMode();
      expect(useThemeStore.getState().mode).toBe('light');

      // Toggle to dark again
      toggleMode();
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('should not affect other properties when toggling mode', () => {
      const { setPrimaryColor, setSecondaryColor, toggleMode } = useThemeStore.getState();

      // Set custom colors
      setPrimaryColor('#custom1');
      setSecondaryColor('#custom2');

      const primaryColorBefore = useThemeStore.getState().primaryColor;
      const secondaryColorBefore = useThemeStore.getState().secondaryColor;

      toggleMode();

      const state = useThemeStore.getState();
      expect(state.primaryColor).toBe(primaryColorBefore);
      expect(state.secondaryColor).toBe(secondaryColorBefore);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all properties to default values from env', () => {
      const { setMode, setPrimaryColor, setSecondaryColor, resetToDefaults } =
        useThemeStore.getState();

      // Change all properties to non-default values
      setMode('dark');
      setPrimaryColor('#custom1');
      setSecondaryColor('#custom2');

      // Verify changes were applied
      let state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.primaryColor).toBe('#custom1');
      expect(state.secondaryColor).toBe('#custom2');

      // Reset to defaults
      resetToDefaults();

      // Verify all properties are reset to env defaults
      state = useThemeStore.getState();
      expect(state.mode).toBe(DEFAULT_THEME_MODE);
      expect(state.primaryColor).toBe(DEFAULT_PRIMARY_COLOR);
      expect(state.secondaryColor).toBe(DEFAULT_SECONDARY_COLOR);
    });

    it('should have no effect when already at default values', () => {
      const { resetToDefaults } = useThemeStore.getState();

      // Store is already at defaults after beforeEach reset
      const stateBefore = useThemeStore.getState();

      resetToDefaults();

      const stateAfter = useThemeStore.getState();
      expect(stateAfter.mode).toBe(stateBefore.mode);
      expect(stateAfter.primaryColor).toBe(stateBefore.primaryColor);
      expect(stateAfter.secondaryColor).toBe(stateBefore.secondaryColor);
    });
  });

  describe('zustand store behavior', () => {
    it('should allow multiple subscribers to receive state updates', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      // Subscribe to store changes
      const unsubscribe1 = useThemeStore.subscribe(subscriber1);
      const unsubscribe2 = useThemeStore.subscribe(subscriber2);

      // Trigger a state change
      useThemeStore.getState().setMode('dark');

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);

      // Cleanup subscriptions
      unsubscribe1();
      unsubscribe2();
    });

    it('should not call unsubscribed listeners', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      const unsubscribe1 = useThemeStore.subscribe(subscriber1);
      const unsubscribe2 = useThemeStore.subscribe(subscriber2);

      // Unsubscribe first listener
      unsubscribe1();

      // Trigger a state change
      useThemeStore.getState().setPrimaryColor('#test');

      expect(subscriber1).not.toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalledTimes(1);

      // Cleanup remaining subscription
      unsubscribe2();
    });

    it('should maintain state immutability', () => {
      const stateBefore = useThemeStore.getState();

      useThemeStore.getState().setMode('dark');

      const stateAfter = useThemeStore.getState();

      // States should be different objects
      expect(stateBefore).not.toBe(stateAfter);

      // Original state should remain unchanged
      expect(stateBefore.mode).toBe(DEFAULT_THEME_MODE);
      expect(stateAfter.mode).toBe('dark');
    });
  });

  describe('state transitions and combinations', () => {
    it('should handle rapid successive state changes', () => {
      const { setMode, setPrimaryColor, setSecondaryColor } = useThemeStore.getState();

      setMode('dark');
      setPrimaryColor('#test1');
      setSecondaryColor('#test2');
      setMode('light');

      const finalState = useThemeStore.getState();
      expect(finalState.mode).toBe('light');
      expect(finalState.primaryColor).toBe('#test1');
      expect(finalState.secondaryColor).toBe('#test2');
    });

    it('should handle all combinations of theme modes', () => {
      const { setMode } = useThemeStore.getState();
      const validModes: Array<'light' | 'dark'> = ['light', 'dark'];

      validModes.forEach((mode) => {
        setMode(mode);
        expect(useThemeStore.getState().mode).toBe(mode);
      });
    });

    it('should maintain consistency after multiple operations', () => {
      const { setMode, setPrimaryColor, setSecondaryColor, toggleMode, resetToDefaults } =
        useThemeStore.getState();

      // Perform various operations
      setMode('dark');
      setPrimaryColor('#ff0000');
      setSecondaryColor('#00ff00');
      toggleMode();
      setMode('dark');
      resetToDefaults();

      // Should be back to defaults
      const finalState = useThemeStore.getState();
      expect(finalState.mode).toBe(DEFAULT_THEME_MODE);
      expect(finalState.primaryColor).toBe(DEFAULT_PRIMARY_COLOR);
      expect(finalState.secondaryColor).toBe(DEFAULT_SECONDARY_COLOR);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty string colors', () => {
      const { setPrimaryColor, setSecondaryColor } = useThemeStore.getState();

      setPrimaryColor('');
      setSecondaryColor('');

      const state = useThemeStore.getState();
      expect(state.primaryColor).toBe('');
      expect(state.secondaryColor).toBe('');
    });

    it('should handle whitespace in colors', () => {
      const { setPrimaryColor, setSecondaryColor } = useThemeStore.getState();

      setPrimaryColor('   #ffffff   ');
      setSecondaryColor('\t#000000\n');

      const state = useThemeStore.getState();
      expect(state.primaryColor).toBe('   #ffffff   ');
      expect(state.secondaryColor).toBe('\t#000000\n');
    });

    it('should maintain state consistency even with unusual color values', () => {
      const { setPrimaryColor, setSecondaryColor, setMode } = useThemeStore.getState();

      // Set unusual but valid color values
      setPrimaryColor('transparent');
      setSecondaryColor('inherit');
      setMode('dark');

      const state = useThemeStore.getState();
      expect(state.primaryColor).toBe('transparent');
      expect(state.secondaryColor).toBe('inherit');
      expect(state.mode).toBe('dark');
    });
  });
});
