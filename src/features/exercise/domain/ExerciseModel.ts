import { produce } from 'immer';

import { BaseModel, ExerciseSubstitution } from '@/shared/domain';
import {
  type Equipment,
  type ExerciseCategory,
  type ExerciseData,
  type ExerciseMovementPattern,
  type ExerciseMovementType,
  exerciseSchema,
  type ExerciseSubstitutionData,
  type MuscleGroup,
} from '@/shared/types';

/**
 * A domain model representing an exercise with its details, equipment requirements,
 * muscle activation patterns, and substitution options.
 */
export class ExerciseModel extends BaseModel<ExerciseData> {
  public readonly profileId: string;
  public readonly name: string;
  public readonly description: string;
  public readonly category: ExerciseData['category'];
  public readonly movementType: ExerciseData['movementType'];
  public readonly movementPattern?: ExerciseData['movementPattern'];
  public readonly difficulty: ExerciseData['difficulty'];
  public readonly equipment: ExerciseData['equipment'];
  public readonly muscleActivation: ExerciseData['muscleActivation'];
  public readonly counterType: ExerciseData['counterType'];
  public readonly jointType: ExerciseData['jointType'];
  public readonly notes?: string;
  public readonly substitutions: ExerciseSubstitution[];

  protected constructor(props: ExerciseData) {
    super(props);
    this.profileId = props.profileId;
    this.name = props.name;
    this.description = props.description;
    this.category = props.category;
    this.movementType = props.movementType;
    this.movementPattern = props.movementPattern;
    this.difficulty = props.difficulty;
    this.equipment = props.equipment;
    this.muscleActivation = props.muscleActivation;
    this.counterType = props.counterType;
    this.jointType = props.jointType;
    this.notes = props.notes;
    this.substitutions = props.substitutions.map((s) => new ExerciseSubstitution(s));
  }

  /**
   * Creates a new ExerciseModel instance from plain data.
   * @param props The exercise data to hydrate from
   * @returns A new ExerciseModel instance
   */
  public static hydrate(props: ExerciseData): ExerciseModel {
    return new ExerciseModel(props);
  }

  /**
   * Private helper method to create updated instances with common logic.
   * @param updates Partial updates to apply
   * @returns A new ExerciseModel instance with the updates
   */
  private createUpdatedInstance(updates: Partial<ExerciseData>): ExerciseModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return ExerciseModel.hydrate(newData);
  }

  /**
   * Creates a new exercise instance with updated details.
   * @param details The details to update
   * @returns A new ExerciseModel instance with updated details
   */
  cloneWithUpdatedDetails(
    details: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): ExerciseModel {
    return this.createUpdatedInstance(details);
  }

  /**
   * Gets muscle groups that are primarily activated by this exercise.
   * @param threshold The activation threshold (default: 0.75)
   * @returns Array of primary muscle groups
   */
  getPrimaryMuscleGroups(threshold = 0.75): MuscleGroup[] {
    return this.getActivatedMuscles(threshold);
  }

  /**
   * Gets muscle groups activated above the specified threshold.
   * @param threshold The activation threshold (default: 0.5)
   * @returns Array of activated muscle groups
   */
  getActivatedMuscles(threshold = 0.5): MuscleGroup[] {
    return (Object.entries(this.muscleActivation) as [MuscleGroup, number][])
      .filter(([, activation]) => activation >= threshold)
      .map(([muscle]) => muscle);
  }

  /**
   * Gets the equipment required for this exercise.
   * @returns Array of required equipment
   */
  getEquipment(): Equipment[] {
    return this.equipment;
  }

  /**
   * Gets the movement type of this exercise.
   * @returns The exercise movement type
   */
  getMovementType(): ExerciseMovementType {
    return this.movementType;
  }

  /**
   * Gets the category of this exercise.
   * @returns The exercise category
   */
  getCategory(): ExerciseCategory {
    return this.category;
  }

  /**
   * Gets the movement pattern of this exercise.
   * @returns The exercise movement pattern, or undefined if not set
   */
  getMovementPattern(): ExerciseMovementPattern | undefined {
    return this.movementPattern;
  }

  /**
   * Gets the description of this exercise.
   * @returns The exercise description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Checks if this exercise uses only bodyweight.
   * @returns True if the exercise only requires bodyweight
   */
  isBodyweight(): boolean {
    return this.equipment.length === 1 && this.equipment[0] === 'bodyweight';
  }

  /**
   * Checks if this exercise requires specific equipment.
   * @param equipment The equipment to check for
   * @returns True if the exercise requires the specified equipment
   */
  requiresEquipment(equipment: Equipment): boolean {
    return this.equipment.includes(equipment);
  }

  /**
   * Creates a new exercise instance with an added substitution.
   * @param exerciseId The ID of the substitute exercise
   * @param priority The priority of the substitution (1-5)
   * @param reason Optional reason for the substitution
   * @returns A new ExerciseModel instance with the added substitution
   */
  cloneWithAddedSubstitution(exerciseId: string, priority: number, reason?: string): ExerciseModel {
    const newSub = new ExerciseSubstitution({ exerciseId, priority, reason });
    const newSubs = [...this.substitutions.filter((s) => s.exerciseId !== exerciseId), newSub];
    return this.createUpdatedInstance({ substitutions: newSubs.map((s) => s.toPlainObject()) });
  }

  /**
   * Creates a new exercise instance with a removed substitution.
   * @param exerciseId The ID of the substitute exercise to remove
   * @returns A new ExerciseModel instance with the substitution removed
   */
  cloneWithRemovedSubstitution(exerciseId: string): ExerciseModel {
    const newSubs = this.substitutions.filter((s) => s.exerciseId !== exerciseId);
    return this.createUpdatedInstance({ substitutions: newSubs.map((s) => s.toPlainObject()) });
  }

  /**
   * Creates a new exercise instance with an updated substitution.
   * @param updatedSub The updated substitution data
   * @returns A new ExerciseModel instance with the updated substitution
   */
  cloneWithUpdatedSubstitution(updatedSub: ExerciseSubstitutionData): ExerciseModel {
    const newSub = new ExerciseSubstitution(updatedSub);
    const newSubs = this.substitutions.map((s) =>
      s.exerciseId === updatedSub.exerciseId ? newSub : s
    );
    return this.createUpdatedInstance({ substitutions: newSubs.map((s) => s.toPlainObject()) });
  }

  /**
   * Gets substitutions sorted by priority (highest first).
   * @returns Array of substitutions sorted by priority
   */
  getSortedSubstitutions(): ExerciseSubstitution[] {
    return [...this.substitutions].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Gets the highest priority substitution for this exercise.
   * @returns The best substitution, or undefined if none exist
   */
  getBestSubstitution(): ExerciseSubstitution | undefined {
    return this.getSortedSubstitutions()[0];
  }

  /**
   * Calculates a similarity score between this exercise and another.
   * @param otherExercise The other exercise to compare with
   * @returns A similarity score between 0 and 1
   */
  getSimilarityScore(otherExercise: ExerciseModel): number {
    // Calculate muscle activation overlap
    const muscleOverlap = this.getActivatedMuscles().filter((m) =>
      otherExercise.getActivatedMuscles().includes(m)
    ).length;
    const totalMuscles = new Set([
      ...this.getActivatedMuscles(),
      ...otherExercise.getActivatedMuscles(),
    ]).size;
    const muscleScore = totalMuscles > 0 ? muscleOverlap / totalMuscles : 0;

    // Check movement pattern similarity
    const patternScore = this.movementPattern === otherExercise.movementPattern ? 1 : 0;

    // Weighted combination
    return muscleScore * 0.7 + patternScore * 0.3;
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this ExerciseModel
   */
  clone(): this {
    return produce(this, () => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain ExerciseData object
   */
  toPlainObject(): ExerciseData {
    const {
      profileId,
      name,
      description,
      category,
      movementType,
      movementPattern,
      difficulty,
      equipment,
      muscleActivation,
      counterType,
      jointType,
      notes,
      id,
      createdAt,
      updatedAt,
    } = this;
    return {
      id,
      profileId,
      name,
      description,
      category,
      movementType,
      movementPattern,
      difficulty,
      equipment,
      muscleActivation,
      counterType,
      jointType,
      notes,
      createdAt,
      updatedAt,
      substitutions: this.substitutions.map((s) => s.toPlainObject()),
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return exerciseSchema.safeParse(this.toPlainObject());
  }
}
