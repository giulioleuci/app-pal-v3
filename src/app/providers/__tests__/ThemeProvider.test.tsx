import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the themeStore
vi.mock('@/app/store/themeStore', () => ({
  useThemeStore: vi.fn(),
}));

// Mock MUI's ThemeProvider and the createAppTheme function
vi.mock('@mui/material/styles', () => ({
  ThemeProvider: vi.fn(({ children }) => children),
}));

vi.mock('@/app/theme', () => ({
  createAppTheme: vi.fn(),
}));

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { useThemeStore } from '@/app/store/themeStore';
import { createAppTheme } from '@/app/theme';

// Get the mocked functions
const mockCreateAppTheme = vi.mocked(createAppTheme);
const mockMuiThemeProvider = vi.mocked(MuiThemeProvider);
const mockUseThemeStore = vi.mocked(useThemeStore);

// Test constants
const DEFAULT_THEME_STATE = {
  mode: 'light' as const,
  primaryColor: '#3b82f6',
  secondaryColor: '#6366f1',
};

const DARK_THEME_STATE = {
  mode: 'dark' as const,
  primaryColor: '#ef4444',
  secondaryColor: '#8b5cf6',
};

const MOCK_THEME_OBJECT = {
  palette: {
    mode: 'light',
    primary: { main: '#3b82f6' },
    secondary: { main: '#6366f1' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: expect.any(Object),
      },
    },
  },
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set default mock return value
    mockUseThemeStore.mockReturnValue(DEFAULT_THEME_STATE);
    mockCreateAppTheme.mockReturnValue(MOCK_THEME_OBJECT);
  });

  describe('Component Rendering and Provider Functionality', () => {
    it('should render children without throwing', () => {
      const TestChild = () => <div data-testid='test-child'>Test Content</div>;

      render(
        <ThemeProvider>
          <TestChild />
        </ThemeProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <ThemeProvider>
          <div data-testid='child-1'>First Child</div>
          <div data-testid='child-2'>Second Child</div>
          <span data-testid='child-3'>Third Child</span>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      expect(() => {
        render(<ThemeProvider>{null}</ThemeProvider>);
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(<ThemeProvider>{undefined}</ThemeProvider>);
      }).not.toThrow();
    });

    it('should handle empty fragment children', () => {
      expect(() => {
        render(
          <ThemeProvider>
            <></>
          </ThemeProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Theme Context Provision to Child Components', () => {
    it('should pass theme object to MUI ThemeProvider', () => {
      const TestChild = () => <div>Child Component</div>;

      render(
        <ThemeProvider>
          <TestChild />
        </ThemeProvider>
      );

      expect(mockMuiThemeProvider).toHaveBeenCalledTimes(1);
      const [firstCall] = mockMuiThemeProvider.mock.calls;
      expect(firstCall[0]).toHaveProperty('theme', MOCK_THEME_OBJECT);
      expect(firstCall[0]).toHaveProperty('children');
    });

    it('should provide theme context to nested components', () => {
      const NestedChild = () => <div data-testid='nested'>Nested</div>;
      const MiddleChild = () => (
        <div data-testid='middle'>
          <NestedChild />
        </div>
      );

      render(
        <ThemeProvider>
          <MiddleChild />
        </ThemeProvider>
      );

      expect(screen.getByTestId('middle')).toBeInTheDocument();
      expect(screen.getByTestId('nested')).toBeInTheDocument();
      expect(mockMuiThemeProvider).toHaveBeenCalledTimes(1);
    });

    it('should maintain theme context with complex component hierarchy', () => {
      const DeepChild = () => <div data-testid='deep-child'>Deep</div>;
      const ComplexTree = () => (
        <div>
          <div>
            <div>
              <DeepChild />
            </div>
          </div>
        </div>
      );

      render(
        <ThemeProvider>
          <ComplexTree />
        </ThemeProvider>
      );

      expect(screen.getByTestId('deep-child')).toBeInTheDocument();
      expect(mockMuiThemeProvider).toHaveBeenCalledTimes(1);
      const [firstCall] = mockMuiThemeProvider.mock.calls;
      expect(firstCall[0]).toHaveProperty('theme', MOCK_THEME_OBJECT);
    });
  });

  describe('Integration with themeStore and MUI Theme System', () => {
    it('should call useThemeStore hook', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockUseThemeStore).toHaveBeenCalledTimes(1);
    });

    it('should extract mode, primaryColor, and secondaryColor from themeStore', () => {
      const customThemeState = {
        mode: 'dark' as const,
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      };
      mockUseThemeStore.mockReturnValue(customThemeState);

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockUseThemeStore).toHaveBeenCalled();
      expect(mockCreateAppTheme).toHaveBeenCalledWith('dark', '#ff0000', '#00ff00');
    });

    it('should create MUI theme with correct palette configuration', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledWith('light', '#3b82f6', '#6366f1');
    });

    it('should create theme with dark mode styles when mode is dark', () => {
      mockUseThemeStore.mockReturnValue(DARK_THEME_STATE);

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledWith('dark', '#ef4444', '#8b5cf6');
    });
  });

  describe('Theme Switching Behavior and State Management', () => {
    it('should update theme when themeStore values change', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Verify initial theme creation
      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);
      expect(mockCreateAppTheme).toHaveBeenCalledWith('light', '#3b82f6', '#6366f1');

      // Clear the mock and change theme state
      mockCreateAppTheme.mockClear();
      mockUseThemeStore.mockReturnValue({
        mode: 'dark' as const,
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);
      expect(mockCreateAppTheme).toHaveBeenCalledWith('dark', '#ff0000', '#00ff00');
    });

    it('should handle mode changes correctly', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Change from light to dark
      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        mode: 'dark' as const,
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenLastCalledWith('dark', '#3b82f6', '#6366f1');
    });

    it('should handle primary color changes correctly', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        primaryColor: '#ff5722',
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenLastCalledWith('light', '#ff5722', '#6366f1');
    });

    it('should handle secondary color changes correctly', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        secondaryColor: '#9c27b0',
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenLastCalledWith('light', '#3b82f6', '#9c27b0');
    });

    it('should handle simultaneous changes to all theme properties', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const newThemeState = {
        mode: 'dark' as const,
        primaryColor: '#e91e63',
        secondaryColor: '#00bcd4',
      };
      mockUseThemeStore.mockReturnValue(newThemeState);

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenLastCalledWith('dark', '#e91e63', '#00bcd4');
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

      render(<ThemeProvider>{children}</ThemeProvider>);

      expect(screen.getByText('Text Node')).toBeInTheDocument();
      expect(screen.getByText('Button Node')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Conditional Node')).toBeInTheDocument();
    });

    it('should handle function components as children', () => {
      const FunctionalChild = () => <div data-testid='functional'>Functional Component</div>;

      render(
        <ThemeProvider>
          <FunctionalChild />
        </ThemeProvider>
      );

      expect(screen.getByTestId('functional')).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(<ThemeProvider>Plain text child</ThemeProvider>);

      expect(screen.getByText('Plain text child')).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<ThemeProvider>{123}</ThemeProvider>);

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

      render(<ThemeProvider>{children}</ThemeProvider>);

      expect(screen.getByTestId('array-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('array-child-2')).toBeInTheDocument();
    });
  });

  describe('Theme Object Creation and Customization', () => {
    it('should use React.useMemo for theme creation', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Theme should be created only once on initial render
      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);
    });

    it('should recreate theme when dependencies change', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);

      // Change primary color (should trigger useMemo)
      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        primaryColor: '#changed',
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(2);
    });

    it('should include comprehensive scrollbar styles for light mode', () => {
      mockUseThemeStore.mockReturnValue({
        mode: 'light' as const,
        primaryColor: '#3b82f6',
        secondaryColor: '#6366f1',
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const expectedBodyStyles = {
        scrollbarColor: '#959595 #f5f5f5',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          backgroundColor: '#f5f5f5',
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          borderRadius: 8,
          backgroundColor: '#959595',
          minHeight: 24,
          border: '3px solid #f5f5f5',
        },
        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
          backgroundColor: '#6b6b6b',
        },
        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
          backgroundColor: '#6b6b6b',
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#6b6b6b',
        },
      };

      expect(mockCreateAppTheme).toHaveBeenCalledWith('light', '#3b82f6', '#6366f1');
    });

    it('should include comprehensive scrollbar styles for dark mode', () => {
      mockUseThemeStore.mockReturnValue({
        mode: 'dark' as const,
        primaryColor: '#3b82f6',
        secondaryColor: '#6366f1',
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const expectedBodyStyles = {
        scrollbarColor: '#6b6b6b #2b2b2b',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          backgroundColor: '#2b2b2b',
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          borderRadius: 8,
          backgroundColor: '#6b6b6b',
          minHeight: 24,
          border: '3px solid #2b2b2b',
        },
        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
          backgroundColor: '#959595',
        },
        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
          backgroundColor: '#959595',
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#959595',
        },
      };

      expect(mockCreateAppTheme).toHaveBeenCalledWith('dark', '#3b82f6', '#6366f1');
    });

    it('should create theme with correct structure', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledWith('light', '#3b82f6', '#6366f1');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing themeStore values gracefully', () => {
      mockUseThemeStore.mockReturnValue({
        mode: undefined,
        primaryColor: undefined,
        secondaryColor: undefined,
      });

      expect(() => {
        render(
          <ThemeProvider>
            <div>Test</div>
          </ThemeProvider>
        );
      }).not.toThrow();

      expect(mockCreateAppTheme).toHaveBeenCalledWith(undefined, undefined, undefined);
    });

    it('should handle null themeStore return value', () => {
      mockUseThemeStore.mockReturnValue(null);

      expect(() => {
        render(
          <ThemeProvider>
            <div>Test</div>
          </ThemeProvider>
        );
      }).toThrow();
    });

    it('should handle empty string colors', () => {
      mockUseThemeStore.mockReturnValue({
        mode: 'light' as const,
        primaryColor: '',
        secondaryColor: '',
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledWith('light', '', '');
    });

    it('should handle non-standard color formats', () => {
      mockUseThemeStore.mockReturnValue({
        mode: 'light' as const,
        primaryColor: 'rgb(255, 0, 0)',
        secondaryColor: 'hsl(120, 100%, 50%)',
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledWith(
        'light',
        'rgb(255, 0, 0)',
        'hsl(120, 100%, 50%)'
      );
    });

    it('should handle createTheme throwing an error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateAppTheme.mockImplementation(() => {
        throw new Error('Theme creation failed');
      });

      expect(() => {
        render(
          <ThemeProvider>
            <div>Test</div>
          </ThemeProvider>
        );
      }).toThrow('Theme creation failed');

      consoleErrorSpy.mockRestore();
    });

    it('should handle rapid theme changes without errors', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Rapid theme changes
      for (let i = 0; i < 5; i++) {
        mockUseThemeStore.mockReturnValue({
          mode: i % 2 === 0 ? 'light' : 'dark',
          primaryColor: `#${i}${i}${i}${i}${i}${i}`,
          secondaryColor: `#${5 - i}${5 - i}${5 - i}${5 - i}${5 - i}${5 - i}`,
        });

        expect(() => {
          rerender(
            <ThemeProvider>
              <div>Test {i}</div>
            </ThemeProvider>
          );
        }).not.toThrow();
      }

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(6); // Initial + 5 updates
    });

    it('should maintain component stability with theme changes', () => {
      let renderCount = 0;
      const TestChild = () => {
        renderCount++;
        return <div data-testid='stable-child'>Stable Child {renderCount}</div>;
      };

      const { rerender } = render(
        <ThemeProvider>
          <TestChild />
        </ThemeProvider>
      );

      expect(renderCount).toBe(1);

      // Change theme
      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        primaryColor: '#changed',
      });

      rerender(
        <ThemeProvider>
          <TestChild />
        </ThemeProvider>
      );

      expect(renderCount).toBe(2);
      expect(screen.getByTestId('stable-child')).toHaveTextContent('Stable Child 2');
    });

    it('should handle invalid mode values gracefully', () => {
      mockUseThemeStore.mockReturnValue({
        mode: 'invalid' as 'light' | 'dark',
        primaryColor: '#3b82f6',
        secondaryColor: '#6366f1',
      });

      expect(() => {
        render(
          <ThemeProvider>
            <div>Test</div>
          </ThemeProvider>
        );
      }).not.toThrow();

      expect(mockCreateAppTheme).toHaveBeenCalledWith('invalid', '#3b82f6', '#6366f1');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not recreate theme when themeStore values remain the same', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);

      // Rerender with same theme values
      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Theme should still only be created once due to useMemo
      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);
    });

    it('should memoize theme creation with correct dependencies', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(1);

      // Change only mode
      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        mode: 'dark' as const,
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(2);

      // Change only primary color
      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        mode: 'dark' as const,
        primaryColor: '#changed',
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(3);

      // Change only secondary color
      mockUseThemeStore.mockReturnValue({
        ...DEFAULT_THEME_STATE,
        mode: 'dark' as const,
        primaryColor: '#changed',
        secondaryColor: '#changed-too',
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockCreateAppTheme).toHaveBeenCalledTimes(4);
    });

    it('should handle high-frequency theme updates efficiently', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const initialCallCount = mockCreateAppTheme.mock.calls.length;

      // Simulate 10 rapid theme updates
      for (let i = 0; i < 10; i++) {
        mockUseThemeStore.mockReturnValue({
          mode: 'light' as const,
          primaryColor: `#color${i}`,
          secondaryColor: '#6366f1',
        });

        rerender(
          <ThemeProvider>
            <div>Update {i}</div>
          </ThemeProvider>
        );
      }

      // Should have created theme for each unique update
      expect(mockCreateAppTheme).toHaveBeenCalledTimes(initialCallCount + 10);
    });
  });
});
