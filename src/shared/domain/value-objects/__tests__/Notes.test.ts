import { describe, expect, it } from 'vitest';

import { BusinessRuleError } from '@/shared/errors';

import { Notes } from '../Notes';

describe('Notes', () => {
  describe('constructor', () => {
    it('should create Notes with empty string', () => {
      // Arrange & Act
      const notes = new Notes('');

      // Assert
      expect(notes.value).toBe('');
    });

    it('should create Notes with short text', () => {
      // Arrange & Act
      const notes = new Notes('Great workout today!');

      // Assert
      expect(notes.value).toBe('Great workout today!');
    });

    it('should create Notes with medium length text', () => {
      // Arrange & Act
      const noteText =
        'This workout was challenging but rewarding. I managed to increase my bench press by 5kg and felt really strong during the squat sets. Need to focus on my form for deadlifts next time.';
      const notes = new Notes(noteText);

      // Assert
      expect(notes.value).toBe(noteText);
    });

    it('should create Notes with text exactly at the character limit', () => {
      // Arrange
      const maxLengthText = 'a'.repeat(500);

      // Act
      const notes = new Notes(maxLengthText);

      // Assert
      expect(notes.value).toBe(maxLengthText);
      expect(notes.value.length).toBe(500);
    });

    it('should create Notes with special characters', () => {
      // Arrange & Act
      const specialText = 'Notes with émojis 💪, numbers 123, and symbols !@#$%^&*()';
      const notes = new Notes(specialText);

      // Assert
      expect(notes.value).toBe(specialText);
    });

    it('should create Notes with line breaks and whitespace', () => {
      // Arrange & Act
      const multilineText = 'First line\nSecond line\n\nThird line with    spaces';
      const notes = new Notes(multilineText);

      // Assert
      expect(notes.value).toBe(multilineText);
    });

    it('should create Notes with Unicode characters', () => {
      // Arrange & Act
      const unicodeText = 'Notes with unicode: 🏋️‍♀️ 💪 🔥 ✅ and accented letters: àáâãäåæçèéêë';
      const notes = new Notes(unicodeText);

      // Assert
      expect(notes.value).toBe(unicodeText);
    });

    it('should throw BusinessRuleError with correct i18n key when text exceeds maximum length', () => {
      // Arrange
      const tooLongText = 'a'.repeat(501);

      // Act & Assert
      expect(() => new Notes(tooLongText)).toThrow(BusinessRuleError);
      expect(() => new Notes(tooLongText)).toThrow('errors.domain.notes.maxLength');
    });

    it('should throw BusinessRuleError with correct i18n key when text is much longer than limit', () => {
      // Arrange
      const veryLongText = 'a'.repeat(1000);

      // Act & Assert
      expect(() => new Notes(veryLongText)).toThrow(BusinessRuleError);
      expect(() => new Notes(veryLongText)).toThrow('errors.domain.notes.maxLength');
    });

    it('should throw BusinessRuleError with correct i18n key for text with Unicode characters exceeding limit', () => {
      // Arrange
      // Unicode emoji count as multiple characters/bytes but as single characters in length
      const baseText = 'a'.repeat(490);
      const unicodeText = baseText + '🏋️‍♀️'.repeat(10); // This might exceed 500 characters depending on counting

      // If the total character count exceeds 500
      if (unicodeText.length > 500) {
        // Act & Assert
        expect(() => new Notes(unicodeText)).toThrow(BusinessRuleError);
        expect(() => new Notes(unicodeText)).toThrow('errors.domain.notes.maxLength');
      }
    });

    it('should freeze the instance after creation', () => {
      // Arrange & Act
      const notes = new Notes('Test notes');

      // Assert
      expect(Object.isFrozen(notes)).toBe(true);
    });

    it('should be immutable', () => {
      // Arrange
      const originalValue = 'Original notes';
      const notes = new Notes(originalValue);

      // Act & Assert - frozen object throws when trying to modify in strict mode
      expect(() => {
        (notes as any).value = 'Modified notes';
      }).toThrow();
      expect(notes.value).toBe(originalValue); // Value should remain unchanged
    });
  });

  describe('boundary testing', () => {
    it('should accept text at exactly 499 characters', () => {
      // Arrange
      const boundaryText = 'a'.repeat(499);

      // Act
      const notes = new Notes(boundaryText);

      // Assert
      expect(notes.value).toBe(boundaryText);
      expect(notes.value.length).toBe(499);
    });

    it('should accept text at exactly 500 characters', () => {
      // Arrange
      const boundaryText = 'a'.repeat(500);

      // Act
      const notes = new Notes(boundaryText);

      // Assert
      expect(notes.value).toBe(boundaryText);
      expect(notes.value.length).toBe(500);
    });

    it('should reject text at exactly 501 characters', () => {
      // Arrange
      const overLimitText = 'a'.repeat(501);

      // Act & Assert
      expect(() => new Notes(overLimitText)).toThrow(BusinessRuleError);
      expect(() => new Notes(overLimitText)).toThrow('errors.domain.notes.maxLength');
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only strings', () => {
      // Arrange & Act
      const whitespaceNotes = new Notes('   ');

      // Assert
      expect(whitespaceNotes.value).toBe('   ');
    });

    it('should handle strings with only newlines', () => {
      // Arrange & Act
      const newlineNotes = new Notes('\n\n\n');

      // Assert
      expect(newlineNotes.value).toBe('\n\n\n');
    });

    it('should handle mixed whitespace at character limit', () => {
      // Arrange
      const mixedWhitespace = `${' \t\n'.repeat(166)}ab`; // 166 * 3 + 2 = 500 chars

      // Act
      const notes = new Notes(mixedWhitespace);

      // Assert
      expect(notes.value).toBe(mixedWhitespace);
      expect(notes.value.length).toBe(500);
    });

    it('should handle realistic workout notes', () => {
      // Arrange
      const realisticNotes = `
Workout Summary:
- Bench Press: 3 sets x 8 reps at 80kg (RPE 8)
- Squats: 4 sets x 6 reps at 120kg (RPE 9)
- Deadlifts: 2 sets x 5 reps at 140kg (RPE 8.5)

Notes:
- Felt strong today, especially on bench press
- Squat form was good, depth consistent
- Need to work on deadlift lockout
- Recovery felt good between sets
- Next session: increase bench by 2.5kg

Weather: Sunny, 22°C
Duration: 90 minutes
Energy level: 8/10
`;

      // Act
      const notes = new Notes(realisticNotes);

      // Assert
      expect(notes.value).toBe(realisticNotes);
    });
  });
});
