/**
 * A centralized fixture of sample data for seeding new profiles and for use in tests.
 * Note: IDs are hardcoded for deterministic mapping. Timestamps and profileId are omitted
 * as they will be added dynamically during the seeding process.
 */
export const sampleDataFixture = {
  exercises: [
    {
      id: 'exercise-1',
      name: 'Barbell Bench Press',
      description: 'Classic horizontal pushing exercise targeting chest, triceps, and shoulders',
      category: 'strength',
      movementType: 'push',
      movementPattern: 'horizontalPush',
      difficulty: 'intermediate',
      equipment: ['barbell', 'bench', 'rack'],
      muscleActivation: { chest: 1, triceps: 0.7, shoulders: 0.5 },
      counterType: 'reps',
      jointType: 'compound',
    },
    {
      id: 'exercise-2',
      name: 'Barbell Squat',
      description:
        'Fundamental lower body compound exercise targeting quads, glutes, and hamstrings',
      category: 'strength',
      movementType: 'push',
      movementPattern: 'squat',
      difficulty: 'intermediate',
      equipment: ['barbell', 'rack'],
      muscleActivation: { quadriceps: 1, glutes: 0.8, hamstrings: 0.4 },
      counterType: 'reps',
      jointType: 'compound',
    },
    {
      id: 'exercise-3',
      name: 'Pull Up',
      description:
        'Vertical pulling exercise using bodyweight to target lats, upper back, and biceps',
      category: 'strength',
      movementType: 'pull',
      movementPattern: 'verticalPull',
      difficulty: 'intermediate',
      equipment: ['bodyweight'],
      muscleActivation: { lats: 1, upper_back: 0.8, biceps: 0.7 },
      counterType: 'reps',
      jointType: 'compound',
    },
    {
      id: 'exercise-4',
      name: 'Dumbbell Row',
      description: 'Horizontal pulling exercise to strengthen the back and biceps',
      category: 'strength',
      movementType: 'pull',
      movementPattern: 'horizontalPull',
      difficulty: 'beginner',
      equipment: ['dumbbell', 'bench'],
      muscleActivation: { lats: 0.8, upper_back: 1, biceps: 0.6 },
      counterType: 'reps',
      jointType: 'compound',
    },
  ],
  appliedExercises: [
    {
      id: 'applied-exercise-1',
      exerciseId: 'exercise-1',
      templateId: null,
      setConfiguration: {
        type: 'standard',
        sets: { min: 3, direction: 'asc' },
        counts: { min: 8, max: 12, direction: 'asc' },
        rpe: { min: 7, max: 8, direction: 'asc' },
      },
    },
    {
      id: 'applied-exercise-2',
      exerciseId: 'exercise-3',
      templateId: null,
      setConfiguration: {
        type: 'standard',
        sets: { min: 4, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      },
    },
    {
      id: 'applied-exercise-3',
      exerciseId: 'exercise-4',
      templateId: null,
      setConfiguration: {
        type: 'standard',
        sets: { min: 4, direction: 'asc' },
        counts: { min: 10, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      },
    },
    {
      id: 'applied-exercise-4',
      exerciseId: 'exercise-2',
      templateId: null,
      setConfiguration: {
        type: 'standard',
        sets: { min: 5, direction: 'asc' },
        counts: { min: 5, direction: 'asc' },
        rpe: { min: 7, max: 8, direction: 'asc' },
      },
    },
  ],
  groups: [
    {
      id: 'group-1',
      type: 'single',
      appliedExerciseIds: ['applied-exercise-1'],
    },
    {
      id: 'group-2',
      type: 'superset',
      appliedExerciseIds: ['applied-exercise-2', 'applied-exercise-3'],
      restTimeSeconds: 120,
      rounds: { min: 1, direction: 'asc' },
    },
    {
      id: 'group-3',
      type: 'single',
      appliedExerciseIds: ['applied-exercise-4'],
    },
  ],
  sessions: [
    {
      id: 'session-1',
      name: 'Push Day',
      groupIds: ['group-1'],
      isDeload: false,
      dayOfWeek: null,
    },
    {
      id: 'session-2',
      name: 'Pull Day (Superset)',
      groupIds: ['group-2'],
      isDeload: false,
      dayOfWeek: null,
    },
    {
      id: 'session-3',
      name: 'Leg Day',
      groupIds: ['group-3'],
      isDeload: false,
      dayOfWeek: null,
    },
  ],
  trainingPlan: {
    id: 'plan-1',
    name: 'Sample Push/Pull/Legs',
    description: 'A classic PPL split to get you started, featuring a superset.',
    sessionIds: ['session-1', 'session-2', 'session-3'],
  },
};
