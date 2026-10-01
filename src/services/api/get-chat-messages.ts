import { API } from "../enpoint";
import { apiService, type TResponse } from "../api-service";

export class GetChatMessagesAPI {
  public static invoke = async <T = unknown>(
    chatId: string | number,
  ): Promise<TResponse<T>> => {
    try {
      const response = await apiService.get<T>(API.CHAT_MESSAGES(chatId));
      return { ...response.data, ok: true };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };
}