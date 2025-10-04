import { act, renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExerciseService } from '../../services/ExerciseService';
import { ExerciseWizardData, useExerciseWizard } from '../useExerciseWizard';

// Mock tsyringe
vi.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
  singleton: () => (target: any) => target,
  Lifecycle: {
    Singleton: 'Singleton',
    Transient: 'Transient',
    ContainerScoped: 'ContainerScoped',
  },
  container: {
    resolve: vi.fn(),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

// Mock services
vi.mock('../../services/ExerciseService');

const mockExerciseService = {
  createExercise: vi.fn(),
};

const mockContainer = container as any;

describe('useExerciseWizard', () => {
  const profileId = 'profile-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockContainer.resolve.mockImplementation((token: any) => {
      if (token === ExerciseService) return mockExerciseService;
      return {};
    });
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      expect(result.current.currentStep).toBe(0);
      expect(result.current.stepData.length).toBe(6);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
      expect(result.current.canGoBack).toBe(false);
      expect(result.current.completionPercentage).toBe(0);
      expect(result.current.isSubmitting).toBe(false);

      // Check function availability
      expect(typeof result.current.nextStep).toBe('function');
      expect(typeof result.current.prevStep).toBe('function');
      expect(typeof result.current.goToStep).toBe('function');
      expect(typeof result.current.setStepData).toBe('function');
      expect(typeof result.current.submitWizard).toBe('function');
      expect(typeof result.current.resetWizard).toBe('function');
    });

    it('should initialize with default wizard data', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      expect(result.current.wizardData.basicInfo.name).toBe('');
      expect(result.current.wizardData.basicInfo.category).toBe('strength');
      expect(result.current.wizardData.basicInfo.difficulty).toBe('beginner');
      expect(result.current.wizardData.targeting.primaryMuscleGroups).toEqual([]);
      expect(result.current.wizardData.equipment.requiredEquipment).toEqual([]);
      expect(result.current.wizardData.instructions.executionSteps).toEqual([]);
      expect(result.current.wizardData.programming.progressionMethods).toEqual([]);
      expect(result.current.wizardData.variations.easierVariations).toEqual([]);
    });

    it('should initialize step data with correct structure', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      const expectedStepIds = [
        'basic-info',
        'targeting',
        'equipment',
        'instructions',
        'programming',
        'variations',
      ];

      expect(result.current.stepData.map((s) => s.stepId)).toEqual(expectedStepIds);

      result.current.stepData.forEach((step) => {
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(typeof step.isValid).toBe('boolean');
        expect(typeof step.isComplete).toBe('boolean');
        expect(step.data).toBeDefined();
      });
    });
  });

  describe('navigation', () => {
    it('should move to next step when current step is valid', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Set up basic info to make step valid
      act(() => {
        result.current.setStepData(0, { name: 'Test Exercise' });
      });

      expect(result.current.canProceed).toBe(true);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.canGoBack).toBe(true);
      expect(result.current.isFirstStep).toBe(false);
    });

    it('should not move to next step when current step is invalid', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      expect(result.current.canProceed).toBe(false);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should move to previous step', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Move to step 1 first
      act(() => {
        result.current.setStepData(0, { name: 'Test Exercise' });
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should not move to previous step from first step', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should jump to specific step', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should not jump to invalid step number', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      act(() => {
        result.current.goToStep(10); // Invalid step
      });

      expect(result.current.currentStep).toBe(0); // Should remain at current step

      act(() => {
        result.current.goToStep(-1); // Invalid step
      });

      expect(result.current.currentStep).toBe(0); // Should remain at current step
    });

    it('should correctly identify first and last steps', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);

      act(() => {
        result.current.goToStep(5); // Last step
      });

      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(true);
    });
  });

  describe('step data management', () => {
    it('should update step data correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      act(() => {
        result.current.setStepData(0, {
          name: 'Bench Press',
          description: 'Chest exercise',
          category: 'strength',
        });
      });

      expect(result.current.wizardData.basicInfo.name).toBe('Bench Press');
      expect(result.current.wizardData.basicInfo.description).toBe('Chest exercise');
      expect(result.current.wizardData.basicInfo.category).toBe('strength');
    });

    it('should merge step data with existing data', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      act(() => {
        result.current.setStepData(0, { name: 'Bench Press' });
      });

      act(() => {
        result.current.setStepData(0, { description: 'Chest exercise' });
      });

      expect(result.current.wizardData.basicInfo.name).toBe('Bench Press');
      expect(result.current.wizardData.basicInfo.description).toBe('Chest exercise');
      expect(result.current.wizardData.basicInfo.category).toBe('strength'); // Default value preserved
    });

    it('should handle invalid step index gracefully', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      const originalData = result.current.wizardData;

      act(() => {
        result.current.setStepData(10, { name: 'Invalid' }); // Invalid step
      });

      expect(result.current.wizardData).toEqual(originalData); // No change
    });

    it('should update different step types correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Basic info
      act(() => {
        result.current.setStepData(0, { name: 'Test Exercise' });
      });

      // Targeting
      act(() => {
        result.current.setStepData(1, {
          primaryMuscleGroups: ['chest'],
          movementPattern: 'push',
        });
      });

      // Equipment
      act(() => {
        result.current.setStepData(2, {
          requiredEquipment: ['barbell'],
          setupInstructions: ['Set up bench'],
        });
      });

      expect(result.current.wizardData.basicInfo.name).toBe('Test Exercise');
      expect(result.current.wizardData.targeting.primaryMuscleGroups).toEqual(['chest']);
      expect(result.current.wizardData.equipment.requiredEquipment).toEqual(['barbell']);
    });
  });

  describe('step validation', () => {
    it('should validate basic info step correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Invalid initially
      expect(result.current.stepData[0].isValid).toBe(false);

      act(() => {
        result.current.setStepData(0, { name: 'Test Exercise' });
      });

      // Should be valid now
      expect(result.current.stepData[0].isValid).toBe(true);
    });

    it('should validate targeting step correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Invalid initially
      expect(result.current.stepData[1].isValid).toBe(false);

      act(() => {
        result.current.setStepData(1, { primaryMuscleGroups: ['chest'] });
      });

      // Should be valid now
      expect(result.current.stepData[1].isValid).toBe(true);
    });

    it('should validate instructions step correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Invalid initially
      expect(result.current.stepData[3].isValid).toBe(false);

      act(() => {
        result.current.setStepData(3, {
          executionSteps: ['Step 1', 'Step 2'],
        });
      });

      // Should be valid now
      expect(result.current.stepData[3].isValid).toBe(true);
    });

    it('should validate programming step correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Invalid initially
      expect(result.current.stepData[4].isValid).toBe(false);

      act(() => {
        result.current.setStepData(4, {
          progressionMethods: ['Increase weight'],
        });
      });

      // Should be valid now
      expect(result.current.stepData[4].isValid).toBe(true);
    });

    it('should treat equipment and variations steps as optional', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Equipment step should be valid by default (optional)
      expect(result.current.stepData[2].isValid).toBe(true);

      // Variations step should be valid by default (optional)
      expect(result.current.stepData[5].isValid).toBe(true);
    });
  });

  describe('completion tracking', () => {
    it('should calculate completion percentage correctly', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      expect(result.current.completionPercentage).toBe(0);

      // Complete basic info
      act(() => {
        result.current.setStepData(0, {
          name: 'Test Exercise',
          description: 'Test description',
        });
      });

      expect(result.current.completionPercentage).toBeGreaterThan(0);

      // Complete targeting
      act(() => {
        result.current.setStepData(1, {
          primaryMuscleGroups: ['chest'],
          movementPattern: 'push',
        });
      });

      expect(result.current.completionPercentage).toBeGreaterThan(16); // Should increase
    });

    it('should distinguish between valid and complete steps', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Make basic info valid but not complete
      act(() => {
        result.current.setStepData(0, { name: 'Test Exercise' });
      });

      expect(result.current.stepData[0].isValid).toBe(true);
      expect(result.current.stepData[0].isComplete).toBe(false);

      // Make it complete
      act(() => {
        result.current.setStepData(0, {
          name: 'Test Exercise',
          description: 'Complete description',
        });
      });

      expect(result.current.stepData[0].isValid).toBe(true);
      expect(result.current.stepData[0].isComplete).toBe(true);
    });
  });

  describe('wizard submission', () => {
    const setupCompleteWizard = (result: any) => {
      act(() => {
        // Basic info
        result.current.setStepData(0, { name: 'Test Exercise' });

        // Targeting
        result.current.setStepData(1, { primaryMuscleGroups: ['chest'] });

        // Instructions
        result.current.setStepData(3, {
          executionSteps: ['Step 1', 'Step 2'],
        });

        // Programming
        result.current.setStepData(4, {
          progressionMethods: ['Increase weight'],
        });
      });
    };

    it('should submit wizard successfully with valid data', async () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      setupCompleteWizard(result);

      mockExerciseService.createExercise.mockResolvedValue('new-exercise-id');

      let exerciseId: string;
      await act(async () => {
        exerciseId = await result.current.submitWizard();
      });

      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId,
          name: 'Test Exercise',
          muscleGroups: ['chest'],
        })
      );
      expect(exerciseId!).toBe('new-exercise-id');
    });

    it('should prevent submission with invalid steps', async () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      await act(async () => {
        await expect(result.current.submitWizard()).rejects.toThrow(
          'Please complete all required steps before submitting'
        );
      });

      expect(mockExerciseService.createExercise).not.toHaveBeenCalled();
    });

    it('should handle service errors during submission', async () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      setupCompleteWizard(result);

      mockExerciseService.createExercise.mockRejectedValue(new Error('Service error'));

      await act(async () => {
        await expect(result.current.submitWizard()).rejects.toThrow('Failed to create exercise');
      });
    });

    it('should set submitting state correctly', async () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      setupCompleteWizard(result);

      mockExerciseService.createExercise.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('id'), 100))
      );

      expect(result.current.isSubmitting).toBe(false);

      let submitPromise: Promise<string>;
      act(() => {
        submitPromise = result.current.submitWizard();
      });

      // Check submitting state immediately after act
      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        await submitPromise!;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should transform wizard data correctly for service', async () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      act(() => {
        result.current.setStepData(0, {
          name: 'Test Exercise',
          description: 'Test description',
          category: 'cardio',
          difficulty: 'advanced',
        });
        result.current.setStepData(1, {
          primaryMuscleGroups: ['chest'],
          secondaryMuscleGroups: ['triceps'],
          movementPattern: 'push',
          unilateral: true,
        });
        result.current.setStepData(2, {
          requiredEquipment: ['barbell'],
          alternativeEquipment: ['dumbbells'],
          setupInstructions: ['Setup 1'],
          safetyNotes: ['Safety 1'],
        });
        result.current.setStepData(3, {
          preparationSteps: ['Prep 1'],
          executionSteps: ['Step 1'],
          breathingCues: ['Breathe'],
          formTips: ['Tip 1'],
          commonMistakes: ['Mistake 1'],
        });
        result.current.setStepData(4, {
          progressionMethods: ['Progress 1'],
        });
        result.current.setStepData(5, {
          easierVariations: [{ name: 'Easy', description: 'Easy var' }],
          harderVariations: [{ name: 'Hard', description: 'Hard var' }],
          substitutions: [{ name: 'Sub', reason: 'Reason' }],
        });
      });

      mockExerciseService.createExercise.mockResolvedValue('id');

      await act(async () => {
        await result.current.submitWizard();
      });

      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId,
          name: 'Test Exercise',
          description: 'Test description',
          category: 'cardio',
          difficulty: 'advanced',
          muscleGroups: ['chest', 'triceps'],
          movementPattern: 'push',
          equipment: ['barbell'],
          unilateral: true,
          instructions: 'Prep 1\nStep 1',
          tips: 'Tip 1',
          commonMistakes: 'Mistake 1',
          setupInstructions: 'Setup 1',
          safetyNotes: 'Safety 1',
          metadata: expect.objectContaining({
            progressionMethods: ['Progress 1'],
            variations: expect.objectContaining({
              easierVariations: [{ name: 'Easy', description: 'Easy var' }],
            }),
            alternativeEquipment: ['dumbbells'],
            breathingCues: ['Breathe'],
          }),
        })
      );
    });
  });

  describe('wizard reset', () => {
    it('should reset wizard to initial state', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      // Make some changes
      act(() => {
        result.current.goToStep(3);
        result.current.setStepData(0, { name: 'Test' });
        result.current.setStepData(1, { primaryMuscleGroups: ['chest'] });
      });

      expect(result.current.currentStep).toBe(3);
      expect(result.current.wizardData.basicInfo.name).toBe('Test');

      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.wizardData.basicInfo.name).toBe('');
      expect(result.current.wizardData.targeting.primaryMuscleGroups).toEqual([]);
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty profileId', () => {
      const { result } = renderHook(() => useExerciseWizard(''));

      expect(result.current.currentStep).toBe(0);
      expect(result.current.stepData.length).toBe(6);
    });

    it('should handle very long step data arrays', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      act(() => {
        result.current.setStepData(3, {
          executionSteps: Array.from({ length: 100 }, (_, i) => `Step ${i + 1}`),
        });
      });

      expect(result.current.wizardData.instructions.executionSteps.length).toBe(100);
    });

    it('should handle special characters in step data', () => {
      const { result } = renderHook(() => useExerciseWizard(profileId));

      const specialName = 'Exercise™ with "quotes" & symbols';

      act(() => {
        result.current.setStepData(0, { name: specialName });
      });

      expect(result.current.wizardData.basicInfo.name).toBe(specialName);
    });
  });
});
