import * as vscode from 'vscode';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface UserInfo {
  id: number;
  nickname?: string;
  profileImage?: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private secretStorage: vscode.SecretStorage;

  private static readonly ACCESS_TOKEN_KEY = 'kakaotalk.accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'kakaotalk.refreshToken';
  private static readonly EXPIRY_KEY = 'kakaotalk.tokenExpiry';
  private static readonly USER_INFO_KEY = 'kakaotalk.userInfo';

  private constructor(secretStorage: vscode.SecretStorage) {
    this.secretStorage = secretStorage;
  }

  public static init(secretStorage: vscode.SecretStorage): void {
    TokenManager.instance = new TokenManager(secretStorage);
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      throw new Error('TokenManager not initialized. Call TokenManager.init() first.');
    }
    return TokenManager.instance;
  }

  public async storeTokens(data: TokenData): Promise<void> {
    await Promise.all([
      this.secretStorage.store(TokenManager.ACCESS_TOKEN_KEY, data.accessToken),
      this.secretStorage.store(TokenManager.REFRESH_TOKEN_KEY, data.refreshToken),
      this.secretStorage.store(TokenManager.EXPIRY_KEY, data.expiresAt.toString()),
    ]);
  }

  public async getAccessToken(): Promise<string | undefined> {
    return this.secretStorage.get(TokenManager.ACCESS_TOKEN_KEY);
  }

  public async getRefreshToken(): Promise<string | undefined> {
    return this.secretStorage.get(TokenManager.REFRESH_TOKEN_KEY);
  }

  public async getTokenExpiry(): Promise<number | undefined> {
    const expiry = await this.secretStorage.get(TokenManager.EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : undefined;
  }

  public async isTokenExpired(): Promise<boolean> {
    const expiry = await this.getTokenExpiry();
    if (!expiry) {
      return true;
    }
    // Consider expired if less than 5 minutes remaining
    return Date.now() >= expiry - 5 * 60 * 1000;
  }

  public async isLoggedIn(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }

  public async storeUserInfo(userInfo: UserInfo): Promise<void> {
    await this.secretStorage.store(
      TokenManager.USER_INFO_KEY,
      JSON.stringify(userInfo)
    );
  }

  public async getUserInfo(): Promise<UserInfo | undefined> {
    const userInfoStr = await this.secretStorage.get(TokenManager.USER_INFO_KEY);
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  public async clearTokens(): Promise<void> {
    await Promise.all([
      this.secretStorage.delete(TokenManager.ACCESS_TOKEN_KEY),
      this.secretStorage.delete(TokenManager.REFRESH_TOKEN_KEY),
      this.secretStorage.delete(TokenManager.EXPIRY_KEY),
      this.secretStorage.delete(TokenManager.USER_INFO_KEY),
    ]);
  }

  public onDidChange(callback: () => void): vscode.Disposable {
    return this.secretStorage.onDidChange(callback);
  }
}
