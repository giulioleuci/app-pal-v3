import { fireEvent, render, screen, waitFor } from '@/test-utils';

import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Test Title',
    message: 'Test message',
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent('Test message');
  });

  it('should not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should display custom button text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText='Delete Now' cancelText='Keep It' />);

    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('Delete Now');
    expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('Keep It');
  });

  it('should handle loading state correctly', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    const cancelButton = screen.getByTestId('confirm-dialog-cancel');

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(confirmButton.querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('should apply danger variant styling', () => {
    render(<ConfirmDialog {...defaultProps} variant='danger' />);

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    expect(confirmButton).toHaveClass('MuiButton-containedError');
  });

  it('should apply warning variant styling', () => {
    render(<ConfirmDialog {...defaultProps} variant='warning' />);

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    expect(confirmButton).toHaveClass('MuiButton-containedWarning');
  });

  it('should apply default variant styling', () => {
    render(<ConfirmDialog {...defaultProps} variant='default' />);

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    expect(confirmButton).toHaveClass('MuiButton-containedPrimary');
  });

  it('should not allow interactions when loading', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog {...defaultProps} isLoading={true} onConfirm={onConfirm} onClose={onClose} />
    );

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    const cancelButton = screen.getByTestId('confirm-dialog-cancel');

    fireEvent.click(confirmButton);
    fireEvent.click(cancelButton);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation correctly', async () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    // Press Escape key on the dialog
    const dialog = screen.getByTestId('confirm-dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should focus trap correctly within the dialog', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByTestId('confirm-dialog-cancel');
    const confirmButton = screen.getByTestId('confirm-dialog-confirm');

    // MUI Dialog should have proper focus management with sentinel elements
    expect(screen.getByTestId('sentinelStart')).toBeInTheDocument();
    expect(screen.getByTestId('sentinelEnd')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const dialog = screen.getByTestId('confirm-dialog');
    const title = screen.getByTestId('confirm-dialog-title');
    const message = screen.getByTestId('confirm-dialog-message');

    // MUI Dialog assigns role='presentation' to the root and role='dialog' to the paper
    expect(dialog).toHaveAttribute('role', 'presentation');

    // Find the actual dialog paper element
    const dialogPaper = document.querySelector('[role="dialog"]');
    expect(dialogPaper).toBeInTheDocument();
    expect(dialogPaper).toHaveAttribute('aria-labelledby');

    expect(title).toHaveAttribute('id');
    expect(message).toBeInTheDocument();
  });
});
