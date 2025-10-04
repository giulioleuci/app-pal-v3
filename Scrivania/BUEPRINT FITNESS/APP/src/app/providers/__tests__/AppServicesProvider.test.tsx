import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('tsyringe', () => ({
  container: {
    resolve: vi.fn(),
  },
}));

vi.mock('@/app/container', () => ({
  configureContainer: vi.fn(),
}));

import { container } from 'tsyringe';

import { configureContainer } from '@/app/container';
import { AppServicesProvider, useAppServices } from '@/app/providers/AppServicesProvider';

// Get the mocked services
const mockContainer = vi.mocked(container);
const mockConfigureContainer = vi.mocked(configureContainer);

// Test constants - Mock service instances
const MOCK_SERVICES = {
  profileService: { name: 'ProfileService', method: vi.fn() },
  bodyMetricsService: { name: 'BodyMetricsService', method: vi.fn() },
  exerciseService: { name: 'ExerciseService', method: vi.fn() },
  maxLogService: { name: 'MaxLogService', method: vi.fn() },
  trainingPlanService: { name: 'TrainingPlanService', method: vi.fn() },
  workoutService: { name: 'WorkoutService', method: vi.fn() },
  analysisService: { name: 'AnalysisService', method: vi.fn() },
  dashboardService: { name: 'DashboardService', method: vi.fn() },
  dataSyncService: { name: 'DataSyncService', method: vi.fn() },
  maintenanceService: { name: 'MaintenanceService', method: vi.fn() },
};

describe('AppServicesProvider', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Reset mockConfigureContainer to default (no error)
    mockConfigureContainer.mockImplementation(() => {
      // Default implementation - do nothing (success)
    });

    // Set default mock behavior for container.resolve
    mockContainer.resolve.mockImplementation((serviceName: string) => {
      switch (serviceName) {
        case 'ProfileService':
          return MOCK_SERVICES.profileService;
        case 'BodyMetricsService':
          return MOCK_SERVICES.bodyMetricsService;
        case 'ExerciseService':
          return MOCK_SERVICES.exerciseService;
        case 'MaxLogService':
          return MOCK_SERVICES.maxLogService;
        case 'TrainingPlanService':
          return MOCK_SERVICES.trainingPlanService;
        case 'WorkoutService':
          return MOCK_SERVICES.workoutService;
        case 'AnalysisService':
          return MOCK_SERVICES.analysisService;
        case 'DashboardService':
          return MOCK_SERVICES.dashboardService;
        case 'DataSyncService':
          return MOCK_SERVICES.dataSyncService;
        case 'MaintenanceService':
          return MOCK_SERVICES.maintenanceService;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }
    });
  });

  describe('Component Rendering and Provider Functionality', () => {
    it('should render children without throwing', () => {
      const TestChild = () => <div data-testid='test-child'>Test Content</div>;

      render(
        <AppServicesProvider>
          <TestChild />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <AppServicesProvider>
          <div data-testid='child-1'>First Child</div>
          <div data-testid='child-2'>Second Child</div>
          <span data-testid='child-3'>Third Child</span>
        </AppServicesProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      expect(() => {
        render(<AppServicesProvider>{null}</AppServicesProvider>);
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(<AppServicesProvider>{undefined}</AppServicesProvider>);
      }).not.toThrow();
    });

    it('should handle empty fragment children', () => {
      expect(() => {
        render(
          <AppServicesProvider>
            <></>
          </AppServicesProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Services Context Provision to Child Components', () => {
    it('should provide services context to child components', () => {
      const TestChild = () => {
        const services = useAppServices();
        return <div data-testid='services-consumer'>Services: {typeof services}</div>;
      };

      render(
        <AppServicesProvider>
          <TestChild />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('services-consumer')).toHaveTextContent('Services: object');
    });

    it('should provide services context to nested components', () => {
      const DeepChild = () => {
        const services = useAppServices();
        return <div data-testid='deep-child'>Services Available: {services ? 'Yes' : 'No'}</div>;
      };

      const MiddleChild = () => (
        <div data-testid='middle-child'>
          <DeepChild />
        </div>
      );

      render(
        <AppServicesProvider>
          <MiddleChild />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('deep-child')).toHaveTextContent('Services Available: Yes');
    });

    it('should maintain services context with complex component hierarchy', () => {
      const ServicesConsumer = () => {
        const services = useAppServices();
        return (
          <div data-testid='services-consumer'>
            Profile Service: {services.profileService ? 'Available' : 'Missing'}
          </div>
        );
      };

      const ComplexTree = () => (
        <div>
          <div>
            <div>
              <ServicesConsumer />
            </div>
          </div>
        </div>
      );

      render(
        <AppServicesProvider>
          <ComplexTree />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('services-consumer')).toHaveTextContent(
        'Profile Service: Available'
      );
    });
  });

  describe('Service Initialization and Dependency Injection', () => {
    it('should configure the DI container on initialization', () => {
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      expect(mockConfigureContainer).toHaveBeenCalledTimes(1);
    });

    it('should resolve all required services from the container', () => {
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      expect(mockContainer.resolve).toHaveBeenCalledWith('ProfileService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('BodyMetricsService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('ExerciseService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('MaxLogService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('TrainingPlanService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('WorkoutService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('AnalysisService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('DashboardService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('DataSyncService');
      expect(mockContainer.resolve).toHaveBeenCalledWith('MaintenanceService');
      expect(mockContainer.resolve).toHaveBeenCalledTimes(10);
    });

    it('should resolve services using correct service names', () => {
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      const expectedServices = [
        'ProfileService',
        'BodyMetricsService',
        'ExerciseService',
        'MaxLogService',
        'TrainingPlanService',
        'WorkoutService',
        'AnalysisService',
        'DashboardService',
        'DataSyncService',
        'MaintenanceService',
      ];

      expectedServices.forEach((serviceName) => {
        expect(mockContainer.resolve).toHaveBeenCalledWith(serviceName);
      });
    });

    it('should initialize services only once per provider instance', () => {
      const { rerender } = render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      const initialCallCount = mockConfigureContainer.mock.calls.length;
      const initialResolveCallCount = mockContainer.resolve.mock.calls.length;

      // Rerender the same provider
      rerender(
        <AppServicesProvider>
          <div>Updated Test</div>
        </AppServicesProvider>
      );

      // Container should still only be configured once due to useState lazy initialization
      expect(mockConfigureContainer).toHaveBeenCalledTimes(initialCallCount);
      expect(mockContainer.resolve).toHaveBeenCalledTimes(initialResolveCallCount);
    });

    it('should maintain services reference across rerenders', () => {
      let capturedServices: any;
      const ServiceCapture = () => {
        const services = useAppServices();
        capturedServices = services;
        return <div>Captured</div>;
      };

      const { rerender } = render(
        <AppServicesProvider>
          <ServiceCapture />
        </AppServicesProvider>
      );

      const firstServices = capturedServices;

      rerender(
        <AppServicesProvider>
          <ServiceCapture />
        </AppServicesProvider>
      );

      expect(capturedServices).toBe(firstServices);
    });
  });

  describe('Service Availability Through Context', () => {
    it('should provide all required services through context', () => {
      const ServiceTester = () => {
        const services = useAppServices();
        return (
          <div>
            <div data-testid='profile-service'>
              {services.profileService ? 'Profile: Available' : 'Profile: Missing'}
            </div>
            <div data-testid='body-metrics-service'>
              {services.bodyMetricsService ? 'BodyMetrics: Available' : 'BodyMetrics: Missing'}
            </div>
            <div data-testid='exercise-service'>
              {services.exerciseService ? 'Exercise: Available' : 'Exercise: Missing'}
            </div>
            <div data-testid='max-log-service'>
              {services.maxLogService ? 'MaxLog: Available' : 'MaxLog: Missing'}
            </div>
            <div data-testid='training-plan-service'>
              {services.trainingPlanService ? 'TrainingPlan: Available' : 'TrainingPlan: Missing'}
            </div>
            <div data-testid='workout-service'>
              {services.workoutService ? 'Workout: Available' : 'Workout: Missing'}
            </div>
            <div data-testid='analysis-service'>
              {services.analysisService ? 'Analysis: Available' : 'Analysis: Missing'}
            </div>
            <div data-testid='dashboard-service'>
              {services.dashboardService ? 'Dashboard: Available' : 'Dashboard: Missing'}
            </div>
            <div data-testid='data-sync-service'>
              {services.dataSyncService ? 'DataSync: Available' : 'DataSync: Missing'}
            </div>
            <div data-testid='maintenance-service'>
              {services.maintenanceService ? 'Maintenance: Available' : 'Maintenance: Missing'}
            </div>
          </div>
        );
      };

      render(
        <AppServicesProvider>
          <ServiceTester />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('profile-service')).toHaveTextContent('Profile: Available');
      expect(screen.getByTestId('body-metrics-service')).toHaveTextContent(
        'BodyMetrics: Available'
      );
      expect(screen.getByTestId('exercise-service')).toHaveTextContent('Exercise: Available');
      expect(screen.getByTestId('max-log-service')).toHaveTextContent('MaxLog: Available');
      expect(screen.getByTestId('training-plan-service')).toHaveTextContent(
        'TrainingPlan: Available'
      );
      expect(screen.getByTestId('workout-service')).toHaveTextContent('Workout: Available');
      expect(screen.getByTestId('analysis-service')).toHaveTextContent('Analysis: Available');
      expect(screen.getByTestId('dashboard-service')).toHaveTextContent('Dashboard: Available');
      expect(screen.getByTestId('data-sync-service')).toHaveTextContent('DataSync: Available');
      expect(screen.getByTestId('maintenance-service')).toHaveTextContent('Maintenance: Available');
    });

    it('should provide services with correct instances', () => {
      const ServiceTester = () => {
        const services = useAppServices();
        return (
          <div>
            <div data-testid='profile-service-name'>
              {services.profileService?.name || 'No Name'}
            </div>
            <div data-testid='body-metrics-service-name'>
              {services.bodyMetricsService?.name || 'No Name'}
            </div>
          </div>
        );
      };

      render(
        <AppServicesProvider>
          <ServiceTester />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('profile-service-name')).toHaveTextContent('ProfileService');
      expect(screen.getByTestId('body-metrics-service-name')).toHaveTextContent(
        'BodyMetricsService'
      );
    });

    it('should allow services to be called through context', () => {
      const ServiceInteractor = () => {
        const services = useAppServices();

        React.useEffect(() => {
          // Call a method on each service to verify they're functional
          services.profileService?.method?.();
          services.bodyMetricsService?.method?.();
        }, [services]);

        return <div data-testid='service-interactor'>Services Interacted</div>;
      };

      render(
        <AppServicesProvider>
          <ServiceInteractor />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('service-interactor')).toBeInTheDocument();
      expect(MOCK_SERVICES.profileService.method).toHaveBeenCalledTimes(1);
      expect(MOCK_SERVICES.bodyMetricsService.method).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Handling and Children Rendering', () => {
    it('should accept and render ReactNode children', () => {
      const children = (
        <div>
          <span>Text Node</span>
          <button>Button Node</button>
          {42}
          <div>Conditional Node</div>
        </div>
      );

      render(<AppServicesProvider>{children}</AppServicesProvider>);

      expect(screen.getByText('Text Node')).toBeInTheDocument();
      expect(screen.getByText('Button Node')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Conditional Node')).toBeInTheDocument();
    });

    it('should handle function components as children', () => {
      const FunctionalChild = () => <div data-testid='functional'>Functional Component</div>;

      render(
        <AppServicesProvider>
          <FunctionalChild />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('functional')).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(<AppServicesProvider>Plain text child</AppServicesProvider>);

      expect(screen.getByText('Plain text child')).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<AppServicesProvider>{123}</AppServicesProvider>);

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should handle array of children', () => {
      const children = [
        <div key='1' data-testid='array-child-1'>
          First
        </div>,
        <div key='2' data-testid='array-child-2'>
          Second
        </div>,
      ];

      render(<AppServicesProvider>{children}</AppServicesProvider>);

      expect(screen.getByTestId('array-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('array-child-2')).toBeInTheDocument();
    });

    it('should handle complex nested children structures', () => {
      render(
        <AppServicesProvider>
          <div data-testid='level-1'>
            Level 1
            <div data-testid='level-2'>
              Level 2<div data-testid='level-3'>Level 3</div>
            </div>
          </div>
        </AppServicesProvider>
      );

      expect(screen.getByTestId('level-1')).toBeInTheDocument();
      expect(screen.getByTestId('level-2')).toBeInTheDocument();
      expect(screen.getByTestId('level-3')).toBeInTheDocument();
    });
  });

  describe('Service Lifecycle Management', () => {
    it('should initialize services only once during provider lifecycle', () => {
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      expect(mockConfigureContainer).toHaveBeenCalledTimes(1);
      expect(mockContainer.resolve).toHaveBeenCalledTimes(10);
    });

    it('should not reinitialize services on rerenders', () => {
      const { rerender } = render(
        <AppServicesProvider>
          <div>Initial</div>
        </AppServicesProvider>
      );

      const initialConfigureCalls = mockConfigureContainer.mock.calls.length;
      const initialResolveCalls = mockContainer.resolve.mock.calls.length;

      // Multiple rerenders
      for (let i = 0; i < 5; i++) {
        rerender(
          <AppServicesProvider>
            <div>Rerender {i}</div>
          </AppServicesProvider>
        );
      }

      expect(mockConfigureContainer).toHaveBeenCalledTimes(initialConfigureCalls);
      expect(mockContainer.resolve).toHaveBeenCalledTimes(initialResolveCalls);
    });

    it('should maintain service instances across component updates', () => {
      let firstServiceInstance: any;
      let secondServiceInstance: any;

      const ServiceCapture = ({ captureIndex }: { captureIndex: number }) => {
        const services = useAppServices();
        if (captureIndex === 1) {
          firstServiceInstance = services.profileService;
        } else {
          secondServiceInstance = services.profileService;
        }
        return <div>Capture {captureIndex}</div>;
      };

      const { rerender } = render(
        <AppServicesProvider>
          <ServiceCapture captureIndex={1} />
        </AppServicesProvider>
      );

      rerender(
        <AppServicesProvider>
          <ServiceCapture captureIndex={2} />
        </AppServicesProvider>
      );

      expect(firstServiceInstance).toBe(secondServiceInstance);
    });

    it('should handle provider unmounting gracefully', () => {
      const { unmount } = render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should throw error when useAppServices is used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        return <div>{useAppServices() ? 'Has services' : 'No services'}</div>;
      };

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAppServices must be used within an AppServicesProvider');
    });

    it('should handle container.resolve throwing errors gracefully', () => {
      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === 'ProfileService') {
          throw new Error(`Failed to resolve ${serviceName}`);
        }
        return { name: serviceName };
      });

      expect(() => {
        render(
          <AppServicesProvider>
            <div>Test</div>
          </AppServicesProvider>
        );
      }).toThrow('Failed to resolve ProfileService');
    });

    it('should handle configureContainer throwing errors', () => {
      mockConfigureContainer.mockImplementation(() => {
        throw new Error('Container configuration failed');
      });

      expect(() => {
        render(
          <AppServicesProvider>
            <div>Test</div>
          </AppServicesProvider>
        );
      }).toThrow('Container configuration failed');
    });

    it('should handle partial service resolution failures', () => {
      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === 'ProfileService') {
          return null;
        }
        if (serviceName === 'BodyMetricsService') {
          return undefined;
        }
        return { name: serviceName };
      });

      const ServiceTester = () => {
        const services = useAppServices();
        return (
          <div>
            <div data-testid='profile-service'>
              Profile: {services.profileService ? 'Available' : 'Missing'}
            </div>
            <div data-testid='body-metrics-service'>
              BodyMetrics: {services.bodyMetricsService ? 'Available' : 'Missing'}
            </div>
            <div data-testid='exercise-service'>
              Exercise: {services.exerciseService ? 'Available' : 'Missing'}
            </div>
          </div>
        );
      };

      render(
        <AppServicesProvider>
          <ServiceTester />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('profile-service')).toHaveTextContent('Profile: Missing');
      expect(screen.getByTestId('body-metrics-service')).toHaveTextContent('BodyMetrics: Missing');
      expect(screen.getByTestId('exercise-service')).toHaveTextContent('Exercise: Available');
    });

    it('should handle services with circular dependencies or complex initialization', () => {
      const circularService = {
        name: 'CircularService',
        dependency: null as any,
      };
      circularService.dependency = circularService;

      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === 'ProfileService') {
          return circularService;
        }
        return { name: serviceName };
      });

      expect(() => {
        render(
          <AppServicesProvider>
            <div>Test</div>
          </AppServicesProvider>
        );
      }).not.toThrow();
    });

    it('should handle multiple providers in different parts of component tree', () => {
      const FirstProviderChild = () => {
        const services = useAppServices();
        return (
          <div data-testid='first-provider-child'>
            First: {services.profileService ? 'Available' : 'Missing'}
          </div>
        );
      };

      const SecondProviderChild = () => {
        const services = useAppServices();
        return (
          <div data-testid='second-provider-child'>
            Second: {services.profileService ? 'Available' : 'Missing'}
          </div>
        );
      };

      render(
        <div>
          <AppServicesProvider>
            <FirstProviderChild />
          </AppServicesProvider>
          <AppServicesProvider>
            <SecondProviderChild />
          </AppServicesProvider>
        </div>
      );

      expect(screen.getByTestId('first-provider-child')).toHaveTextContent('First: Available');
      expect(screen.getByTestId('second-provider-child')).toHaveTextContent('Second: Available');
    });
  });

  describe('Integration with Dependency Injection Container', () => {
    it('should configure container before resolving services', () => {
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      // configureContainer should be called before any resolve calls
      const configureCall = mockConfigureContainer.mock.invocationCallOrder[0];
      const firstResolveCall = mockContainer.resolve.mock.invocationCallOrder[0];

      expect(configureCall).toBeLessThan(firstResolveCall);
    });

    it('should pass correct service tokens to container.resolve', () => {
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      const expectedTokens = [
        'ProfileService',
        'BodyMetricsService',
        'ExerciseService',
        'MaxLogService',
        'TrainingPlanService',
        'WorkoutService',
        'AnalysisService',
        'DashboardService',
        'DataSyncService',
        'MaintenanceService',
      ];

      expectedTokens.forEach((token) => {
        expect(mockContainer.resolve).toHaveBeenCalledWith(token);
      });
    });

    it('should handle container being in different states', () => {
      // Test with container returning different service configurations
      mockContainer.resolve.mockImplementation((serviceName: string) => {
        return {
          name: serviceName,
          initialized: true,
          version: '1.0.0',
        };
      });

      const ServiceTester = () => {
        const services = useAppServices();
        return (
          <div data-testid='service-version'>{services.profileService?.version || 'Unknown'}</div>
        );
      };

      render(
        <AppServicesProvider>
          <ServiceTester />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('service-version')).toHaveTextContent('1.0.0');
    });

    it('should maintain layer boundaries by not importing concrete service classes', () => {
      // This test verifies that the provider only uses string tokens
      // and doesn't import actual service classes, maintaining architectural boundaries
      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      // All resolve calls should use string tokens, not class references
      mockContainer.resolve.mock.calls.forEach(([token]) => {
        expect(typeof token).toBe('string');
        expect(token).toMatch(/^[A-Z][a-zA-Z]*Service$/);
      });
    });

    it('should handle service factory patterns correctly', () => {
      const serviceFactory = {
        create: vi.fn(() => ({ name: 'FactoryCreatedService' })),
      };

      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === 'ProfileService') {
          return serviceFactory;
        }
        return { name: serviceName };
      });

      const ServiceTester = () => {
        const services = useAppServices();
        return (
          <div data-testid='factory-service'>
            {services.profileService?.create ? 'Factory' : 'Regular'}
          </div>
        );
      };

      render(
        <AppServicesProvider>
          <ServiceTester />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('factory-service')).toHaveTextContent('Factory');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should use lazy initialization for services', () => {
      // Services should only be resolved when the provider is first rendered
      expect(mockContainer.resolve).not.toHaveBeenCalled();

      render(
        <AppServicesProvider>
          <div>Test</div>
        </AppServicesProvider>
      );

      expect(mockContainer.resolve).toHaveBeenCalledTimes(10);
    });

    it('should not create new service instances on rerenders', () => {
      const { rerender } = render(
        <AppServicesProvider>
          <div>Initial</div>
        </AppServicesProvider>
      );

      const initialCalls = mockContainer.resolve.mock.calls.length;

      // Multiple rerenders should not trigger new service resolution
      for (let i = 0; i < 3; i++) {
        rerender(
          <AppServicesProvider>
            <div>Rerender {i}</div>
          </AppServicesProvider>
        );
      }

      expect(mockContainer.resolve).toHaveBeenCalledTimes(initialCalls);
    });

    it('should handle memory-intensive services efficiently', () => {
      const heavyService = {
        name: 'HeavyService',
        largeData: new Array(1000).fill('data'),
        processData: vi.fn(),
      };

      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === 'ProfileService') {
          return heavyService;
        }
        return { name: serviceName };
      });

      const ServiceTester = () => {
        const services = useAppServices();
        return (
          <div data-testid='heavy-service'>
            Data Size: {services.profileService?.largeData?.length || 0}
          </div>
        );
      };

      render(
        <AppServicesProvider>
          <ServiceTester />
        </AppServicesProvider>
      );

      expect(screen.getByTestId('heavy-service')).toHaveTextContent('Data Size: 1000');
      // Service should still be resolved only once
      expect(mockContainer.resolve).toHaveBeenCalledTimes(10);
    });
  });
});
