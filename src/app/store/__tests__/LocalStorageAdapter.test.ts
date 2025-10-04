import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageAdapter } from '../LocalStorageAdapter';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock console.warn to verify error logging
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Define global localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    vi.clearAllMocks();
    consoleWarnSpy.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getItem', () => {
    it('should retrieve an item from localStorage successfully', () => {
      // Arrange
      const key = 'test-key';
      const value = 'test-value';
      localStorageMock.getItem.mockReturnValue(value);

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return null when localStorage returns null', () => {
      // Arrange
      const key = 'non-existent-key';
      localStorageMock.getItem.mockReturnValue(null);

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return null when localStorage returns undefined', () => {
      // Arrange
      const key = 'undefined-key';
      localStorageMock.getItem.mockReturnValue(undefined);

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBeUndefined();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle localStorage.getItem throwing an error', () => {
      // Arrange
      const key = 'error-key';
      const error = new Error('localStorage is full');
      localStorageMock.getItem.mockImplementation(() => {
        throw error;
      });

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to get item "${key}" from localStorage:`,
        error
      );
    });

    it('should handle DOMException when localStorage is disabled', () => {
      // Arrange
      const key = 'disabled-key';
      const domException = new DOMException('localStorage is disabled', 'SecurityError');
      localStorageMock.getItem.mockImplementation(() => {
        throw domException;
      });

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to get item "${key}" from localStorage:`,
        domException
      );
    });

    it('should work with empty string keys', () => {
      // Arrange
      const key = '';
      const value = 'empty-key-value';
      localStorageMock.getItem.mockReturnValue(value);

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it('should work with special character keys', () => {
      // Arrange
      const key = 'key-with-special-chars!@#$%^&*()';
      const value = 'special-value';
      localStorageMock.getItem.mockReturnValue(value);

      // Act
      const result = adapter.getItem(key);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });
  });

  describe('setItem', () => {
    it('should set an item in localStorage successfully', () => {
      // Arrange
      const key = 'test-key';
      const value = 'test-value';
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle localStorage.setItem throwing an error', () => {
      // Arrange
      const key = 'error-key';
      const value = 'error-value';
      const error = new Error('localStorage quota exceeded');
      localStorageMock.setItem.mockImplementation(() => {
        throw error;
      });

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to set item "${key}" in localStorage:`,
        error
      );
    });

    it('should handle QuotaExceededError when storage is full', () => {
      // Arrange
      const key = 'quota-key';
      const value = 'large-value';
      const quotaError = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to set item "${key}" in localStorage:`,
        quotaError
      );
    });

    it('should work with empty string values', () => {
      // Arrange
      const key = 'empty-value-key';
      const value = '';
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should work with JSON string values', () => {
      // Arrange
      const key = 'json-key';
      const value = JSON.stringify({ data: 'test', number: 123 });
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should work with very long string values', () => {
      // Arrange
      const key = 'long-value-key';
      const value = 'a'.repeat(10000);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should work with unicode characters', () => {
      // Arrange
      const key = 'unicode-key';
      const value = '🚀💪🏋️‍♂️ Fitness App 中文';
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      adapter.setItem(key, value);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove an item from localStorage successfully', () => {
      // Arrange
      const key = 'test-key';
      localStorageMock.removeItem.mockImplementation(() => {});

      // Act
      adapter.removeItem(key);

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle localStorage.removeItem throwing an error', () => {
      // Arrange
      const key = 'error-key';
      const error = new Error('Failed to remove item');
      localStorageMock.removeItem.mockImplementation(() => {
        throw error;
      });

      // Act
      adapter.removeItem(key);

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to remove item "${key}" from localStorage:`,
        error
      );
    });

    it('should handle removing non-existent keys gracefully', () => {
      // Arrange
      const key = 'non-existent-key';
      localStorageMock.removeItem.mockImplementation(() => {});

      // Act
      adapter.removeItem(key);

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should work with empty string keys', () => {
      // Arrange
      const key = '';
      localStorageMock.removeItem.mockImplementation(() => {});

      // Act
      adapter.removeItem(key);

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle SecurityError when localStorage access is denied', () => {
      // Arrange
      const key = 'security-key';
      const securityError = new DOMException('Access denied', 'SecurityError');
      localStorageMock.removeItem.mockImplementation(() => {
        throw securityError;
      });

      // Act
      adapter.removeItem(key);

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to remove item "${key}" from localStorage:`,
        securityError
      );
    });
  });

  describe('StateStorage interface compliance', () => {
    it('should implement the StateStorage interface correctly', () => {
      // Assert
      expect(typeof adapter.getItem).toBe('function');
      expect(typeof adapter.setItem).toBe('function');
      expect(typeof adapter.removeItem).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Arrange
      const key = 'test-key';
      const value = 'test-value';
      localStorageMock.getItem.mockReturnValue(value);
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {});

      // Act & Assert
      const getResult = adapter.getItem(key);
      expect(typeof getResult).toBe('string');

      const setResult = adapter.setItem(key, value);
      expect(setResult).toBeUndefined();

      const removeResult = adapter.removeItem(key);
      expect(removeResult).toBeUndefined();
    });
  });

  describe('Error handling and logging', () => {
    it('should log different types of errors appropriately', () => {
      // Arrange
      const key = 'error-test-key';
      const value = 'error-test-value';
      const customError = new Error('Custom error message');
      const domException = new DOMException('DOM Exception', 'TestError');
      const typeError = new TypeError('Type error');

      // Test getItem error logging
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw customError;
      });
      adapter.getItem(key);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to get item "${key}" from localStorage:`,
        customError
      );

      // Test setItem error logging
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw domException;
      });
      adapter.setItem(key, value);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to set item "${key}" in localStorage:`,
        domException
      );

      // Test removeItem error logging
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw typeError;
      });
      adapter.removeItem(key);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to remove item "${key}" from localStorage:`,
        typeError
      );
    });

    it('should handle null and undefined localStorage gracefully', () => {
      // Arrange
      const key = 'null-test-key';
      const value = 'null-test-value';

      // Mock localStorage to be null/undefined
      localStorageMock.getItem.mockImplementation(() => {
        throw new ReferenceError('localStorage is not defined');
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw new ReferenceError('localStorage is not defined');
      });
      localStorageMock.removeItem.mockImplementation(() => {
        throw new ReferenceError('localStorage is not defined');
      });

      // Act & Assert
      const getResult = adapter.getItem(key);
      expect(getResult).toBeNull();

      expect(() => adapter.setItem(key, value)).not.toThrow();
      expect(() => adapter.removeItem(key)).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle a complete storage lifecycle', () => {
      // Arrange
      const key = 'lifecycle-key';
      const value = 'lifecycle-value';
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {});

      // Act - Initial get (should return null)
      let result = adapter.getItem(key);
      expect(result).toBeNull();

      // Act - Set the value
      adapter.setItem(key, value);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, value);

      // Act - Mock that the value now exists and get it
      localStorageMock.getItem.mockReturnValue(value);
      result = adapter.getItem(key);
      expect(result).toBe(value);

      // Act - Remove the value
      adapter.removeItem(key);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);

      // Act - Mock that the value is now removed and get it
      localStorageMock.getItem.mockReturnValue(null);
      result = adapter.getItem(key);
      expect(result).toBeNull();

      // Assert
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should work correctly with Zustand persist middleware data format', () => {
      // Arrange - Typical Zustand persisted data structure
      const key = 'zustand-store';
      const zustandData = JSON.stringify({
        state: { profiles: [], activeProfileId: null },
        version: 0,
      });
      localStorageMock.getItem.mockReturnValue(zustandData);
      localStorageMock.setItem.mockImplementation(() => {});

      // Act
      const retrievedData = adapter.getItem(key);
      adapter.setItem(key, zustandData);

      // Assert
      expect(retrievedData).toBe(zustandData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(key, zustandData);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
