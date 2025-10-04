import 'reflect-metadata';

import { container } from 'tsyringe';
import { beforeAll, describe, it, vi } from 'vitest';

import { configureContainer } from '@/app/container';

// Unmock tsyringe for this test file since we need the real container functionality
vi.unmock('tsyringe');

// Eagerly import all modules to be tested for DI resolution
const modules = (import.meta as any).glob(
  [
    '/src/features/**/data/*Repository.ts',
    '/src/features/**/services/*Service.ts',
    '/src/app/services/*Service.ts',
    '/src/features/**/handlers/*Handler.ts',
  ],
  { eager: true }
);

describe('Dependency Injection Container', () => {
  beforeAll(() => {
    configureContainer();
  });

  const injectableClasses: { name: string; constructor: any }[] = [];

  // Discover all exported classes that are likely injectables
  for (const path in modules) {
    const module = modules[path] as any;
    for (const key in module) {
      const exported = module[key];
      if (typeof exported === 'function' && /^[A-Z]/.test(exported.name)) {
        injectableClasses.push({ name: exported.name, constructor: exported });
      }
    }
  }

  it('should resolve all repository interfaces', () => {
    const repoClasses = injectableClasses.filter((c) => c.name.endsWith('Repository'));
    repoClasses.forEach((repo) => {
      const tokenName = `I${repo.name}`;
      try {
        container.resolve(tokenName);
      } catch (_error) {
        console.error(`Failed to resolve ${tokenName}:`, _error);
        throw _error;
      }
    });
  });

  it('should resolve all services and handlers', () => {
    const serviceAndHandlerClasses = injectableClasses.filter(
      (c) => c.name.endsWith('Service') || c.name.endsWith('Handler')
    );
    console.log(
      'Service and handler classes found:',
      serviceAndHandlerClasses.map((c) => c.name)
    );

    // Test each service individually and collect failures instead of stopping at first failure
    const failures: Array<{ name: string; error: Error }> = [];

    serviceAndHandlerClasses.forEach((cls) => {
      try {
        console.log(`Attempting to resolve: ${cls.name}`);
        container.resolve(cls.constructor);
        console.log(`✓ Successfully resolved: ${cls.name}`);
      } catch (_error) {
        console.error(`✗ Failed to resolve ${cls.name}:`, _error);
        failures.push({ name: cls.name, error: _error as Error });
      }
    });

    if (failures.length > 0) {
      const failureMessage = `Failed to resolve ${failures.length} service(s): ${failures.map((f) => f.name).join(', ')}`;
      console.error('\nSummary of failures:');
      failures.forEach((failure) => {
        console.error(`- ${failure.name}: ${failure.error.message}`);
      });
      throw new Error(failureMessage);
    }
  });
});
