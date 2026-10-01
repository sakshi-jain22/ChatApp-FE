import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import {
  UserRegisterationAPI,
  type IUserRegisterationRequest,
  type IUserRegisterationResponse,
} from "./api/user-registeration";
import {
  UserLoginAPI,
  type IResponseData,
  type IUserLoginRequest,
} from "./api/user-login";
import { UserLogoutAPI, type IUserLogoutResponse } from "./api/user-logout";
import { GetCurrentUserAPI } from "./api/get-current-user";
import { GetUsersAPI } from "./api/get-users";
import { GetUserChatsAPI } from "./api/get-user-chats";
import { CreateChatAPI } from "./api/create-chat";
import { GetChatByIdAPI } from "./api/get-chat-by-id";
import { GetChatMessagesAPI } from "./api/get-chat-messages";
import { AUTH_STORAGE_KEY } from "../constants";

export interface TResponse<TData> {
  status?: number;
  ok?: boolean;
  data?: TData;
  error?: string;
}

class ApiService {
  private static instance: ApiService;
  private readonly client: AxiosInstance;

  private constructor() {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    let authorization = '';
    if (token) authorization = `Bearer ${token}`;

    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: authorization
      },
    });
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }

    return ApiService.instance;
  }

  public async post<T>(
    endpoint: string,
    payload?: unknown,
  ): Promise<AxiosResponse<TResponse<T>>> {
    const response = await this.client.post<TResponse<T>>(endpoint, payload);

    return response;
  }

  public async get<T>(endpoint: string): Promise<AxiosResponse<TResponse<T>>> {
    const response = await this.client.get<TResponse<T>>(endpoint);

    return response;
  }

  public async userRegisteration(
    payload: IUserRegisterationRequest,
  ): Promise<IUserRegisterationResponse> {
    return await UserRegisterationAPI.invoke(payload);
  }

  public async userLogin(
    payload: IUserLoginRequest,
  ): Promise<TResponse<IResponseData>> {
    const response = await UserLoginAPI.invoke(payload);
    const { token = "" } = response.data || {};

    if (token) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            this.client.defaults.headers["Authorization"] = `Bearer ${token}`;

    }

    return response;
  }

  public async userLogout(): Promise<IUserLogoutResponse> {
    this.client.defaults.headers.common["Authorization"] = '';
    this.client.defaults.headers["Authorization"] = '';
    return await UserLogoutAPI.invoke();
  }

  public async getCurrentUser<T = unknown>(): Promise<TResponse<T>> {
    return GetCurrentUserAPI.invoke<T>();
  }

  public async getUsers<T = unknown>(): Promise<TResponse<T>> {
    return GetUsersAPI.invoke<T>();
  }

  public async getUserChats<T = unknown>(): Promise<TResponse<T>> {
    return GetUserChatsAPI.invoke<T>();
  }

  public async createChat<T = unknown>(
    payload: Record<string, unknown>,
  ): Promise<TResponse<T>> {
    return CreateChatAPI.invoke<T>(payload);
  }

  public async getChatById<T = unknown>(
    chatId: string | number,
  ): Promise<TResponse<T>> {
    return GetChatByIdAPI.invoke<T>(chatId);
  }

  public async getChatMessages<T = unknown>(
    chatId: string | number,
  ): Promise<TResponse<T>> {
    return GetChatMessagesAPI.invoke<T>(chatId);
  }
}

export const apiService = ApiService.getInstance();
export default ApiService;
