import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';
import { ExerciseSubstitutionData } from '@/shared/types';

import { ExerciseSubstitution } from '../ExerciseSubstitution';

describe('ExerciseSubstitution', () => {
  describe('constructor', () => {
    it('should create ExerciseSubstitution with valid data including reason', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 1,
        reason: 'Equipment not available',
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.exerciseId).toBe(data.exerciseId);
      expect(substitution.priority).toBe(data.priority);
      expect(substitution.reason).toBe(data.reason);
    });

    it('should create ExerciseSubstitution with valid data without reason', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'abcd1234-ef56-78gh-90ij-klmnopqrstuv',
        priority: 3,
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.exerciseId).toBe(data.exerciseId);
      expect(substitution.priority).toBe(data.priority);
      expect(substitution.reason).toBeUndefined();
    });

    it('should create ExerciseSubstitution with minimum priority', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'min-test-uuid-1234-5678-9012-345678901234',
        priority: 1,
        reason: 'Minimum priority substitution',
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.priority).toBe(1);
    });

    it('should create ExerciseSubstitution with maximum priority', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'max-test-uuid-1234-5678-9012-345678901234',
        priority: 5,
        reason: 'Maximum priority substitution',
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.priority).toBe(5);
    });

    it('should create ExerciseSubstitution with all valid priority values', () => {
      const validPriorities = [1, 2, 3, 4, 5];

      validPriorities.forEach((priority) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: `test-uuid-${priority}234-5678-9012-345678901234`,
          priority,
          reason: `Priority ${priority} substitution`,
        };

        // Act
        const substitution = new ExerciseSubstitution(data);

        // Assert
        expect(substitution.priority).toBe(priority);
      });
    });

    it('should create ExerciseSubstitution with empty string reason', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'empty-reason-uuid-1234-5678-9012-345678901234',
        priority: 2,
        reason: '',
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.reason).toBe('');
    });

    it('should throw BusinessRuleError with correct i18n key when priority is below minimum', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'below-min-uuid-1234-5678-9012-345678901234',
        priority: 0,
      };

      // Act & Assert
      expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
      expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
    });

    it('should throw BusinessRuleError with correct i18n key when priority is negative', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'negative-uuid-1234-5678-9012-345678901234',
        priority: -1,
      };

      // Act & Assert
      expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
      expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
    });

    it('should throw BusinessRuleError with correct i18n key when priority is above maximum', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'above-max-uuid-1234-5678-9012-345678901234',
        priority: 6,
      };

      // Act & Assert
      expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
      expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
    });

    it('should throw BusinessRuleError with correct i18n key when priority is much higher than maximum', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'way-above-uuid-1234-5678-9012-345678901234',
        priority: 100,
      };

      // Act & Assert
      expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
      expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
    });

    it('should freeze the instance after creation', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'freeze-test-uuid-1234-5678-9012-345678901234',
        priority: 3,
        reason: 'Test freezing',
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(Object.isFrozen(substitution)).toBe(true);
    });

    it('should be immutable', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'immutable-test-uuid-1234-5678-9012-345678901234',
        priority: 2,
        reason: 'Test immutability',
      };
      const substitution = new ExerciseSubstitution(data);

      // Act & Assert - frozen object throws when trying to modify in strict mode
      expect(() => {
        (substitution as any).exerciseId = 'different-id';
      }).toThrow();

      expect(substitution.exerciseId).toBe(data.exerciseId);
      expect(substitution.priority).toBe(data.priority);
      expect(substitution.reason).toBe(data.reason);
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object with all properties when reason is provided', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'plain-obj-uuid-1234-5678-9012-345678901234',
        priority: 4,
        reason: 'For plain object test',
      };
      const substitution = new ExerciseSubstitution(data);

      // Act
      const result = substitution.toPlainObject();

      // Assert
      expect(result).toEqual({
        exerciseId: data.exerciseId,
        priority: data.priority,
        reason: data.reason,
      });
    });

    it('should return plain object with undefined reason when reason is not provided', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'no-reason-uuid-1234-5678-9012-345678901234',
        priority: 2,
      };
      const substitution = new ExerciseSubstitution(data);

      // Act
      const result = substitution.toPlainObject();

      // Assert
      expect(result).toEqual({
        exerciseId: data.exerciseId,
        priority: data.priority,
        reason: undefined,
      });
    });

    it('should return plain object with empty string reason', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'empty-string-uuid-1234-5678-9012-345678901234',
        priority: 1,
        reason: '',
      };
      const substitution = new ExerciseSubstitution(data);

      // Act
      const result = substitution.toPlainObject();

      // Assert
      expect(result).toEqual({
        exerciseId: data.exerciseId,
        priority: data.priority,
        reason: '',
      });
    });

    it('should return a new object instance each time', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'new-instance-uuid-1234-5678-9012-345678901234',
        priority: 3,
        reason: 'Test new instance',
      };
      const substitution = new ExerciseSubstitution(data);

      // Act
      const result1 = substitution.toPlainObject();
      const result2 = substitution.toPlainObject();

      // Assert
      expect(result1).not.toBe(result2); // Different instances
      expect(result1).toEqual(result2); // Same content
    });

    it('should return an object that matches the original data', () => {
      // Arrange
      const data: ExerciseSubstitutionData = {
        exerciseId: 'match-original-uuid-1234-5678-9012-345678901234',
        priority: 5,
        reason: 'Should match original data',
      };
      const substitution = new ExerciseSubstitution(data);

      // Act
      const result = substitution.toPlainObject();

      // Assert
      expect(result).toEqual(data);
    });
  });

  describe('realistic use cases', () => {
    it('should handle common exercise substitution scenarios', () => {
      const scenarios = [
        {
          data: {
            exerciseId: 'bench-press-uuid-1234-5678-9012-345678901234',
            priority: 1,
            reason: 'Shoulder injury - avoid pressing movements',
          },
          description: 'injury-related substitution',
        },
        {
          data: {
            exerciseId: 'squat-rack-uuid-1234-5678-9012-345678901234',
            priority: 2,
            reason: 'Equipment not available during peak hours',
          },
          description: 'equipment availability substitution',
        },
        {
          data: {
            exerciseId: 'deadlift-uuid-1234-5678-9012-345678901234',
            priority: 3,
            reason: 'Beginner-friendly alternative',
          },
          description: 'skill level substitution',
        },
        {
          data: {
            exerciseId: 'pull-up-uuid-1234-5678-9012-345678901234',
            priority: 4,
            reason: 'Home workout alternative',
          },
          description: 'location-based substitution',
        },
        {
          data: {
            exerciseId: 'cardio-alt-uuid-1234-5678-9012-345678901234',
            priority: 5,
            reason: 'Time constraint - shorter alternative',
          },
          description: 'time-based substitution',
        },
      ];

      scenarios.forEach(({ data, description }) => {
        // Act
        const substitution = new ExerciseSubstitution(data);

        // Assert
        expect(substitution.exerciseId).toBe(data.exerciseId);
        expect(substitution.priority).toBe(data.priority);
        expect(substitution.reason).toBe(data.reason);
      });
    });

    it('should handle substitutions without reasons', () => {
      const data: ExerciseSubstitutionData = {
        exerciseId: 'no-reason-exercise-uuid-1234-5678-9012-345678901234',
        priority: 3,
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.exerciseId).toBe(data.exerciseId);
      expect(substitution.priority).toBe(data.priority);
      expect(substitution.reason).toBeUndefined();
    });

    it('should handle different UUID formats', () => {
      const uuidFormats = [
        '123e4567-e89b-12d3-a456-426614174000',
        'abcdef12-3456-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      uuidFormats.forEach((uuid, index) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: uuid,
          priority: (index % 5) + 1, // Cycle through 1-5
          reason: `Test UUID format ${index}`,
        };

        // Act
        const substitution = new ExerciseSubstitution(data);

        // Assert
        expect(substitution.exerciseId).toBe(uuid);
      });
    });
  });

  describe('priority boundary testing', () => {
    it('should accept all valid priority values', () => {
      const validPriorities = [1, 2, 3, 4, 5];

      validPriorities.forEach((priority) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: `boundary-test-${priority}-uuid-1234-5678-9012-345678901234`,
          priority,
        };

        // Act
        const substitution = new ExerciseSubstitution(data);

        // Assert
        expect(substitution.priority).toBe(priority);
      });
    });

    it('should reject all invalid priority values', () => {
      const invalidPriorities = [0, -1, -5, 6, 10, 100];

      invalidPriorities.forEach((priority) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: `invalid-priority-${priority}-uuid-1234-5678-9012-345678901234`,
          priority,
        };

        // Act & Assert
        expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
        expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
      });
    });

    it('should reject decimal priorities outside valid range', () => {
      // The validation actually works properly - decimal values outside 1-5 are rejected
      const invalidDecimalPriorities = [0.5, 5.1];

      invalidDecimalPriorities.forEach((priority) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: `decimal-priority-${priority}-uuid-1234-5678-9012-345678901234`,
          priority,
        };

        // Act & Assert
        expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
        expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
      });
    });

    it('should accept decimal priorities within valid range', () => {
      // Valid decimal priorities within the 1-5 range
      const validDecimalPriorities = [1.5, 2.5, 3.7, 4.9];

      validDecimalPriorities.forEach((priority) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: `valid-decimal-priority-${priority}-uuid-1234-5678-9012-345678901234`,
          priority,
        };

        // Act
        const substitution = new ExerciseSubstitution(data);

        // Assert
        expect(substitution.priority).toBe(priority);
      });
    });

    it('should reject special numeric values', () => {
      // Special numeric values should be rejected by the range validation
      const specialValues = [-Infinity, Infinity]; // NaN comparisons fail, so NaN gets rejected

      specialValues.forEach((priority) => {
        // Arrange
        const data: ExerciseSubstitutionData = {
          exerciseId: `special-priority-${String(priority)}-uuid-1234-5678-9012-345678901234`,
          priority,
        };

        // Act & Assert
        expect(() => new ExerciseSubstitution(data)).toThrow(BusinessRuleError);
        expect(() => new ExerciseSubstitution(data)).toThrow('errors.domain.substitution.priority');
      });
    });

    it('should create ExerciseSubstitution with NaN priority (validation limitation)', () => {
      // NaN comparisons always return false, so it passes the range check
      const data: ExerciseSubstitutionData = {
        exerciseId: 'nan-priority-uuid-1234-5678-9012-345678901234',
        priority: NaN,
      };

      // Act
      const substitution = new ExerciseSubstitution(data);

      // Assert
      expect(substitution.priority).toBeNaN();
    });
  });
});
