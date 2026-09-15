import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { Issue, IssueStatus } from "../../types";
import { issueApi } from "../../services";

interface IssueState {
  issues: Issue[];
  filters: Record<string, string | number | undefined>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: IssueState = {
  issues: [],
  filters: {},
  status: "idle",
  error: null,
};

export const fetchIssues = createAsyncThunk(
  "issues/fetchAll",
  async ({ projectId, filters }: { projectId: string; filters?: Record<string, string | number | undefined> }) => {
    return await issueApi.list(projectId, filters);
  }
);

export const createIssue = createAsyncThunk(
  "issues/create",
  async ({
    projectId,
    data,
  }: {
    projectId: string;
    data: Partial<Issue>;
  }) => {
    return await issueApi.create(projectId, data);
  }
);

export const updateIssue = createAsyncThunk(
  "issues/update",
  async (
    { id, data }: { id: string; data: Partial<Omit<Issue, "id">> },
    { getState }
  ) => {
    const state = getState() as { issues: IssueState };
    const issue = state.issues.issues.find((i) => i.id === id);
    if (!issue) throw new Error("Issue not found");
    return await issueApi.update(issue.projectId, id, data);
  }
);

export const setIssueStatus = createAsyncThunk(
  "issues/setStatus",
  async ({ id, status, position }: { id: string; status: IssueStatus; position: number }, { getState }) => {
    const state = getState() as { issues: IssueState };
    const issue = state.issues.issues.find((i) => i.id === id);
    if (!issue) throw new Error("Issue not found");
    return await issueApi.updateStatus(issue.projectId, id, status, position);
  }
);

const issueSlice = createSlice({
  name: "issues",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<Record<string, string | number | undefined>>) {
      state.filters = action.payload;
    },
    clearFilters(state) {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIssues.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchIssues.fulfilled, (state, action: PayloadAction<Issue[]>) => {
        state.issues = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load issues";
      })
      .addCase(createIssue.fulfilled, (state, action: PayloadAction<Issue>) => {
        state.issues = [...state.issues, action.payload];
      })
      .addCase(updateIssue.fulfilled, (state, action: PayloadAction<Issue>) => {
        const idx = state.issues.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.issues[idx] = action.payload;
        }
      })
      .addCase(setIssueStatus.fulfilled, (state, action: PayloadAction<Issue>) => {
        const idx = state.issues.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.issues[idx] = action.payload;
        }
      });
  },
});

export const { setFilter, clearFilters } = issueSlice.actions;
export default issueSlice.reducer;