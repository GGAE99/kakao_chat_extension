import axios, { AxiosInstance, AxiosError } from 'axios';
import { TokenManager } from '../auth/tokenManager';
import { KakaoOAuth } from '../auth/kakaoOAuth';

export class KakaoClient {
  private client: AxiosInstance;
  private kakaoOAuth: KakaoOAuth | null = null;

  private static readonly BASE_URL = 'https://kapi.kakao.com';

  constructor() {
    this.client = axios.create({
      baseURL: KakaoClient.BASE_URL,
    });

    this.setupInterceptors();
  }

  public setKakaoOAuth(kakaoOAuth: KakaoOAuth): void {
    this.kakaoOAuth = kakaoOAuth;
  }

  private setupInterceptors(): void {
    // Request interceptor: Add authorization header
    this.client.interceptors.request.use(
      async (config) => {
        const tokenManager = TokenManager.getInstance();
        const accessToken = await tokenManager.getAccessToken();

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && this.kakaoOAuth) {
          // Try to refresh the token
          const refreshed = await this.kakaoOAuth.refreshTokens();

          if (refreshed) {
            // Retry the original request
            const tokenManager = TokenManager.getInstance();
            const newAccessToken = await tokenManager.getAccessToken();

            if (newAccessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client(originalRequest);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}
