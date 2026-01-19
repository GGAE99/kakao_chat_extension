import * as vscode from 'vscode';
import { KakaoOAuth } from './kakaoOAuth';

export class UriHandler implements vscode.UriHandler {
  private _onAuthCallback = new vscode.EventEmitter<string>();
  public readonly onAuthCallback = this._onAuthCallback.event;

  constructor(private kakaoOAuth: KakaoOAuth) {}

  async handleUri(uri: vscode.Uri): Promise<void> {
    // Expected URI: vscode://publisher.kakaotalk-vscode/callback?code=xxx
    console.log('UriHandler received:', uri.toString());

    if (uri.path === '/callback') {
      const query = new URLSearchParams(uri.query);
      const code = query.get('code');
      const error = query.get('error');
      const errorDescription = query.get('error_description');

      if (error) {
        const errorMsg = errorDescription || error;
        vscode.window.showErrorMessage(`Kakao login failed: ${errorMsg}`);
        return;
      }

      if (code) {
        try {
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: 'Logging in to KakaoTalk...',
              cancellable: false,
            },
            async () => {
              await this.kakaoOAuth.exchangeCodeForTokens(code);
            }
          );
          this._onAuthCallback.fire('success');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          vscode.window.showErrorMessage(`Failed to complete login: ${errorMessage}`);
          this._onAuthCallback.fire('error');
        }
      }
    }
  }

  dispose() {
    this._onAuthCallback.dispose();
  }
}
