import * as vscode from 'vscode';
import axios from 'axios';
import { TokenManager } from './tokenManager';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
  };
}

export class KakaoOAuth {
  private static readonly AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
  private static readonly TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
  private static readonly USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';

  private readonly clientId: string;
  private readonly redirectUri: string;

  private _onAuthStateChanged = new vscode.EventEmitter<boolean>();
  public readonly onAuthStateChanged = this._onAuthStateChanged.event;

  constructor(clientId: string, publisherId: string) {
    this.clientId = clientId;
    this.redirectUri = `vscode://${publisherId}.kakaotalk-vscode/callback`;
  }

  public getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'talk_message friends',
    });

    return `${KakaoOAuth.AUTH_URL}?${params.toString()}`;
  }

  public async startLogin(): Promise<void> {
    const authUrl = this.getAuthorizationUrl();
    await vscode.env.openExternal(vscode.Uri.parse(authUrl));
  }

  public async exchangeCodeForTokens(code: string): Promise<void> {
    try {
      const response = await axios.post<KakaoTokenResponse>(
        KakaoOAuth.TOKEN_URL,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          code: code,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData = response.data;
      const expiresAt = Date.now() + tokenData.expires_in * 1000;

      const tokenManager = TokenManager.getInstance();
      await tokenManager.storeTokens({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt,
      });

      // Fetch user info
      await this.fetchAndStoreUserInfo(tokenData.access_token);

      vscode.window.showInformationMessage('Successfully logged in to KakaoTalk!');
      this._onAuthStateChanged.fire(true);
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  public async refreshTokens(): Promise<boolean> {
    const tokenManager = TokenManager.getInstance();
    const refreshToken = await tokenManager.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await axios.post<KakaoTokenResponse>(
        KakaoOAuth.TOKEN_URL,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData = response.data;
      const expiresAt = Date.now() + tokenData.expires_in * 1000;

      await tokenManager.storeTokens({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        expiresAt: expiresAt,
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private async fetchAndStoreUserInfo(accessToken: string): Promise<void> {
    try {
      const response = await axios.get<KakaoUserResponse>(
        KakaoOAuth.USER_INFO_URL,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userData = response.data;
      const tokenManager = TokenManager.getInstance();

      await tokenManager.storeUserInfo({
        id: userData.id,
        nickname: userData.kakao_account?.profile?.nickname,
        profileImage: userData.kakao_account?.profile?.profile_image_url,
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  public async logout(): Promise<void> {
    const tokenManager = TokenManager.getInstance();
    await tokenManager.clearTokens();
    vscode.window.showInformationMessage('Logged out from KakaoTalk');
    this._onAuthStateChanged.fire(false);
  }

  dispose() {
    this._onAuthStateChanged.dispose();
  }
}
