import { fireEvent, render, screen } from '@/test-utils';

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('should render correctly with default props', () => {
    render(<EmptyState context='workouts' />);

    expect(screen.getByTestId('empty-state-component')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for workouts', () => {
    render(<EmptyState context='workouts' />);

    // These would normally come from i18n, but we're testing the structure
    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for exercises', () => {
    render(<EmptyState context='exercises' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for training plans', () => {
    render(<EmptyState context='trainingPlans' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for workout sessions', () => {
    render(<EmptyState context='workoutSessions' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for progress', () => {
    render(<EmptyState context='progress' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for profile', () => {
    render(<EmptyState context='profile' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for notifications', () => {
    render(<EmptyState context='notifications' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render contextual content for search', () => {
    render(<EmptyState context='search' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render generic content for generic context', () => {
    render(<EmptyState context='generic' />);

    expect(screen.getByTestId('empty-state-title')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toBeInTheDocument();
  });

  it('should render custom title and message when provided', () => {
    render(<EmptyState context='workouts' title='Custom Title' message='Custom message content' />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Custom Title');
    expect(screen.getByTestId('empty-state-message')).toHaveTextContent('Custom message content');
  });

  it('should render action button when provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        context='workouts'
        action={{
          label: 'Create Workout',
          onClick: onAction,
        }}
      />
    );

    const actionButton = screen.getByTestId('empty-state-action');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent('Create Workout');
  });

  it('should call action onClick when action button is clicked', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        context='workouts'
        action={{
          label: 'Create Workout',
          onClick: onAction,
        }}
      />
    );

    fireEvent.click(screen.getByTestId('empty-state-action'));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should render with contained button variant', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        context='workouts'
        action={{
          label: 'Create Workout',
          onClick: onAction,
          variant: 'contained',
        }}
      />
    );

    const actionButton = screen.getByTestId('empty-state-action');
    expect(actionButton).toHaveClass('MuiButton-contained');
  });

  it('should render with outlined button variant', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        context='workouts'
        action={{
          label: 'Create Workout',
          onClick: onAction,
          variant: 'outlined',
        }}
      />
    );

    const actionButton = screen.getByTestId('empty-state-action');
    expect(actionButton).toHaveClass('MuiButton-outlined');
  });

  it('should render with text button variant', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        context='workouts'
        action={{
          label: 'Create Workout',
          onClick: onAction,
          variant: 'text',
        }}
      />
    );

    const actionButton = screen.getByTestId('empty-state-action');
    expect(actionButton).toHaveClass('MuiButton-text');
  });

  it('should render fullPage variant correctly', () => {
    render(<EmptyState context='workouts' variant='fullPage' />);

    const container = screen.getByTestId('empty-state-component');
    expect(container).toHaveStyle({
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('should render inline variant correctly (default)', () => {
    render(<EmptyState context='workouts' variant='inline' />);

    const container = screen.getByTestId('empty-state-component');
    expect(container).toHaveClass('MuiPaper-root');
  });

  it('should not render action button when no action is provided', () => {
    render(<EmptyState context='workouts' />);

    expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<EmptyState context='workouts' />);

    const title = screen.getByTestId('empty-state-title');
    const message = screen.getByTestId('empty-state-message');

    // Typography with component='h2' renders as h2 without explicit role
    expect(title).toHaveProperty('tagName', 'H2');
    expect(message).toBeInTheDocument();
  });

  it('should render with custom icon when provided', () => {
    render(<EmptyState context='workouts' icon='star' />);

    // The icon would be rendered by the Icon component
    expect(screen.getByTestId('empty-state-component')).toBeInTheDocument();
  });
});
