# PUBLIC API - UI Logic Layer

This document provides comprehensive **PUBLIC API** documentation for the UI Logic Layer.
Every class, method, function, input parameter and output value is documented with complete signatures and descriptions.

## PUBLIC API Overview

The UI Logic Layer exposes the following PUBLIC API:
- **Custom React Hooks**: React hooks for component state and business logic integration
- **Query Services**: Adapter pattern for server state management with React Query
- **State Management**: Global and local state management solutions
- **Cache Management**: Granular cache invalidation and synchronization

## API Documentation Format

Each API element follows this format:
- **Function/Hook Name**: Complete function/hook name and description
- **Method Format**: `functionName()` or `ClassName.methodName()` with full signature
- **Input Parameters**: Detailed parameter types and descriptions
- **Output Values**: Complete return type and value descriptions
- **Extended Description**: Comprehensive function/method behavior documentation

---

## Miscellaneous

### Custom Hooks

#### PUBLIC API: `useActiveProfileId()`

**File:** `/src/shared/hooks/useActiveProfileId.ts`

**Full Function Signature:**
```typescript
export function useActiveProfileId(): string | null
```

**Extended Description:**
Hook that provides access to the active profile ID from the profile store. This hook abstracts the Zustand store implementation details, providing a clean interface for components that need to access the currently active profile ID. It returns only the activeProfileId value, making it easier to use and more focused than accessing the full store.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `string | null`
- **Description:** The currently active profile ID, or null if no profile is active

---

#### PUBLIC API: `useAggregateCache()`

**File:** `/src/shared/hooks/useAggregateCache.ts`

**Full Function Signature:**
```typescript
export function useAggregateCache(): SimpleCacheInterface
```

**Extended Description:**
Simplified cache management hook for aggregate hooks (backward compatible). Provides a simple interface for cache warming and pattern-based invalidation while maintaining compatibility with existing aggregate implementations.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `SimpleCacheInterface`
- **Description:** Simple cache management interface

---

#### PUBLIC API: `useAdvancedAggregateCache()`

**File:** `/src/shared/hooks/useAggregateCache.ts`

**Full Function Signature:**
```typescript
export function useAdvancedAggregateCache(
  featureName: string,
  options: CacheOptimizationOptions =
```

**Extended Description:**
Advanced cache management hook for aggregate hooks. This hook provides sophisticated cache management capabilities specifically designed for aggregate hooks that manage multiple related queries. It offers: - Intelligent cache invalidation with pattern matching - Coordinated cache updates across related queries - Performance-optimized prefetching strategies - Cache warming and background refresh capabilities

**INPUT PARAMETERS:**

- **`featureName`** (`string`): No description provided
- **`options`** (`CacheOptimizationOptions`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ generateKey: (operation: string, ...params: unknown[]) => unknown[]; invalidatePattern: (pattern: CacheInvalidationPattern) => Promise<void>; updateMultiple: (updates: { queryKey: unknown[]; data: unknown; exact?: boolean | undefined; }[]) => void; prefetchRelated: (baseKey: unknown[], relatedQueries: { key: unknown[]; fetchFn: () => Promise<unknown>; priority?: "low" | "medium" | "high" | undefined; }[]) => Promise<void>; warmCache: () => Promise<void>; setupBackgroundRefresh: () => () => void; getMetrics: () => { totalQueries: number; staleQueries: number; errorQueries: number; loadingQueries: number; cachedQueries: number; cacheHitRatio: number; oldestCacheTime: number; newestCacheTime: number; }; getOptimizationSuggestions: () => string[]; }`
- **Description:** Cache management interface

---

#### PUBLIC API: `createCrudHooks()`

**File:** `/src/shared/hooks/useCrudHooks.ts`

**Full Function Signature:**
```typescript
export function createCrudHooks<T, TCreate, TUpdate>(
  entityName: string,
  service: CrudService<T, TCreate, TUpdate>
)
```

**Extended Description:**
Generic CRUD hooks factory that creates standardized hooks for any entity. Reduces boilerplate and ensures consistent patterns across all features.

**INPUT PARAMETERS:**

- **`entityName`** (`string`): No description provided
- **`service`** (`CrudService<T, TCreate, TUpdate>`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ useCreate: (options?: Omit<UseMutationOptions<T, ApplicationError, TCreate, unknown>, "mutationFn"> | undefined) => UseMutationResult<T, ApplicationError, TCreate, unknown>; useUpdate: (options?: Omit<UseMutationOptions<T, ApplicationError, TUpdate, unknown>, "mutationFn"> | undefined) => UseMutationResult<T, ApplicationError, TUpdate, unknown>; useDelete: (options?: Omit<UseMutationOptions<void, ApplicationError, { id: string; }, unknown>, "mutationFn"> | undefined) => UseMutationResult<void, ApplicationError, { id: string; }, unknown>; useGet: (id: string, options?: Omit<UseQueryOptions<T, ApplicationError, T, readonly unknown[]>, "queryKey" | "queryFn"> | undefined) => UseQueryResult<F<T>, ApplicationError>; useList: (profileId: string, options?: Omit<UseQueryOptions<T[], ApplicationError, T[], readonly unknown[]>, "queryKey" | "queryFn"> | undefined) => UseQueryResult<T[], ApplicationError>; }`
- **Description:** Object containing standardized CRUD hooks

---

#### PUBLIC API: `useDebouncedValue()`

**File:** `/src/shared/hooks/useDebouncedValue.ts`

**Full Function Signature:**
```typescript
export function useDebouncedValue<T>(value: T, delay: number): T
```

**Extended Description:**
A generic hook that debounces a value, delaying updates until after the specified delay. This hook is useful for optimizing performance in scenarios where you want to delay expensive operations (like API calls or complex computations) until the user has stopped changing a value for a certain period of time.

**INPUT PARAMETERS:**

- **`value`** (`T`): No description provided
- **`delay`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `T`
- **Description:** The debounced value that updates only after the delay period

**Usage Examples:**

```typescript
```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

// Only triggers search when user stops typing for 300ms
useEffect(() => {
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```
```

---

#### PUBLIC API: `useObserveQuery()`

**File:** `/src/shared/hooks/useObserveQuery.ts`

**Full Function Signature:**
```typescript
export function useObserveQuery<T = Model>(
  query: Query<Model> | null | undefined,
  options: UseObserveQueryOptions<T> =
```

**Extended Description:**
A generic React hook that bridges WatermelonDB's reactive `observe()` API with React's `useSyncExternalStore`. This hook provides a reactive foundation for integrating WatermelonDB queries with React components, automatically updating the component when the underlying data changes.

**INPUT PARAMETERS:**

- **`query`** (`default<default> | null | undefined`): No description provided
- **`options`** (`UseObserveQueryOptions<T>`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseObserveQueryResult<T>`
- **Description:** Object containing the current query results and observation status

**Usage Examples:**

```typescript
```typescript
// Basic usage
const { data: profiles, isObserving } = useObserveQuery(
  database.get('profiles').query(),
  {
    transform: (models) => models.map(toDomainFormat),
    enabled: true
  }
);

// With filtering
const { data: activeProfiles } = useObserveQuery(
  database.get('profiles').query(Q.where('is_active', true)),
  {
    transform: (models) => models.map(profileToDomain)
  }
);

// Conditional observation
const { data: exercises } = useObserveQuery(
  profileId ? database.get('exercises').query(Q.where('profile_id', profileId)) : null,
  {
    enabled: !!profileId,
    transform: exerciseTransform
  }
);
```
```

---

#### PUBLIC API: `useOptimizedQuery()`

**File:** `/src/shared/hooks/useOptimizedQuery.ts`

**Full Function Signature:**
```typescript
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> =
```

**Extended Description:**
Advanced optimized query hook with intelligent caching, debouncing, and performance tracking. This hook extends React Query with additional optimization features: - Intelligent cache management with adaptive stale times - Debounced refetch operations to prevent excessive requests - Automatic background refresh with visibility/online detection - Prefetching of related data - Performance metrics and cache hit ratio tracking

**INPUT PARAMETERS:**

- **`queryKey`** (`unknown[]`): No description provided
- **`queryFn`** (`() => Promise<TData>`): No description provided
- **`options`** (`OptimizedQueryOptions<TData, TError>`): No description provided

**OUTPUT VALUE:**
- **Type:** `OptimizedQueryResult<TData, TError>`
- **Description:** Enhanced query result with optimization features

---

#### PUBLIC API: `useOptimizedInfiniteQuery()`

**File:** `/src/shared/hooks/useOptimizedQuery.ts`

**Full Function Signature:**
```typescript
export function useOptimizedInfiniteQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: (
```

**Extended Description:**
Hook for creating optimized infinite queries with the same optimization features

**INPUT PARAMETERS:**

- **`queryKey`** (`unknown[]`): No description provided
- **`queryFn`** (`({ pageParam }: { pageParam: unknown; }) => Promise<TData>`): No description provided
- **`options`** (`OptimizedQueryOptions<TData, TError> & { initialPageParam: unknown; getNextPageParam: (lastPage: TData, allPages: TData[], lastPageParam: unknown) => unknown; }`): No description provided

**OUTPUT VALUE:**
- **Type:** `OptimizedQueryResult<TData, TError>`
- **Description:** Returns value of type OptimizedQueryResult<TData, TError>

---

#### PUBLIC API: `useOptimizedSearch()`

**File:** `/src/shared/hooks/useOptimizedQuery.ts`

**Full Function Signature:**
```typescript
export function useOptimizedSearch<TData, TError = Error>(
  searchTerm: string,
  queryKey: unknown[],
  searchFn: (term: string) => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> &
```

**Extended Description:**
Specialized hook for search queries with built-in debouncing and ranking

**INPUT PARAMETERS:**

- **`searchTerm`** (`string`): No description provided
- **`queryKey`** (`unknown[]`): No description provided
- **`searchFn`** (`(term: string) => Promise<TData>`): No description provided
- **`options`** (`OptimizedQueryOptions<TData, TError> & { minQueryLength?: number | undefined; debounceMs?: number | undefined; rankingFn?: ((results: TData, query: string) => TData) | undefined; }`): No description provided

**OUTPUT VALUE:**
- **Type:** `OptimizedQueryResult<TData, TError>`
- **Description:** Returns value of type OptimizedQueryResult<TData, TError>

---

#### PUBLIC API: `usePerformanceMonitor()`

**File:** `/src/shared/hooks/usePerformanceMonitor.ts`

**Full Function Signature:**
```typescript
export function usePerformanceMonitor(hookName: string, enabled = process.env.NODE_ENV === 'development')
```

**Extended Description:**
Performance monitoring hook for aggregate hooks. This hook provides comprehensive performance monitoring for aggregate hooks: - Render time tracking - Memory usage monitoring   - Cache performance analysis - Error rate tracking - Trend analysis and recommendations Use this hook to wrap your aggregate hooks during development to monitor performance and identify optimization opportunities.

**INPUT PARAMETERS:**

- **`hookName`** (`string`): No description provided
- **`enabled`** (`boolean`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ metrics: AggregatePerformanceMetrics | undefined; recordError: () => void; measureOperation: <T>(operation: () => T, operationName?: string | undefined) => T; getOptimizationSuggestions: () => string[]; isPerformant: boolean; hasIssues: boolean; enabled: boolean; }`
- **Description:** Performance monitoring utilities

---

#### PUBLIC API: `useGlobalPerformanceMetrics()`

**File:** `/src/shared/hooks/usePerformanceMonitor.ts`

**Full Function Signature:**
```typescript
export function useGlobalPerformanceMetrics()
```

**Extended Description:**
Hook to access global performance metrics for all aggregate hooks

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `{ allMetrics: Map<string, AggregatePerformanceMetrics>; report: { summary: { totalHooks: number; averagePerformance: number; issuesFound: number; }; recommendations: string[]; topPerformers: string[]; needsAttention: string[]; }; getMetricsArray: () => AggregatePerformanceMetrics[]; getTopPerformers: () => string[]; getIssues: () => string[]; getRecommendations: () => string[]; }`
- **Description:** Returns value of type { allMetrics: Map<string, AggregatePerformanceMetrics>; report: { summary: { totalHooks: number; averagePerformance: number; issuesFound: number; }; recommendations: string[]; topPerformers: string[]; needsAttention: string[]; }; getMetricsArray: () => AggregatePerformanceMetrics[]; getTopPerformers: () => string[]; getIssues: () => string[]; getRecommendations: () => string[]; }

---

#### PUBLIC API: `logPerformanceReport()`

**File:** `/src/shared/hooks/usePerformanceMonitor.ts`

**Full Function Signature:**
```typescript
export function logPerformanceReport()
```

**Extended Description:**
Development utility to log performance metrics to console

**INPUT PARAMETERS:** None

**OUTPUT VALUE:** `void` (no return value)

---

#### PUBLIC API: `useProgressCalculations()`

**File:** `/src/shared/hooks/useProgressCalculations.ts`

**Full Function Signature:**
```typescript
export function useProgressCalculations(): UseProgressCalculationsResult
```

**Extended Description:**
Hook for statistical analysis and progress calculations. Provides pure calculation functions for analyzing progress data points. Does not fetch data - takes data as parameters for analysis.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `UseProgressCalculationsResult`
- **Description:** Object with calculation functions and analysis tools

**Usage Examples:**

```typescript
```typescript
const {
  calculateTrend,
  getProgressRate,
  projectFutureProgress,
  statisticalSummary
} = useProgressCalculations();

// Analyze strength progression
const maxLogData = maxLogs.map(log => ({
  date: log.achievedDate,
  value: log.weight,
  type: 'weight' as const
}));

const trend = calculateTrend(maxLogData);
const rate = getProgressRate(maxLogData);
const projections = projectFutureProgress(maxLogData, 90); // 90 days

return (
  <Box>
    <TrendIndicator trend={trend} />
    <ProgressRate rate={rate} />
    <ProjectionChart projections={projections} />
  </Box>
);
```
```

---

## Analysis Feature

### Custom Hooks

#### PUBLIC API: `useAnalyticsHub()`

**File:** `/src/features/analysis/hooks/useAnalyticsHub.ts`

**Full Function Signature:**
```typescript
export function useAnalyticsHub(profileId: string, defaultFilters?: AnalyticsFilters)
```

**Extended Description:**
Comprehensive analytics and reporting aggregate hook. This hook provides a unified interface for: - Volume, frequency, strength, and weight progress analysis - Comprehensive report generation - Data export in multiple formats - Chart-ready data formatting - Progress calculations and trends Consolidates 7+ analysis hooks into a single, cohesive API while providing optimized data fetching and caching.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`defaultFilters`** (`AnalyticsFilters | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ volume: UseQueryResult<Result<VolumeAnalysisData, ApplicationError>, Error>; frequency: UseQueryResult<Result<FrequencyAnalysisData, ApplicationError>, Error>; weightProgress: UseQueryResult<Result<WeightProgressData, ApplicationError>, Error>; getStrengthProgress: (exerciseId: string, dateRange?: DateRange | undefined) => UseQueryResult<Result<StrengthProgressData, ApplicationError>, Error>; charts: { volume: any; frequency: any; weight: any; combined: { name: string; data: any; color: string; }[]; }; insights: { volumeTrend: any; frequencyTrend: any; weightTrend: any; overallProgress: string; recommendations: string[]; }; generateReport: UseMutationResult<any, Error, AnalyticsFilters, unknown>; export: UseMutationResult<any, Error, ExportOptions & { filters?: AnalyticsFilters | undefined; }, unknown>; quickAnalysis: { getWeeklyVolume: () => Promise<Result<VolumeAnalysisData, ApplicationError>>; getMonthlyProgress: () => Promise<Result<FrequencyAnalysisData, ApplicationError>>; compareToLastMonth: () => Promise<{ volumeChange: string; frequencyChange: string; improvement: boolean; } | null>; }; isLoadingAnalysis: boolean; isGeneratingReport: boolean; isExporting: boolean; analysisError: Error | null; reportError: Error | null; exportError: Error | null; refetch: () => void; warmCache: (dateRanges?: DateRange[]) => Promise<void>; invalidateCache: () => void; }`
- **Description:** Comprehensive analytics and reporting interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useAnalyticsHub().volume`** - Sub-method of the aggregate hook
- **`useAnalyticsHub().frequency`** - Sub-method of the aggregate hook
- **`useAnalyticsHub().weight`** - Sub-method of the aggregate hook
- **`useAnalyticsHub().combined`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `useDataExport()`

**File:** `/src/features/analysis/hooks/useDataExport.ts`

**Full Function Signature:**
```typescript
export function useDataExport(profileId: string): UseDataExportResult
```

**Extended Description:**
Hook for advanced data export with multiple formats and automated exports. Provides comprehensive data export functionality with support for multiple formats, date range filtering, and scheduled automated exports. Enhances the basic export capabilities with formatted reports and scheduling features.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseDataExportResult`
- **Description:** Object with export functions and format configurations

**Usage Examples:**

```typescript
```typescript
const { 
  exportToCSV, 
  exportToPDF, 
  exportFormats,
  scheduleExport 
} = useDataExport(profileId);

// Export workout data to CSV
const handleExportCSV = async () => {
  const csvData = await exportToCSV({
    workouts: true,
    maxLogs: true,
    dateRange: { from: startDate, to: endDate }
  });
  // Download or display CSV data
};

// Schedule weekly exports
const handleScheduleExport = async () => {
  await scheduleExport({
    format: 'csv',
    data: { workouts: true },
    schedule: { frequency: 'weekly', time: '09:00', enabled: true }
  });
};
```
```

---

#### PUBLIC API: `useGenerateFullReport()`

**File:** `/src/features/analysis/hooks/useGenerateFullReport.ts`

**Full Function Signature:**
```typescript
export function useGenerateFullReport(
  options?: Omit<
    UseMutationOptions<FullAnalysisReport, ApplicationError, GenerateFullReportInput>,
    'mutationFn'
  >
)
```

**Extended Description:**
React Query mutation hook for generating comprehensive analysis reports. This hook triggers a potentially slow, synchronous task that generates a complete analysis report across multiple metrics. Its `isLoading` state is critical for the UI to display a blocking modal during the long-running operation. The mutation aggregates volume, frequency, weight progress, and strength progress data into a single comprehensive report for the specified time period.

**INPUT PARAMETERS:**

- **`options`** (`Omit<UseMutationOptions<FullAnalysisReport, ApplicationError, GenerateFullReportInput, unknown>, "mutationFn"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<FullAnalysisReport, ApplicationError, GenerateFullReportInput, unknown>`
- **Description:** Mutation result with mutate function, loading state, and error information

---

#### PUBLIC API: `useProgressCharts()`

**File:** `/src/features/analysis/hooks/useProgressCharts.ts`

**Full Function Signature:**
```typescript
export function useProgressCharts(
  exerciseIds: string[],
  dateRange: DateRange,
  profileId: string
): UseProgressChartsResult
```

**Extended Description:**
Hook for providing formatted chart data for progress visualization components. Processes strength, volume, and frequency data into chart-ready format with proper axis labels and series formatting. Designed specifically for integration with chart libraries like Chart.js, Recharts, or D3. Transforms raw workout and max log data into visualization-ready datasets.

**INPUT PARAMETERS:**

- **`exerciseIds`** (`string[]`): No description provided
- **`dateRange`** (`DateRange`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseProgressChartsResult`
- **Description:** Object with formatted chart data for different visualization types

**Usage Examples:**

```typescript
```typescript
const { strengthData, volumeData, frequencyData } = useProgressCharts(
  ['exercise1', 'exercise2'],
  { from: startDate, to: endDate },
  profileId
);

return (
  <Box>
    <LineChart data={strengthData} />
    <BarChart data={volumeData} />
    <AreaChart data={frequencyData} />
  </Box>
);
```
```

---

### Query Services

#### AnalysisQueryService

**File:** `/src/features/analysis/query-services/AnalysisQueryService.ts`

**Description:**
Query service that acts as an adapter between the Analysis Application Layer and React Query. This service handles the unwrapping of Result objects returned by the AnalysisService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all analysis-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {AnalysisService} analysisService - 
 */
constructor(@inject('AnalysisService') private readonly analysisService: AnalysisService)
```

**Public Methods:**

##### PUBLIC API: `AnalysisQueryService.getStrengthProgress()`

**Full Method Signature:**
```typescript
async getStrengthProgress(
    profileId: string,
    exerciseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StrengthProgressData>
```

**Extended Description:**
Generates strength progress analysis for a specific exercise over a date range.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`startDate`** (`Date`): No description provided
- **`endDate`** (`Date`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<StrengthProgressData>`
- **Description:** Promise resolving to strength progress data

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `AnalysisQueryService.getWeightProgress()`

**Full Method Signature:**
```typescript
async getWeightProgress(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeightProgressData>
```

**Extended Description:**
Generates body weight progression analysis over a date range.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`startDate`** (`Date`): No description provided
- **`endDate`** (`Date`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WeightProgressData>`
- **Description:** Promise resolving to weight progress data

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `AnalysisQueryService.getVolumeAnalysis()`

**Full Method Signature:**
```typescript
async getVolumeAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VolumeAnalysisData>
```

**Extended Description:**
Generates training volume analysis over a date range.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`startDate`** (`Date`): No description provided
- **`endDate`** (`Date`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<VolumeAnalysisData>`
- **Description:** Promise resolving to volume analysis data

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `AnalysisQueryService.getFrequencyAnalysis()`

**Full Method Signature:**
```typescript
async getFrequencyAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FrequencyAnalysisData>
```

**Extended Description:**
Generates workout frequency analysis over a date range.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`startDate`** (`Date`): No description provided
- **`endDate`** (`Date`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<FrequencyAnalysisData>`
- **Description:** Promise resolving to frequency analysis data

**EXCEPTIONS:**
- When the operation fails

---

## Body-metrics Feature

### Custom Hooks

#### PUBLIC API: `useBodyMetricsTracking()`

**File:** `/src/features/body-metrics/hooks/useBodyMetricsTracking.ts`

**Full Function Signature:**
```typescript
export function useBodyMetricsTracking(profileId: string)
```

**Extended Description:**
Comprehensive body metrics tracking aggregate hook. This hook provides a unified interface for: - Weight and height record management (CRUD operations) - Latest metrics tracking - Historical data and trends - Metric conversions and calculations - Progress analysis Consolidates 9 body-metrics hooks into a single, cohesive API while maintaining reactive data updates through WatermelonDB.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ weightHistory: WeightRecordModel[]; heightHistory: HeightRecordModel[]; latestWeight: WeightRecordModel; latestHeight: HeightRecordModel; isLoadingWeights: boolean; isLoadingHeights: boolean; weight: { add: UseMutationResult<Result<WeightRecordModel, ApplicationError>, Error, AddWeightRecordInput, unknown>; update: UseMutationResult<Result<WeightRecordModel, ApplicationError>, Error, UpdateWeightRecordInput, unknown>; delete: UseMutationResult<void, Error, string, unknown>; }; height: { add: UseMutationResult<Result<HeightRecordModel, ApplicationError>, Error, AddHeightRecordInput, unknown>; delete: UseMutationResult<void, Error, string, unknown>; }; conversions: { kgToLbs: (kg: number) => number; lbsToKg: (lbs: number) => number; cmToFeet: (cm: number) => { feet: number; inches: number; }; feetToCm: (feet: number, inches: number) => number; }; progress: { trend: "stable" | "increasing" | "decreasing"; changeAmount: number; changePercentage: number; bmi: number | null; healthStatus: "unknown" | "underweight" | "normal" | "overweight" | "obese"; }; recentActivity: { weightRecords: number; heightRecords: number; lastWeightUpdate: Date | null; lastHeightUpdate: Date | null; }; isAddingWeight: boolean; isUpdatingWeight: boolean; isDeletingWeight: boolean; isAddingHeight: boolean; isDeletingHeight: boolean; weightError: Error | null; heightError: Error | null; }`
- **Description:** Comprehensive body metrics tracking interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useBodyMetricsTracking().inches`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `useBodyProgressAnalyzer()`

**File:** `/src/features/body-metrics/hooks/useBodyProgressAnalyzer.ts`

**Full Function Signature:**
```typescript
export function useBodyProgressAnalyzer(profileId: string): UseBodyProgressAnalyzerResult
```

**Extended Description:**
Hook for advanced body metrics analysis and health insights. Provides comprehensive analysis of weight trends, body composition changes, BMI calculations, and health metrics using historical body metrics data. Includes predictive analytics for future progress estimation and health recommendations.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseBodyProgressAnalyzerResult`
- **Description:** Object with trend analysis, health metrics, and predictions

**Usage Examples:**

```typescript
```typescript
const {
  weightTrend,
  calculateBMI,
  healthMetrics,
  progressPrediction
} = useBodyProgressAnalyzer(profileId);

return (
  <Box>
    <Typography>Weight Trend: {weightTrend.direction}</Typography>
    <Typography>BMI: {calculateBMI()}</Typography>
    {healthMetrics.map(metric => (
      <HealthMetricCard key={metric.name} metric={metric} />
    ))}
    {progressPrediction && (
      <PredictionChart data={progressPrediction} />
    )}
  </Box>
);
```
```

---

#### PUBLIC API: `useMetricConversions()`

**File:** `/src/features/body-metrics/hooks/useMetricConversions.ts`

**Full Function Signature:**
```typescript
export function useMetricConversions(options: UseMetricConversionsOptions =
```

**Extended Description:**
Hook for unit conversion utilities and formatting for body metrics display. Centralizes conversion logic scattered across components and provides consistent formatting based on user preferences. Handles weight, height, and distance conversions with proper rounding and display formatting.

**INPUT PARAMETERS:**

- **`options`** (`UseMetricConversionsOptions`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMetricConversionsResult`
- **Description:** Object with conversion functions and formatting utilities

**Usage Examples:**

```typescript
```typescript
const {
  convertWeight,
  formatForDisplay,
  getPreferredUnit,
  autoConvert,
  isMetric
} = useMetricConversions({
  preferredUnits: 'metric',
  locale: 'en-US'
});

// Convert weight values
const kgValue = convertWeight(150, 'lbs', 'kg'); // 68.04

// Auto-convert to user's preferred unit
const converted = autoConvert(70, 'weight', 'kg');
// Result: { value: 154.32, unit: 'lbs', formatted: '154.3 lbs' }

// Format for display
const display = formatForDisplay(180, 'height', 'cm'); // "180 cm" or "5' 11\""

return (
  <Box>
    <Typography>Weight: {converted.formatted}</Typography>
    <Typography>System: {isMetric ? 'Metric' : 'Imperial'}</Typography>
  </Box>
);
```
```

---

### Query Services

#### BodyMetricsQueryService

**File:** `/src/features/body-metrics/query-services/BodyMetricsQueryService.ts`

**Description:**
Query service that acts as an adapter between the Body Metrics Application Layer and React Query. This service handles the unwrapping of Result objects returned by the BodyMetricsService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all body metrics-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {BodyMetricsService} bodyMetricsService - 
 */
constructor(
    @inject('BodyMetricsService') private readonly bodyMetricsService: BodyMetricsService
  )
```

**Public Methods:**

##### PUBLIC API: `BodyMetricsQueryService.addWeightRecord()`

**Full Method Signature:**
```typescript
async addWeightRecord(
    profileId: string,
    weight: number,
    date: Date,
    notes?: string
  ): Promise<WeightRecordModel>
```

**Extended Description:**
Adds a new weight record for a user profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`weight`** (`number`): No description provided
- **`date`** (`Date`): No description provided
- **`notes`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WeightRecordModel>`
- **Description:** Promise resolving to the created WeightRecordModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.addHeightRecord()`

**Full Method Signature:**
```typescript
async addHeightRecord(
    profileId: string,
    height: number,
    date: Date,
    notes?: string
  ): Promise<HeightRecordModel>
```

**Extended Description:**
Adds a new height record for a user profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`height`** (`number`): No description provided
- **`date`** (`Date`): No description provided
- **`notes`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<HeightRecordModel>`
- **Description:** Promise resolving to the created HeightRecordModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.getWeightHistory()`

**Full Method Signature:**
```typescript
getWeightHistory(profileId: string): Query<WeightRecord>
```

**Extended Description:**
Retrieves the weight history for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<WeightRecord>`
- **Description:** Query for WeightRecord models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.getHeightHistory()`

**Full Method Signature:**
```typescript
getHeightHistory(profileId: string): Query<HeightRecord>
```

**Extended Description:**
Retrieves the height history for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<HeightRecord>`
- **Description:** Query for HeightRecord models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.getLatestWeight()`

**Full Method Signature:**
```typescript
async getLatestWeight(profileId: string): Promise<WeightRecordModel | undefined>
```

**Extended Description:**
Retrieves the latest weight record for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WeightRecordModel | undefined>`
- **Description:** Promise resolving to the latest WeightRecordModel or undefined

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.getLatestWeightQuery()`

**Full Method Signature:**
```typescript
getLatestWeightQuery(profileId: string): Query<WeightRecord>
```

**Extended Description:**
Gets a WatermelonDB query for the latest weight record of a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<WeightRecord>`
- **Description:** Query for WeightRecord models for reactive observation (sorted by date descending, limit 1)

##### PUBLIC API: `BodyMetricsQueryService.updateWeightRecord()`

**Full Method Signature:**
```typescript
async updateWeightRecord(
    recordId: string,
    newWeight?: number,
    newNotes?: string
  ): Promise<WeightRecordModel>
```

**Extended Description:**
Updates an existing weight record.

**INPUT PARAMETERS:**

- **`recordId`** (`string`): No description provided
- **`newWeight`** (`number | undefined`): No description provided
- **`newNotes`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WeightRecordModel>`
- **Description:** Promise resolving to the updated WeightRecordModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.deleteWeightRecord()`

**Full Method Signature:**
```typescript
async deleteWeightRecord(recordId: string): Promise<void>
```

**Extended Description:**
Deletes a weight record permanently.

**INPUT PARAMETERS:**

- **`recordId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `BodyMetricsQueryService.deleteHeightRecord()`

**Full Method Signature:**
```typescript
async deleteHeightRecord(recordId: string): Promise<void>
```

**Extended Description:**
Deletes a height record permanently.

**INPUT PARAMETERS:**

- **`recordId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

---

## Dashboard Feature

### Custom Hooks

#### PUBLIC API: `useDashboardData()`

**File:** `/src/features/dashboard/hooks/useDashboardData.ts`

**Full Function Signature:**
```typescript
export function useDashboardData(): UseDashboardDataResult
```

**Extended Description:**
Aggregate React Query hook that provides all dashboard data in a unified interface. This hook combines the results of multiple dashboard-related queries into a single, unified interface. It orchestrates the fetching of dashboard metrics, recent activity, and progress trends, providing intelligent state aggregation that combines loading states, errors, and success states from all underlying queries. The hook automatically fetches data for the currently active profile ID from the profile store. If no profile is active, all queries are disabled and the hook returns appropriate empty states. This is a powerful example of the aggregate hook pattern, providing a clean interface for complex dashboard pages that need multiple data sources.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `UseDashboardDataResult`
- **Description:** Combined result with unified loading states, errors, and dashboard data

---

#### PUBLIC API: `useDashboardHub()`

**File:** `/src/features/dashboard/hooks/useDashboardHub.ts`

**Full Function Signature:**
```typescript
export function useDashboardHub()
```

**Extended Description:**
Enhanced dashboard hub that extends the existing useDashboardData with additional capabilities. This hook provides a unified interface for: - Core dashboard metrics, activity, and trends (from existing useDashboardData) - Workout streak tracking - Quick action summaries - Goal progress tracking   - Motivational insights and recommendations - Dashboard customization preferences Enhances the existing dashboard aggregate with comprehensive dashboard management while maintaining backward compatibility.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `{ streak: any; workoutSummary: any; goalProgress: any; weeklyPerformance: { workoutsCompleted: any; targetWorkouts: any; completionRate: number; totalVolume: any; averageIntensity: any; improvement: { volume: any; frequency: any; }; } | null; insights: { message: string; type: "welcome"; actionable: boolean; action?: undefined; } | { message: string; type: "achievement"; actionable: boolean; action: string; } | { message: string; type: "success"; actionable: boolean; action?: undefined; } | { message: string; type: "encouragement"; actionable: boolean; action: string; } | { message: string; type: "motivation"; actionable: boolean; action?: undefined; }; quickActions: { id: string; title: string; description: string; priority: number; category: string; }[]; widgets: { metrics: { visible: boolean; order: number; size: "medium"; }; streak: { visible: boolean; order: number; size: "small"; }; recentActivity: { visible: boolean; order: number; size: "large"; }; progressTrends: { visible: boolean; order: number; size: "medium"; }; goalProgress: { visible: boolean; order: number; size: "medium"; }; quickActions: { visible: boolean; order: number; size: "small"; }; }; isLoadingEnhanced: any; enhancedErrors: { base: ApplicationError | null; streak: any; summary: any; goals: Error | null; weekly: Error | null; }; refresh: () => void; backgroundRefresh: () => Promise<void>; hasCompleteData: boolean; dataFreshness: { metrics: string; streak: string; goals: string; }; warmCache: () => Promise<void>; invalidateCache: () => void; data: DashboardData | undefined; isLoading: boolean; isError: boolean; error: ApplicationError | null; hasNoActiveProfile: boolean; isSuccess: boolean; isFetching: boolean; }`
- **Description:** Enhanced dashboard interface with all dashboard capabilities

**AGGREGATE HOOK SUB-METHODS:**

- **`useDashboardHub().message`** - Sub-method of the aggregate hook
- **`useDashboardHub().type`** - Sub-method of the aggregate hook
- **`useDashboardHub().actionable`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `useGetDashboardMetrics()`

**File:** `/src/features/dashboard/hooks/useGetDashboardMetrics.ts`

**Full Function Signature:**
```typescript
export function useGetDashboardMetrics(
  profileId: string | null,
  options?: Partial<UseQueryOptions<DashboardMetrics, ApplicationError>>
)
```

**Extended Description:**
React Query hook for fetching dashboard metrics. This hook fetches key dashboard metrics like total workouts, streaks, and personal records. It provides a reactive interface for dashboard metric data with automatic caching, error handling, and background updates.

**INPUT PARAMETERS:**

- **`profileId`** (`string | null`): No description provided
- **`options`** (`Partial<UseQueryOptions<DashboardMetrics, ApplicationError, DashboardMetrics, readonly unknown[]>> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseQueryResult<DashboardMetrics, ApplicationError>`
- **Description:** Query result with dashboard metrics data

---

#### PUBLIC API: `useGetProgressTrends()`

**File:** `/src/features/dashboard/hooks/useGetProgressTrends.ts`

**Full Function Signature:**
```typescript
export function useGetProgressTrends(
  profileId: string | null,
  options?: Partial<UseQueryOptions<ProgressTrends, ApplicationError>>
)
```

**Extended Description:**
React Query hook for fetching progress trends data. This hook fetches progress trend data including workout frequency, strength progress, and body weight trends for dashboard charts. It provides a reactive interface for  trend data with automatic caching, error handling, and background updates.

**INPUT PARAMETERS:**

- **`profileId`** (`string | null`): No description provided
- **`options`** (`Partial<UseQueryOptions<ProgressTrends, ApplicationError, ProgressTrends, readonly unknown[]>> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseQueryResult<ProgressTrends, ApplicationError>`
- **Description:** Query result with progress trends data

---

#### PUBLIC API: `useGetRecentActivity()`

**File:** `/src/features/dashboard/hooks/useGetRecentActivity.ts`

**Full Function Signature:**
```typescript
export function useGetRecentActivity(
  profileId: string | null,
  options?: Partial<UseQueryOptions<RecentActivity, ApplicationError>>
)
```

**Extended Description:**
React Query hook for fetching recent activity data. This hook fetches recent workout and personal record activity for the dashboard. It provides a reactive interface for recent activity data with automatic caching, error handling, and background updates.

**INPUT PARAMETERS:**

- **`profileId`** (`string | null`): No description provided
- **`options`** (`Partial<UseQueryOptions<RecentActivity, ApplicationError, RecentActivity, readonly unknown[]>> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseQueryResult<RecentActivity, ApplicationError>`
- **Description:** Query result with recent activity data

---

#### PUBLIC API: `useWorkoutStreak()`

**File:** `/src/features/dashboard/hooks/useWorkoutStreak.ts`

**Full Function Signature:**
```typescript
export function useWorkoutStreak(
  profileId: string,
  streakGoal: number = 30
): UseWorkoutStreakResult
```

**Extended Description:**
Hook for calculating workout consistency streaks and motivation metrics. Analyzes workout frequency patterns from historical data to calculate current and longest streaks. Provides motivational features that encourage consistent workout habits through streak tracking and goal-setting functionality.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`streakGoal`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseWorkoutStreakResult`
- **Description:** Object with streak metrics and historical data

**Usage Examples:**

```typescript
```typescript
const { 
  currentStreak, 
  longestStreak, 
  streakGoal, 
  daysUntilGoal 
} = useWorkoutStreak(profileId, 30);

return (
  <Box>
    <Typography variant="h4">{currentStreak} Days</Typography>
    <Typography>Current Streak</Typography>
    <LinearProgress 
      value={(currentStreak / streakGoal) * 100} 
      variant="determinate"
    />
    <Typography>
      {daysUntilGoal} days until goal of {streakGoal}
    </Typography>
  </Box>
);
```
```

---

#### PUBLIC API: `useWorkoutSummaryCard()`

**File:** `/src/features/dashboard/hooks/useWorkoutSummaryCard.ts`

**Full Function Signature:**
```typescript
export function useWorkoutSummaryCard(profileId: string): UseWorkoutSummaryCardResult
```

**Extended Description:**
Hook for combining dashboard summary card data from multiple sources. Aggregates workout logs, max logs, and body metrics into a unified interface for dashboard summary cards. Eliminates the need for multiple useEffect combinations in components by providing pre-processed dashboard data.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseWorkoutSummaryCardResult`
- **Description:** Object with combined dashboard summary data

**Usage Examples:**

```typescript
```typescript
const { 
  lastWorkout,
  weeklyStats,
  monthlyProgress,
  recentPRs,
  isLoading 
} = useWorkoutSummaryCard(profileId);

return (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <LastWorkoutCard workout={lastWorkout} />
    </Grid>
    <Grid item xs={12} md={6}>
      <WeeklyStatsCard stats={weeklyStats} />
    </Grid>
    <Grid item xs={12} md={6}>
      <MonthlyProgressCard progress={monthlyProgress} />
    </Grid>
    <Grid item xs={12} md={6}>
      <RecentPRsCard prs={recentPRs} />
    </Grid>
  </Grid>
);
```
```

---

### Query Services

#### DashboardQueryService

**File:** `/src/features/dashboard/query-services/DashboardQueryService.ts`

**Description:**
Query service that acts as an adapter between the Dashboard Application Layer and React Query. This service handles the unwrapping of Result objects returned by the DashboardService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all dashboard-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {DashboardService} dashboardService - 
 */
constructor(@inject('DashboardService') private readonly dashboardService: DashboardService)
```

**Public Methods:**

##### PUBLIC API: `DashboardQueryService.getDashboardData()`

**Full Method Signature:**
```typescript
async getDashboardData(profileId: string): Promise<DashboardData>
```

**Extended Description:**
Generates complete dashboard data for a profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DashboardData>`
- **Description:** Promise resolving to complete dashboard data

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `DashboardQueryService.generateDashboardMetrics()`

**Full Method Signature:**
```typescript
async generateDashboardMetrics(profileId: string): Promise<DashboardMetrics>
```

**Extended Description:**
Generates key metrics for the dashboard.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DashboardMetrics>`
- **Description:** Promise resolving to dashboard metrics

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `DashboardQueryService.generateRecentActivity()`

**Full Method Signature:**
```typescript
async generateRecentActivity(profileId: string): Promise<RecentActivity>
```

**Extended Description:**
Generates recent activity data for the dashboard.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<RecentActivity>`
- **Description:** Promise resolving to recent activity data

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `DashboardQueryService.generateProgressTrends()`

**Full Method Signature:**
```typescript
async generateProgressTrends(profileId: string): Promise<ProgressTrends>
```

**Extended Description:**
Generates progress trends for dashboard charts.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ProgressTrends>`
- **Description:** Promise resolving to progress trends

**EXCEPTIONS:**
- When the operation fails

---

## Data-sync Feature

### Custom Hooks

#### PUBLIC API: `useDataIntegrityChecker()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export function useDataIntegrityChecker(profileId: string): UseDataIntegrityCheckerResult
```

**Extended Description:**
Hook for data integrity validation and maintenance operations. Ensures database consistency by identifying and fixing orphaned records, missing references, and constraint violations. Provides automated and manual data integrity checking with detailed reporting and repair capabilities.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseDataIntegrityCheckerResult`
- **Description:** Object with integrity checking functions and status

**Usage Examples:**

```typescript
```typescript
const { 
  runCheck, 
  issues, 
  fixIssue,
  fixAllIssues,
  lastCheckDate,
  scheduleCheck 
} = useDataIntegrityChecker(profileId);

// Run integrity check
const handleRunCheck = async () => {
  const report = await runCheck();
  console.log(`Found ${report.issuesFound} issues`);
};

// Fix specific issue
const handleFixIssue = async (issueId: string) => {
  await fixIssue(issueId);
  alert('Issue fixed successfully!');
};

// Schedule automatic checks
const handleScheduleCheck = () => {
  scheduleCheck(); // Run weekly
};
```
```

---

#### PUBLIC API: `checkOrphanedWorkoutLogs()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export async function checkOrphanedWorkoutLogs(profileId: string): Promise<DataIssue[]>
```

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DataIssue[]>`
- **Description:** Returns value of type Promise<DataIssue[]>

---

#### PUBLIC API: `checkMissingExerciseReferences()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export async function checkMissingExerciseReferences(profileId: string): Promise<DataIssue[]>
```

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DataIssue[]>`
- **Description:** Returns value of type Promise<DataIssue[]>

---

#### PUBLIC API: `checkOrphanedMaxLogs()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export async function checkOrphanedMaxLogs(profileId: string): Promise<DataIssue[]>
```

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DataIssue[]>`
- **Description:** Returns value of type Promise<DataIssue[]>

---

#### PUBLIC API: `checkDuplicateEntries()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export async function checkDuplicateEntries(profileId: string): Promise<DataIssue[]>
```

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DataIssue[]>`
- **Description:** Returns value of type Promise<DataIssue[]>

---

#### PUBLIC API: `checkConstraintViolations()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export async function checkConstraintViolations(profileId: string): Promise<DataIssue[]>
```

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DataIssue[]>`
- **Description:** Returns value of type Promise<DataIssue[]>

---

#### PUBLIC API: `checkCorruptedData()`

**File:** `/src/features/data-sync/hooks/useDataIntegrityChecker.ts`

**Full Function Signature:**
```typescript
export async function checkCorruptedData(profileId: string): Promise<DataIssue[]>
```

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<DataIssue[]>`
- **Description:** Returns value of type Promise<DataIssue[]>

---

#### PUBLIC API: `useDataSyncManager()`

**File:** `/src/features/data-sync/hooks/useDataSyncManager.ts`

**Full Function Signature:**
```typescript
export function useDataSyncManager(profileId?: string)
```

**Extended Description:**
Comprehensive data synchronization and integrity management aggregate hook. This hook provides a unified interface for: - Data import from various formats (JSON, CSV, XML) - Data export with flexible options and filtering - Data integrity checking and validation - Backup and restore operations - Sync status monitoring and error handling Consolidates 3 data-sync hooks into a single, cohesive API while providing robust error handling and progress tracking.

**INPUT PARAMETERS:**

- **`profileId`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ integrityStatus: any; backupHistory: any; healthSummary: { score: number; grade: "A" | "B" | "C" | "D" | "F"; issues: { critical: any; high: any; medium: any; low: any; total: any; }; needsAttention: boolean; summary: any; } | null; syncProgress: { operation: "import" | "export" | "integrity_check" | null; progress: number; currentStep: string; }; export: UseMutationResult<Result<ExportData, ApplicationError>, Error, ExportOptions, unknown>; import: UseMutationResult<Result<ImportStatus, ApplicationError>, Error, ImportOptions & { file: File; }, unknown>; checkIntegrity: UseMutationResult<any, Error, { fix?: boolean | undefined; skipBackup?: boolean | undefined; } | undefined, unknown>; createBackup: UseMutationResult<any, Error, { description?: string | undefined; includeMedia?: boolean | undefined; } | undefined, unknown>; restoreBackup: UseMutationResult<any, Error, string, unknown>; quickActions: { exportAllData: () => Promise<Result<ExportData, ApplicationError>>; quickIntegrityCheck: () => Promise<any>; createFullBackup: () => Promise<any>; validateAndFix: () => Promise<any>; }; validators: { validateImportFile: (file: File, format: "csv" | "json" | "xml") => { isValid: boolean; errors: string[]; }; }; isLoadingStatus: boolean; isLoadingBackups: boolean; isExporting: boolean; isImporting: boolean; isCheckingIntegrity: boolean; isCreatingBackup: boolean; isRestoring: boolean; statusError: Error | null; backupError: Error | null; exportError: Error | null; importError: Error | null; integrityError: Error | null; backupOpError: Error | null; restoreError: Error | null; hasIntegrityIssues: boolean; needsUrgentAttention: boolean; isSyncing: boolean; refresh: () => void; }`
- **Description:** Comprehensive data sync management interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useDataSyncManager().score`** - Sub-method of the aggregate hook
- **`useDataSyncManager().grade`** - Sub-method of the aggregate hook
- **`useDataSyncManager().issues`** - Sub-method of the aggregate hook
- **`useDataSyncManager().critical`** - Sub-method of the aggregate hook
- **`useDataSyncManager().high`** - Sub-method of the aggregate hook
- **`useDataSyncManager().medium`** - Sub-method of the aggregate hook
- **`useDataSyncManager().low`** - Sub-method of the aggregate hook
- **`useDataSyncManager().total`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `useExportData()`

**File:** `/src/features/data-sync/hooks/useExportData.ts`

**Full Function Signature:**
```typescript
export function useExportData(
  options?: Omit<UseMutationOptions<ExportData, ApplicationError, ExportDataInput>, 'mutationFn'>
)
```

**Extended Description:**
React Query mutation hook for exporting user data. This hook provides a declarative way to trigger data export operations with progress tracking. It uses chunking to prevent UI blocking during large exports and provides real-time progress updates through the onProgress callback.

**INPUT PARAMETERS:**

- **`options`** (`Omit<UseMutationOptions<ExportData, ApplicationError, ExportDataInput, unknown>, "mutationFn"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<ExportData, ApplicationError, ExportDataInput, unknown>`
- **Description:** Mutation result with mutate function, loading state, and error information

---

#### PUBLIC API: `useImportData()`

**File:** `/src/features/data-sync/hooks/useImportData.ts`

**Full Function Signature:**
```typescript
export function useImportData(
  options?: Omit<
    UseMutationOptions<ImportStatus, ApplicationError | ConflictError, ImportDataInput>,
    'mutationFn'
  >
)
```

**Extended Description:**
React Query mutation hook for importing user data. This hook provides a declarative way to trigger data import operations with progress tracking and conflict handling. It uses chunking to prevent UI blocking during large imports and provides real-time progress updates through the onProgress callback. The hook handles ConflictError instances specially using the isConflictError type guard in its onError callback. When a ConflictError is thrown, its message property contains an I18nKeys type that must be translated by the consuming UI component to provide localized error messages to the user. On successful import, the hook triggers granular cache invalidation by calling queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() }) to refresh profile-wide data and ensure UI consistency across all related features.

**INPUT PARAMETERS:**

- **`options`** (`Omit<UseMutationOptions<ImportStatus, ApplicationError | ConflictError, ImportDataInput, unknown>, "mutationFn"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<ImportStatus, ApplicationError | ConflictError, ImportDataInput, unknown>`
- **Description:** Mutation result with mutate function, loading state, and error information

---

### Query Services

#### DataSyncQueryService

**File:** `/src/features/data-sync/query-services/DataSyncQueryService.ts`

**Description:**
Query service that acts as an adapter between the Data Sync Application Layer and React Query. This service handles the unwrapping of Result objects returned by the DataSyncService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all data synchronization operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {DataSyncService} dataSyncService - 
 */
constructor(@inject('DataSyncService') private readonly dataSyncService: DataSyncService)
```

**Public Methods:**

##### PUBLIC API: `DataSyncQueryService.exportData()`

**Full Method Signature:**
```typescript
async exportData(
    profileId: string,
    onProgress?: (status: ExportStatus) => void
  ): Promise<ExportData>
```

**Extended Description:**
Exports all user data to a structured format. Uses chunking to prevent UI blocking during large exports.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`onProgress`** (`((status: ExportStatus) => void) | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ExportData>`
- **Description:** Promise resolving to export data

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `DataSyncQueryService.importData()`

**Full Method Signature:**
```typescript
async importData(
    importData: ExportData,
    onProgress?: (status: ImportStatus) => void
  ): Promise<ImportStatus>
```

**Extended Description:**
Imports data from an export file. Uses chunking to prevent UI blocking during large imports.

**INPUT PARAMETERS:**

- **`importData`** (`ExportData`): No description provided
- **`onProgress`** (`((status: ImportStatus) => void) | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ImportStatus>`
- **Description:** Promise resolving to import status

**EXCEPTIONS:**
- When the operation fails or conflicts are detected

---

## Exercise Feature

### Custom Hooks

#### PUBLIC API: `useAddSubstitution()`

**File:** `/src/features/exercise/hooks/useAddSubstitution.ts`

**Full Function Signature:**
```typescript
export function useAddSubstitution(
  options?: Omit<
    UseMutationOptions<ExerciseModel, ApplicationError, AddSubstitutionInput>,
    'mutationFn'
  >
)
```

**Extended Description:**
React Query mutation hook for adding a substitution to an exercise. This hook provides a declarative way to add exercise substitutions with automatic cache invalidation and optimistic updates. It updates both the specific exercise cache and the exercises list cache upon successful addition of the substitution.

**INPUT PARAMETERS:**

- **`options`** (`Omit<UseMutationOptions<ExerciseModel, ApplicationError, AddSubstitutionInput, unknown>, "mutationFn"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<ExerciseModel, ApplicationError, AddSubstitutionInput, unknown>`
- **Description:** Mutation result with mutate function, loading state, and error information

---

#### PUBLIC API: `useCachedExerciseData()`

**File:** `/src/features/exercise/hooks/useCachedExerciseData.ts`

**Full Function Signature:**
```typescript
export function useCachedExerciseData(
  profileId: string,
  maxCacheAge: number = 30
): UseCachedExerciseDataResult
```

**Extended Description:**
Hook for intelligent caching layer over existing exercise hooks. Provides performance optimization for frequently accessed exercise data by implementing smart caching strategies. Reduces database queries in exercise selection components and improves user experience with faster data access.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`maxCacheAge`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseCachedExerciseDataResult`
- **Description:** Object with cached data and cache management functions

**Usage Examples:**

```typescript
```typescript
const {
  exercises,
  getExercise,
  searchCache,
  cacheAge,
  cacheHitRate
} = useCachedExerciseData(profileId, 15);

// Get exercise by ID (cached)
const exercise = getExercise(exerciseId);

// Search exercises (cached)
const searchResults = searchCache('bench press');

return (
  <Box>
    <Typography variant="caption">
      Cache Age: {cacheAge}m | Hit Rate: {cacheHitRate}%
    </Typography>
    <ExerciseSelector exercises={exercises} />
  </Box>
);
```
```

---

#### PUBLIC API: `useExerciseAnalytics()`

**File:** `/src/features/exercise/hooks/useExerciseAnalytics.ts`

**Full Function Signature:**
```typescript
export function useExerciseAnalytics(profileId: string)
```

**Extended Description:**
Exercise statistics, usage tracking, and insights. Provides comprehensive analytics for exercise usage patterns, statistics, and trend analysis with intelligent caching.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ exercises: ExerciseModel[]; statistics: ExerciseStatistics; usageAnalytics: { exerciseId: string; usageCount: number; lastUsed: Date; frequency: number; trend: "stable" | "increasing" | "decreasing"; }[]; trendingExercises: TrendingExercise[]; isLoadingAnalytics: boolean; analyticsError: Error | null; getExerciseUsage: (exerciseId: string) => UsageAnalytics | null; getUsageFrequency: (exerciseId: string) => number; getPersonalBest: (exerciseId: string) => number | null; insights: ({ type: string; message: string; actionable: boolean; action: string; } | { type: string; message: string; actionable: boolean; action?: undefined; })[]; warmCache: () => Promise<void>; invalidateAnalytics: () => void; refetch: () => void; hasData: boolean; isEmpty: boolean; isActive: boolean; }`
- **Description:** Analytics and statistics interface

---

#### PUBLIC API: `useExerciseCRUD()`

**File:** `/src/features/exercise/hooks/useExerciseCRUD.ts`

**Full Function Signature:**
```typescript
export function useExerciseCRUD(profileId: string)
```

**Extended Description:**
Standard CRUD operations for exercises using shared patterns. This hook provides basic create, read, update, delete operations for exercises following the established architectural patterns. Uses the repository pattern and follows React Query best practices.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ exercises: ExerciseModel[]; getExercise: (exerciseId: string) => UseQueryResult<any, Error>; isLoading: boolean; isCreating: boolean; isUpdating: boolean; isDeleting: boolean; error: any; createError: Error | null; updateError: Error | null; deleteError: Error | null; create: UseMutateAsyncFunction<any, Error, Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "createdAt" | "updatedAt">, unknown>; update: (id: string, input: Partial<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }>) => Promise<any>; delete: UseMutateAsyncFunction<void, Error, string, unknown>; warmCache: (exerciseIds?: string[]) => Promise<void>; invalidateCache: () => void; refetch: () => void; }`
- **Description:** Standard CRUD operations and data access

---

#### PUBLIC API: `useExerciseInstructions()`

**File:** `/src/features/exercise/hooks/useExerciseInstructions.ts`

**Full Function Signature:**
```typescript
export function useExerciseInstructions(exerciseId: string): ExerciseInstructionData
```

**Extended Description:**
Hook for providing comprehensive exercise guidance and instructional content. Retrieves detailed exercise instructions, form cues, tips, and common mistakes for UI display during workouts. Helps users maintain proper form and technique by providing structured guidance information for each exercise.

**INPUT PARAMETERS:**

- **`exerciseId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `ExerciseInstructionData`
- **Description:** Object with comprehensive exercise instruction data

**Usage Examples:**

```typescript
```typescript
const instructions = useExerciseInstructions(exerciseId);

return (
  <Box>
    <Typography variant="h6">Instructions</Typography>
    {instructions.instructions.map((step, index) => (
      <Typography key={index}>• {step}</Typography>
    ))}
    
    <Typography variant="h6">Tips</Typography>
    {instructions.tips.map((tip, index) => (
      <Alert key={index} severity="info">{tip}</Alert>
    ))}
  </Box>
);
```
```

---

#### PUBLIC API: `useExercisePerformanceOverview()`

**File:** `/src/features/exercise/hooks/useExercisePerformanceOverview.ts`

**Full Function Signature:**
```typescript
export function useExercisePerformanceOverview(
  exerciseId: string,
  profileId: string
): UseExercisePerformanceOverviewResult
```

**Extended Description:**
Hook for aggregating comprehensive exercise performance data. Combines exercise details, max logs, and workout history into a unified interface for exercise detail pages. Eliminates the need for multiple separate hook calls by providing pre-processed performance analytics.

**INPUT PARAMETERS:**

- **`exerciseId`** (`string`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseExercisePerformanceOverviewResult`
- **Description:** Object with comprehensive exercise performance data

**Usage Examples:**

```typescript
```typescript
const { 
  exerciseData,
  maxLogs,
  recentWorkouts,
  progressTrend,
  volumeHistory,
  performanceMetrics,
  isLoading 
} = useExercisePerformanceOverview(exerciseId, profileId);

return (
  <Box>
    <ExerciseHeader exercise={exerciseData} />
    <PerformanceMetricsCard metrics={performanceMetrics} />
    <ProgressChart data={progressTrend} />
    <VolumeChart data={volumeHistory} />
    <MaxLogsTable logs={maxLogs} />
    <RecentWorkoutsTable workouts={recentWorkouts} />
  </Box>
);
```
```

---

#### PUBLIC API: `useExerciseSearch()`

**File:** `/src/features/exercise/hooks/useExerciseSearch.ts`

**Full Function Signature:**
```typescript
export function useExerciseSearch(initialQuery: string = '', initialFilters: ExerciseFilters =
```

**Extended Description:**
Exercise search, filtering, and discovery functionality. Provides debounced search, instant filtering, and exercise discovery features with optimized performance for large datasets.

**INPUT PARAMETERS:**

- **`initialQuery`** (`string`): No description provided
- **`initialFilters`** (`ExerciseFilters`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ exercises: any; totalCount: any; isLoading: any; searchQuery: string; filters: ExerciseFilters; recentSearches: string[]; searchResults: any; isSearching: any; searchError: any; search: (query: string, filterCriteria?: ExerciseFilters | undefined) => void; clearSearch: () => void; setFilters: React.Dispatch<React.SetStateAction<ExerciseFilters>>; instantSearch: (query: string, data?: { id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }[]) => { id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }[]; applyFilters: (data: { id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }[], filterCriteria: ExerciseFilters) => { id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }[]; findSimilar: (targetExercise: { id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }) => { id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }[]; hasActiveSearch: boolean; isEmpty: boolean; }`
- **Description:** Search and filtering capabilities

---

#### PUBLIC API: `useExerciseStatistics()`

**File:** `/src/features/exercise/hooks/useExerciseStatistics.ts`

**Full Function Signature:**
```typescript
export function useExerciseStatistics(
  exerciseId: string,
  profileId: string
): UseExerciseStatisticsResult
```

**Extended Description:**
Hook for comprehensive exercise statistics and performance analytics. Provides detailed statistics for individual exercises using workout logs and max logs. Calculates performance metrics, progression data, and usage frequency for comprehensive exercise analysis. Essential for individual exercise detail pages and progress tracking.

**INPUT PARAMETERS:**

- **`exerciseId`** (`string`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseExerciseStatisticsResult`
- **Description:** Object with comprehensive exercise performance analytics

**Usage Examples:**

```typescript
```typescript
const stats = useExerciseStatistics(exerciseId, profileId);

return (
  <Box>
    <Typography>Total Sessions: {stats.totalSessions}</Typography>
    <Typography>Average Weight: {stats.averageWeight}kg</Typography>
    {stats.bestSet && (
      <Typography>
        Best Set: {stats.bestSet.weight}kg × {stats.bestSet.reps}
      </Typography>
    )}
    <VolumeChart data={stats.volumeProgression} />
  </Box>
);
```
```

---

#### PUBLIC API: `useExerciseWizard()`

**File:** `/src/features/exercise/hooks/useExerciseWizard.ts`

**Full Function Signature:**
```typescript
export function useExerciseWizard(profileId: string): UseExerciseWizardResult
```

**Extended Description:**
Hook for multi-step exercise creation wizard state management. Manages complex exercise creation workflow through a step-by-step wizard interface. Provides validation, progress tracking, and state management for comprehensive exercise setup without changing existing business logic.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseExerciseWizardResult`
- **Description:** Object with wizard state and navigation functions

**Usage Examples:**

```typescript
```typescript
const {
  currentStep,
  stepData,
  nextStep,
  prevStep,
  setStepData,
  canProceed,
  submitWizard,
  completionPercentage
} = useExerciseWizard(profileId);

return (
  <Wizard>
    <WizardHeader>
      <ProgressBar value={completionPercentage} />
      <Typography>Step {currentStep + 1} of {stepData.length}</Typography>
    </WizardHeader>

    <WizardContent>
      {currentStep === 0 && (
        <BasicInfoStep
          data={wizardData.basicInfo}
          onChange={(data) => setStepData(0, data)}
        />
      )}
      {currentStep === 1 && (
        <TargetingStep
          data={wizardData.targeting}
          onChange={(data) => setStepData(1, data)}
        />
      )}
      // ... other steps
    </WizardContent>

    <WizardActions>
      <Button onClick={prevStep} disabled={!canGoBack}>
        Back
      </Button>
      {isLastStep ? (
        <Button onClick={submitWizard} disabled={!canProceed}>
          Create Exercise
        </Button>
      ) : (
        <Button onClick={nextStep} disabled={!canProceed}>
          Next
        </Button>
      )}
    </WizardActions>
  </Wizard>
);
```
```

---

#### PUBLIC API: `useRecentExercises()`

**File:** `/src/features/exercise/hooks/useRecentExercises.ts`

**Full Function Signature:**
```typescript
export function useRecentExercises(
  profileId: string,
  limit: number = 10
): UseRecentExercisesResult
```

**Extended Description:**
Hook for tracking recently used exercises for quick workout building. Provides a list of exercises recently performed by the user, sorted by most recent usage. Includes the last performed date for each exercise to help users quickly identify exercises they've used recently. Essential for convenience features in workout creation.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`limit`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseRecentExercisesResult`
- **Description:** Object with recent exercises and their last performed dates

**Usage Examples:**

```typescript
```typescript
const { recentExercises, lastPerformed } = useRecentExercises(profileId, 8);

return (
  <Box>
    <Typography variant="h6">Recent Exercises</Typography>
    {recentExercises.map(exercise => (
      <Card key={exercise.id}>
        <CardContent>
          <Typography>{exercise.name}</Typography>
          <Typography variant="caption">
            Last performed: {formatDate(lastPerformed[exercise.id])}
          </Typography>
        </CardContent>
      </Card>
    ))}
  </Box>
);
```
```

---

#### PUBLIC API: `useRemoveSubstitution()`

**File:** `/src/features/exercise/hooks/useRemoveSubstitution.ts`

**Full Function Signature:**
```typescript
export function useRemoveSubstitution(
  options?: Omit<
    UseMutationOptions<ExerciseModel, ApplicationError, RemoveSubstitutionInput>,
    'mutationFn'
  >
)
```

**Extended Description:**
React Query mutation hook for removing a substitution from an exercise. This hook provides a declarative way to remove exercise substitutions with automatic cache invalidation and optimistic updates. It updates both the specific exercise cache and the exercises list cache upon successful removal of the substitution.

**INPUT PARAMETERS:**

- **`options`** (`Omit<UseMutationOptions<ExerciseModel, ApplicationError, RemoveSubstitutionInput, unknown>, "mutationFn"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<ExerciseModel, ApplicationError, RemoveSubstitutionInput, unknown>`
- **Description:** Mutation result with mutate function, loading state, and error information

---

#### PUBLIC API: `useSaveBulkExercises()`

**File:** `/src/features/exercise/hooks/useSaveBulkExercises.ts`

**Full Function Signature:**
```typescript
export function useSaveBulkExercises(
  options?: Omit<UseMutationOptions<void, ApplicationError, ExerciseModel[]>, 'mutationFn'>
)
```

**Extended Description:**
React Query mutation hook for saving multiple exercises in bulk. This hook provides a declarative way to save multiple exercises with automatic cache invalidation. It invalidates all exercises caches for the affected profiles upon successful bulk save to ensure UI consistency.

**INPUT PARAMETERS:**

- **`options`** (`Omit<UseMutationOptions<void, ApplicationError, ExerciseModel[], unknown>, "mutationFn"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<void, ApplicationError, ExerciseModel[], unknown>`
- **Description:** Mutation result with mutate function, loading state, and error information

---

### Query Services

#### ExerciseQueryService

**File:** `/src/features/exercise/query-services/ExerciseQueryService.ts`

**Description:**
Query service that acts as an adapter between the Exercise Application Layer and React Query. This service handles the unwrapping of Result objects returned by the ExerciseService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all exercise-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {ExerciseService} exerciseService - 
 */
constructor(@inject('ExerciseService') private readonly exerciseService: ExerciseService)
```

**Public Methods:**

##### PUBLIC API: `ExerciseQueryService.createExercise()`

**Full Method Signature:**
```typescript
async createExercise(
    exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExerciseModel | null>
```

**Extended Description:**
Creates a new exercise for a profile.

**INPUT PARAMETERS:**

- **`exerciseData`** (`Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "createdAt" | "updatedAt">`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ExerciseModel | null>`
- **Description:** Promise resolving to the created ExerciseModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.getExercise()`

**Full Method Signature:**
```typescript
async getExercise(profileId: string, exerciseId: string): Promise<ExerciseModel>
```

**Extended Description:**
Retrieves an exercise by its ID for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ExerciseModel>`
- **Description:** Promise resolving to the ExerciseModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.getAllExercises()`

**Full Method Signature:**
```typescript
getAllExercises(profileId: string): Query<Exercise>
```

**Extended Description:**
Retrieves all exercises for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<Exercise>`
- **Description:** Query for Exercise models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.getExercisesByIds()`

**Full Method Signature:**
```typescript
getExercisesByIds(profileId: string, exerciseIds: string[]): Query<Exercise>
```

**Extended Description:**
Retrieves multiple exercises by their IDs for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseIds`** (`string[]`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<Exercise>`
- **Description:** Query for Exercise models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.updateExercise()`

**Full Method Signature:**
```typescript
async updateExercise(
    profileId: string,
    exerciseId: string,
    updates: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ExerciseModel>
```

**Extended Description:**
Updates an existing exercise.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`updates`** (`Partial<Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "push" | "static" | "other" | "pull" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "profileId" | "createdAt" | "updatedAt">>`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ExerciseModel>`
- **Description:** Promise resolving to the updated ExerciseModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.addSubstitution()`

**Full Method Signature:**
```typescript
async addSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string,
    priority: number,
    reason?: string
  ): Promise<ExerciseModel>
```

**Extended Description:**
Adds a substitution to an existing exercise.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`substituteExerciseId`** (`string`): No description provided
- **`priority`** (`number`): No description provided
- **`reason`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ExerciseModel>`
- **Description:** Promise resolving to the updated ExerciseModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.removeSubstitution()`

**Full Method Signature:**
```typescript
async removeSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string
  ): Promise<ExerciseModel>
```

**Extended Description:**
Removes a substitution from an existing exercise.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`substituteExerciseId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ExerciseModel>`
- **Description:** Promise resolving to the updated ExerciseModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.deleteExercise()`

**Full Method Signature:**
```typescript
async deleteExercise(profileId: string, exerciseId: string): Promise<void>
```

**Extended Description:**
Permanently deletes an exercise from the system.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ExerciseQueryService.saveBulkExercises()`

**Full Method Signature:**
```typescript
async saveBulkExercises(exercises: ExerciseModel[]): Promise<void>
```

**Extended Description:**
Saves multiple exercises in bulk.

**INPUT PARAMETERS:**

- **`exercises`** (`ExerciseModel[]`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when bulk save is complete

**EXCEPTIONS:**
- When the operation fails

---

## Maintenance Feature

### Custom Hooks

#### PUBLIC API: `useMaintenanceHub()`

**File:** `/src/features/maintenance/hooks/useMaintenanceHub.ts`

**Full Function Signature:**
```typescript
export function useMaintenanceHub()
```

**Extended Description:**
Enhanced maintenance operations aggregate hub. This comprehensive hub provides: - Database optimization and performance monitoring - Automated maintenance scheduling and execution - System health diagnostics and reporting - Intelligent recommendations and insights - Bulk operations with progress tracking - Data integrity validation and repair - Storage optimization and cleanup - Performance analytics and trending Follows the useAnalyticsHub comprehensive pattern while consolidating all maintenance operations into a single interface.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `{ systemHealth: any; performanceMetrics: any; maintenanceSchedule: any; insights: { status: string; summary: string; alerts: ({ type: "critical"; title: string; message: string; } | { type: "warning"; title: string; message: string; })[]; trends: ({ type: "positive"; title: string; change: string; } | { type: "negative"; title: string; change: string; })[]; }; quickActions: { id: string; title: string; description: string; icon: string; action: () => Promise<any>; }[]; isLoadingHealth: boolean; isLoadingMetrics: boolean; isRunningAutomated: boolean; isOptimizing: boolean; isCleaning: boolean; healthError: Error | null; metricsError: Error | null; automatedError: Error | null; optimizationError: Error | null; cleanupError: Error | null; runAutomatedMaintenance: UseMutateAsyncFunction<any, Error, string[], unknown>; fullOptimization: UseMutateAsyncFunction<any, Error, { aggressive?: boolean | undefined; includeIndexes?: boolean | undefined; }, unknown>; advancedCleanup: UseMutateAsyncFunction<any, Error, { removeOrphaned: boolean; compactTables: boolean; rebuildIndexes: boolean; cleanupLogs: boolean; }, unknown>; generateReport: () => Promise<MaintenanceReport>; autoConfig: AutoMaintenanceConfig; updateAutoConfig: (updates: Partial<AutoMaintenanceConfig>) => void; refreshHealth: () => Promise<aH<any, Error>>; refreshMetrics: () => Promise<aH<any, Error>>; refreshAll: () => void; isHealthy: boolean; needsAttention: boolean; hasActiveOperations: boolean; overallHealth: string; optimizeDatabase: UseMutateAsyncFunction<Result<{ message: string; operationsPerformed: string[]; }, ApplicationError>, Error, { rebuildIndexes?: boolean | undefined; } | undefined, unknown>; validateDataIntegrity: UseMutateAsyncFunction<Result<{ isValid: boolean; issues: string[]; totalRecordsChecked: number; }, ApplicationError>, Error, void, unknown>; bulkDelete: UseMutateAsyncFunction<Result<CleanupResult, ApplicationError>, Error, "ALL" | "OLD_DATA" | "INACTIVE_PROFILES", unknown>; cleanupTempFiles: () => Promise<Result<CleanupResult, ApplicationError>>; isValidating: boolean; optimizationProgress: number; validationResults: null; cleanupResults: null; lastOptimization: null; lastValidation: null; }`
- **Description:** Enhanced maintenance management interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useMaintenanceHub().generatedAt`** - Sub-method of the aggregate hook
- **`useMaintenanceHub().systemHealth`** - Sub-method of the aggregate hook
- **`useMaintenanceHub().databaseSize`** - Sub-method of the aggregate hook
- **`useMaintenanceHub().performance`** - Sub-method of the aggregate hook
- **`useMaintenanceHub().storage`** - Sub-method of the aggregate hook
- **`useMaintenanceHub().integrity`** - Sub-method of the aggregate hook

---

### Query Services

#### MaintenanceQueryService

**File:** `/src/features/maintenance/query-services/MaintenanceQueryService.ts`

**Description:**
Query service that acts as an adapter between the Maintenance Application Layer and React Query. This service handles the unwrapping of Result objects returned by the MaintenanceService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all maintenance operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {MaintenanceService} maintenanceService - 
 */
constructor(
    @inject('MaintenanceService') private readonly maintenanceService: MaintenanceService
  )
```

**Public Methods:**

##### PUBLIC API: `MaintenanceQueryService.bulkDelete()`

**Full Method Signature:**
```typescript
async bulkDelete(
    option: BulkDeleteOptions,
    onProgress?: (status: MaintenanceStatus) => void
  ): Promise<CleanupResult>
```

**Extended Description:**
Performs bulk delete operations based on the specified option. Uses chunking to prevent UI blocking during large operations.

**INPUT PARAMETERS:**

- **`option`** (`BulkDeleteOptions`): No description provided
- **`onProgress`** (`((status: MaintenanceStatus) => void) | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<CleanupResult>`
- **Description:** Promise resolving to cleanup results

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaintenanceQueryService.optimizeDatabase()`

**Full Method Signature:**
```typescript
async optimizeDatabase(): Promise<
```

**Extended Description:**
Optimizes database performance by running cleanup operations.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `Promise<{ message: string; operationsPerformed: string[]; }>`
- **Description:** Promise resolving to optimization results

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaintenanceQueryService.validateDataIntegrity()`

**Full Method Signature:**
```typescript
async validateDataIntegrity(): Promise<
```

**Extended Description:**
Validates data integrity across all repositories.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `Promise<{ isValid: boolean; issues: string[]; totalRecordsChecked: number; }>`
- **Description:** Promise resolving to validation results

**EXCEPTIONS:**
- When the operation fails

---

## Max-log Feature

### Custom Hooks

#### PUBLIC API: `use1RMCalculator()`

**File:** `/src/features/max-log/hooks/use1RMCalculator.ts`

**Full Function Signature:**
```typescript
export function use1RMCalculator(): Use1RMCalculatorResult
```

**Extended Description:**
Hook for comprehensive 1RM calculations and weight recommendations. Provides multiple 1RM calculation formulas with confidence ratings and weight recommendations for different rep ranges. Offers immediate feedback in workout forms without creating max log entries, enabling real-time training decisions.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `Use1RMCalculatorResult`
- **Description:** Object with calculation functions and validation rules

**Usage Examples:**

```typescript
```typescript
const { calculate1RM, compareFormulas, getRecommendedWeight } = use1RMCalculator();

// Calculate 1RM from a set
const oneRM = calculate1RM(100, 5); // 100kg x 5 reps

// Compare different formulas
const comparisons = compareFormulas(100, 5);

// Get weight recommendation for target reps
const recommendedWeight = getRecommendedWeight(8, oneRM); // For 8 reps
```
```

---

#### PUBLIC API: `useMaxLogTracking()`

**File:** `/src/features/max-log/hooks/useMaxLogTracking.ts`

**Full Function Signature:**
```typescript
export function useMaxLogTracking(profileId: string)
```

**Extended Description:**
Comprehensive max log management aggregate hook. This hook provides a unified interface for: - Max log CRUD operations (create, update, delete, get) - Personal record tracking and calculations - 1RM calculations (Brzycki, Baechle formulas) - Performance comparisons and trends - Bodyweight ratio calculations - Personal record alerts and notifications Consolidates 13+ individual max-log hooks into a single, cohesive API while providing optimized data fetching and intelligent caching.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ maxLogs: MaxLogModel[]; personalRecords: PersonalRecord[]; summary: string | undefined; getLatestForExercise: (exerciseId: string) => { id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; } | null; strongestExercises: { exerciseId: string; maxWeight: number; estimated1RM: number; }[]; isLoading: boolean; isSummaryLoading: boolean; isCreating: boolean; isUpdating: boolean; isDeleting: boolean; error: Error | null; createError: Error | null; updateError: Error | null; deleteError: Error | null; create: UseMutateAsyncFunction<any, Error, CreateMaxLogInput, unknown>; update: UseMutateAsyncFunction<any, Error, UpdateMaxLogInput, unknown>; delete: UseMutateAsyncFunction<void, Error, string, unknown>; getById: (maxLogId: string) => UseQueryResult<any, Error>; calculate1RM: (weight: number, reps: number, formula?: "brzycki" | "baechle") => number; calculateBodyweightRatio: (exerciseWeight: number, bodyweight: number) => number; comparePerformance: (exerciseId: string, timeframe?: "week" | "month" | "quarter") => { trend: "insufficient_data"; change: number; recent: MaxLogModel; previous: null; } | { trend: string; change: number; recent: MaxLogModel; previous: MaxLogModel; }; checkForPersonalRecords: (newMaxLog: { id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }) => boolean; warmCache: (exerciseIds?: string[]) => Promise<void>; invalidateCache: () => void; refetch: () => void; hasData: boolean; isEmpty: boolean; recordCount: number; recentActivity: MaxLogModel[]; progressTrend: string; }`
- **Description:** Comprehensive max log tracking interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useMaxLogTracking().trend`** - Sub-method of the aggregate hook
- **`useMaxLogTracking().change`** - Sub-method of the aggregate hook
- **`useMaxLogTracking().recent`** - Sub-method of the aggregate hook
- **`useMaxLogTracking().previous`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `usePersonalRecordAlerts()`

**File:** `/src/features/max-log/hooks/usePersonalRecordAlerts.ts`

**Full Function Signature:**
```typescript
export function usePersonalRecordAlerts(profileId: string): UsePersonalRecordAlertsResult
```

**Extended Description:**
Hook for detecting and celebrating personal records using workout and max log data. Automatically identifies personal records during workout logging and provides celebration functionality. Analyzes completed sets against historical max logs to detect new achievements and motivate users through progress recognition.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UsePersonalRecordAlertsResult`
- **Description:** Object with PR detection, recent records, and celebration functions

**Usage Examples:**

```typescript
```typescript
const { checkForPRs, recentPRs, celebratePR } = usePersonalRecordAlerts(profileId);

// Check for PRs after workout completion
const handleWorkoutComplete = (workout: WorkoutLogModel) => {
  const prs = checkForPRs(workout);
  
  prs.forEach(pr => {
    showPRNotification(pr);
    celebratePR(pr.exerciseId);
  });
};

return (
  <Box>
    <Typography variant="h6">Recent PRs</Typography>
    {recentPRs.map(pr => (
      <PRCard key={pr.id} record={pr} />
    ))}
  </Box>
);
```
```

---

### Query Services

#### MaxLogQueryService

**File:** `/src/features/max-log/query-services/MaxLogQueryService.ts`

**Description:**
Query service that acts as an adapter between the Max Log Application Layer and React Query. This service handles the unwrapping of Result objects returned by the MaxLogService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all max log-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {MaxLogService} maxLogService - 
 */
constructor(@inject('MaxLogService') private readonly maxLogService: MaxLogService)
```

**Public Methods:**

##### PUBLIC API: `MaxLogQueryService.createMaxLog()`

**Full Method Signature:**
```typescript
async createMaxLog(
    maxLogData: Omit<
      MaxLogData,
      'id' | 'createdAt' | 'updatedAt' | 'estimated1RM' | 'maxBrzycki' | 'maxBaechle'
    >
  ): Promise<MaxLogModel>
```

**Extended Description:**
Creates a new max log entry for tracking a personal record.

**INPUT PARAMETERS:**

- **`maxLogData`** (`Omit<{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }, "id" | "createdAt" | "updatedAt" | "estimated1RM" | "maxBrzycki" | "maxBaechle">`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<MaxLogModel>`
- **Description:** Promise resolving to the created MaxLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.getMaxLog()`

**Full Method Signature:**
```typescript
async getMaxLog(maxLogId: string): Promise<MaxLogModel>
```

**Extended Description:**
Retrieves a max log by its ID.

**INPUT PARAMETERS:**

- **`maxLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<MaxLogModel>`
- **Description:** Promise resolving to the MaxLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.getAllMaxLogs()`

**Full Method Signature:**
```typescript
getAllMaxLogs(profileId: string): Query<MaxLog>
```

**Extended Description:**
Retrieves all max logs for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<MaxLog>`
- **Description:** Query for MaxLog models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.getLatestMaxLogsByExercise()`

**Full Method Signature:**
```typescript
async getLatestMaxLogsByExercise(profileId: string): Promise<Map<string, MaxLogModel>>
```

**Extended Description:**
Retrieves the latest max log for each exercise for a profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<Map<string, MaxLogModel>>`
- **Description:** Promise resolving to a Map of exercise IDs to their latest MaxLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.updateMaxLog()`

**Full Method Signature:**
```typescript
async updateMaxLog(
    maxLogId: string,
    updates: Partial<
```

**Extended Description:**
Updates an existing max log entry.

**INPUT PARAMETERS:**

- **`maxLogId`** (`string`): No description provided
- **`updates`** (`Partial<{ weight: number; reps: number; notes: string; date: Date; }>`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<MaxLogModel>`
- **Description:** Promise resolving to the updated MaxLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.compareMaxLogPerformance()`

**Full Method Signature:**
```typescript
async compareMaxLogPerformance(
    maxLogId1: string,
    maxLogId2: string
  ): Promise<
```

**Extended Description:**
Compares performance between two max log entries.

**INPUT PARAMETERS:**

- **`maxLogId1`** (`string`): No description provided
- **`maxLogId2`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<{ differenceKg: number; percentageImprovement: number; }>`
- **Description:** Promise resolving to performance comparison metrics

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.calculateBodyweightRatio()`

**Full Method Signature:**
```typescript
async calculateBodyweightRatio(maxLogId: string, bodyweightKg: number): Promise<number>
```

**Extended Description:**
Calculates the lift-to-bodyweight ratio for a max log.

**INPUT PARAMETERS:**

- **`maxLogId`** (`string`): No description provided
- **`bodyweightKg`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<number>`
- **Description:** Promise resolving to the bodyweight ratio

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.getMaxLogsOlderThan()`

**Full Method Signature:**
```typescript
getMaxLogsOlderThan(profileId: string, date: Date): Query<MaxLog>
```

**Extended Description:**
Retrieves max logs that are older than a specific date.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`date`** (`Date`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<MaxLog>`
- **Description:** Query for MaxLog models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.getMaxLogSummary()`

**Full Method Signature:**
```typescript
async getMaxLogSummary(maxLogId: string): Promise<string>
```

**Extended Description:**
Generates a summary string for a max log.

**INPUT PARAMETERS:**

- **`maxLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<string>`
- **Description:** Promise resolving to the summary string

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `MaxLogQueryService.deleteMaxLog()`

**Full Method Signature:**
```typescript
async deleteMaxLog(maxLogId: string): Promise<void>
```

**Extended Description:**
Permanently deletes a max log from the system.

**INPUT PARAMETERS:**

- **`maxLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

---

## Profile Feature

### Custom Hooks

#### PUBLIC API: `useActiveProfileData()`

**File:** `/src/features/profile/hooks/useActiveProfileData.ts`

**Full Function Signature:**
```typescript
export function useActiveProfileData(): UseActiveProfileDataResult
```

**Extended Description:**
Aggregate React Query hook that provides all commonly needed data for the active profile. This hook combines the results of multiple profile-related queries into a single, unified interface. It provides intelligent state aggregation, combining loading states, errors, and success states from the underlying queries. The hook automatically fetches user settings and details for the currently active profile ID from the profile store. If no profile is active, all queries are disabled and the hook returns appropriate empty states.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `UseActiveProfileDataResult`
- **Description:** Combined result with unified loading states, errors, and data

---

#### PUBLIC API: `useGetAppSettings()`

**File:** `/src/features/profile/hooks/useGetAppSettings.ts`

**Full Function Signature:**
```typescript
export function useGetAppSettings(
  profileId?: string | null,
  options?: Partial<UseQueryOptions<UserSettingsModel | null, ApplicationError>>
)
```

**Extended Description:**
React Query hook for fetching user application settings. This hook provides reactive access to user settings including theme preferences, unit systems, training plan configuration, timer settings, and dashboard layout.

**INPUT PARAMETERS:**

- **`profileId`** (`string | null | undefined`): No description provided
- **`options`** (`Partial<UseQueryOptions<UserSettingsModel | null, ApplicationError, UserSettingsModel | null, readonly unknown[]>> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseQueryResult<UserSettingsModel | null, ApplicationError>`
- **Description:** Query result with user settings data

---

#### PUBLIC API: `useProfileOperations()`

**File:** `/src/features/profile/hooks/useProfileOperations.ts`

**Full Function Signature:**
```typescript
export function useProfileOperations()
```

**Extended Description:**
Profile CRUD and switching operations hook. Focused hook for profile management operations including: - Creating new profiles - Updating existing profiles - Deleting profiles - Switching between profiles - Getting all profiles

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `{ profiles: ProfileModel[]; activeProfileId: string | null; isLoading: boolean; isCreating: boolean; isUpdating: boolean; isDeleting: boolean; createError: Error | null; updateError: Error | null; deleteError: Error | null; create: UseMutateAsyncFunction<any, Error, CreateProfileInput, unknown>; update: UseMutateAsyncFunction<any, Error, UpdateProfileInput, unknown>; delete: UseMutateAsyncFunction<void, Error, string, unknown>; switch: (profileId: string) => Promise<string>; getById: (profileId: string) => ProfileModel | null; hasMultipleProfiles: boolean; canDeleteProfile: string | false | null; refetch: () => void; }`
- **Description:** Profile operations interface

---

#### PUBLIC API: `useUpdateAppSettings()`

**File:** `/src/features/profile/hooks/useUpdateAppSettings.ts`

**Full Function Signature:**
```typescript
export function useUpdateAppSettings(
  options?: Partial<UseMutationOptions<UserSettingsModel, ApplicationError, UpdateAppSettingsInput>>
)
```

**Extended Description:**
React Mutation hook for updating user application settings. This hook provides a mutation interface for updating user settings with automatic cache invalidation and optimistic updates support. Supports updating: - Theme mode and colors - Unit system and BMI formula - Active training plan - Timer preferences (auto-start settings) - Lift mappings - Dashboard layout and visibility

**INPUT PARAMETERS:**

- **`options`** (`Partial<UseMutationOptions<UserSettingsModel, ApplicationError, UpdateAppSettingsInput, unknown>> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMutationResult<UserSettingsModel, ApplicationError, UpdateAppSettingsInput, unknown>`
- **Description:** Mutation result with update functionality

---

#### PUBLIC API: `useUserData()`

**File:** `/src/features/profile/hooks/useUserData.ts`

**Full Function Signature:**
```typescript
export function useUserData()
```

**Extended Description:**
User details and settings management hook. Focused hook for user-related data management including: - User details (name, email, phone, etc.) - User settings (theme, language, notifications, privacy)   - Settings persistence and synchronization - Quick settings updates - Simple validation (complex validation handled by ProfileModel)

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `{ userDetails: UserDetails; userSettings: UserSettings; isLoaded: boolean; isUpdatingDetails: boolean; isUpdatingSettings: boolean; detailsError: Error | null; settingsError: Error | null; updateDetails: UseMutateAsyncFunction<{ firstName: string; lastName: string; email: string; phone?: string | undefined; bio?: string | undefined; avatar?: string | undefined; emergencyContact?: { name: string; phone: string; relationship: string; } | undefined; }, Error, Partial<UserDetails>, unknown>; updateSettings: UseMutateAsyncFunction<{ notifications: { workoutReminders: boolean; progressUpdates: boolean; achievementAlerts: boolean; }; privacy: { shareProgress: boolean; publicProfile: boolean; }; units: "metric" | "imperial"; theme: "light" | "dark" | "system"; language: "en" | "it"; }, Error, Partial<UserSettings>, unknown>; updateTheme: (theme: "light" | "dark" | "system") => void; updateLanguage: (language: "en" | "it") => void; updateUnits: (units: "metric" | "imperial") => void; toggleNotification: (key: "workoutReminders" | "progressUpdates" | "achievementAlerts") => void; togglePrivacy: (key: "shareProgress" | "publicProfile") => void; resetSettings: () => void; exportUserData: () => { details: UserDetails; settings: UserSettings; exportedAt: string; }; importUserData: (data: { details?: UserDetails | undefined; settings?: UserSettings | undefined; }) => Promise<void>; isComplete: boolean; hasAvatar: boolean; hasEmergencyContact: boolean; isDarkMode: boolean; isMetric: boolean; }`
- **Description:** User data management interface

---

### Query Services

#### ProfileQueryService

**File:** `/src/features/profile/query-services/ProfileQueryService.ts`

**Description:**
Query service that acts as an adapter between the Application Layer and React Query. This service handles the unwrapping of Result objects returned by application services, allowing React Query hooks to use standard promise-based error handling. It provides methods for all profile-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {ProfileService} profileService - 
 * @param {UserDetailsService} userDetailsService - 
 * @param {UserSettingsService} userSettingsService - 
 */
constructor(
    @inject('ProfileService') private readonly profileService: ProfileService,
    @inject('UserDetailsService') private readonly userDetailsService: UserDetailsService,
    @inject('UserSettingsService') private readonly userSettingsService: UserSettingsService
  )
```

**Public Methods:**

##### PUBLIC API: `ProfileQueryService.getProfiles()`

**Full Method Signature:**
```typescript
getProfiles(): Query<Profile>
```

**Extended Description:**
Retrieves all profiles from the system.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `default<Profile>`
- **Description:** Query for Profile models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.getProfileQuery()`

**Full Method Signature:**
```typescript
getProfileQuery(profileId: string): Query<Profile>
```

**Extended Description:**
Retrieves a reactive query for a specific profile by ID. This method provides reactive observation capabilities for individual profiles, automatically updating when the profile data changes.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<Profile>`
- **Description:** Query for Profile model for reactive observation

##### PUBLIC API: `ProfileQueryService.getProfile()`

**Full Method Signature:**
```typescript
async getProfile(profileId: string): Promise<ProfileModel>
```

**Extended Description:**
Retrieves a specific profile by ID.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ProfileModel>`
- **Description:** Promise resolving to the ProfileModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.createProfile()`

**Full Method Signature:**
```typescript
async createProfile(name: string): Promise<ProfileModel>
```

**Extended Description:**
Creates a new profile with the given name.

**INPUT PARAMETERS:**

- **`name`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ProfileModel>`
- **Description:** Promise resolving to the created ProfileModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.updateProfile()`

**Full Method Signature:**
```typescript
async updateProfile(profileId: string, newName: string): Promise<ProfileModel>
```

**Extended Description:**
Updates a profile's name.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`newName`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ProfileModel>`
- **Description:** Promise resolving to the updated ProfileModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.deactivateProfile()`

**Full Method Signature:**
```typescript
async deactivateProfile(profileId: string): Promise<ProfileModel>
```

**Extended Description:**
Deactivates a profile (soft delete).

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<ProfileModel>`
- **Description:** Promise resolving to the deactivated ProfileModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.deleteProfile()`

**Full Method Signature:**
```typescript
async deleteProfile(profileId: string): Promise<void>
```

**Extended Description:**
Permanently deletes a profile from the system.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.getUserSettings()`

**Full Method Signature:**
```typescript
async getUserSettings(profileId: string): Promise<UserSettingsModel | undefined>
```

**Extended Description:**
Retrieves user settings for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<UserSettingsModel | undefined>`
- **Description:** Promise resolving to UserSettingsModel or undefined if not found

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.saveUserSettings()`

**Full Method Signature:**
```typescript
async saveUserSettings(settings: UserSettingsModel): Promise<UserSettingsModel>
```

**Extended Description:**
Saves user settings for a profile.

**INPUT PARAMETERS:**

- **`settings`** (`UserSettingsModel`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<UserSettingsModel>`
- **Description:** Promise resolving to the saved UserSettingsModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.getUserDetails()`

**Full Method Signature:**
```typescript
async getUserDetails(profileId: string): Promise<UserDetailsModel | undefined>
```

**Extended Description:**
Retrieves user details for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<UserDetailsModel | undefined>`
- **Description:** Promise resolving to UserDetailsModel or undefined if not found

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `ProfileQueryService.saveUserDetails()`

**Full Method Signature:**
```typescript
async saveUserDetails(details: UserDetailsModel): Promise<UserDetailsModel>
```

**Extended Description:**
Saves user details for a profile.

**INPUT PARAMETERS:**

- **`details`** (`UserDetailsModel`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<UserDetailsModel>`
- **Description:** Promise resolving to the saved UserDetailsModel

**EXCEPTIONS:**
- When the operation fails

---

## Training-plan Feature

### Custom Hooks

#### PUBLIC API: `useGetTrainingCycle()`

**File:** `/src/features/training-plan/hooks/useGetTrainingCycle.ts`

**Full Function Signature:**
```typescript
export function useGetTrainingCycle(cycleId: string, options?:
```

**Extended Description:**
Reactive hook for observing a specific training cycle by ID. This hook provides a reactive way to observe a training cycle using WatermelonDB's observe() API. It automatically updates when training cycle data changes, eliminating the need for manual cache invalidation while maintaining a clean separation from the underlying persistence layer.

**INPUT PARAMETERS:**

- **`cycleId`** (`string`): No description provided
- **`options`** (`{ enabled?: boolean | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseObserveQueryResult<TrainingCycleModel>`
- **Description:** Observable result with training cycle data and observation status

---

#### PUBLIC API: `useGetTrainingCycles()`

**File:** `/src/features/training-plan/hooks/useGetTrainingCycles.ts`

**Full Function Signature:**
```typescript
export function useGetTrainingCycles(profileId: string, options?:
```

**Extended Description:**
Reactive hook for observing all training cycles for a specific profile. This hook provides a reactive way to observe all training cycles for a given profile using WatermelonDB's observe() API. It automatically updates when training cycle data changes, eliminating the need for manual cache invalidation while maintaining a clean separation from the underlying persistence layer.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`options`** (`{ enabled?: boolean | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseObserveQueryResult<TrainingCycleModel>`
- **Description:** Observable result with training cycles data and observation status

---

#### PUBLIC API: `useGetTrainingPlan()`

**File:** `/src/features/training-plan/hooks/useGetTrainingPlan.ts`

**Full Function Signature:**
```typescript
export function useGetTrainingPlan(planId: string, options?:
```

**Extended Description:**
Reactive hook for observing a specific training plan by ID. This hook provides a reactive way to observe a training plan using WatermelonDB's observe() API. It automatically updates when training plan data changes, eliminating the need for manual cache invalidation while maintaining a clean separation from the underlying persistence layer.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided
- **`options`** (`{ enabled?: boolean | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseObserveQueryResult<TrainingPlanModel>`
- **Description:** Observable result with training plan data and observation status

---

#### PUBLIC API: `useGetTrainingPlans()`

**File:** `/src/features/training-plan/hooks/useGetTrainingPlans.ts`

**Full Function Signature:**
```typescript
export function useGetTrainingPlans(
  profileId: string,
  filters?:
```

**Extended Description:**
Reactive hook for observing all training plans for a specific profile. This hook provides a reactive way to observe all training plans for a given profile using WatermelonDB's observe() API. It automatically updates when training plan data changes, eliminating the need for manual cache invalidation while maintaining a clean separation from the underlying persistence layer.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`filters`** (`{ isArchived?: boolean | undefined; cycleId?: string | undefined; } | undefined`): No description provided
- **`options`** (`{ enabled?: boolean | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseObserveQueryResult<TrainingPlanModel>`
- **Description:** Observable result with training plans data and observation status

---

#### PUBLIC API: `usePlanEditorData()`

**File:** `/src/features/training-plan/hooks/usePlanEditorData.ts`

**Full Function Signature:**
```typescript
export function usePlanEditorData(planId: string, profileId: string): UsePlanEditorDataResult
```

**Extended Description:**
Aggregate React Query hook that provides all data required for the plan editor workflow. This hook combines the results of multiple queries into a single, unified interface for the plan editing experience. It fetches both the training plan details and the complete list of available exercises for the exercise picker modal. The hook provides intelligent state aggregation, combining loading states, errors, and success states from the underlying queries. It automatically handles concurrent data fetching and provides a clean API for the presentation layer.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UsePlanEditorDataResult`
- **Description:** Combined result with unified loading states, errors, and data

---

#### PUBLIC API: `useTrainingPlanManager()`

**File:** `/src/features/training-plan/hooks/useTrainingPlanManager.ts`

**Full Function Signature:**
```typescript
export function useTrainingPlanManager(profileId: string)
```

**Extended Description:**
Comprehensive training plan and cycle management aggregate hook. This hook provides a unified interface for: - Training plan CRUD operations (create, update, delete, archive) - Training cycle management and scheduling - Plan progression and adaptation tracking - Plan templates and customization - Workout scheduling from plans Consolidates 10+ training-plan hooks into a single, cohesive API while maintaining reactive updates through WatermelonDB.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ plans: TrainingPlanModel[]; cycles: TrainingCycleModel[]; activeCycles: TrainingCycleModel[]; planProgress: any[]; statistics: { totalPlans: number; activePlans: number; archivedPlans: number; totalCycles: number; completedCycles: number; averagePlanDuration: number; }; getPlanDetails: (planId: string) => any; getPlan: (planId: string) => Promise<TrainingPlanModel | null>; getCycle: (cycleId: string) => Promise<TrainingCycleModel | null>; plan: { create: UseMutationResult<TrainingPlanModel, Error, CreateTrainingPlanInput, unknown>; update: UseMutationResult<TrainingPlanModel, Error, { id: string; updates: { name?: string | undefined; description?: string | undefined; notes?: string | undefined; cycleId?: string | null | undefined; }; }, unknown>; delete: UseMutationResult<void, Error, string, unknown>; archive: UseMutationResult<Result<TrainingPlanModel, ApplicationError>, Error, string, unknown>; }; cycle: { create: UseMutationResult<Result<TrainingCycleModel, ApplicationError>, Error, CreateTrainingCycleInput, unknown>; update: UseMutationResult<Result<TrainingCycleModel, ApplicationError>, Error, { id: string; updates: Partial<CreateTrainingCycleInput>; }, unknown>; delete: UseMutationResult<void, Error, string, unknown>; }; helpers: { getByDifficulty: (difficulty: "beginner" | "intermediate" | "advanced") => TrainingPlanModel[]; getByGoal: (goal: string) => TrainingPlanModel[]; getRecommendedDuration: (goal: string, difficulty: string) => 10 | 12 | 16 | 8; validatePlanStructure: (plan: Partial<CreateTrainingPlanInput>) => { isValid: boolean; errors: string[]; }; }; scheduling: { getNextWorkoutFromPlan: (planId: string) => SessionModel | null; getWeeklySchedule: (cycleId: string) => { sessionId: string; sessionName: string; dayOfWeek: number; exercises: any; }[]; }; isLoadingPlans: boolean; isLoadingCycles: boolean; isCreatingPlan: boolean; isUpdatingPlan: boolean; isDeletingPlan: boolean; isArchivingPlan: boolean; isCreatingCycle: boolean; isUpdatingCycle: boolean; isDeletingCycle: boolean; planError: Error | null; cycleError: Error | null; }`
- **Description:** Comprehensive training plan management interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useTrainingPlanManager().isValid`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `useTrainingPlanProgress()`

**File:** `/src/features/training-plan/hooks/useTrainingPlanProgress.ts`

**Full Function Signature:**
```typescript
export function useTrainingPlanProgress(
  planId: string,
  profileId: string
): UseTrainingPlanProgressResult
```

**Extended Description:**
Hook for combining training plan data with workout execution for progress tracking. Aggregates training plan structure with actual workout logs to show plan completion progress, upcoming sessions, and performance metrics. Provides a comprehensive view of training plan adherence and progress.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseTrainingPlanProgressResult`
- **Description:** Object with plan structure and progress data

**Usage Examples:**

```typescript
```typescript
const { 
  plan,
  completedSessions,
  totalSessions,
  progressPercentage,
  upcomingSessions,
  lastCompleted,
  progressMetrics 
} = useTrainingPlanProgress(planId, profileId);

return (
  <Box>
    <PlanHeader plan={plan} progress={progressPercentage} />
    <ProgressBar 
      completed={completedSessions} 
      total={totalSessions} 
    />
    <UpcomingSessionsList sessions={upcomingSessions} />
    <MetricsCard metrics={progressMetrics} />
    {lastCompleted && (
      <LastCompletedCard workout={lastCompleted} />
    )}
  </Box>
);
```
```

---

### Query Services

#### TrainingPlanQueryService

**File:** `/src/features/training-plan/query-services/TrainingPlanQueryService.ts`

**Description:**
Query service that acts as an adapter between the Training Plan Application Layer and React Query. This service handles the unwrapping of Result objects returned by the TrainingPlanService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all training plan and cycle-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {TrainingPlanService} trainingPlanService - 
 */
constructor(
    @inject('TrainingPlanService') private readonly trainingPlanService: TrainingPlanService
  )
```

**Public Methods:**

##### PUBLIC API: `TrainingPlanQueryService.createTrainingPlan()`

**Full Method Signature:**
```typescript
async createTrainingPlan(
    profileId: string,
    name: string,
    description?: string,
    cycleId?: string
  ): Promise<TrainingPlanModel>
```

**Extended Description:**
Creates a new training plan for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`name`** (`string`): No description provided
- **`description`** (`string | undefined`): No description provided
- **`cycleId`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingPlanModel>`
- **Description:** Promise resolving to the created TrainingPlanModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.createTrainingCycle()`

**Full Method Signature:**
```typescript
async createTrainingCycle(
    profileId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    goal: string,
    notes?: string
  ): Promise<TrainingCycleModel>
```

**Extended Description:**
Creates a new training cycle for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`name`** (`string`): No description provided
- **`startDate`** (`Date`): No description provided
- **`endDate`** (`Date`): No description provided
- **`goal`** (`string`): No description provided
- **`notes`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingCycleModel>`
- **Description:** Promise resolving to the created TrainingCycleModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.getTrainingPlan()`

**Full Method Signature:**
```typescript
async getTrainingPlan(planId: string): Promise<TrainingPlanModel>
```

**Extended Description:**
Retrieves a training plan by its unique identifier.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingPlanModel>`
- **Description:** Promise resolving to the TrainingPlanModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.getTrainingPlanQuery()`

**Full Method Signature:**
```typescript
getTrainingPlanQuery(planId: string): Query<TrainingPlan>
```

**Extended Description:**
Gets a WatermelonDB query for a specific training plan by ID.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<TrainingPlan>`
- **Description:** Query for TrainingPlan model for reactive observation

##### PUBLIC API: `TrainingPlanQueryService.getTrainingCycle()`

**Full Method Signature:**
```typescript
async getTrainingCycle(cycleId: string): Promise<TrainingCycleModel>
```

**Extended Description:**
Retrieves a training cycle by its unique identifier.

**INPUT PARAMETERS:**

- **`cycleId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingCycleModel>`
- **Description:** Promise resolving to the TrainingCycleModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.getTrainingCycleQuery()`

**Full Method Signature:**
```typescript
getTrainingCycleQuery(cycleId: string): Query<TrainingCycle>
```

**Extended Description:**
Gets a WatermelonDB query for a specific training cycle by ID.

**INPUT PARAMETERS:**

- **`cycleId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<TrainingCycle>`
- **Description:** Query for TrainingCycle model for reactive observation

##### PUBLIC API: `TrainingPlanQueryService.getTrainingPlans()`

**Full Method Signature:**
```typescript
getTrainingPlans(
    profileId: string,
    filters?:
```

**Extended Description:**
Retrieves all training plans for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`filters`** (`{ isArchived?: boolean | undefined; cycleId?: string | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<TrainingPlan>`
- **Description:** Query for TrainingPlan models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.getTrainingCycles()`

**Full Method Signature:**
```typescript
getTrainingCycles(profileId: string): Query<TrainingCycle>
```

**Extended Description:**
Retrieves all training cycles for a specific profile.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<TrainingCycle>`
- **Description:** Query for TrainingCycle models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.updateTrainingPlan()`

**Full Method Signature:**
```typescript
async updateTrainingPlan(
    planId: string,
    updates:
```

**Extended Description:**
Updates a training plan's basic information.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided
- **`updates`** (`{ name?: string | undefined; description?: string | undefined; notes?: string | undefined; cycleId?: string | null | undefined; }`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingPlanModel>`
- **Description:** Promise resolving to the updated TrainingPlanModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.updateTrainingCycle()`

**Full Method Signature:**
```typescript
async updateTrainingCycle(
    cycleId: string,
    updates:
```

**Extended Description:**
Updates a training cycle's basic information.

**INPUT PARAMETERS:**

- **`cycleId`** (`string`): No description provided
- **`updates`** (`{ name?: string | undefined; startDate?: Date | undefined; endDate?: Date | undefined; goal?: string | undefined; notes?: string | undefined; }`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingCycleModel>`
- **Description:** Promise resolving to the updated TrainingCycleModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.archiveTrainingPlan()`

**Full Method Signature:**
```typescript
async archiveTrainingPlan(planId: string): Promise<TrainingPlanModel>
```

**Extended Description:**
Archives a training plan (soft delete).

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<TrainingPlanModel>`
- **Description:** Promise resolving to the archived TrainingPlanModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.deleteTrainingPlan()`

**Full Method Signature:**
```typescript
async deleteTrainingPlan(planId: string, options:
```

**Extended Description:**
Permanently deletes a training plan from the system. This operation cascades to delete all child entities (sessions, exercise groups, applied exercises).

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided
- **`options`** (`{ deleteChildren: boolean; }`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `TrainingPlanQueryService.deleteTrainingCycle()`

**Full Method Signature:**
```typescript
async deleteTrainingCycle(cycleId: string): Promise<void>
```

**Extended Description:**
Permanently deletes a training cycle from the system. This operation also removes the cycle association from any related training plans.

**INPUT PARAMETERS:**

- **`cycleId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

---

## Workout Feature

### Custom Hooks

#### PUBLIC API: `useAdvancedSetExecution()`

**File:** `/src/features/workout/hooks/useAdvancedSetExecution.ts`

**Full Function Signature:**
```typescript
export function useAdvancedSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string
): UseAdvancedSetExecutionResult
```

**Extended Description:**
Main hook for managing advanced set execution state and bridging services to UI components. This hook provides a comprehensive interface for executing complex set types like drop sets, myo-reps, pyramidal sets, rest-pause, and MAV sets. It integrates with the XState machine and Zustand store for state management, and provides timer functionality for rest periods. Features: - Real-time state management during set execution - Automatic calculation of next weights/reps - Timer management for rest periods - Progress persistence and resumption - Integration with existing rest timer system

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`workoutLogId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseAdvancedSetExecutionResult`
- **Description:** Comprehensive advanced set execution interface

**Usage Examples:**

```typescript
```typescript
const dropSetExecution = useAdvancedSetExecution('profile-1', 'workout-1', 'exercise-1');

// Initialize a drop set
await dropSetExecution.initialize(dropSetConfig, 100);

// Complete the main set
await dropSetExecution.completeCurrentSet({
  weight: 100,
  counts: 8,
  rpe: 9,
  completed: true
});

// Start rest timer
dropSetExecution.startRest();

// Display progress
return (
  <Box>
    <Typography>Phase {dropSetExecution.currentPhase} of {dropSetExecution.totalPhases}</Typography>
    <Typography>Next: {dropSetExecution.nextSetData?.weight}kg × {dropSetExecution.nextSetData?.expectedCounts}</Typography>
    {dropSetExecution.restTimer.isActive && (
      <Typography>Rest: {dropSetExecution.restTimer.formattedTime}</Typography>
    )}
  </Box>
);
```
```

---

#### PUBLIC API: `useAdvancedSetProgress()`

**File:** `/src/features/workout/hooks/useAdvancedSetProgress.ts`

**Full Function Signature:**
```typescript
export function useAdvancedSetProgress(
  profileId: string,
  setId?: string
): UseAdvancedSetProgressResult
```

**Extended Description:**
Hook for tracking and resuming advanced set execution progress. This hook manages persistence of advanced set execution state, allowing users to resume interrupted sessions across app restarts or crashes. It provides automatic saving, manual backup/restore, and progress tracking capabilities. Features: - Automatic progress persistence across app restarts - Manual save/restore with backup management - Progress tracking and metadata - Auto-save configuration - Error recovery and validation

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`setId`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseAdvancedSetProgressResult`
- **Description:** Progress tracking and persistence interface

**Usage Examples:**

```typescript
```typescript
const progress = useAdvancedSetProgress('profile-1');

// Check for resumable progress
if (progress.canResume && progress.activeSession) {
  return (
    <Card>
      <Typography>Resume {progress.activeSession.setType} set?</Typography>
      <Typography>
        Progress: {progress.completedSets} sets completed 
        ({progress.progressPercentage}%)
      </Typography>
      <Typography>
        Started: {format(progress.startTime, 'MMM dd, HH:mm')}
      </Typography>
      <Button onClick={progress.resumeProgress}>
        Resume Session
      </Button>
      <Button onClick={progress.clearProgress} color="secondary">
        Start Fresh
      </Button>
    </Card>
  );
}

// During execution - auto-save is enabled by default
useEffect(() => {
  if (executionState?.currentPhase) {
    progress.saveProgress(); // Manual save at key points
  }
}, [executionState?.currentPhase]);

// Create backup before risky operations
const handleExperimentalFeature = async () => {
  const backupId = await progress.createBackup();
  try {
    // Risky operation
  } catch (error) {
    await progress.restoreFromBackup(backupId);
  }
};

// List available backups for user selection
const backups = await progress.listBackups();
backups.forEach(backup => {
  console.log(`${backup.setType} - ${format(backup.timestamp, 'MMM dd, HH:mm')}`);
});
```
```

---

#### PUBLIC API: `useDropSetExecution()`

**File:** `/src/features/workout/hooks/useDropSetExecution.ts`

**Full Function Signature:**
```typescript
export function useDropSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  dropConfig?: DropSetConfiguration
): UseDropSetExecutionResult
```

**Extended Description:**
Specific hook for drop set execution logic. Drop sets involve performing a main set to near failure, then immediately reducing the weight by a predetermined percentage and continuing for additional drops. This hook manages the weight progression and drop sequence. Drop set phases: 1. Main set (100% weight) → failure 2. Drop 1 (80% weight) → failure   3. Drop 2 (60% weight) → failure 4. etc.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`workoutLogId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`dropConfig`** (`DropSetConfiguration | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseDropSetExecutionResult`
- **Description:** Drop set specific execution interface with weight calculations

**Usage Examples:**

```typescript
```typescript
const dropSet = useDropSetExecution('profile-1', 'workout-1', 'exercise-1', dropConfig);

// Initialize with 100kg base weight
await dropSet.initialize(dropConfig, 100);

// Display current phase
if (dropSet.isMainSet) {
  return <Text>Main Set: {dropSet.currentWeight}kg</Text>;
} else if (dropSet.isDropPhase) {
  return (
    <Text>
      Drop {dropSet.dropNumber}/{dropSet.totalDrops}: {dropSet.currentWeight}kg
      (-{dropSet.dropPercentage}%)
    </Text>
  );
}

// Complete main set and progress to first drop
await dropSet.completeCurrentSet({
  weight: 100,
  counts: 8,
  rpe: 9,
  completed: true
});

// Next weight is automatically calculated
console.log(dropSet.nextWeight); // 80kg (20% drop)
```
```

---

#### PUBLIC API: `useGetLastWorkoutSummary()`

**File:** `/src/features/workout/hooks/useGetLastWorkoutSummary.ts`

**Full Function Signature:**
```typescript
export function useGetLastWorkoutSummary(
  profileId: string,
  sessionId: string,
  options?:
```

**Extended Description:**
Reactive hook for observing the last workout summary for a specific session. This hook provides a reactive way to observe the most recent workout log for a given session using WatermelonDB's observe() API. It automatically updates when workout data changes, providing historical context for workout initialization.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`sessionId`** (`string`): No description provided
- **`options`** (`{ enabled?: boolean | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseObserveQueryResult<WorkoutLogModel>`
- **Description:** Observable result with last workout data and observation status

---

#### PUBLIC API: `useGetWorkoutHistory()`

**File:** `/src/features/workout/hooks/useGetWorkoutHistory.ts`

**Full Function Signature:**
```typescript
export function useGetWorkoutHistory(
  profileId: string,
  limit: number = 20,
  filters?:
```

**Extended Description:**
React Query infinite query hook for fetching paginated workout history. This hook provides infinite scrolling functionality for workout history, loading workout logs in pages as the user scrolls. It's optimized for displaying large amounts of historical workout data efficiently.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`limit`** (`number`): No description provided
- **`filters`** (`{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined`): No description provided
- **`options`** (`Omit<UseInfiniteQueryOptions<WorkoutHistoryPage, ApplicationError, WorkoutHistoryPage, readonly unknown[], unknown>, "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseInfiniteQueryResult<WorkoutHistoryPage, ApplicationError>`
- **Description:** Infinite query result with paginated workout history data

---

#### PUBLIC API: `useInfiniteWorkoutHistory()`

**File:** `/src/features/workout/hooks/useInfiniteWorkoutHistory.ts`

**Full Function Signature:**
```typescript
export function useInfiniteWorkoutHistory(
  profileId: string,
  pageSize: number = 20,
  filters?: HistoryFilters
): UseInfiniteWorkoutHistoryResult
```

**Extended Description:**
Hook for infinite scrolling workout history with performance optimization. Implements infinite scrolling for workout history using existing pagination APIs. Reduces memory usage and improves performance for users with large workout histories by loading data incrementally as needed.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`pageSize`** (`number`): No description provided
- **`filters`** (`HistoryFilters | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseInfiniteWorkoutHistoryResult`
- **Description:** Object with infinite scroll data and controls

**Usage Examples:**

```typescript
```typescript
const {
  workouts,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  totalCount
} = useInfiniteWorkoutHistory(profileId, 15, {
  dateRange: { from: startDate, to: endDate }
});

return (
  <InfiniteScroll
    dataLength={workouts.length}
    next={fetchNextPage}
    hasMore={hasNextPage}
    loader={<Loading />}
  >
    {workouts.map(workout => (
      <WorkoutCard key={workout.id} workout={workout} />
    ))}
  </InfiniteScroll>
);
```
```

---

#### PUBLIC API: `useMavSetExecution()`

**File:** `/src/features/workout/hooks/useMavSetExecution.ts`

**Full Function Signature:**
```typescript
export function useMavSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  mavConfig?: MavSetConfiguration
): UseMavSetExecutionResult
```

**Extended Description:**
Specific hook for MAV (Maximum Adaptive Volume) set execution logic. MAV sets involve performing multiple sets with consistent reps and weight, focusing on volume accumulation at a specific RPE. The goal is to maintain consistent performance across all sets. MAV characteristics: - Fixed reps per set (typically 5-8) - Fixed weight throughout - Target RPE maintained (typically 7-8) - Multiple sets (typically 4-8 sets) - Consistent rest periods MAV phases: 1. Set 1: 70kg×5 @ RPE 7 2. Rest (60 seconds) 3. Set 2: 70kg×5 @ RPE 7 4. Rest (60 seconds) 5. Continue for all sets 6. Monitor consistency and adjust future sessions

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`workoutLogId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`mavConfig`** (`MavSetConfiguration | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMavSetExecutionResult`
- **Description:** MAV set specific execution interface with volume and consistency tracking

**Usage Examples:**

```typescript
```typescript
const mav = useMavSetExecution('profile-1', 'workout-1', 'exercise-1', config);

// Initialize MAV protocol
await mav.initialize(config, 70); // 70kg weight

// Display current phase
return (
  <Box>
    <Text>
      MAV Set {mav.currentSet}/{mav.totalSets}: {mav.currentWeight}kg × {mav.repsPerSet}
      Target RPE: {mav.targetRpe}
    </Text>
    <Text>
      Volume: {mav.currentVolume}/{mav.totalVolumeTarget} reps
      ({mav.getVolumeProgress().percentage}%)
    </Text>
    <Text>
      Consistency: {mav.consistencyScore}% (Avg RPE: {mav.averageRpe})
    </Text>
  </Box>
);

// Complete a set
await mav.completeCurrentSet({
  weight: 70,
  counts: 5, // Hit target reps
  rpe: 7,   // Hit target RPE
  completed: true
});

// Check if weight adjustment is needed
const adjustment = mav.shouldAdjustWeight(5, 7);
console.log(adjustment.action); // 'maintain' - on target

// If struggling (only got 3 reps @ RPE 9)
const strugglingAdjustment = mav.shouldAdjustWeight(3, 9);
console.log(strugglingAdjustment.action); // 'decrease'
console.log(strugglingAdjustment.reason); // 'RPE too high and reps below target'

// Get pace analysis
const pace = mav.getPaceAnalysis();
if (!pace.onTrack) {
  console.log(pace.recommendation); // 'Consider reducing weight to maintain consistency'
}
```
```

---

#### PUBLIC API: `useMyoRepsExecution()`

**File:** `/src/features/workout/hooks/useMyoRepsExecution.ts`

**Full Function Signature:**
```typescript
export function useMyoRepsExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  myoRepsConfig?: MyoRepsSetConfiguration
): UseMyoRepsExecutionResult
```

**Extended Description:**
Specific hook for MyoReps execution logic. MyoReps (Myo-Repetition) sets involve: 1. Activation set: Perform reps to a specific RPE (usually 8-9) 2. Brief rest (15-20 seconds) 3. Mini-sets: Perform smaller rep clusters until failure to maintain target reps 4. Continue until unable to reach target reps or max mini-sets reached MyoReps phases: 1. Activation set (15 reps @ RPE 9) 2. Rest (15-20 seconds) 3. Mini-set 1 (5 reps target) 4. Rest (15-20 seconds)   5. Mini-set 2 (5 reps target) 6. Continue until failure to reach target or max sets

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`workoutLogId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`myoRepsConfig`** (`MyoRepsSetConfiguration | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseMyoRepsExecutionResult`
- **Description:** MyoReps specific execution interface with rep tracking and continuation logic

**Usage Examples:**

```typescript
```typescript
const myoReps = useMyoRepsExecution('profile-1', 'workout-1', 'exercise-1', config);

// Initialize MyoReps protocol
await myoReps.initialize(config, 60); // 60kg weight

// Display current phase
if (myoReps.isActivationSet) {
  return (
    <Text>
      Activation Set: {myoReps.activationReps} reps @ RPE {myoReps.activationRpe}
    </Text>
  );
} else if (myoReps.isMiniSet) {
  return (
    <Text>
      Mini-Set {myoReps.currentMiniSet}/{myoReps.totalMiniSets}: 
      Target {myoReps.targetMiniSetReps} reps
    </Text>
  );
}

// Complete activation set
await myoReps.completeCurrentSet({
  weight: 60,
  counts: 15,
  rpe: 9,
  completed: true
});

// Complete mini-set and check if should continue
const miniSetReps = 4; // Failed to reach 5 rep target
const shouldContinue = myoReps.shouldContinueMiniSets(miniSetReps);

if (shouldContinue) {
  await myoReps.completeCurrentSet({
    weight: 60,
    counts: miniSetReps,
    rpe: 10,
    completed: true
  });
} else {
  // End MyoReps - unable to maintain target
  myoReps.abort();
}
```
```

---

#### PUBLIC API: `usePyramidalSetExecution()`

**File:** `/src/features/workout/hooks/usePyramidalSetExecution.ts`

**Full Function Signature:**
```typescript
export function usePyramidalSetExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  pyramidalConfig?: PyramidalSetConfiguration
): UsePyramidalSetExecutionResult
```

**Extended Description:**
Specific hook for pyramidal set execution logic. Pyramidal sets involve progressively increasing weight while decreasing reps to a peak, then reversing the pattern. This creates a "pyramid" structure. Pyramidal phases: 1. Ascending: 60kg×12, 70kg×10, 80kg×8, 90kg×6 (to peak) 2. Peak: 100kg×4 (heaviest weight, lowest reps) 3. Descending: 90kg×6, 80kg×8, 70kg×10, 60kg×12 (back down)

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`workoutLogId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`pyramidalConfig`** (`PyramidalSetConfiguration | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UsePyramidalSetExecutionResult`
- **Description:** Pyramidal set specific execution interface with weight/rep progression

**Usage Examples:**

```typescript
```typescript
const pyramid = usePyramidalSetExecution('profile-1', 'workout-1', 'exercise-1', config);

// Initialize pyramidal protocol
await pyramid.initialize(config);

// Display current phase
if (pyramid.isAscendingPhase) {
  return (
    <Text>
      Ascending Step {pyramid.currentStep}: {pyramid.currentWeight}kg × {pyramid.currentReps}
      (to peak: {pyramid.stepsToP eak} steps)
    </Text>
  );
} else if (pyramid.isAtPeak) {
  return (
    <Text>
      Peak: {pyramid.peakWeight}kg × {pyramid.currentReps} - Maximum effort!
    </Text>
  );
} else if (pyramid.isDescendingPhase) {
  return (
    <Text>
      Descending Step {pyramid.currentStep}: {pyramid.currentWeight}kg × {pyramid.currentReps}
      ({pyramid.remainingSteps} steps remaining)
    </Text>
  );
}

// Display pyramid structure
pyramid.pyramidStructure.forEach(step => {
  console.log(
    `Step ${step.step}: ${step.weight}kg × ${step.reps} ${step.current ? '← CURRENT' : ''}`
  );
});

// Complete current step
await pyramid.completeCurrentSet({
  weight: pyramid.currentWeight!,
  counts: pyramid.currentReps!,
  rpe: pyramid.isAtPeak ? 10 : 8,
  completed: true
});

// Visual representation
console.log(pyramid.getPyramidVisualization());
// [
//   "60kg×12",     ← base
//   " 70kg×10",    ← ascending
//   "  80kg×8",    ← ascending
//   "   90kg×6",   ← ascending
//   "    100kg×4", ← peak
//   "   90kg×6",   ← descending
//   "  80kg×8",    ← descending
//   " 70kg×10",    ← descending
//   "60kg×12"      ← base
// ]
```
```

---

#### PUBLIC API: `useQuickActions()`

**File:** `/src/features/workout/hooks/useQuickActions.ts`

**Full Function Signature:**
```typescript
export function useQuickActions(profileId: string): UseQuickActionsResult
```

**Extended Description:**
Hook for providing one-tap actions for common workout tasks. Simplifies complex multi-step operations into single function calls for improved user experience. Provides quick access to frequently used actions like starting the last workout, repeating exercises, and quick logging without full workflow.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseQuickActionsResult`
- **Description:** Object with quick action functions and recent action history

**Usage Examples:**

```typescript
```typescript
const { startLastWorkout, repeatExercise, quickLog, recentActions } = useQuickActions(profileId);

return (
  <Box>
    <Button onClick={startLastWorkout}>
      Start Last Workout
    </Button>
    <Button onClick={() => repeatExercise(exerciseId)}>
      Repeat Exercise
    </Button>
    <QuickLogForm onSubmit={quickLog} />
  </Box>
);
```
```

---

#### PUBLIC API: `useRestPauseExecution()`

**File:** `/src/features/workout/hooks/useRestPauseExecution.ts`

**Full Function Signature:**
```typescript
export function useRestPauseExecution(
  profileId: string,
  workoutLogId: string,
  exerciseId: string,
  restPauseConfig?: RestPauseSetConfiguration
): UseRestPauseExecutionResult
```

**Extended Description:**
Specific hook for Rest-Pause execution logic. Rest-Pause sets involve: 1. Main set: Perform reps to near failure (typically RPE 9-10) 2. Brief rest pause (10-15 seconds) 3. Continuation set: Perform additional reps with same weight 4. Repeat pause-continuation cycle until unable to perform target reps Rest-Pause phases: 1. Main set (8 reps @ RPE 9) 2. Pause (15 seconds) 3. Continue (3 reps target) 4. Pause (15 seconds) 5. Continue (3 reps target) 6. Continue until failure to reach target or max pauses

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`workoutLogId`** (`string`): No description provided
- **`exerciseId`** (`string`): No description provided
- **`restPauseConfig`** (`RestPauseSetConfiguration | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseRestPauseExecutionResult`
- **Description:** Rest-Pause specific execution interface with pause timing and rep accumulation

**Usage Examples:**

```typescript
```typescript
const restPause = useRestPauseExecution('profile-1', 'workout-1', 'exercise-1', config);

// Initialize Rest-Pause protocol
await restPause.initialize(config, 80); // 80kg weight

// Display current phase
if (restPause.isMainSet) {
  return (
    <Text>
      Main Set: {restPause.mainSetReps} reps @ RPE {restPause.targetRpe}
    </Text>
  );
} else if (restPause.isPausePhase) {
  return (
    <Text>
      Rest-Pause {restPause.currentPause}: {restPause.restTimer.formattedTime}
    </Text>
  );
} else if (restPause.isContinuationSet) {
  return (
    <Text>
      Continue {restPause.currentPause}: Target {restPause.miniSetReps} reps
      (Total: {restPause.totalRepsCompleted} reps)
    </Text>
  );
}

// Complete main set
await restPause.completeCurrentSet({
  weight: 80,
  counts: 8,
  rpe: 9,
  completed: true
});

// Complete continuation set and check if should continue
const continuationReps = 2; // Failed to reach 3 rep target
const shouldContinue = restPause.shouldContinuePauses(continuationReps);

if (shouldContinue) {
  await restPause.completeCurrentSet({
    weight: 80,
    counts: continuationReps,
    rpe: 10,
    completed: true
  });
} else {
  // End Rest-Pause - unable to maintain target
  restPause.abort();
}

console.log(`Total reps: ${restPause.totalRepsCompleted}`); // 10 reps (8 + 2)
```
```

---

#### PUBLIC API: `useRestTimer()`

**File:** `/src/features/workout/hooks/useRestTimer.ts`

**Full Function Signature:**
```typescript
export function useRestTimer(defaultRest: number = 60): UseRestTimerResult
```

**Extended Description:**
Hook for managing rest periods between sets with countdown functionality. Provides rest timer management with countdown display, pause/resume capability, and skip functionality. Essential for proper workout pacing and recovery timing. Uses browser timers and integrates with existing profile rest preferences.

**INPUT PARAMETERS:**

- **`defaultRest`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseRestTimerResult`
- **Description:** Object with timer controls and formatted countdown display

**Usage Examples:**

```typescript
```typescript
const restTimer = useRestTimer(90); // 90 second default

// Start rest timer after completing a set
const handleSetComplete = () => {
  restTimer.start(120); // 2 minute rest
};

// Display countdown in UI
return (
  <Box>
    <Typography variant="h3" color={restTimer.timeRemaining <= 10 ? 'error' : 'primary'}>
      {restTimer.formattedTime}
    </Typography>
    <Button onClick={restTimer.skip}>Skip Rest</Button>
  </Box>
);
```
```

---

#### PUBLIC API: `useWorkoutBackup()`

**File:** `/src/features/workout/hooks/useWorkoutBackup.ts`

**Full Function Signature:**
```typescript
export function useWorkoutBackup(profileId: string): UseWorkoutBackupResult
```

**Extended Description:**
Hook for automated workout data backup and restore functionality. Provides comprehensive backup and restore capabilities using existing export/import services. Ensures data safety through automated backups, integrity validation, and reliable restore functionality without requiring cloud storage.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseWorkoutBackupResult`
- **Description:** Object with backup/restore functions and configuration

**Usage Examples:**

```typescript
```typescript
const { 
  createBackup, 
  restoreFromBackup,
  backupHistory,
  autoBackup,
  setAutoBackup 
} = useWorkoutBackup(profileId);

// Create manual backup
const handleCreateBackup = async () => {
  const backup = await createBackup();
  console.log('Backup created:', backup.filename);
};

// Restore from backup
const handleRestore = async (backupData: BackupData) => {
  await restoreFromBackup(backupData);
  alert('Data restored successfully!');
};

// Enable automatic backups
const handleToggleAutoBackup = () => {
  setAutoBackup(!autoBackup);
};
```
```

---

#### PUBLIC API: `useWorkoutCalendar()`

**File:** `/src/features/workout/hooks/useWorkoutCalendar.ts`

**Full Function Signature:**
```typescript
export function useWorkoutCalendar(
  profileId: string,
  month: number,
  year: number
): UseWorkoutCalendarResult
```

**Extended Description:**
Hook for calendar view of workout planning and history. Provides calendar-organized workout data for scheduling interfaces, combining historical workout data with future scheduled workouts. Enables users to view their workout patterns over time and schedule future training sessions.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`month`** (`number`): No description provided
- **`year`** (`number`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseWorkoutCalendarResult`
- **Description:** Object with calendar data and scheduling functions

**Usage Examples:**

```typescript
```typescript
const { 
  calendarData, 
  addScheduledWorkout,
  removeScheduledWorkout 
} = useWorkoutCalendar(profileId, 2, 2024); // March 2024

// Schedule a workout
const handleScheduleWorkout = async (date: Date, planId: string) => {
  await addScheduledWorkout(date, planId);
};

return (
  <Calendar>
    {calendarData.map(day => (
      <CalendarDay 
        key={day.date.toISOString()}
        day={day}
        onScheduleWorkout={handleScheduleWorkout}
      />
    ))}
  </Calendar>
);
```
```

---

#### PUBLIC API: `useWorkoutFormState()`

**File:** `/src/features/workout/hooks/useWorkoutFormState.ts`

**Full Function Signature:**
```typescript
export function useWorkoutFormState(
  initialWorkout?: Partial<WorkoutFormData>
): UseWorkoutFormStateResult
```

**Extended Description:**
Hook for managing complex workout creation/editing form state with validation. Manages nested workout form data with exercises and sets, providing validation and state management functions. Eliminates extensive useState management in components by centralizing workout form logic and validation rules.

**INPUT PARAMETERS:**

- **`initialWorkout`** (`Partial<WorkoutFormData> | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseWorkoutFormStateResult`
- **Description:** Object with form state and management functions

**Usage Examples:**

```typescript
```typescript
const {
  formState,
  updateWorkoutDetails,
  addExercise,
  addSet,
  updateSet,
  validateForm,
  isDirty
} = useWorkoutFormState(existingWorkout);

// Update workout name
const handleNameChange = (name: string) => {
  updateWorkoutDetails({ name });
};

// Add a new exercise
const handleAddExercise = (exerciseId: string, name: string) => {
  addExercise(exerciseId, name);
};

// Validate before submission
const handleSubmit = () => {
  const validation = validateForm();
  if (validation.isValid) {
    submitWorkout(formState);
  } else {
    showValidationErrors(validation.errors);
  }
};
```
```

---

#### PUBLIC API: `useWorkoutHistory()`

**File:** `/src/features/workout/hooks/useWorkoutHistory.ts`

**Full Function Signature:**
```typescript
export function useWorkoutHistory(
  profileId: string,
  filters: HistoryFilters =
```

**Extended Description:**
Hook for enhanced workout history with advanced filtering and search capabilities. Provides comprehensive workout history management with sophisticated filtering, text search, and statistical analysis. Essential for large workout databases where users need to find specific workouts quickly and analyze their patterns.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`filters`** (`HistoryFilters`): No description provided

**OUTPUT VALUE:**
- **Type:** `UseWorkoutHistoryResult`
- **Description:** Object with filtered history, search functions, and statistics

**Usage Examples:**

```typescript
```typescript
const { 
  history, 
  searchHistory, 
  filterByDateRange,
  historyStats 
} = useWorkoutHistory(profileId, {
  dateRange: { from: startDate, to: endDate },
  minRating: 4
});

// Search through history
const searchResults = searchHistory('bench press');

return (
  <Box>
    <Typography>Total Workouts: {historyStats.totalWorkouts}</Typography>
    {history.map(workout => (
      <WorkoutCard key={workout.id} summary={workout} />
    ))}
  </Box>
);
```
```

---

#### PUBLIC API: `useWorkoutInitializationData()`

**File:** `/src/features/workout/hooks/useWorkoutInitializationData.ts`

**Full Function Signature:**
```typescript
export function useWorkoutInitializationData(
  planId: string,
  sessionId: string,
  profileId: string
): WorkoutInitializationData
```

**Extended Description:**
Aggregate React Query hook that prepares all data needed before starting a workout. This hook combines multiple data sources to provide a complete picture of what the workout should look like and how the user performed the last time they did this session. It's essential for workout initialization as it provides the context needed to create a historically-aware workout log. The hook waits for both the current session details and last performance data to be available before marking itself as ready, ensuring all necessary context is loaded before workout creation.

**INPUT PARAMETERS:**

- **`planId`** (`string`): No description provided
- **`sessionId`** (`string`): No description provided
- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `WorkoutInitializationData`
- **Description:** Object containing current session, last performance, loading state, and readiness indicator

---

#### PUBLIC API: `useWorkoutProgress()`

**File:** `/src/features/workout/hooks/useWorkoutProgress.ts`

**Full Function Signature:**
```typescript
export function useWorkoutProgress(workoutId: string): WorkoutProgressData
```

**Extended Description:**
Hook for tracking real-time workout completion progress during an active session. Provides live progress calculation for ongoing workouts including exercise completion, set completion, and overall progress percentage for UI progress bars and motivation. Monitors active workout state reactively for immediate UI updates.

**INPUT PARAMETERS:**

- **`workoutId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `WorkoutProgressData`
- **Description:** Object with detailed progress metrics for UI display

**Usage Examples:**

```typescript
```typescript
const progress = useWorkoutProgress(activeWorkoutId);

return (
  <Box>
    <LinearProgress 
      variant="determinate" 
      value={progress.progressPercentage} 
    />
    <Typography>
      {progress.completedExercises}/{progress.totalExercises} exercises
    </Typography>
    <Typography>
      {progress.completedSets}/{progress.totalSets} sets
    </Typography>
  </Box>
);
```
```

---

#### PUBLIC API: `useWorkoutSession()`

**File:** `/src/features/workout/hooks/useWorkoutSession.ts`

**Full Function Signature:**
```typescript
export function useWorkoutSession(profileId: string)
```

**Extended Description:**
Comprehensive workout session management aggregate hook. This hook provides a unified interface for: - Active workout session management (start, end, pause, resume) - Workout logging and history - Progress tracking and metrics - Quick actions and shortcuts Consolidates 15+ workout-related hooks into a single, cohesive API while maintaining reactive data updates through WatermelonDB.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `{ activeWorkout: WorkoutLogModel[] | null; isActiveWorkout: boolean; workoutTimer: { elapsedSeconds: number; formattedTime: string; isRunning: boolean; } | null; workoutHistory: WorkoutLogModel[][]; recentWorkouts: WorkoutLogModel[][]; getWorkout: (workoutLogId: string) => WorkoutLogModel[] | null; isLoadingActive: boolean; isLoadingHistory: boolean; start: UseMutationResult<WorkoutLogModel, Error, { sessionId?: string | undefined; trainingPlanId?: string | undefined; exercises?: string[] | undefined; }, unknown>; end: UseMutationResult<WorkoutLogModel, Error, string, unknown>; pause: UseMutationResult<never, Error, string, unknown>; resume: UseMutationResult<never, Error, string, unknown>; delete: UseMutationResult<void, Error, string, unknown>; updateMetadata: UseMutationResult<WorkoutLogModel, Error, { workoutLogId: string; notes?: string | undefined; rating?: number | undefined; }, unknown>; quickActions: { startLastWorkout: () => Promise<WorkoutLogModel>; repeatWorkout: (workoutLogId: string) => Promise<WorkoutLogModel>; }; stats: { totalWorkouts: number; thisWeekWorkouts: number; averageDuration: number; streak: number; }; isStarting: boolean; isEnding: boolean; isPausing: boolean; isResuming: boolean; isDeleting: boolean; isUpdatingMetadata: boolean; startError: Error | null; endError: Error | null; pauseError: Error | null; resumeError: Error | null; deleteError: Error | null; updateError: Error | null; }`
- **Description:** Comprehensive workout session management interface

**AGGREGATE HOOK SUB-METHODS:**

- **`useWorkoutSession().averageDuration`** - Sub-method of the aggregate hook
- **`useWorkoutSession().streak`** - Sub-method of the aggregate hook

---

#### PUBLIC API: `useWorkoutTimer()`

**File:** `/src/features/workout/hooks/useWorkoutTimer.ts`

**Full Function Signature:**
```typescript
export function useWorkoutTimer(): UseWorkoutTimerResult
```

**Extended Description:**
Hook for tracking overall workout duration with start/pause/reset functionality. Provides real-time elapsed time tracking for workout sessions, formatted for UI display. Uses browser timer APIs for accurate time tracking with pause/resume capability. Essential for workout session management and user motivation through duration display.

**INPUT PARAMETERS:** None

**OUTPUT VALUE:**
- **Type:** `UseWorkoutTimerResult`
- **Description:** Object with timer controls and formatted time display

**Usage Examples:**

```typescript
```typescript
const { elapsedTime, formattedTime, isRunning, start, pause, reset } = useWorkoutTimer();

// Start timing when workout begins
const handleStartWorkout = () => {
  start();
};

// Display formatted time in UI
return (
  <Box>
    <Typography variant="h4">{formattedTime}</Typography>
    <Button onClick={isRunning ? pause : start}>
      {isRunning ? 'Pause' : 'Start'}
    </Button>
  </Box>
);
```
```

---

### Query Services

#### WorkoutQueryService

**File:** `/src/features/workout/query-services/WorkoutQueryService.ts`

**Description:**
Query service that acts as an adapter between the Application Layer and React Query. This service handles the unwrapping of Result objects returned by the WorkoutService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all workout-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

**Constructor:**

##### Constructor

```typescript
/**
 * @param {WorkoutService} workoutService - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('WorkoutService') private readonly workoutService: WorkoutService,
    @inject('BlueprintFitnessDB') private readonly database: BlueprintFitnessDB
  )
```

**Public Methods:**

##### PUBLIC API: `WorkoutQueryService.startWorkoutFromPlan()`

**Full Method Signature:**
```typescript
async startWorkoutFromPlan(
    profileId: string,
    sessionId: string,
    trainingPlanId?: string,
    trainingPlanName?: string
  ): Promise<WorkoutLogModel>
```

**Extended Description:**
Starts a new workout from a planned session.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`sessionId`** (`string`): No description provided
- **`trainingPlanId`** (`string | undefined`): No description provided
- **`trainingPlanName`** (`string | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WorkoutLogModel>`
- **Description:** Promise resolving to the created WorkoutLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.getWorkoutLog()`

**Full Method Signature:**
```typescript
async getWorkoutLog(workoutLogId: string): Promise<WorkoutLogModel>
```

**Extended Description:**
Retrieves a workout log by its unique identifier.

**INPUT PARAMETERS:**

- **`workoutLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WorkoutLogModel>`
- **Description:** Promise resolving to the WorkoutLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.getWorkoutLogQuery()`

**Full Method Signature:**
```typescript
getWorkoutLogQuery(workoutLogId: string): Query<WorkoutLog>
```

**Extended Description:**
Gets a WatermelonDB query for a specific workout log by ID.

**INPUT PARAMETERS:**

- **`workoutLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<WorkoutLog>`
- **Description:** Query for WorkoutLog model for reactive observation

##### PUBLIC API: `WorkoutQueryService.getWorkoutLogs()`

**Full Method Signature:**
```typescript
getWorkoutLogs(
    profileId: string,
    filters?:
```

**Extended Description:**
Retrieves all workout logs for a profile with optional filtering.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`filters`** (`{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<WorkoutLog>`
- **Description:** Query for WorkoutLog models for reactive observation

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.getWorkoutHistory()`

**Full Method Signature:**
```typescript
async getWorkoutHistory(
    profileId: string,
    limit: number,
    offset: number,
    filters?:
```

**Extended Description:**
Retrieves paginated workout history for a profile. Note: This method remains async as it returns complex pagination metadata needed by UI components. For reactive data, use getWorkoutLogs() instead.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`limit`** (`number`): No description provided
- **`offset`** (`number`): No description provided
- **`filters`** (`{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<{ logs: WorkoutLogModel[]; hasMore: boolean; total: number; }>`
- **Description:** Promise resolving to paginated workout history

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.getLastWorkoutForSession()`

**Full Method Signature:**
```typescript
async getLastWorkoutForSession(
    profileId: string,
    sessionId: string
  ): Promise<WorkoutLogModel | undefined>
```

**Extended Description:**
Finds the last workout log for a specific session.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`sessionId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WorkoutLogModel | undefined>`
- **Description:** Promise resolving to the WorkoutLogModel or undefined if not found

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.getLastWorkoutForSessionQuery()`

**Full Method Signature:**
```typescript
getLastWorkoutForSessionQuery(profileId: string, sessionId: string): Query<WorkoutLog>
```

**Extended Description:**
Gets a WatermelonDB query for the last workout of a specific session.

**INPUT PARAMETERS:**

- **`profileId`** (`string`): No description provided
- **`sessionId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `default<WorkoutLog>`
- **Description:** Query for WorkoutLog models for reactive observation

##### PUBLIC API: `WorkoutQueryService.endWorkout()`

**Full Method Signature:**
```typescript
async endWorkout(workoutLogId: string): Promise<WorkoutLogModel>
```

**Extended Description:**
Ends a workout by marking it as completed and calculating final metrics.

**INPUT PARAMETERS:**

- **`workoutLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WorkoutLogModel>`
- **Description:** Promise resolving to the updated WorkoutLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.updateWorkoutMetadata()`

**Full Method Signature:**
```typescript
async updateWorkoutMetadata(
    workoutLogId: string,
    metadata:
```

**Extended Description:**
Updates workout metadata such as notes and user rating.

**INPUT PARAMETERS:**

- **`workoutLogId`** (`string`): No description provided
- **`metadata`** (`{ notes?: string | undefined; userRating?: number | undefined; }`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<WorkoutLogModel>`
- **Description:** Promise resolving to the updated WorkoutLogModel

**EXCEPTIONS:**
- When the operation fails

##### PUBLIC API: `WorkoutQueryService.deleteWorkout()`

**Full Method Signature:**
```typescript
async deleteWorkout(workoutLogId: string): Promise<void>
```

**Extended Description:**
Deletes a workout log permanently.

**INPUT PARAMETERS:**

- **`workoutLogId`** (`string`): No description provided

**OUTPUT VALUE:**
- **Type:** `Promise<void>`
- **Description:** Promise resolving when deletion is complete

**EXCEPTIONS:**
- When the operation fails

---

