import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { Sprint } from "../../types";
import { sprintApi } from "../../services";

interface SprintState {
  sprints: Sprint[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SprintState = {
  sprints: [],
  status: "idle",
  error: null,
};

export const fetchSprints = createAsyncThunk(
  "sprints/fetchAll",
  async (projectId: string) => {
    return await sprintApi.list(projectId);
  }
);

export const createSprint = createAsyncThunk(
  "sprints/create",
  async ({
    projectId,
    data,
  }: {
    projectId: string;
    data: { name: string; goal?: string; startDate?: string | null; endDate?: string | null };
  }) => {
    return await sprintApi.create(projectId, data);
  }
);

export const startSprint = createAsyncThunk(
  "sprints/start",
  async (id: string, { getState }) => {
    const state = getState() as { sprints: SprintState };
    const sprint = state.sprints.sprints.find((s) => s.id === id);
    if (!sprint) throw new Error("Sprint not found");
    return await sprintApi.start(sprint.projectId, id);
  }
);

export const completeSprint = createAsyncThunk(
  "sprints/complete",
  async (id: string, { getState }) => {
    const state = getState() as { sprints: SprintState };
    const sprint = state.sprints.sprints.find((s) => s.id === id);
    if (!sprint) throw new Error("Sprint not found");
    return await sprintApi.complete(sprint.projectId, id);
  }
);

const sprintSlice = createSlice({
  name: "sprints",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSprints.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSprints.fulfilled, (state, action: PayloadAction<Sprint[]>) => {
        state.sprints = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load sprints";
      })
      .addCase(createSprint.fulfilled, (state, action: PayloadAction<Sprint>) => {
        state.sprints = [action.payload, ...state.sprints];
      })
      .addCase(startSprint.fulfilled, (state, action: PayloadAction<Sprint>) => {
        const idx = state.sprints.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sprints[idx] = action.payload;
      })
      .addCase(completeSprint.fulfilled, (state, action: PayloadAction<Sprint>) => {
        const idx = state.sprints.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sprints[idx] = action.payload;
      });
  },
});

export default sprintSlice.reducer;