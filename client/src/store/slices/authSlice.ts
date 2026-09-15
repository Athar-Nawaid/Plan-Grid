import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthResponse, User } from "../../types";
import { authApi, clearToken, getToken, setToken } from "../../services";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: getToken(),
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }) => {
    return await authApi.login(data);
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: { email: string; name: string; password: string }) => {
    return await authApi.register(data);
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      clearToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        setToken(action.payload.token);
        state.status = "succeeded";
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        setToken(action.payload.token);
        state.status = "succeeded";
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Registration failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;