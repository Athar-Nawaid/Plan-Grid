import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  issueModal: { open: boolean; issueId: string | null; createFor: { status: string } | null };
  projectModalOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  issueModal: { open: false, issueId: null, createFor: null },
  projectModalOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openIssueModal(
      state,
      action: PayloadAction<{ issueId?: string; createFor?: { status: string } | null }>
    ) {
      state.issueModal = {
        open: true,
        issueId: action.payload.issueId ?? null,
        createFor: action.payload.createFor ?? null,
      };
    },
    closeIssueModal(state) {
      state.issueModal = { open: false, issueId: null, createFor: null };
    },
    setProjectModal(state, action: PayloadAction<boolean>) {
      state.projectModalOpen = action.payload;
    },
  },
});

export const { toggleSidebar, openIssueModal, closeIssueModal, setProjectModal } = uiSlice.actions;
export default uiSlice.reducer;