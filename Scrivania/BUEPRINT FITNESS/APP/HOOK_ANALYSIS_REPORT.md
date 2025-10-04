# Hook Performance Analysis Report

Generated: 2025-10-01T14:23:30.331Z

Total hooks analyzed: 29

## 🔴 CRITICAL ISSUES

### useAdvancedSetExecution

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useAdvancedSetExecution.ts`
**Complexity:** CRITICAL (Score: 556)

- **[CRITICAL]** Line 129: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[CRITICAL]** Line 155: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[CRITICAL]** Line 187: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[MEDIUM]** Line 199: Potentially missing dependencies: useAdvancedSetExecutionStore, getState, abortSession
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 247: Potentially missing dependencies: minute, getSuggestedRestPeriod
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 264: Potentially missing dependencies: sessionData, completedSets
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useRestPauseExecution

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useRestPauseExecution.ts`
**Complexity:** CRITICAL (Score: 436)

- **[MEDIUM]** Line 20: useMemo with complex object/array dependency may cause unnecessary recalculations
  - *Suggestion:* Use primitive values or stable references in dependency array
- **[MEDIUM]** Line 28: useMemo with complex object/array dependency may cause unnecessary recalculations
  - *Suggestion:* Use primitive values or stable references in dependency array
- **[MEDIUM]** Line 15: Potentially missing dependencies: baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 20: Potentially missing dependencies: baseExecution, restTimer, isActive
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 42: Potentially missing dependencies: max, baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 44: Potentially missing dependencies: maxMiniSets
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 46: Potentially missing dependencies: max
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 53: Potentially missing dependencies: restPauseSeconds
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 55: Potentially missing dependencies: mainSetReps
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 56: Potentially missing dependencies: miniSetReps
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 61: Potentially missing dependencies: rpe
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 68: Potentially missing dependencies: baseExecution, completedSets, length
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useAdvancedSetProgress

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useAdvancedSetProgress.ts`
**Complexity:** CRITICAL (Score: 360)

- **[CRITICAL]** Line 44: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[CRITICAL]** Line 168: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[MEDIUM]** Line 20: Potentially missing dependencies: session, getSession, getCurrentSession
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useMavSetExecution

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useMavSetExecution.ts`
**Complexity:** CRITICAL (Score: 358)

- **[MEDIUM]** Line 14: Potentially missing dependencies: baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 18: Potentially missing dependencies: sets
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 23: Potentially missing dependencies: max
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 29: Potentially missing dependencies: baseExecution, completedSets, length
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 50: Potentially missing dependencies: repsPerSet
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 54: Potentially missing dependencies: targetRpe
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 59: Potentially missing dependencies: restBetweenSetsSeconds
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 63: Potentially missing dependencies: sets, repsPerSet
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 73: Potentially missing dependencies: max
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 156: Potentially missing dependencies: completed, remaining, percentage
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 207: Potentially missing dependencies: number, round
  - *Suggestion:* Add missing dependencies to avoid stale closures

### usePyramidalSetExecution

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/usePyramidalSetExecution.ts`
**Complexity:** CRITICAL (Score: 299)

- **[MEDIUM]** Line 11: Potentially missing dependencies: repsAtEachStep, length
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 14: Potentially missing dependencies: floor, repsAtEachStep, length
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 25: Potentially missing dependencies: baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 43: Potentially missing dependencies: baseExecution, isCompleted
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 53: Potentially missing dependencies: max
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 103: Potentially missing dependencies: startWeight
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 106: Potentially missing dependencies: stepWeightIncrease
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 155: Potentially missing dependencies: number, round
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useMyoRepsExecution

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useMyoRepsExecution.ts`
**Complexity:** CRITICAL (Score: 298)

- **[MEDIUM]** Line 27: useMemo with complex object/array dependency may cause unnecessary recalculations
  - *Suggestion:* Use primitive values or stable references in dependency array
- **[MEDIUM]** Line 15: Potentially missing dependencies: baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 19: Potentially missing dependencies: baseExecution, currentPhase, isCompleted
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 27: Potentially missing dependencies: baseExecution, restTimer, isActive
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 35: Potentially missing dependencies: max, baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 40: Potentially missing dependencies: miniSets, min
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 41: Potentially missing dependencies: max
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 49: Potentially missing dependencies: activationCounts, min
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 51: Potentially missing dependencies: rpe, min
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 52: Potentially missing dependencies: miniSetCounts, min
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useWorkoutBackup

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useWorkoutBackup.ts`
**Complexity:** CRITICAL (Score: 295)

- **[CRITICAL]** Line 194: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[CRITICAL]** Line 222: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect

### usePerformanceMonitor

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/hooks/usePerformanceMonitor.ts`
**Complexity:** CRITICAL (Score: 295)

- **[CRITICAL]** Line 24: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[CRITICAL]** Line 76: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[MEDIUM]** Line 85: Potentially missing dependencies: errorsRef, current
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useCachedExerciseData

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/exercise/hooks/useCachedExerciseData.ts`
**Complexity:** CRITICAL (Score: 262)

- **[CRITICAL]** Line 30: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[MEDIUM]** Line 52: Potentially missing dependencies: floor, now, lastUpdated
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 77: Potentially missing dependencies: data
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useUserData

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/profile/hooks/useUserData.ts`
**Complexity:** CRITICAL (Score: 220)

- **[CRITICAL]** Line 13: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[MEDIUM]** Line 141: Potentially missing dependencies: mutate
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useWorkoutFormState

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useWorkoutFormState.ts`
**Complexity:** CRITICAL (Score: 206)

- **[MEDIUM]** Line 58: Potentially missing dependencies: stringify
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 347: Potentially missing dependencies: newInitialState, createInitialState, setFormState
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[HIGH]** Line 44: Nested useMemo detected - indicates overly complex hook
  - *Suggestion:* Consider splitting into multiple hooks or extracting to a service

### useDropSetExecution

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useDropSetExecution.ts`
**Complexity:** CRITICAL (Score: 196)

- **[MEDIUM]** Line 15: Potentially missing dependencies: baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 19: Potentially missing dependencies: baseExecution, currentPhase, isCompleted
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 27: Potentially missing dependencies: max, baseExecution, currentPhase
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 33: Potentially missing dependencies: drops, min
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 36: Potentially missing dependencies: baseExecution, currentSetData, weight
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 38: Potentially missing dependencies: baseExecution, nextSetData, weight
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useWorkoutTimer

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useWorkoutTimer.ts`
**Complexity:** CRITICAL (Score: 173)

- **[CRITICAL]** Line 55: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect
- **[MEDIUM]** Line 42: Potentially missing dependencies: setIsRunning, intervalRef, current
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useRestTimer

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useRestTimer.ts`
**Complexity:** CRITICAL (Score: 169)

- **[CRITICAL]** Line 118: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect

## 🟠 HIGH PRIORITY ISSUES

### useWorkoutSession

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useWorkoutSession.ts`
**Complexity:** HIGH (Score: 141)

- **[MEDIUM]** Line 15: Potentially missing dependencies: filter, workout, endTime
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useAnalyticsHub

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/analysis/hooks/useAnalyticsHub.ts`
**Complexity:** HIGH (Score: 136)

- **[MEDIUM]** Line 175: Potentially missing dependencies: refetch
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 212: Potentially missing dependencies: analysis
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useExerciseWizard

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/exercise/hooks/useExerciseWizard.ts`
**Complexity:** HIGH (Score: 135)

- **[MEDIUM]** Line 138: Potentially missing dependencies: setCurrentStep, prev
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 145: Potentially missing dependencies: setCurrentStep, prev
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useBodyMetricsTracking

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/body-metrics/hooks/useBodyMetricsTracking.ts`
**Complexity:** HIGH (Score: 133)

- **[HIGH]** Line 8: Hook calls useObserveQuery 3 times, risking re-render cascade
  - *Suggestion:* Consider combining queries or using a single query with joins

### useOptimizedQuery

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/hooks/useOptimizedQuery.ts`
**Complexity:** HIGH (Score: 132)

- **[MEDIUM]** Line 132: Potentially missing dependencies: query, isSuccess
  - *Suggestion:* Add missing dependencies to avoid stale closures
- **[MEDIUM]** Line 143: Potentially missing dependencies: cacheHits, totalRequests
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useProfileOperations

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/profile/hooks/useProfileOperations.ts`
**Complexity:** HIGH (Score: 121)

- **[HIGH]** Line 2: Nested useMemo detected - indicates overly complex hook
  - *Suggestion:* Consider splitting into multiple hooks or extracting to a service

### useDataSyncManager

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/data-sync/hooks/useDataSyncManager.ts`
**Complexity:** HIGH (Score: 118)

- **[MEDIUM]** Line 271: Potentially missing dependencies: refetch
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useGlobalPerformanceMetrics

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/hooks/usePerformanceMonitor.ts`
**Complexity:** HIGH (Score: 117)

- **[CRITICAL]** Line 7: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect

### useDebouncedValue

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/hooks/useDebouncedValue.ts`
**Complexity:** HIGH (Score: 116)

- **[CRITICAL]** Line 6: useEffect without dependency array - will run on every render
  - *Suggestion:* Add dependency array as second argument to useEffect

### useExerciseSearch

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/exercise/hooks/useExerciseSearch.ts`
**Complexity:** HIGH (Score: 114)

- **[MEDIUM]** Line 150: Potentially missing dependencies: setSearchQuery, setFilters
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useDataIntegrityChecker

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/data-sync/hooks/useDataIntegrityChecker.ts`
**Complexity:** HIGH (Score: 97)

- **[MEDIUM]** Line 212: Potentially missing dependencies: clearTimeout, setScheduledCheckId
  - *Suggestion:* Add missing dependencies to avoid stale closures

### useObserveQuery

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/hooks/useObserveQuery.ts`
**Complexity:** HIGH (Score: 97)

- **[HIGH]** Line 1: Hook calls useObserveQuery 3 times, risking re-render cascade
  - *Suggestion:* Consider combining queries or using a single query with joins

### useExercisePerformanceOverview

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/exercise/hooks/useExercisePerformanceOverview.ts`
**Complexity:** HIGH (Score: 96)

- **[HIGH]** Line 9: Hook calls useObserveQuery 3 times, risking re-render cascade
  - *Suggestion:* Consider combining queries or using a single query with joins

### useExerciseCRUD

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/exercise/hooks/useExerciseCRUD.ts`
**Complexity:** HIGH (Score: 83)

- **[MEDIUM]** Line 107: Potentially missing dependencies: exercises
  - *Suggestion:* Add missing dependencies to avoid stale closures

## 🟡 MEDIUM PRIORITY ISSUES

### useInfiniteWorkoutHistory

**File:** `/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/hooks/useInfiniteWorkoutHistory.ts`
**Complexity:** MEDIUM (Score: 59)

- **[MEDIUM]** Line 89: Potentially missing dependencies: infiniteQuery, isFetchingNextPage, fetchNextPage
  - *Suggestion:* Add missing dependencies to avoid stale closures


## Summary

- Critical: 14
- High: 14
- Medium: 1

