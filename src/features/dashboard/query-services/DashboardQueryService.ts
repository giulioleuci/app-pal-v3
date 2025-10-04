import { inject, injectable } from 'tsyringe';

import {
  DashboardData,
  DashboardMetrics,
  DashboardService,
  ProgressTrends,
  RecentActivity,
} from '@/features/dashboard/services/DashboardService';

/**
 * Query service that acts as an adapter between the Dashboard Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the DashboardService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all dashboard-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class DashboardQueryService {
  constructor(@inject(DashboardService) private readonly dashboardService: DashboardService) {}

  /**
   * Generates complete dashboard data for a profile.
   * @param profileId The profile ID to generate dashboard for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to complete dashboard data
   */
  async getDashboardData(profileId: string): Promise<DashboardData> {
    const result = await this.dashboardService.getDashboardData(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Generates key metrics for the dashboard.
   * @param profileId The profile ID to generate metrics for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to dashboard metrics
   */
  async generateDashboardMetrics(profileId: string): Promise<DashboardMetrics> {
    const result = await this.dashboardService.generateDashboardMetrics(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Generates recent activity data for the dashboard.
   * @param profileId The profile ID to generate activity for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to recent activity data
   */
  async generateRecentActivity(profileId: string): Promise<RecentActivity> {
    const result = await this.dashboardService.generateRecentActivity(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Generates progress trends for dashboard charts.
   * @param profileId The profile ID to generate trends for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to progress trends
   */
  async generateProgressTrends(profileId: string): Promise<ProgressTrends> {
    const result = await this.dashboardService.generateProgressTrends(profileId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }
}
