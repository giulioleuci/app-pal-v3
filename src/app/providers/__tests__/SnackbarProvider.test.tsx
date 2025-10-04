import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock MUI components
vi.mock('@mui/material', () => ({
  Alert: vi.fn(({ children, onClose, severity, variant, sx }) => (
    <div
      data-testid='mock-alert'
      data-severity={severity}
      data-variant={variant}
      data-sx={JSON.stringify(sx)}
      onClick={onClose}
    >
      {children}
    </div>
  )),
  Snackbar: vi.fn(({ open, autoHideDuration, onClose, anchorOrigin, children }) => (
    <div
      data-testid='mock-snackbar'
      data-open={open}
      data-auto-hide-duration={autoHideDuration}
      data-anchor-origin={JSON.stringify(anchorOrigin)}
      style={{ display: open ? 'block' : 'none' }}
    >
      {children}
      <button data-testid='snackbar-close' onClick={() => onClose?.(new Event('test'), 'timeout')}>
        Close
      </button>
    </div>
  )),
}));

import { Alert, Snackbar } from '@mui/material';

import { SnackbarProvider, useSnackbar } from '@/app/providers/SnackbarProvider';

// Get the mocked components
const mockAlert = vi.mocked(Alert);
const mockSnackbar = vi.mocked(Snackbar);

// Test helper component to test the hook
function TestConsumer({ testId, action }: { testId: string; action?: string }) {
  const snackbar = useSnackbar();

  const handleAction = () => {
    switch (action) {
      case 'success':
        snackbar.showSuccess('Success message');
        break;
      case 'success-custom-duration':
        snackbar.showSuccess('Success with custom duration', 2000);
        break;
      case 'error':
        snackbar.showError('Error message');
        break;
      case 'error-custom-duration':
        snackbar.showError('Error with custom duration', 8000);
        break;
      case 'warning':
        snackbar.showWarning('Warning message');
        break;
      case 'warning-custom-duration':
        snackbar.showWarning('Warning with custom duration', 3000);
        break;
      case 'info':
        snackbar.showInfo('Info message');
        break;
      case 'info-custom-duration':
        snackbar.showInfo('Info with custom duration', 7000);
        break;
      case 'custom-message':
        snackbar.showMessage({
          message: 'Custom message',
          severity: 'warning',
          duration: 9000,
        });
        break;
      case 'custom-message-minimal':
        snackbar.showMessage({ message: 'Minimal custom message' });
        break;
      default:
        break;
    }
  };

  return (
    <div data-testid={testId}>
      <button data-testid={`${testId}-trigger`} onClick={handleAction}>
        Trigger
      </button>
      <div data-testid={`${testId}-content`}>Consumer Content</div>
    </div>
  );
}

describe('SnackbarProvider', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('Component Rendering and Provider Functionality', () => {
    it('should render children without throwing', () => {
      const TestChild = () => <div data-testid='test-child'>Test Content</div>;

      render(
        <SnackbarProvider>
          <TestChild />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <SnackbarProvider>
          <div data-testid='child-1'>First Child</div>
          <div data-testid='child-2'>Second Child</div>
          <span data-testid='child-3'>Third Child</span>
        </SnackbarProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      expect(() => {
        render(<SnackbarProvider>{null}</SnackbarProvider>);
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(<SnackbarProvider>{undefined}</SnackbarProvider>);
      }).not.toThrow();
    });

    it('should handle empty fragment children', () => {
      expect(() => {
        render(
          <SnackbarProvider>
            <></>
          </SnackbarProvider>
        );
      }).not.toThrow();
    });

    it('should render the MUI Snackbar component', () => {
      render(
        <SnackbarProvider>
          <div>Test</div>
        </SnackbarProvider>
      );

      expect(screen.getByTestId('mock-snackbar')).toBeInTheDocument();
      expect(mockSnackbar).toHaveBeenCalledTimes(1);
    });

    it('should render the MUI Alert component inside Snackbar', () => {
      render(
        <SnackbarProvider>
          <div>Test</div>
        </SnackbarProvider>
      );

      expect(screen.getByTestId('mock-alert')).toBeInTheDocument();
      expect(mockAlert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Snackbar Context Provision to Child Components', () => {
    it('should provide snackbar context to child components', () => {
      render(
        <SnackbarProvider>
          <TestConsumer testId='test-consumer' />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('test-consumer')).toBeInTheDocument();
      expect(screen.getByTestId('test-consumer-content')).toBeInTheDocument();
    });

    it('should provide context to deeply nested components', () => {
      const DeepChild = () => <TestConsumer testId='deep-consumer' />;
      const MiddleChild = () => (
        <div>
          <DeepChild />
        </div>
      );

      render(
        <SnackbarProvider>
          <MiddleChild />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('deep-consumer')).toBeInTheDocument();
    });

    it('should maintain context with complex component hierarchy', () => {
      const ComplexTree = () => (
        <div>
          <div>
            <div>
              <TestConsumer testId='nested-consumer' />
            </div>
          </div>
        </div>
      );

      render(
        <SnackbarProvider>
          <ComplexTree />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('nested-consumer')).toBeInTheDocument();
    });
  });

  describe('Snackbar State Management (Show, Hide, Queue Handling)', () => {
    it('should initialize snackbar as closed', () => {
      render(
        <SnackbarProvider>
          <div>Test</div>
        </SnackbarProvider>
      );

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'false');
      expect(snackbar).toHaveStyle({ display: 'none' });
    });

    it('should show snackbar when message is triggered', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      const trigger = screen.getByTestId('consumer-trigger');
      await user.click(trigger);

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'true');
      expect(snackbar).toHaveStyle({ display: 'block' });
    });

    it('should hide snackbar when close is triggered', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      // Show the snackbar
      const trigger = screen.getByTestId('consumer-trigger');
      await user.click(trigger);

      let snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'true');

      // Close the snackbar
      const closeButton = screen.getByTestId('snackbar-close');
      await user.click(closeButton);

      snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'false');
    });

    it('should not close snackbar on clickaway', () => {
      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      const snackbarProps = mockSnackbar.mock.calls[0][0];
      const result = snackbarProps.onClose?.(new Event('test'), 'clickaway');

      // The snackbar should remain open (onClose should return early)
      expect(result).toBeUndefined();
    });

    it('should update message content when different messages are shown', async () => {
      const user = userEvent.setup();

      const MultiActionConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <div>
            <button data-testid='show-first' onClick={() => snackbar.showSuccess('First message')}>
              First
            </button>
            <button data-testid='show-second' onClick={() => snackbar.showError('Second message')}>
              Second
            </button>
          </div>
        );
      };

      render(
        <SnackbarProvider>
          <MultiActionConsumer />
        </SnackbarProvider>
      );

      // Show first message
      await user.click(screen.getByTestId('show-first'));
      expect(screen.getByText('First message')).toBeInTheDocument();

      // Show second message (should replace first)
      await user.click(screen.getByTestId('show-second'));
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
  });

  describe('Different Snackbar Types and Variants', () => {
    it('should show success message with correct severity', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'success');
    });

    it('should show error message with correct severity', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='error' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'error');
    });

    it('should show warning message with correct severity', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='warning' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'warning');
    });

    it('should show info message with correct severity', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='info' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'info');
    });

    it('should show custom message with specified severity', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='custom-message' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      expect(screen.getByText('Custom message')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'warning');
    });

    it('should use default severity (info) for custom message without severity', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='custom-message-minimal' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      expect(screen.getByText('Minimal custom message')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'info');
    });

    it('should render Alert with filled variant', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-variant', 'filled');
    });

    it('should render Alert with correct styling', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const alert = screen.getByTestId('mock-alert');
      const sx = JSON.parse(alert.getAttribute('data-sx') || '{}');
      expect(sx).toEqual({ width: '100%' });
    });
  });

  describe('Duration and Auto-hide Configuration', () => {
    it('should use default duration for success messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '4000');
    });

    it('should use custom duration for success messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success-custom-duration' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '2000');
    });

    it('should use default duration for error messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='error' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '6000');
    });

    it('should use custom duration for error messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='error-custom-duration' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '8000');
    });

    it('should use default duration for warning messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='warning' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '5000');
    });

    it('should use custom duration for warning messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='warning-custom-duration' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '3000');
    });

    it('should use default duration for info messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='info' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '4000');
    });

    it('should use custom duration for info messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='info-custom-duration' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '7000');
    });

    it('should use custom duration for custom messages', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='custom-message' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '9000');
    });

    it('should use default duration (6000) for custom messages without duration', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='custom-message-minimal' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '6000');
    });
  });

  describe('Snackbar Positioning and Anchor Origin', () => {
    it('should position snackbar at bottom-left', () => {
      render(
        <SnackbarProvider>
          <div>Test</div>
        </SnackbarProvider>
      );

      const snackbar = screen.getByTestId('mock-snackbar');
      const anchorOrigin = JSON.parse(snackbar.getAttribute('data-anchor-origin') || '{}');
      expect(anchorOrigin).toEqual({
        vertical: 'bottom',
        horizontal: 'left',
      });
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

      render(<SnackbarProvider>{children}</SnackbarProvider>);

      expect(screen.getByText('Text Node')).toBeInTheDocument();
      expect(screen.getByText('Button Node')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Conditional Node')).toBeInTheDocument();
    });

    it('should handle function components as children', () => {
      const FunctionalChild = () => <div data-testid='functional'>Functional Component</div>;

      render(
        <SnackbarProvider>
          <FunctionalChild />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('functional')).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(<SnackbarProvider>Plain text child</SnackbarProvider>);

      expect(screen.getByText('Plain text child')).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<SnackbarProvider>{123}</SnackbarProvider>);

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

      render(<SnackbarProvider>{children}</SnackbarProvider>);

      expect(screen.getByTestId('array-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('array-child-2')).toBeInTheDocument();
    });
  });

  describe('useSnackbar Hook', () => {
    it('should provide all required methods', () => {
      const HookTester = () => {
        const snackbar = useSnackbar();

        return (
          <div>
            <div data-testid='has-show-success'>{typeof snackbar.showSuccess}</div>
            <div data-testid='has-show-error'>{typeof snackbar.showError}</div>
            <div data-testid='has-show-warning'>{typeof snackbar.showWarning}</div>
            <div data-testid='has-show-info'>{typeof snackbar.showInfo}</div>
            <div data-testid='has-show-message'>{typeof snackbar.showMessage}</div>
          </div>
        );
      };

      render(
        <SnackbarProvider>
          <HookTester />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('has-show-success')).toHaveTextContent('function');
      expect(screen.getByTestId('has-show-error')).toHaveTextContent('function');
      expect(screen.getByTestId('has-show-warning')).toHaveTextContent('function');
      expect(screen.getByTestId('has-show-info')).toHaveTextContent('function');
      expect(screen.getByTestId('has-show-message')).toHaveTextContent('function');
    });

    it('should throw error when used outside of SnackbarProvider', () => {
      const InvalidConsumer = () => {
        useSnackbar();
        return <div>This should not render</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<InvalidConsumer />);
      }).toThrow('useSnackbar must be used within a SnackbarProvider');

      consoleSpy.mockRestore();
    });

    it('should maintain referential stability of methods', () => {
      let firstRenderMethods: any = {};
      let secondRenderMethods: any = {};

      const StabilityTester = ({ renderCount }: { renderCount: number }) => {
        const methods = useSnackbar();

        if (renderCount === 1) {
          firstRenderMethods = methods;
        } else {
          secondRenderMethods = methods;
        }

        return <div data-testid={`render-${renderCount}`}>Render {renderCount}</div>;
      };

      const { rerender } = render(
        <SnackbarProvider>
          <StabilityTester renderCount={1} />
        </SnackbarProvider>
      );

      rerender(
        <SnackbarProvider>
          <StabilityTester renderCount={2} />
        </SnackbarProvider>
      );

      expect(firstRenderMethods.showSuccess).toBe(secondRenderMethods.showSuccess);
      expect(firstRenderMethods.showError).toBe(secondRenderMethods.showError);
      expect(firstRenderMethods.showWarning).toBe(secondRenderMethods.showWarning);
      expect(firstRenderMethods.showInfo).toBe(secondRenderMethods.showInfo);
      expect(firstRenderMethods.showMessage).toBe(secondRenderMethods.showMessage);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty message strings', async () => {
      const user = userEvent.setup();

      const EmptyMessageConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button data-testid='empty-trigger' onClick={() => snackbar.showSuccess('')}>
            Empty Message
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <EmptyMessageConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('empty-trigger'));

      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveTextContent('');
      expect(alert).toHaveAttribute('data-severity', 'success');
    });

    it('should handle zero duration', async () => {
      const user = userEvent.setup();

      const ZeroDurationConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button
            data-testid='zero-duration-trigger'
            onClick={() => snackbar.showSuccess('Zero duration', 0)}
          >
            Zero Duration
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <ZeroDurationConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('zero-duration-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '0');
    });

    it('should handle negative duration', async () => {
      const user = userEvent.setup();

      const NegativeDurationConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button
            data-testid='negative-duration-trigger'
            onClick={() => snackbar.showMessage({ message: 'Negative duration', duration: -1000 })}
          >
            Negative Duration
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <NegativeDurationConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('negative-duration-trigger'));

      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-auto-hide-duration', '-1000');
    });

    it('should handle very long messages', async () => {
      const user = userEvent.setup();
      const longMessage = 'A'.repeat(1000);

      const LongMessageConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button data-testid='long-message-trigger' onClick={() => snackbar.showInfo(longMessage)}>
            Long Message
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <LongMessageConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('long-message-trigger'));

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in messages', async () => {
      const user = userEvent.setup();
      const specialMessage = '!@#$%^&*()_+{}|:"<>?[]\\;\',./`~';

      const SpecialCharConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button
            data-testid='special-char-trigger'
            onClick={() => snackbar.showWarning(specialMessage)}
          >
            Special Characters
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <SpecialCharConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('special-char-trigger'));

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle unicode characters in messages', async () => {
      const user = userEvent.setup();
      const unicodeMessage =
        '🚀 Testing with emojis 🎉 and unicode characters: café, résumé, naïve';

      const UnicodeConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button
            data-testid='unicode-trigger'
            onClick={() => snackbar.showSuccess(unicodeMessage)}
          >
            Unicode
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <UnicodeConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('unicode-trigger'));

      expect(screen.getByText(unicodeMessage)).toBeInTheDocument();
    });

    it('should handle rapid consecutive message calls', async () => {
      const user = userEvent.setup();

      const RapidCallsConsumer = () => {
        const snackbar = useSnackbar();
        return (
          <button
            data-testid='rapid-calls-trigger'
            onClick={() => {
              snackbar.showSuccess('First');
              snackbar.showError('Second');
              snackbar.showWarning('Third');
              snackbar.showInfo('Final');
            }}
          >
            Rapid Calls
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <RapidCallsConsumer />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('rapid-calls-trigger'));

      // Should show the last message
      expect(screen.getByText('Final')).toBeInTheDocument();
      const alert = screen.getByTestId('mock-alert');
      expect(alert).toHaveAttribute('data-severity', 'info');
    });
  });

  describe('Integration with MUI Snackbar Components', () => {
    it('should pass correct props to MUI Snackbar', () => {
      render(
        <SnackbarProvider>
          <div>Test</div>
        </SnackbarProvider>
      );

      expect(mockSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          open: false,
          autoHideDuration: 6000,
          onClose: expect.any(Function),
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          children: expect.any(Object),
        }),
        undefined
      );
    });

    it('should pass correct props to MUI Alert', () => {
      render(
        <SnackbarProvider>
          <div>Test</div>
        </SnackbarProvider>
      );

      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          onClose: expect.any(Function),
          severity: 'info',
          variant: 'filled',
          sx: { width: '100%' },
          children: '',
        }),
        undefined
      );
    });

    it('should update MUI component props when snackbar state changes', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='error' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      // Check that Snackbar received updated props
      const snackbarCalls = mockSnackbar.mock.calls;
      const lastSnackbarCall = snackbarCalls[snackbarCalls.length - 1];
      expect(lastSnackbarCall[0]).toMatchObject({
        open: true,
        autoHideDuration: 6000,
      });

      // Check that Alert received updated props
      const alertCalls = mockAlert.mock.calls;
      const lastAlertCall = alertCalls[alertCalls.length - 1];
      expect(lastAlertCall[0]).toMatchObject({
        severity: 'error',
        variant: 'filled',
        sx: { width: '100%' },
        children: 'Error message',
      });
    });

    it('should handle Alert onClose callback', async () => {
      const user = userEvent.setup();

      render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' action='success' />
        </SnackbarProvider>
      );

      await user.click(screen.getByTestId('consumer-trigger'));

      // Click on the alert (which triggers onClose)
      const alert = screen.getByTestId('mock-alert');
      await user.click(alert);

      // Snackbar should be closed
      const snackbar = screen.getByTestId('mock-snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks with multiple renders', () => {
      const { rerender, unmount } = render(
        <SnackbarProvider>
          <div>Test 1</div>
        </SnackbarProvider>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <SnackbarProvider>
            <div>Test {i + 2}</div>
          </SnackbarProvider>
        );
      }

      expect(() => unmount()).not.toThrow();
    });

    it('should maintain performance with frequent message changes', async () => {
      const user = userEvent.setup();

      const PerformanceConsumer = () => {
        const snackbar = useSnackbar();
        let counter = 0;

        return (
          <button
            data-testid='performance-trigger'
            onClick={() => {
              counter++;
              snackbar.showInfo(`Message ${counter}`);
            }}
          >
            Performance Test
          </button>
        );
      };

      render(
        <SnackbarProvider>
          <PerformanceConsumer />
        </SnackbarProvider>
      );

      const trigger = screen.getByTestId('performance-trigger');

      // Simulate rapid clicking
      for (let i = 0; i < 5; i++) {
        await user.click(trigger);
      }

      // Should not cause any performance issues or errors
      expect(screen.getByTestId('mock-snackbar')).toBeInTheDocument();
    });

    it('should clean up properly when unmounted', () => {
      const { unmount } = render(
        <SnackbarProvider>
          <TestConsumer testId='consumer' />
        </SnackbarProvider>
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
