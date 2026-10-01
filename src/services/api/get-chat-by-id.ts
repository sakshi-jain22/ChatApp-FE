import { API } from "../enpoint";
import { apiService, type TResponse } from "../api-service";

export class GetChatByIdAPI {
  public static invoke = async <T = unknown>(
    chatId: string | number,
  ): Promise<TResponse<T>> => {
    try {
      const response = await apiService.get<T>(API.CHAT(chatId));
      return { ...response.data, ok: true };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };
}