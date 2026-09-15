import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { Project, ProjectMember } from "../../types";
import { projectApi } from "../../services";

interface ProjectState {
  projects: Project[];
  current: Project | null;
  members: ProjectMember[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  current: null,
  members: [],
  status: "idle",
  error: null,
};

export const fetchProjects = createAsyncThunk("projects/fetchAll", async () => {
  return await projectApi.list();
});

export const fetchProject = createAsyncThunk(
  "projects/fetchOne",
  async (id: string) => {
    return await projectApi.get(id);
  }
);

export const fetchMembers = createAsyncThunk(
  "projects/fetchMembers",
  async (id: string) => {
    return await projectApi.members(id);
  }
);

export const createProject = createAsyncThunk(
  "projects/create",
  async (data: { name: string; key: string; description?: string }) => {
    return await projectApi.create(data);
  }
);

export const addMember = createAsyncThunk(
  "projects/addMember",
  async ({ projectId, userId, role }: { projectId: string; userId: string; role: "ADMIN" | "MEMBER" | "VIEWER" }) => {
    return await projectApi.addMember(projectId, { userId, role });
  }
);

export const removeMember = createAsyncThunk(
  "projects/removeMember",
  async ({ projectId, userId }: { projectId: string; userId: string }) => {
    return await projectApi.removeMember(projectId, userId);
  }
);

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProject(state) {
      state.current = null;
      state.members = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.projects = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load projects";
      })
      .addCase(fetchProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.current = action.payload;
      })
      .addCase(fetchMembers.fulfilled, (state, action: PayloadAction<ProjectMember[]>) => {
        state.members = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.projects = [action.payload, ...state.projects];
      })
      .addCase(addMember.fulfilled, (state, action: PayloadAction<ProjectMember>) => {
        state.members = [...state.members.filter((m) => m.userId !== action.payload.userId), action.payload];
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.userId !== action.meta.arg.userId);
      });
  },
});

export const { clearProject } = projectSlice.actions;
export default projectSlice.reducer;