import { inject, injectable } from 'tsyringe';

import {
  AnalysisService,
  FrequencyAnalysisData,
  StrengthProgressData,
  VolumeAnalysisData,
  WeightProgressData,
} from '@/features/analysis/services/AnalysisService';

/**
 * Query service that acts as an adapter between the Analysis Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the AnalysisService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all analysis-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class AnalysisQueryService {
  constructor(@inject(AnalysisService) private readonly analysisService: AnalysisService) {}

  /**
   * Generates strength progress analysis for a specific exercise over a date range.
   * @param profileId The profile ID to analyze
   * @param exerciseId The exercise ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to strength progress data
   */
  async getStrengthProgress(
    profileId: string,
    exerciseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StrengthProgressData> {
    const result = await this.analysisService.getStrengthProgress(
      profileId,
      exerciseId,
      startDate,
      endDate
    );
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Generates body weight progression analysis over a date range.
   * @param profileId The profile ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to weight progress data
   */
  async getWeightProgress(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeightProgressData> {
    const result = await this.analysisService.getWeightProgress(profileId, startDate, endDate);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Generates training volume analysis over a date range.
   * @param profileId The profile ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to volume analysis data
   */
  async getVolumeAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VolumeAnalysisData> {
    const result = await this.analysisService.getVolumeAnalysis(profileId, startDate, endDate);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Generates workout frequency analysis over a date range.
   * @param profileId The profile ID to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to frequency analysis data
   */
  async getFrequencyAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FrequencyAnalysisData> {
    const result = await this.analysisService.getFrequencyAnalysis(profileId, startDate, endDate);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }
}
