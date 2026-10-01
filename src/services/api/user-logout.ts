import { API } from "../enpoint";
import { apiService, type TResponse } from "./../api-service";

export interface IUserLoginRequest {
  email: string;
  password: string;
}

export interface IUserLogoutResponse {
  status?: number;
  ok?: boolean;
  data?: TResponse<void>;
  error?: string;
}


export class UserLogoutAPI {
  public static invoke = async (
  ): Promise<IUserLogoutResponse> => {
    try {
      await apiService.post(API.LOGOUT);
      return { ok: true };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };
}
