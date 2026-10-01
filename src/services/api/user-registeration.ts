import { API } from "../enpoint";
import { apiService, type TResponse } from "./../api-service";

export interface IUserRegisterationRequest {
  name: string;
  email: string;
  password: string;
}

export interface IUserRegisterationResponse {
  status?: number;
  ok?: boolean;
  data?: TResponse<IResponseData> | null;
  error?: string;
}

interface IResponseData {
  email: string;
  id: number;
  lastSeen: Date | null;
  name: string;
  profileImageUrl: string;
  status: "OFFLINE" | "ONLINE";
}

export class UserRegisterationAPI {
  public static invoke = async (
    payload: IUserRegisterationRequest,
  ): Promise<IUserRegisterationResponse> => {
    try {
      const response = await apiService.post<IResponseData>(
        API.REGISTER,
        payload,
      );

      if (response.status === 200) {
        return { data: response.data || null, ok: true };
      } else {
        throw new Error(`Response not ok: ${(response.data || "").toString()}`);
      }
    } catch (error: unknown) {
      return {
        error: `${error instanceof Error ? error?.message : "An unknown error occurred"}`,
        ok: false,
      };
    }
  };
}
