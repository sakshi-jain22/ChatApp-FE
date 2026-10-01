import { API } from "../enpoint";
import { apiService, type TResponse } from "./../api-service";

export interface IUserLoginRequest {
  email: string;
  password: string;
}

export interface IResponseData {
  token: string;
}

export class UserLoginAPI {
  public static invoke = async (
    payload: IUserLoginRequest,
  ): Promise<TResponse<IResponseData>> => {
    try {
      const response = await apiService.post<IResponseData>(API.LOGIN, payload);

      if (response.status === 200) {
        return { data: response.data, ok: true };
      } else {
        throw new Error(`Response not ok: ${(response?.data||'')?.toString()}`);
      }
    } catch (error: unknown) {
      console.log('error:' , error)
      return {
        error: `${error instanceof Error ? error?.message : "An unknown error occurred"}`,
        ok: false,
      };
    }
  };
}
