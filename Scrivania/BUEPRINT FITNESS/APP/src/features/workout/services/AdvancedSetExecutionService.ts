import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { MavSetConfiguration } from '@/features/training-plan/domain/sets/MavSetConfiguration';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';
import { PyramidalSetConfiguration } from '@/features/training-plan/domain/sets/PyramidalSetConfiguration';
import { RestPauseSetConfiguration } from '@/features/training-plan/domain/sets/RestPauseSetConfiguration';
import { SetConfiguration } from '@/features/training-plan/domain/sets/SetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { DropSetExecutionService } from './DropSetExecutionService';
import { MavExecutionService } from './MavExecutionService';
import { MyoRepsExecutionService } from './MyoRepsExecutionService';
import { PyramidalExecutionService } from './PyramidalExecutionService';
import { RestPauseExecutionService } from './RestPauseExecutionService';
import { AdvancedSetExecutionState, SetProgressionData } from './types';

// Re-export types for test imports
export type { AdvancedSetExecutionState, SetProgressionData } from './types';

/**
 * Application service responsible for orchestrating advanced set execution during active workouts.
 * This service coordinates between different specialized execution services and manages
 * the step-by-step progression through complex set types.
 */
@injectable()
export class AdvancedSetExecutionService {
  constructor(
    @inject(DropSetExecutionService) private readonly dropSetService: DropSetExecutionService,
    @inject(MyoRepsExecutionService) private readonly myoRepsService: MyoRepsExecutionService,
    @inject(PyramidalExecutionService) private readonly pyramidalService: PyramidalExecutionService,
    @inject(RestPauseExecutionService) private readonly restPauseService: RestPauseExecutionService,
    @inject(MavExecutionService) private readonly mavService: MavExecutionService,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Initializes execution state for an advanced set configuration.
   * @param setConfiguration The advanced set configuration to initialize
   * @param lastWeight Optional last weight used for this exercise
   * @returns A Result containing the initial execution state or an error
   */
  async initializeExecution(
    setConfiguration: SetConfiguration,
    lastWeight?: number
  ): Promise<Result<AdvancedSetExecutionState, ApplicationError>> {
    try {
      this.logger.info('Initializing advanced set execution', {
        setType: setConfiguration.type,
        lastWeight,
      });

      switch (setConfiguration.type) {
        case 'drop': {
          const dropConfig = setConfiguration as DropSetConfiguration;
          const result = await this.dropSetService.initializeExecution(dropConfig, lastWeight);
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('drop', result.getValue()));
          } else {
            this.logger.error('Drop set initialization failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'myoReps': {
          const myoConfig = setConfiguration as MyoRepsSetConfiguration;
          const result = await this.myoRepsService.initializeExecution(myoConfig, lastWeight);
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('myoReps', result.getValue()));
          } else {
            this.logger.error('MyoReps initialization failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'pyramidal': {
          const pyramidConfig = setConfiguration as PyramidalSetConfiguration;
          const result = await this.pyramidalService.initializeExecution(pyramidConfig, lastWeight);
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('pyramidal', result.getValue()));
          } else {
            this.logger.error('Pyramidal initialization failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'restPause': {
          const restPauseConfig = setConfiguration as RestPauseSetConfiguration;
          const result = await this.restPauseService.initializeExecution(
            restPauseConfig,
            lastWeight
          );
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('restPause', result.getValue()));
          } else {
            this.logger.error('Rest-pause initialization failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'mav': {
          const mavConfig = setConfiguration as MavSetConfiguration;
          const result = await this.mavService.initializeExecution(mavConfig, lastWeight);
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('mav', result.getValue()));
          } else {
            this.logger.error('MAV initialization failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        default:
          return Result.failure(
            new ApplicationError(`Unsupported advanced set type: ${setConfiguration.type}`)
          );
      }
    } catch (_error) {
      this.logger.error('Failed to initialize advanced set execution', _error as Error, {
        setType: setConfiguration.type,
        lastWeight,
      });
      return Result.failure(
        new ApplicationError('Failed to initialize advanced set execution', _error)
      );
    }
  }

  /**
   * Progresses to the next phase of an advanced set execution.
   * @param currentState The current execution state
   * @param completedSetData Data from the just-completed set
   * @returns A Result containing the updated execution state or an error
   */
  async progressToNextPhase(
    currentState: AdvancedSetExecutionState,
    completedSetData: SetProgressionData
  ): Promise<Result<AdvancedSetExecutionState, ApplicationError>> {
    try {
      this.logger.info('Progressing to next phase', {
        setType: currentState.setType,
        currentPhase: currentState.currentPhase,
        completedSetData,
      });

      switch (currentState.setType) {
        case 'drop': {
          const result = await this.dropSetService.progressToNextPhase(
            this.mapFromAdvancedState(currentState),
            completedSetData
          );
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('drop', result.getValue()));
          } else {
            this.logger.error('Drop set progression failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'myoReps': {
          const result = await this.myoRepsService.progressToNextPhase(
            this.mapFromAdvancedState(currentState),
            completedSetData
          );
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('myoReps', result.getValue()));
          } else {
            this.logger.error('MyoReps progression failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'pyramidal': {
          const result = await this.pyramidalService.progressToNextPhase(
            this.mapFromAdvancedState(currentState),
            completedSetData
          );
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('pyramidal', result.getValue()));
          } else {
            this.logger.error('Pyramidal progression failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'restPause': {
          const result = await this.restPauseService.progressToNextPhase(
            this.mapFromAdvancedState(currentState),
            completedSetData
          );
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('restPause', result.getValue()));
          } else {
            this.logger.error('Rest-pause progression failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        case 'mav': {
          const result = await this.mavService.progressToNextPhase(
            this.mapFromAdvancedState(currentState),
            completedSetData
          );
          if (result.isSuccess) {
            return Result.success(this.mapToAdvancedState('mav', result.getValue()));
          } else {
            this.logger.error('MAV progression failed', result.error!);
            return Result.failure(result.error!);
          }
        }

        default:
          return Result.failure(
            new ApplicationError(`Unsupported advanced set type: ${currentState.setType}`)
          );
      }
    } catch (_error) {
      this.logger.error('Failed to progress to next phase', _error as Error, {
        setType: currentState.setType,
        currentPhase: currentState.currentPhase,
      });
      return Result.failure(new ApplicationError('Failed to progress to next phase', _error));
    }
  }

  /**
   * Validates if the current phase can be completed with the given data.
   * @param currentState The current execution state
   * @param proposedSetData The proposed set completion data
   * @returns A Result containing validation success or an error
   */
  async validatePhaseCompletion(
    currentState: AdvancedSetExecutionState,
    proposedSetData: SetProgressionData
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      let result: Result<boolean, ApplicationError>;

      switch (currentState.setType) {
        case 'drop':
          result = await this.dropSetService.validatePhaseCompletion(
            this.mapFromAdvancedState(currentState),
            proposedSetData
          );
          break;

        case 'myoReps':
          result = await this.myoRepsService.validatePhaseCompletion(
            this.mapFromAdvancedState(currentState),
            proposedSetData
          );
          break;

        case 'pyramidal':
          result = await this.pyramidalService.validatePhaseCompletion(
            this.mapFromAdvancedState(currentState),
            proposedSetData
          );
          break;

        case 'restPause':
          result = await this.restPauseService.validatePhaseCompletion(
            this.mapFromAdvancedState(currentState),
            proposedSetData
          );
          break;

        case 'mav':
          result = await this.mavService.validatePhaseCompletion(
            this.mapFromAdvancedState(currentState),
            proposedSetData
          );
          break;

        default:
          return Result.failure(
            new ApplicationError(`Unsupported advanced set type: ${currentState.setType}`)
          );
      }

      if (result.isFailure) {
        this.logger.error('Phase completion validation failed', result.error!, {
          setType: currentState.setType,
          currentPhase: currentState.currentPhase,
        });
      }

      return result;
    } catch (_error) {
      this.logger.error('Failed to validate phase completion', _error as Error, {
        setType: currentState.setType,
        currentPhase: currentState.currentPhase,
      });
      return Result.failure(new ApplicationError('Failed to validate phase completion', _error));
    }
  }

  /**
   * Gets the suggested rest period for the current phase.
   * @param currentState The current execution state
   * @returns A Result containing the suggested rest period in seconds or an error
   */
  async getSuggestedRestPeriod(
    currentState: AdvancedSetExecutionState
  ): Promise<Result<number, ApplicationError>> {
    try {
      let result: Promise<Result<number, ApplicationError>>;

      switch (currentState.setType) {
        case 'drop':
          result = this.dropSetService.getSuggestedRestPeriod(
            this.mapFromAdvancedState(currentState)
          );
          break;

        case 'myoReps':
          result = this.myoRepsService.getSuggestedRestPeriod(
            this.mapFromAdvancedState(currentState)
          );
          break;

        case 'pyramidal':
          result = this.pyramidalService.getSuggestedRestPeriod(
            this.mapFromAdvancedState(currentState)
          );
          break;

        case 'restPause':
          result = this.restPauseService.getSuggestedRestPeriod(
            this.mapFromAdvancedState(currentState)
          );
          break;

        case 'mav':
          result = this.mavService.getSuggestedRestPeriod(this.mapFromAdvancedState(currentState));
          break;

        default:
          return Result.success(60); // Default 1 minute rest
      }

      return await result;
    } catch (_error) {
      this.logger.error('Failed to get suggested rest period', _error as Error, {
        setType: currentState.setType,
        currentPhase: currentState.currentPhase,
      });
      return Result.failure(new ApplicationError('Failed to get suggested rest period', _error));
    }
  }

  /**
   * Maps service-specific execution state to the unified advanced state interface.
   */
  private mapToAdvancedState(
    setType: AdvancedSetExecutionState['setType'],
    serviceState: any
  ): AdvancedSetExecutionState {
    return {
      setType,
      currentPhase: serviceState.currentPhase,
      totalPhases: serviceState.totalPhases,
      isCompleted: serviceState.isCompleted,
      currentSetData: serviceState.currentSetData,
      nextSetData: serviceState.nextSetData,
      restPeriodSeconds: serviceState.restPeriodSeconds,
    };
  }

  /**
   * Maps the unified advanced state back to service-specific state format.
   */
  private mapFromAdvancedState(state: AdvancedSetExecutionState): any {
    return {
      currentPhase: state.currentPhase,
      totalPhases: state.totalPhases,
      isCompleted: state.isCompleted,
      currentSetData: state.currentSetData,
      nextSetData: state.nextSetData,
      restPeriodSeconds: state.restPeriodSeconds,
    };
  }
}
