import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiService } from "../services/api-service";

export type ChatId = number | string;

export interface ChatConversation {
  id: ChatId;
  type: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatUser {
  id: ChatId;
  name: string;
  profileImageUrl?: string | null;
  status?: string;
  email: string
}

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface ChatState {
  chats: ChatConversation[];
  availableUsers: ChatUser[];
  activeChatId: ChatId | null;
  status: RequestStatus;
  usersStatus: RequestStatus;
  creatingUserId: ChatId | null;
  error: string | null;
  usersError: string | null;
  createError: string | null;
}

const initialState: ChatState = {
  chats: [],
  availableUsers: [],
  activeChatId: null,
  status: "idle",
  usersStatus: "idle",
  creatingUserId: null,
  error: null,
  usersError: null,
  createError: null,
};

export const fetchUserChats = createAsyncThunk<
  ChatConversation[],
  void,
  { rejectValue: string }
>("chat/fetchUserChats", async (_, { rejectWithValue }) => {
  const response = await apiService.getUserChats<ChatConversation[]>();
  if (!response.ok) {
    return rejectWithValue(response.error ?? "Unable to load your chats.");
  }

  if (!Array.isArray(response.data)) {
    return rejectWithValue("The chat list response was invalid.");
  }

  return response.data;
}, {
  condition: (_, { getState }) => {
    const state = getState() as { chat: ChatState };
    return state.chat.status !== "loading";
  },
});

export const fetchAvailableUsers = createAsyncThunk<
  ChatUser[],
  void,
  { rejectValue: string }
>("chat/fetchAvailableUsers", async (_, { rejectWithValue }) => {
  const response = await apiService.getUsers<ChatUser[]>();
  if (!response.ok) {
    return rejectWithValue(response.error ?? "Unable to load users.");
  }

  if (!Array.isArray(response.data)) {
    return rejectWithValue("The users response was invalid.");
  }

  return response.data;
}, {
  condition: (_, { getState }) => {
    const state = getState() as { chat: ChatState };
    return state.chat.usersStatus !== "loading";
  },
});

export const createChat = createAsyncThunk<
  { chats: ChatConversation[]; createdChat?: ChatConversation },
  ChatUser,
  { rejectValue: string }
>("chat/createChat", async (user, { rejectWithValue }) => {
  const createResponse = await apiService.createChat<ChatConversation>({
    participantIds: [user.id],
    type: 'PRIVATE',
    name: user.name,

  });
  if (!createResponse.ok) {
    return rejectWithValue(createResponse.error ?? "Unable to start this chat.");
  }

  const chatsResponse = await apiService.getUserChats<ChatConversation[]>();
  if (!chatsResponse.ok || !Array.isArray(chatsResponse.data)) {
    return rejectWithValue(chatsResponse.error ?? "Unable to refresh your chats.");
  }

  return { chats: chatsResponse.data, createdChat: createResponse.data };
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    selectChat: (state, action: PayloadAction<ChatId>) => {
      state.activeChatId = action.payload;
    },
    resetChats: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserChats.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.chats = action.payload;
        state.status = "succeeded";
        if (!state.chats.some((chat) => chat.id === state.activeChatId)) {
          state.activeChatId = state.chats[0]?.id ?? null;
        }
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.status = "failed";
        state.error = action.payload ?? "Unable to load your chats.";
      })
      .addCase(fetchAvailableUsers.pending, (state) => {
        state.usersStatus = "loading";
        state.usersError = null;
      })
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.availableUsers = action.payload;
        state.usersStatus = "succeeded";
      })
      .addCase(fetchAvailableUsers.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.usersStatus = "failed";
        state.usersError = action.payload ?? "Unable to load users.";
      })
      .addCase(createChat.pending, (state, action) => {
        state.creatingUserId = action.meta.arg.id;
        state.createError = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.chats = action.payload.chats;
        state.activeChatId = action.payload.createdChat?.id
          ?? state.chats[state.chats.length - 1]?.id
          ?? null;
        state.creatingUserId = null;
        state.status = "succeeded";
      })
      .addCase(createChat.rejected, (state, action) => {
        state.creatingUserId = null;
        state.createError = action.payload ?? "Unable to start this chat.";
      });
  },
});

export const { resetChats, selectChat } = chatSlice.actions;
export default chatSlice.reducer;