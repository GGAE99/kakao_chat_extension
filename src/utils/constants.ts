import * as vscode from 'vscode';

// Get configuration from VSCode settings
export function getKakaoConfig() {
  const config = vscode.workspace.getConfiguration('kakaotalk');

  return {
    // REST API Key from VSCode settings
    // Users configure this in Settings > Extensions > KakaoTalk
    CLIENT_ID: config.get<string>('restApiKey', ''),

    // Publisher ID is read from package.json at build time
    // For OAuth redirect URI: vscode://{publisher}.kakaotalk-vscode/callback
    PUBLISHER_ID: 'your-publisher-name', // Change this when you publish
  };
}

// Check if API key is configured
export function isApiKeyConfigured(): boolean {
  const config = getKakaoConfig();
  return config.CLIENT_ID.length > 0;
}

// Open settings to configure API key
export async function openApiKeySettings(): Promise<void> {
  await vscode.commands.executeCommand(
    'workbench.action.openSettings',
    'kakaotalk.restApiKey'
  );
}

// API Endpoints
export const KAKAO_ENDPOINTS = {
  AUTH: 'https://kauth.kakao.com/oauth/authorize',
  TOKEN: 'https://kauth.kakao.com/oauth/token',
  API_BASE: 'https://kapi.kakao.com',
  USER_INFO: '/v2/user/me',
  SEND_TO_ME: '/v2/api/talk/memo/default/send',
  SEND_TO_FRIENDS: '/v1/api/talk/friends/message/default/send',
  GET_FRIENDS: '/v1/api/talk/friends',
};

// Error Messages
export const ERROR_MESSAGES = {
  NOT_LOGGED_IN: 'Please login to KakaoTalk first',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  SEND_FAILED: 'Failed to send message',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_API_KEY: 'Invalid API key. Please check your Kakao Developer settings',
  API_KEY_NOT_CONFIGURED: 'Please configure your Kakao REST API Key in settings',
};
