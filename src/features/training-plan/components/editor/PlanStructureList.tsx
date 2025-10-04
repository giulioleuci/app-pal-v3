import Stack from '@mui/material/Stack';
import React from 'react';

import { SessionCard } from './SessionCard';

export interface Session {
  id: string;
  name: string;
  notes?: string;
  execution_count: number;
  is_deload: boolean;
  day_of_week?: string;
}

export interface PlanStructureListProps {
  /**
   * Array of workout sessions to display
   */
  sessions: Session[];
  /**
   * Callback fired when a session should be reordered
   */
  onReorderSession?: (sessionId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when a session should be edited
   */
  onEditSession?: (sessionId: string) => void;
  /**
   * Callback fired when a session should be deleted
   */
  onDeleteSession?: (sessionId: string) => void;
  /**
   * Callback fired when a new session should be added
   */
  onAddSession?: () => void;
  /**
   * Whether the list is in a loading state
   */
  isLoading?: boolean;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A vertical list component that displays workout sessions in a training plan.
 * Each session is rendered as a SessionCard with controls for reordering, editing, and deleting.
 * Follows the mobile-first vertical layout strategy.
 *
 * @example
 * ```tsx
 * <PlanStructureList
 *   sessions={sessions}
 *   onReorderSession={handleReorderSession}
 *   onEditSession={handleEditSession}
 *   onDeleteSession={handleDeleteSession}
 *   onAddSession={handleAddSession}
 * />
 * ```
 */
export const PlanStructureList = ({
  sessions,
  onReorderSession,
  onEditSession,
  onDeleteSession,
  onAddSession,
  isLoading = false,
  'data-testid': testId = 'plan-structure-list',
}: PlanStructureListProps) => {
  return (
    <Stack
      spacing={2}
      data-testid={testId}
      sx={{
        width: '100%',
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? 'none' : 'auto',
      }}
    >
      {sessions.map((session, index) => (
        <SessionCard
          key={session.id}
          session={session}
          isFirst={index === 0}
          isLast={index === sessions.length - 1}
          onReorder={onReorderSession}
          onEdit={onEditSession}
          onDelete={onDeleteSession}
          data-testid={`session-card-${session.id}`}
        />
      ))}
    </Stack>
  );
};
