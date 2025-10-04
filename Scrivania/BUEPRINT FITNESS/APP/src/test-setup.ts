import 'reflect-metadata'; // For ts-syringe
import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterEach, vi } from 'vitest';

// Mock crypto API for WatermelonDB compatibility
const mockCrypto = {
  getRandomValues: (buffer: Uint8Array) => {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  },
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
} as Crypto;

Object.defineProperty(globalThis, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true,
});

// Mock localStorage for persist middleware
const mockStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockStorage,
  writable: true,
  configurable: true,
});

// Global mock for tsyringe to handle @injectable decorator
vi.mock('tsyringe', async (importOriginal) => {
  const actual = await importOriginal<typeof import('tsyringe')>();
  return {
    ...actual,
    injectable: () => (target: any) => target, // Mock decorator that returns the class unchanged
    container: {
      resolve: vi.fn(),
      register: vi.fn(),
      registerSingleton: vi.fn(),
      registerInstance: vi.fn(),
      invalidateQueries: vi.fn(),
    },
  };
});

// Clean up the DOM after each test (for component tests)
afterEach(() => {
  cleanup();
});

// Initialize a mock i18next instance for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'errors', 'forms', 'domain'],
  resources: { en: { common: {}, errors: {}, forms: {}, domain: {} } },
});
