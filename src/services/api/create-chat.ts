import { API } from "../enpoint";
import { apiService, type TResponse } from "../api-service";

export class CreateChatAPI {
  public static invoke = async <T = unknown>(
    payload: Record<string, unknown>,
  ): Promise<TResponse<T>> => {
    try {
      const response = await apiService.post<T>(API.CHATS, payload);
      return { data: response.data as T, ok: true };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };
}