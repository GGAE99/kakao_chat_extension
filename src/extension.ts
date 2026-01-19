import * as vscode from 'vscode';
import { SidebarProvider } from './webview/SidebarProvider';
import { TokenManager } from './auth/tokenManager';
import { KakaoOAuth } from './auth/kakaoOAuth';
import { UriHandler } from './auth/uriHandler';
import { KakaoClient } from './api/kakaoClient';
import { MessageApi } from './api/messageApi';
import { NotificationService } from './services/notificationService';
import { getKakaoConfig, isApiKeyConfigured, openApiKeySettings, ERROR_MESSAGES } from './utils/constants';

let sidebarProvider: SidebarProvider;
let kakaoOAuth: KakaoOAuth | null = null;
let kakaoClient: KakaoClient;
let messageApi: MessageApi;
let notificationService: NotificationService;
let uriHandler: UriHandler | null = null;

function initializeKakaoServices(): boolean {
  const config = getKakaoConfig();

  if (!config.CLIENT_ID) {
    return false;
  }

  // Initialize Kakao OAuth
  kakaoOAuth = new KakaoOAuth(config.CLIENT_ID, config.PUBLISHER_ID);

  // Initialize Kakao API Client
  kakaoClient = new KakaoClient();
  kakaoClient.setKakaoOAuth(kakaoOAuth);

  // Initialize Message API
  messageApi = new MessageApi(kakaoClient);

  return true;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('KakaoTalk for VSCode is now active!');

  // Initialize Token Manager
  TokenManager.init(context.secrets);

  // Initialize Notification Service
  notificationService = NotificationService.getInstance();

  // Try to initialize Kakao services (may fail if API key not configured)
  initializeKakaoServices();

  // Initialize sidebar webview provider
  sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Setup sidebar message handler
  sidebarProvider.setMessageHandler(async (message) => {
    switch (message.type) {
      case 'login':
        await handleLogin();
        break;
      case 'logout':
        await handleLogout();
        break;
      case 'sendMessage':
        await handleSendMessage(message.payload?.text);
        break;
      case 'getAuthState':
        await updateSidebarAuthState();
        break;
      case 'openSettings':
        await openApiKeySettings();
        break;
    }
  });

  // Register login command
  context.subscriptions.push(
    vscode.commands.registerCommand('kakaotalk.login', handleLogin)
  );

  // Register logout command
  context.subscriptions.push(
    vscode.commands.registerCommand('kakaotalk.logout', handleLogout)
  );

  // Register send to me command
  context.subscriptions.push(
    vscode.commands.registerCommand('kakaotalk.sendToMe', async () => {
      if (!checkApiKeyAndLogin()) {
        return;
      }

      const message = await vscode.window.showInputBox({
        prompt: 'Enter message to send to yourself',
        placeHolder: 'Type your message here...',
      });

      if (message) {
        await handleSendMessage(message);
      }
    })
  );

  // Register send code snippet command
  context.subscriptions.push(
    vscode.commands.registerCommand('kakaotalk.sendCodeSnippet', async () => {
      if (!checkApiKeyAndLogin()) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText) {
          const fileName = editor.document.fileName.split(/[/\\]/).pop() || 'code';
          const languageId = editor.document.languageId;

          const codeMessage = `[Code from ${fileName}]\n\n\`\`\`${languageId}\n${selectedText}\n\`\`\``;

          await handleSendMessage(codeMessage);
        } else {
          vscode.window.showWarningMessage('Please select some code first');
        }
      }
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('kakaotalk.restApiKey')) {
        // Re-initialize services when API key changes
        if (initializeKakaoServices()) {
          // Re-register URI handler with new kakaoOAuth
          if (kakaoOAuth) {
            uriHandler = new UriHandler(kakaoOAuth);
            context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

            context.subscriptions.push(
              kakaoOAuth.onAuthStateChanged(async () => {
                await updateSidebarAuthState();
              })
            );

            context.subscriptions.push(
              uriHandler.onAuthCallback(async () => {
                await updateSidebarAuthState();
              })
            );
          }
          vscode.window.showInformationMessage('KakaoTalk: API key configured successfully');
          updateSidebarAuthState();
        }
      }
    })
  );

  // Initial setup if API key is already configured
  if (isApiKeyConfigured() && kakaoOAuth) {
    uriHandler = new UriHandler(kakaoOAuth);
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

    context.subscriptions.push(
      kakaoOAuth.onAuthStateChanged(async () => {
        await updateSidebarAuthState();
      })
    );

    context.subscriptions.push(
      uriHandler.onAuthCallback(async () => {
        await updateSidebarAuthState();
      })
    );
  }

  // Initial auth state check
  setTimeout(() => {
    updateSidebarAuthState();
  }, 1000);
}

async function handleLogin(): Promise<void> {
  if (!isApiKeyConfigured()) {
    const action = await vscode.window.showWarningMessage(
      ERROR_MESSAGES.API_KEY_NOT_CONFIGURED,
      'Open Settings'
    );
    if (action === 'Open Settings') {
      await openApiKeySettings();
    }
    return;
  }

  // Re-initialize if needed
  if (!kakaoOAuth) {
    initializeKakaoServices();
  }

  if (kakaoOAuth) {
    await kakaoOAuth.startLogin();
  }
}

async function handleLogout(): Promise<void> {
  if (kakaoOAuth) {
    await kakaoOAuth.logout();
  }
  await updateSidebarAuthState();
}

async function checkApiKeyAndLogin(): Promise<boolean> {
  if (!isApiKeyConfigured()) {
    const action = await vscode.window.showWarningMessage(
      ERROR_MESSAGES.API_KEY_NOT_CONFIGURED,
      'Open Settings'
    );
    if (action === 'Open Settings') {
      await openApiKeySettings();
    }
    return false;
  }

  const tokenManager = TokenManager.getInstance();
  if (!(await tokenManager.isLoggedIn())) {
    notificationService.showLoginRequired();
    return false;
  }

  return true;
}

async function updateSidebarAuthState(): Promise<void> {
  const tokenManager = TokenManager.getInstance();
  const isLoggedIn = await tokenManager.isLoggedIn();
  const userInfo = await tokenManager.getUserInfo();
  const apiKeyConfigured = isApiKeyConfigured();

  sidebarProvider.postMessage({
    type: 'authStateChanged',
    payload: {
      isLoggedIn,
      user: userInfo,
      apiKeyConfigured,
    },
  });
}

async function handleSendMessage(text?: string): Promise<void> {
  if (!text || text.trim() === '') {
    vscode.window.showWarningMessage('Please enter a message');
    return;
  }

  if (!checkApiKeyAndLogin()) {
    return;
  }

  try {
    await notificationService.showProgress('Sending message...', async () => {
      await messageApi.sendTextToMe(text);
    });

    notificationService.showMessageSent();
    sidebarProvider.postMessage({ type: 'messageSent' });
  } catch (error) {
    console.error('Failed to send message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    notificationService.showMessageFailed(errorMessage);
  }
}

export function deactivate() {
  console.log('KakaoTalk for VSCode is now deactivated.');
}
