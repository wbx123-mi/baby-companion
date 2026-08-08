import type { ApiFailure, ApiSuccess } from "@baby-companion/contracts";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface HttpRequestOptions {
  path: string;
  method?: HttpMethod;
  data?: UniNamespace.RequestOptions["data"];
  headers?: Record<string, string>;
  accessToken?: string | null;
}

export class HttpApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "HttpApiError";
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000/api/v1").replace(/\/$/, "");

export function rawRequest<T>(options: HttpRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-request-id": createRequestId(),
      ...options.headers,
    };
    if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;

    uni.request({
      url: `${API_BASE_URL}${options.path}`,
      method: options.method || "GET",
      data: options.data,
      header: headers,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve((response.data as ApiSuccess<T>).data);
          return;
        }
        const failure = response.data as Partial<ApiFailure>;
        reject(new HttpApiError(
          response.statusCode,
          failure.code || "HTTP_ERROR",
          failure.message || "请求失败，请稍后重试",
          failure.details,
        ));
      },
      fail(error) {
        reject(new HttpApiError(0, "NETWORK_ERROR", error.errMsg || "无法连接服务"));
      },
    });
  });
}

function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
