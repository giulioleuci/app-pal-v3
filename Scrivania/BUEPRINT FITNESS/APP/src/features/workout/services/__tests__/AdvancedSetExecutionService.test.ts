import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { MavSetConfiguration } from '@/features/training-plan/domain/sets/MavSetConfiguration';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';
import { PyramidalSetConfiguration } from '@/features/training-plan/domain/sets/PyramidalSetConfiguration';
import { RestPauseSetConfiguration } from '@/features/training-plan/domain/sets/RestPauseSetConfiguration';
import { Result } from '@/shared/utils/Result';

import { AdvancedSetExecutionService, SetProgressionData } from '../AdvancedSetExecutionService';
import { DropSetExecutionService } from '../DropSetExecutionService';
import { MavExecutionService } from '../MavExecutionService';
import { MyoRepsExecutionService } from '../MyoRepsExecutionService';
import { PyramidalExecutionService } from '../PyramidalExecutionService';
import { RestPauseExecutionService } from '../RestPauseExecutionService';

describe('AdvancedSetExecutionService', () => {
  let service: AdvancedSetExecutionService;
  let mockDropSetService: DropSetExecutionService;
  let mockMyoRepsService: MyoRepsExecutionService;
  let mockPyramidalService: PyramidalExecutionService;
  let mockRestPauseService: RestPauseExecutionService;
  let mockMavService: MavExecutionService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockDropSetService = {
      initializeExecution: vi.fn(),
      progressToNextPhase: vi.fn(),
      validatePhaseCompletion: vi.fn(),
      getSuggestedRestPeriod: vi.fn(),
    } as any;

    mockMyoRepsService = {
      initializeExecution: vi.fn(),
      progressToNextPhase: vi.fn(),
      validatePhaseCompletion: vi.fn(),
      getSuggestedRestPeriod: vi.fn(),
    } as any;

    mockPyramidalService = {
      initializeExecution: vi.fn(),
      progressToNextPhase: vi.fn(),
      validatePhaseCompletion: vi.fn(),
      getSuggestedRestPeriod: vi.fn(),
    } as any;

    mockRestPauseService = {
      initializeExecution: vi.fn(),
      progressToNextPhase: vi.fn(),
      validatePhaseCompletion: vi.fn(),
      getSuggestedRestPeriod: vi.fn(),
    } as any;

    mockMavService = {
      initializeExecution: vi.fn(),
      progressToNextPhase: vi.fn(),
      validatePhaseCompletion: vi.fn(),
      getSuggestedRestPeriod: vi.fn(),
    } as any;

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    service = new AdvancedSetExecutionService(
      mockDropSetService,
      mockMyoRepsService,
      mockPyramidalService,
      mockRestPauseService,
      mockMavService,
      mockLogger
    );
  });

  describe('initializeExecution', () => {
    it('should initialize drop set execution', async () => {
      const dropSetConfig = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const mockState = {
        currentPhase: 1,
        totalPhases: 3,
        isCompleted: false,
        currentSetData: { weight: 100, counts: 8 },
        nextSetData: { weight: 80, expectedCounts: 8 },
        restPeriodSeconds: 15,
      };

      vi.mocked(mockDropSetService.initializeExecution).mockResolvedValue(
        Result.success(mockState)
      );

      const result = await service.initializeExecution(dropSetConfig, 100);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().setType).toBe('drop');
      expect(result.getValue().currentPhase).toBe(1);
      expect(result.getValue().totalPhases).toBe(3);
      expect(mockDropSetService.initializeExecution).toHaveBeenCalledWith(dropSetConfig, 100);
    });

    it('should initialize myoReps execution', async () => {
      const myoRepsConfig = new MyoRepsSetConfiguration({
        type: 'myoReps',
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      const mockState = {
        currentPhase: 1,
        totalPhases: 4,
        isCompleted: false,
        currentSetData: { weight: 80, counts: 15 },
        nextSetData: { weight: 80, expectedCounts: 5 },
        restPeriodSeconds: 20,
      };

      vi.mocked(mockMyoRepsService.initializeExecution).mockResolvedValue(
        Result.success(mockState)
      );

      const result = await service.initializeExecution(myoRepsConfig, 80);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().setType).toBe('myoReps');
      expect(mockMyoRepsService.initializeExecution).toHaveBeenCalledWith(myoRepsConfig, 80);
    });

    it('should initialize pyramidal execution', async () => {
      const pyramidConfig = new PyramidalSetConfiguration({
        type: 'pyramidal',
        startCounts: { min: 12, direction: 'asc' },
        endCounts: { min: 6, direction: 'asc' },
        step: { min: 2, direction: 'asc' },
        mode: 'ascending',
        sets: { min: 4, direction: 'asc' },
      });

      const mockState = {
        currentPhase: 1,
        totalPhases: 4,
        isCompleted: false,
        currentSetData: { weight: 60, counts: 12 },
        nextSetData: { weight: 65, expectedCounts: 10 },
        restPeriodSeconds: 60,
      };

      vi.mocked(mockPyramidalService.initializeExecution).mockResolvedValue(
        Result.success(mockState)
      );

      const result = await service.initializeExecution(pyramidConfig, 60);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().setType).toBe('pyramidal');
      expect(mockPyramidalService.initializeExecution).toHaveBeenCalledWith(pyramidConfig, 60);
    });

    it('should handle unsupported set types', async () => {
      const unsupportedConfig = { type: 'unsupported' } as any;

      const result = await service.initializeExecution(unsupportedConfig);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Unsupported advanced set type');
    });

    it('should handle service initialization errors', async () => {
      const dropSetConfig = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      vi.mocked(mockDropSetService.initializeExecution).mockResolvedValue(
        Result.failure(new Error('Service error'))
      );

      const result = await service.initializeExecution(dropSetConfig);

      expect(result.isFailure).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('progressToNextPhase', () => {
    const mockCurrentState = {
      setType: 'drop' as const,
      currentPhase: 1,
      totalPhases: 3,
      isCompleted: false,
      currentSetData: { weight: 100, counts: 8 },
      nextSetData: { weight: 80, expectedCounts: 8 },
      restPeriodSeconds: 15,
    };

    const completedSetData: SetProgressionData = {
      weight: 100,
      counts: 8,
      rpe: 8,
      completed: true,
    };

    it('should progress drop set to next phase', async () => {
      const mockNextState = {
        ...mockCurrentState,
        currentPhase: 2,
      };

      vi.mocked(mockDropSetService.progressToNextPhase).mockResolvedValue(
        Result.success(mockNextState)
      );

      const result = await service.progressToNextPhase(mockCurrentState, completedSetData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().currentPhase).toBe(2);
      expect(mockDropSetService.progressToNextPhase).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPhase: 1,
          totalPhases: 3,
          isCompleted: false,
        }),
        completedSetData
      );
    });

    it('should handle progression errors', async () => {
      vi.mocked(mockDropSetService.progressToNextPhase).mockResolvedValue(
        Result.failure(new Error('Progression error'))
      );

      const result = await service.progressToNextPhase(mockCurrentState, completedSetData);

      expect(result.isFailure).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('validatePhaseCompletion', () => {
    const mockCurrentState = {
      setType: 'myoReps' as const,
      currentPhase: 1,
      totalPhases: 4,
      isCompleted: false,
      currentSetData: { weight: 80, counts: 15 },
    };

    const proposedSetData: SetProgressionData = {
      weight: 80,
      counts: 15,
      rpe: 8,
      completed: true,
    };

    it('should validate phase completion successfully', async () => {
      vi.mocked(mockMyoRepsService.validatePhaseCompletion).mockResolvedValue(Result.success(true));

      const result = await service.validatePhaseCompletion(mockCurrentState, proposedSetData);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
      expect(mockMyoRepsService.validatePhaseCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPhase: 1,
          totalPhases: 4,
          isCompleted: false,
        }),
        proposedSetData
      );
    });

    it('should handle validation errors', async () => {
      vi.mocked(mockMyoRepsService.validatePhaseCompletion).mockResolvedValue(
        Result.failure(new Error('Validation error'))
      );

      const result = await service.validatePhaseCompletion(mockCurrentState, proposedSetData);

      expect(result.isFailure).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getSuggestedRestPeriod', () => {
    it('should get rest period for drop sets', async () => {
      const mockCurrentState = {
        setType: 'drop' as const,
        currentPhase: 2,
        totalPhases: 3,
        isCompleted: false,
        currentSetData: { weight: 80, counts: 8 },
      };

      vi.mocked(mockDropSetService.getSuggestedRestPeriod).mockResolvedValue(Result.success(15));

      const result = await service.getSuggestedRestPeriod(mockCurrentState);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(15);
      expect(mockDropSetService.getSuggestedRestPeriod).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPhase: 2,
          totalPhases: 3,
          isCompleted: false,
        })
      );
    });

    it('should return default rest period for unsupported set types', async () => {
      const mockCurrentState = {
        setType: 'unsupported' as any,
        currentPhase: 1,
        totalPhases: 1,
        isCompleted: false,
        currentSetData: { weight: 100, counts: 10 },
      };

      const result = await service.getSuggestedRestPeriod(mockCurrentState);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(60); // Default 1 minute
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors during initialization', async () => {
      const dropSetConfig = new DropSetConfiguration({
        type: 'drop',
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        sets: { min: 1, direction: 'asc' },
      });

      vi.mocked(mockDropSetService.initializeExecution).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await service.initializeExecution(dropSetConfig);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Failed to initialize advanced set execution');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle unexpected errors during progression', async () => {
      const mockCurrentState = {
        setType: 'restPause' as const,
        currentPhase: 1,
        totalPhases: 3,
        isCompleted: false,
        currentSetData: { weight: 90, counts: 10 },
      };

      const completedSetData: SetProgressionData = {
        weight: 90,
        counts: 10,
        rpe: 9,
        completed: true,
      };

      vi.mocked(mockRestPauseService.progressToNextPhase).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await service.progressToNextPhase(mockCurrentState, completedSetData);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Failed to progress to next phase');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
