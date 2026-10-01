import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { apiService } from "../services/api-service";

interface CurrentUser {
  name: string;
}

interface SettingsState {
  showSearch: boolean;
  enableNotifications: boolean;
  isOnline: boolean;
  username: string;
  email: string;
}

const initialState: SettingsState = {
  showSearch: false,
  enableNotifications: false,
  isOnline: false,
  username: "",
  email: "",
};

export const getCurrentUser = createAsyncThunk<
  string,
  never,
  { rejectValue: string }
>("settings/user/me", async (_, { rejectWithValue }) => {
  const response = await apiService.getCurrentUser<CurrentUser>();
  if (!response.ok) {
    return rejectWithValue(response.error ?? "Unable to get user data.");
  }
  console.log("response: ", response);

  //   if (response?.data?.name) {
  //     setUsername(response.data?.name||"")
  //   }

  return response.data;
});

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setEnableNotifications: (state, action) => {
      state.enableNotifications = action.payload;
    },
    setShowSearch: (state, action) => {
      state.showSearch = action.payload;
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    resetSettings: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.username = "";
        state.isOnline = false;
        state.email = "";
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        console.log("action: ", action);
        state.username = action.payload.name;
        state.isOnline = action.payload.status === "ONLINE";
        state.email = action.payload.email;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.username = "";
        state.isOnline = false;
        state.email = "";
      });
  },
});

export const {
  setEnableNotifications,
  setShowSearch,
  setOnlineStatus,
  setUsername,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
