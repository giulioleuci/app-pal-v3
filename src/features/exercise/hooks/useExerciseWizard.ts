import { useCallback, useMemo, useState } from 'react';
import { container } from 'tsyringe';

import { ExerciseService } from '@/features/exercise/services/ExerciseService';

export interface StepData {
  stepId: string;
  title: string;
  description: string;
  isValid: boolean;
  isComplete: boolean;
  data: any;
}

export interface ExerciseWizardData {
  // Step 1: Basic Information
  basicInfo: {
    name: string;
    description?: string;
    category: 'strength' | 'cardio' | 'flexibility' | 'plyometric';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };

  // Step 2: Muscle Groups & Movement Pattern
  targeting: {
    primaryMuscleGroups: string[];
    secondaryMuscleGroups: string[];
    movementPattern: string;
    unilateral: boolean;
  };

  // Step 3: Equipment & Setup
  equipment: {
    requiredEquipment: string[];
    alternativeEquipment: string[];
    setupInstructions: string[];
    safetyNotes: string[];
  };

  // Step 4: Exercise Instructions
  instructions: {
    preparationSteps: string[];
    executionSteps: string[];
    breathingCues: string[];
    formTips: string[];
    commonMistakes: string[];
  };

  // Step 5: Programming Guidelines
  programming: {
    recommendedRepRanges: {
      strength: { min: number; max: number };
      hypertrophy: { min: number; max: number };
      endurance: { min: number; max: number };
    };
    recommendedSets: { min: number; max: number };
    restTime: { min: number; max: number }; // in seconds
    frequency: { min: number; max: number }; // per week
    progressionMethods: string[];
  };

  // Step 6: Variations & Substitutions
  variations: {
    easierVariations: Array<{ name: string; description: string }>;
    harderVariations: Array<{ name: string; description: string }>;
    substitutions: Array<{ name: string; reason: string; equipment?: string[] }>;
  };
}

interface UseExerciseWizardResult {
  currentStep: number;
  stepData: StepData[];
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setStepData: <K extends keyof ExerciseWizardData>(
    step: number,
    data: Partial<ExerciseWizardData[K]>
  ) => void;
  canProceed: boolean;
  canGoBack: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  submitWizard: () => Promise<string>;
  resetWizard: () => void;
  wizardData: ExerciseWizardData;
  completionPercentage: number;
  isSubmitting: boolean;
}

/**
 * Hook for multi-step exercise creation wizard state management.
 *
 * Manages complex exercise creation workflow through a step-by-step wizard interface.
 * Provides validation, progress tracking, and state management for comprehensive
 * exercise setup without changing existing business logic.
 *
 * @param profileId The profile ID to create the exercise for
 * @returns Object with wizard state and navigation functions
 *
 * @example
 * ```typescript
 * const {
 *   currentStep,
 *   stepData,
 *   nextStep,
 *   prevStep,
 *   setStepData,
 *   canProceed,
 *   submitWizard,
 *   completionPercentage
 * } = useExerciseWizard(profileId);
 *
 * return (
 *   <Wizard>
 *     <WizardHeader>
 *       <ProgressBar value={completionPercentage} />
 *       <Typography>Step {currentStep + 1} of {stepData.length}</Typography>
 *     </WizardHeader>
 *
 *     <WizardContent>
 *       {currentStep === 0 && (
 *         <BasicInfoStep
 *           data={wizardData.basicInfo}
 *           onChange={(data) => setStepData(0, data)}
 *         />
 *       )}
 *       {currentStep === 1 && (
 *         <TargetingStep
 *           data={wizardData.targeting}
 *           onChange={(data) => setStepData(1, data)}
 *         />
 *       )}
 *       // ... other steps
 *     </WizardContent>
 *
 *     <WizardActions>
 *       <Button onClick={prevStep} disabled={!canGoBack}>
 *         Back
 *       </Button>
 *       {isLastStep ? (
 *         <Button onClick={submitWizard} disabled={!canProceed}>
 *           Create Exercise
 *         </Button>
 *       ) : (
 *         <Button onClick={nextStep} disabled={!canProceed}>
 *           Next
 *         </Button>
 *       )}
 *     </WizardActions>
 *   </Wizard>
 * );
 * ```
 */
export function useExerciseWizard(profileId: string): UseExerciseWizardResult {
  const exerciseService = container.resolve(ExerciseService);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize wizard data with default values
  const [wizardData, setWizardData] = useState<ExerciseWizardData>({
    basicInfo: {
      name: '',
      description: '',
      category: 'strength',
      difficulty: 'beginner',
    },
    targeting: {
      primaryMuscleGroups: [],
      secondaryMuscleGroups: [],
      movementPattern: '',
      unilateral: false,
    },
    equipment: {
      requiredEquipment: [],
      alternativeEquipment: [],
      setupInstructions: [],
      safetyNotes: [],
    },
    instructions: {
      preparationSteps: [],
      executionSteps: [],
      breathingCues: [],
      formTips: [],
      commonMistakes: [],
    },
    programming: {
      recommendedRepRanges: {
        strength: { min: 1, max: 5 },
        hypertrophy: { min: 6, max: 12 },
        endurance: { min: 13, max: 20 },
      },
      recommendedSets: { min: 3, max: 5 },
      restTime: { min: 60, max: 180 },
      frequency: { min: 1, max: 3 },
      progressionMethods: [],
    },
    variations: {
      easierVariations: [],
      harderVariations: [],
      substitutions: [],
    },
  });

  // Define step configurations
  const stepConfigurations = useMemo(
    (): StepData[] => [
      {
        stepId: 'basic-info',
        title: 'Basic Information',
        description: 'Name, category, and difficulty level',
        isValid: false,
        isComplete: false,
        data: wizardData.basicInfo,
      },
      {
        stepId: 'targeting',
        title: 'Muscle Groups & Movement',
        description: 'Target muscles and movement patterns',
        isValid: false,
        isComplete: false,
        data: wizardData.targeting,
      },
      {
        stepId: 'equipment',
        title: 'Equipment & Setup',
        description: 'Required equipment and setup instructions',
        isValid: false,
        isComplete: false,
        data: wizardData.equipment,
      },
      {
        stepId: 'instructions',
        title: 'Exercise Instructions',
        description: 'Step-by-step execution guide',
        isValid: false,
        isComplete: false,
        data: wizardData.instructions,
      },
      {
        stepId: 'programming',
        title: 'Programming Guidelines',
        description: 'Recommended sets, reps, and progression',
        isValid: false,
        isComplete: false,
        data: wizardData.programming,
      },
      {
        stepId: 'variations',
        title: 'Variations & Substitutions',
        description: 'Alternative versions and substitutions',
        isValid: false,
        isComplete: false,
        data: wizardData.variations,
      },
    ],
    [wizardData]
  );

  // Validate each step and update step data
  const stepData = useMemo((): StepData[] => {
    return stepConfigurations.map((step, index) => ({
      ...step,
      isValid: validateStep(index, wizardData),
      isComplete: validateStep(index, wizardData) && hasCompleteData(index, wizardData),
    }));
  }, [stepConfigurations, wizardData]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completedSteps = stepData.filter((step) => step.isComplete).length;
    return Math.round((completedSteps / stepData.length) * 100);
  }, [stepData]);

  // Navigation helpers
  const canProceed = stepData[currentStep]?.isValid || false;
  const canGoBack = currentStep > 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === stepData.length - 1;

  /**
   * Moves to the next step
   */
  const nextStep = useCallback(() => {
    if (canProceed && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, isLastStep]);

  /**
   * Moves to the previous step
   */
  const prevStep = useCallback(() => {
    if (canGoBack) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [canGoBack]);

  /**
   * Jumps to a specific step
   */
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < stepData.length) {
        setCurrentStep(step);
      }
    },
    [stepData.length]
  );

  /**
   * Updates data for a specific step
   */
  const setStepData = useCallback(
    <K extends keyof ExerciseWizardData>(step: number, data: Partial<ExerciseWizardData[K]>) => {
      const stepKeys: (keyof ExerciseWizardData)[] = [
        'basicInfo',
        'targeting',
        'equipment',
        'instructions',
        'programming',
        'variations',
      ];

      const stepKey = stepKeys[step];
      if (stepKey) {
        setWizardData((prev) => ({
          ...prev,
          [stepKey]: { ...prev[stepKey], ...data },
        }));
      }
    },
    []
  );

  /**
   * Submits the wizard and creates the exercise
   */
  const submitWizard = useCallback(async (): Promise<string> => {
    if (!stepData.every((step) => step.isValid)) {
      throw new Error('Please complete all required steps before submitting');
    }

    setIsSubmitting(true);

    try {
      // Transform wizard data to exercise creation format
      const exerciseData = {
        profileId,
        name: wizardData.basicInfo.name,
        description: wizardData.basicInfo.description,
        category: wizardData.basicInfo.category,
        difficulty: wizardData.basicInfo.difficulty,
        muscleGroups: [
          ...wizardData.targeting.primaryMuscleGroups,
          ...wizardData.targeting.secondaryMuscleGroups,
        ],
        movementPattern: wizardData.targeting.movementPattern,
        equipment: wizardData.equipment.requiredEquipment,
        instructions: [
          ...wizardData.instructions.preparationSteps,
          ...wizardData.instructions.executionSteps,
        ].join('\n'),
        tips: wizardData.instructions.formTips.join('\n'),
        commonMistakes: wizardData.instructions.commonMistakes.join('\n'),
        setupInstructions: wizardData.equipment.setupInstructions.join('\n'),
        safetyNotes: wizardData.equipment.safetyNotes.join('\n'),
        unilateral: wizardData.targeting.unilateral,
        metadata: {
          recommendedRepRanges: wizardData.programming.recommendedRepRanges,
          recommendedSets: wizardData.programming.recommendedSets,
          restTime: wizardData.programming.restTime,
          frequency: wizardData.programming.frequency,
          progressionMethods: wizardData.programming.progressionMethods,
          variations: wizardData.variations,
          alternativeEquipment: wizardData.equipment.alternativeEquipment,
          breathingCues: wizardData.instructions.breathingCues,
        },
      };

      // Create the exercise
      const exerciseId = await exerciseService.createExercise(exerciseData);

      return exerciseId;
    } catch (_error) {
      console.error('Error submitting exercise wizard:', _error);
      throw new Error('Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
  }, [stepData, wizardData, profileId, exerciseService]);

  /**
   * Resets the wizard to initial state
   */
  const resetWizard = useCallback(() => {
    setCurrentStep(0);
    setIsSubmitting(false);
    setWizardData({
      basicInfo: {
        name: '',
        description: '',
        category: 'strength',
        difficulty: 'beginner',
      },
      targeting: {
        primaryMuscleGroups: [],
        secondaryMuscleGroups: [],
        movementPattern: '',
        unilateral: false,
      },
      equipment: {
        requiredEquipment: [],
        alternativeEquipment: [],
        setupInstructions: [],
        safetyNotes: [],
      },
      instructions: {
        preparationSteps: [],
        executionSteps: [],
        breathingCues: [],
        formTips: [],
        commonMistakes: [],
      },
      programming: {
        recommendedRepRanges: {
          strength: { min: 1, max: 5 },
          hypertrophy: { min: 6, max: 12 },
          endurance: { min: 13, max: 20 },
        },
        recommendedSets: { min: 3, max: 5 },
        restTime: { min: 60, max: 180 },
        frequency: { min: 1, max: 3 },
        progressionMethods: [],
      },
      variations: {
        easierVariations: [],
        harderVariations: [],
        substitutions: [],
      },
    });
  }, []);

  return {
    currentStep,
    stepData,
    nextStep,
    prevStep,
    goToStep,
    setStepData,
    canProceed,
    canGoBack,
    isFirstStep,
    isLastStep,
    submitWizard,
    resetWizard,
    wizardData,
    completionPercentage,
    isSubmitting,
  };
}

/**
 * Validates data for a specific step
 */
function validateStep(stepIndex: number, data: ExerciseWizardData): boolean {
  switch (stepIndex) {
    case 0: // Basic Info
      return !!data.basicInfo.name.trim();

    case 1: // Targeting
      return data.targeting.primaryMuscleGroups.length > 0;

    case 2: // Equipment
      return true; // Equipment is optional

    case 3: // Instructions
      return data.instructions.executionSteps.length > 0;

    case 4: // Programming
      return data.programming.progressionMethods.length > 0;

    case 5: // Variations
      return true; // Variations are optional

    default:
      return false;
  }
}

/**
 * Checks if a step has complete/comprehensive data
 */
function hasCompleteData(stepIndex: number, data: ExerciseWizardData): boolean {
  switch (stepIndex) {
    case 0: // Basic Info
      return !!(data.basicInfo.name.trim() && data.basicInfo.description?.trim());

    case 1: // Targeting
      return (
        data.targeting.primaryMuscleGroups.length > 0 && !!data.targeting.movementPattern.trim()
      );

    case 2: // Equipment
      return (
        data.equipment.requiredEquipment.length > 0 && data.equipment.setupInstructions.length > 0
      );

    case 3: // Instructions
      return data.instructions.executionSteps.length >= 2 && data.instructions.formTips.length > 0;

    case 4: // Programming
      return data.programming.progressionMethods.length >= 2;

    case 5: // Variations
      return (
        data.variations.easierVariations.length > 0 || data.variations.harderVariations.length > 0
      );

    default:
      return false;
  }
}
