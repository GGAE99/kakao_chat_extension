import * as vscode from 'vscode';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private isNotificationsEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('kakaotalk');
    return config.get<boolean>('showNotifications', true);
  }

  public showInfo(message: string): void {
    if (this.isNotificationsEnabled()) {
      vscode.window.showInformationMessage(message);
    }
  }

  public showError(message: string): void {
    // Always show errors regardless of notification settings
    vscode.window.showErrorMessage(message);
  }

  public showWarning(message: string): void {
    if (this.isNotificationsEnabled()) {
      vscode.window.showWarningMessage(message);
    }
  }

  public showMessageSent(): void {
    this.showInfo('KakaoTalk: Message sent successfully!');
  }

  public showMessageFailed(reason?: string): void {
    const message = reason
      ? `KakaoTalk: Failed to send message - ${reason}`
      : 'KakaoTalk: Failed to send message';
    this.showError(message);
  }

  public showLoginSuccess(): void {
    this.showInfo('KakaoTalk: Successfully logged in!');
  }

  public showLogoutSuccess(): void {
    this.showInfo('KakaoTalk: Successfully logged out');
  }

  public showLoginRequired(): void {
    this.showWarning('KakaoTalk: Please login first');
  }

  public async showProgress<T>(
    title: string,
    task: () => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: title,
        cancellable: false,
      },
      async () => {
        return await task();
      }
    );
  }
}
