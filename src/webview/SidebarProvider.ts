import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kakaotalk.sidebarView';
  private _view?: vscode.WebviewView;
  private _messageHandler?: (message: any) => Promise<void>;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public setMessageHandler(handler: (message: any) => Promise<void>): void {
    this._messageHandler = handler;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlContent(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (this._messageHandler) {
        await this._messageHandler(message);
      }
    });
  }

  public postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _getHtmlContent(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KakaoTalk</title>
  <style>
    body {
      padding: 10px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    button {
      padding: 8px 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    .kakao-button {
      background-color: #FEE500;
      color: #000000;
    }
    .kakao-button:hover {
      background-color: #E6CF00;
    }
    .status {
      padding: 10px;
      background-color: var(--vscode-editor-background);
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .status.logged-in {
      border-left: 3px solid #4CAF50;
    }
    .status.logged-out {
      border-left: 3px solid #FF9800;
    }
    textarea {
      width: 100%;
      min-height: 100px;
      padding: 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
      box-sizing: border-box;
    }
    .message-section {
      display: none;
    }
    .message-section.visible {
      display: block;
    }
    h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- API Key Not Configured State -->
    <div id="notConfiguredStatus" class="status logged-out">
      <h3>Setup Required</h3>
      <p>Please configure your Kakao REST API Key to use this extension.</p>
      <p style="font-size: 11px; margin-top: 8px;">
        Get your API key from <a href="https://developers.kakao.com" style="color: var(--vscode-textLink-foreground);">Kakao Developers</a>
      </p>
    </div>
    <button id="configureBtn" class="kakao-button">Configure API Key</button>

    <!-- Logged Out State -->
    <div id="loggedOutStatus" class="status logged-out" style="display: none;">
      <h3>Not logged in</h3>
      <p>Please login to send KakaoTalk messages.</p>
    </div>

    <!-- Logged In State -->
    <div id="loggedInStatus" class="status logged-in" style="display: none;">
      <h3>Logged in</h3>
      <p id="userInfo">Ready to send messages</p>
    </div>

    <button id="loginBtn" class="kakao-button" style="display: none;">Login with Kakao</button>
    <button id="logoutBtn" style="display: none;">Logout</button>

    <!-- Message Section -->
    <div id="messageSection" class="message-section">
      <h3>Send Message to Me</h3>
      <textarea id="messageInput" placeholder="Enter your message..."></textarea>
      <button id="sendBtn" style="margin-top: 10px;">Send Message</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const configureBtn = document.getElementById('configureBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const notConfiguredStatus = document.getElementById('notConfiguredStatus');
    const loggedOutStatus = document.getElementById('loggedOutStatus');
    const loggedInStatus = document.getElementById('loggedInStatus');
    const messageSection = document.getElementById('messageSection');

    configureBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'openSettings' });
    });

    loginBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'login' });
    });

    logoutBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'logout' });
    });

    sendBtn.addEventListener('click', () => {
      const message = messageInput.value.trim();
      if (message) {
        vscode.postMessage({ type: 'sendMessage', payload: { text: message } });
      }
    });

    // Request initial state
    vscode.postMessage({ type: 'getAuthState' });

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'authStateChanged':
          updateAuthState(message.payload);
          break;
        case 'messageSent':
          messageInput.value = '';
          break;
      }
    });

    function updateAuthState(state) {
      const apiKeyConfigured = state.apiKeyConfigured;
      const isLoggedIn = state.isLoggedIn;

      // Hide all states first
      notConfiguredStatus.style.display = 'none';
      loggedOutStatus.style.display = 'none';
      loggedInStatus.style.display = 'none';
      configureBtn.style.display = 'none';
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'none';
      messageSection.classList.remove('visible');

      if (!apiKeyConfigured) {
        // API Key not configured
        notConfiguredStatus.style.display = 'block';
        configureBtn.style.display = 'block';
      } else if (isLoggedIn) {
        // Logged in
        loggedInStatus.style.display = 'block';
        logoutBtn.style.display = 'block';
        messageSection.classList.add('visible');
        if (state.user && state.user.nickname) {
          document.getElementById('userInfo').textContent = 'Welcome, ' + state.user.nickname;
        }
      } else {
        // API configured but not logged in
        loggedOutStatus.style.display = 'block';
        loginBtn.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;
  }
}
