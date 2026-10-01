import { API } from "../enpoint";
import { apiService, type TResponse } from "../api-service";

export class GetCurrentUserAPI {
  public static invoke = async <T = unknown>(): Promise<TResponse<T>> => {
    try {
      const response = await apiService.get<T>(API.CURRENT_USER);
      return { data: response.data as T, ok: true };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };
}