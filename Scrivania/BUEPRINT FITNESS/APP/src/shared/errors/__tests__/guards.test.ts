import { describe, expect, it } from 'vitest';

import { ApplicationError } from '../ApplicationError';
import { ConflictError } from '../ConflictError';
import { isConflictError } from '../guards';

describe('Error Type Guards', () => {
  describe('isConflictError', () => {
    it('should return true for ConflictError instances', () => {
      // Arrange
      const conflictError = new ConflictError('errors.test.conflict');

      // Act
      const result = isConflictError(conflictError);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for ApplicationError instances that are not ConflictError', () => {
      // Arrange
      const applicationError = new ApplicationError('errors.test.application');

      // Act
      const result = isConflictError(applicationError);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for standard Error instances', () => {
      // Arrange
      const standardError = new Error('Standard error message');

      // Act
      const result = isConflictError(standardError);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for TypeError instances', () => {
      // Arrange
      const typeError = new TypeError('Type error message');

      // Act
      const result = isConflictError(typeError);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for ReferenceError instances', () => {
      // Arrange
      const referenceError = new ReferenceError('Reference error message');

      // Act
      const result = isConflictError(referenceError);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      // Arrange
      const nullValue = null;

      // Act
      const result = isConflictError(nullValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      // Arrange
      const undefinedValue = undefined;

      // Act
      const result = isConflictError(undefinedValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for string values', () => {
      // Arrange
      const stringValue = 'error string';

      // Act
      const result = isConflictError(stringValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for number values', () => {
      // Arrange
      const numberValue = 404;

      // Act
      const result = isConflictError(numberValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for boolean values', () => {
      // Arrange
      const booleanValue = true;

      // Act
      const result = isConflictError(booleanValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for plain objects', () => {
      // Arrange
      const plainObject = { message: 'Not an error', name: 'ConflictError' };

      // Act
      const result = isConflictError(plainObject);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for objects with ConflictError-like properties but wrong prototype', () => {
      // Arrange
      const mockError = {
        name: 'ConflictError',
        message: 'errors.test.conflict',
        constructor: { name: 'ConflictError' },
      };

      // Act
      const result = isConflictError(mockError);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for arrays', () => {
      // Arrange
      const arrayValue = ['error', 'array'];

      // Act
      const result = isConflictError(arrayValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for functions', () => {
      // Arrange
      const functionValue = () => new ConflictError('errors.test.conflict');

      // Act
      const result = isConflictError(functionValue);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle inherited ConflictError correctly', () => {
      // Arrange
      class ExtendedConflictError extends ConflictError {
        constructor(message: any) {
          super(message);
          this.name = 'ExtendedConflictError';
        }
      }
      const extendedError = new ExtendedConflictError('errors.test.extended');

      // Act
      const result = isConflictError(extendedError);

      // Assert
      expect(result).toBe(true);
    });

    it('should work correctly in try-catch scenarios', () => {
      // Arrange
      const throwConflictError = () => {
        throw new ConflictError('errors.test.thrown');
      };
      const throwStandardError = () => {
        throw new Error('Standard thrown error');
      };

      // Act & Assert
      try {
        throwConflictError();
      } catch (_error) {
        expect(isConflictError(_error)).toBe(true);
      }

      try {
        throwStandardError();
      } catch (_error) {
        expect(isConflictError(_error)).toBe(false);
      }
    });

    it('should provide correct type narrowing', () => {
      // Arrange
      const unknownError: unknown = new ConflictError('errors.test.narrowing');

      // Act & Assert
      if (isConflictError(unknownError)) {
        // TypeScript should narrow the type to ConflictError
        expect(unknownError.message).toBe('errors.test.narrowing');
        expect(unknownError.name).toBe('ConflictError');
        // This should compile without TypeScript errors
        expect(typeof unknownError.message).toBe('string');
      } else {
        // This should not be reached
        expect.fail('Type guard should have identified ConflictError');
      }
    });

    it('should handle multiple ConflictError instances correctly', () => {
      // Arrange
      const error1 = new ConflictError('errors.test.first');
      const error2 = new ConflictError('errors.test.second');
      const standardError = new Error('Standard error');

      // Act & Assert
      expect(isConflictError(error1)).toBe(true);
      expect(isConflictError(error2)).toBe(true);
      expect(isConflictError(standardError)).toBe(false);
    });

    it('should handle ConflictError with different message types', () => {
      // Arrange
      const conflictErrorWithString = new ConflictError('errors.validation.conflict' as any);

      // Act
      const result = isConflictError(conflictErrorWithString);

      // Assert
      expect(result).toBe(true);
    });

    describe('Edge Cases', () => {
      it('should return false for Symbol values', () => {
        // Arrange
        const symbolValue = Symbol('error');

        // Act
        const result = isConflictError(symbolValue);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for BigInt values', () => {
        // Arrange
        const bigintValue = BigInt(404);

        // Act
        const result = isConflictError(bigintValue);

        // Assert
        expect(result).toBe(false);
      });

      it('should handle prototype pollution attempts', () => {
        // Arrange
        const maliciousObject = Object.create(ConflictError.prototype);
        maliciousObject.name = 'ConflictError';
        maliciousObject.message = 'errors.test.malicious';

        // Act
        const result = isConflictError(maliciousObject);

        // Assert
        // Should return true because it's actually instanceof ConflictError
        // due to prototype chain manipulation
        expect(result).toBe(true);
      });

      it('should handle frozen objects', () => {
        // Arrange
        const frozenObject = Object.freeze({
          name: 'ConflictError',
          message: 'errors.test.frozen',
        });

        // Act
        const result = isConflictError(frozenObject);

        // Assert
        expect(result).toBe(false);
      });

      it('should handle sealed objects', () => {
        // Arrange
        const sealedObject = Object.seal({
          name: 'ConflictError',
          message: 'errors.test.sealed',
        });

        // Act
        const result = isConflictError(sealedObject);

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});
