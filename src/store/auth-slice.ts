import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { IUserLoginRequest } from "../services/api/user-login";
import type { IUserRegisterationRequest } from "../services/api/user-registeration";
import { apiService } from "../services/api-service";
import { AUTH_STORAGE_KEY } from "../constants";
import { getCurrentUser } from "./settings-slice";

interface AuthState {
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem(AUTH_STORAGE_KEY),
  status: "idle",
  error: null,
  isLoggedIn: false,
};

export const loginUser = createAsyncThunk<
  string,
  IUserLoginRequest,
  { rejectValue: string }
>("auth/login", async (payload, { dispatch, rejectWithValue }) => {
  const response = await apiService.userLogin(payload);
  if (!response.ok) {
    return rejectWithValue(response.error ?? "Unable to sign in.");
  }
  console.log('response: ', response);
  const { token = "" } = response.data || {};
  console.log("token: ", {token})
  if (!token) {
    return rejectWithValue("The login response did not include an auth token.");
  }

  dispatch(getCurrentUser());

  localStorage.setItem(AUTH_STORAGE_KEY, token);
  return token;
});

export const registerUser = createAsyncThunk<
  void,
  IUserRegisterationRequest,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  const response = await apiService.userRegisteration(payload);
  if (!response.ok) {
    return rejectWithValue(response.error ?? "Unable to create your account.");
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.userLogout();
      if (!response.ok) {
        return rejectWithValue(response.error ?? "Unable to sign out.");
      }
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.isLoggedIn = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('action: ', action);
        state.token = action.payload;
        state.status = "succeeded";
        state.isLoggedIn = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ?? action.error.message ?? "Unable to sign in.";
        state.isLoggedIn = false
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.isLoggedIn = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = "succeeded";
        state.isLoggedIn = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ??
          action.error.message ??
          "Unable to create your account.";
        state.isLoggedIn = false;
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.token = null;
        state.isLoggedIn = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.status = "idle";
        state.isLoggedIn = false;
        
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.token = null;
        state.status = "failed";
        state.error =
          action.payload ?? action.error.message ?? "Unable to sign out.";
      });
  },
});

export default authSlice.reducer;
