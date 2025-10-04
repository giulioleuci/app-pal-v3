import isEqual from 'lodash.isequal';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { SessionModel, TrainingPlanModel } from '../domain';

interface PlanEditorState {
  originalPlan: TrainingPlanModel | null;
  draftPlan: TrainingPlanModel | null;
  isDirty: boolean;
}

interface PlanEditorActions {
  loadPlan: (plan: TrainingPlanModel) => void;
  updateDetails: (details: { name: string; description?: string }) => void;
  addSession: (session: SessionModel) => void;
  removeSession: (sessionId: string) => void;
  reorderSession: (sessionId: string, newIndex: number) => void;
  reset: () => void;
  unload: () => void;
}

const initialState: PlanEditorState = {
  originalPlan: null,
  draftPlan: null,
  isDirty: false,
};

/**
 * A Zustand store to manage the state of the high-level training plan editor.
 */
export const usePlanEditorStore = create<PlanEditorState & PlanEditorActions>()(
  immer((set) => ({
    ...initialState,

    loadPlan: (plan) =>
      set((state) => {
        state.originalPlan = plan;
        state.draftPlan = plan;
        state.isDirty = false;
      }),

    updateDetails: (details) =>
      set((state) => {
        if (state.draftPlan) {
          state.draftPlan = state.draftPlan.cloneWithUpdatedDetails(details);
          state.isDirty = !isEqual(
            state.originalPlan?.toPlainObject(),
            state.draftPlan.toPlainObject()
          );
        }
      }),

    addSession: (session) =>
      set((state) => {
        if (state.draftPlan) {
          state.draftPlan = state.draftPlan.cloneWithAddedSession(session);
          state.isDirty = true;
        }
      }),

    removeSession: (sessionId) =>
      set((state) => {
        if (state.draftPlan) {
          state.draftPlan = state.draftPlan.cloneWithRemovedSession(sessionId);
          state.isDirty = !isEqual(
            state.originalPlan?.toPlainObject(),
            state.draftPlan.toPlainObject()
          );
        }
      }),

    reorderSession: (sessionId, newIndex) =>
      set((state) => {
        if (state.draftPlan) {
          state.draftPlan = state.draftPlan.cloneWithReorderedSession(sessionId, newIndex);
          state.isDirty = !isEqual(
            state.originalPlan?.toPlainObject(),
            state.draftPlan.toPlainObject()
          );
        }
      }),

    reset: () =>
      set((state) => {
        state.draftPlan = state.originalPlan;
        state.isDirty = false;
      }),

    unload: () => set(initialState),
  }))
);
