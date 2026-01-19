# KakaoTalk for VSCode

Send KakaoTalk messages directly from Visual Studio Code.

![VSCode Version](https://img.shields.io/badge/VSCode-1.85.0+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Send messages to yourself** - Quick notes, reminders, code snippets
- **Send code snippets** - Right-click on selected code to send via KakaoTalk
- **Sidebar UI** - Easy-to-use interface in the VSCode activity bar
- **Secure authentication** - OAuth 2.0 login with Kakao

## Screenshots

| Sidebar | Send Message |
|---------|--------------|
| ![Sidebar](docs/sidebar.png) | ![Send](docs/send.png) |

## Requirements

- Visual Studio Code 1.85.0 or higher
- Kakao account
- Kakao Developers REST API Key

## Setup

### 1. Get your Kakao REST API Key

1. Go to [Kakao Developers](https://developers.kakao.com)
2. Log in with your Kakao account
3. Click **My Application** → **Add Application**
4. Enter an app name and create the application
5. Go to **App Keys** and copy your **REST API Key**

### 2. Configure Redirect URI

1. In Kakao Developers, go to your app
2. Navigate to **Kakao Login** → **Redirect URI**
3. Add the following URI:
   ```
   vscode://your-publisher-name.kakaotalk-vscode/callback
   ```
   > Replace `your-publisher-name` with the actual publisher ID

### 3. Enable Kakao Login

1. Go to **Kakao Login** → **Activation**
2. Turn on **Kakao Login**
3. Go to **Consent Items** and enable:
   - Profile (nickname, profile image)
   - Send Kakao Talk Message

### 4. Install and Configure the Extension

1. Install "KakaoTalk for VSCode" from the VSCode Marketplace
2. Click the KakaoTalk icon in the activity bar
3. Click **Configure API Key**
4. Paste your REST API Key in the settings
5. Click **Login with Kakao**

## Usage

### Send a Message

1. Click the KakaoTalk icon in the activity bar
2. Type your message in the text area
3. Click **Send Message**

### Send Code Snippet

1. Select code in the editor
2. Right-click and select **KakaoTalk: Send Selected Code**

### Commands

| Command | Description |
|---------|-------------|
| `KakaoTalk: Login` | Log in with your Kakao account |
| `KakaoTalk: Logout` | Log out from KakaoTalk |
| `KakaoTalk: Send Message to Me` | Send a message to yourself |
| `KakaoTalk: Send Selected Code` | Send selected code as a message |

## Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `kakaotalk.restApiKey` | Your Kakao REST API Key | `""` |
| `kakaotalk.defaultTemplate` | Default message template (text/feed) | `"text"` |
| `kakaotalk.showNotifications` | Show notifications when messages are sent | `true` |

## API Limits

Kakao Talk Message API has free quotas:

| Limit | Free Quota |
|-------|------------|
| Per sender | 100 messages/day |
| Per recipient | 100 messages/day |
| Per sender-recipient pair | 20 messages/day |

For more details, see [Kakao Developers Quota](https://developers.kakao.com/docs/latest/en/getting-started/quota).

## Troubleshooting

### "Failed to complete login" error

- Make sure the Redirect URI is correctly set in Kakao Developers
- Check that Kakao Login is enabled for your app
- Verify your REST API Key is correct

### "Failed to send message" error

- Check your internet connection
- Make sure you're logged in
- Verify the "Send Kakao Talk Message" consent item is enabled

### Messages not appearing

- The Kakao Talk Message API can only send messages to yourself
- Check if you've exceeded the daily quota (20 messages to yourself per day)

## Development

### Build

```bash
npm install
npm run compile
```

### Watch mode

```bash
npm run watch
```

### Package

```bash
npm run package
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Kakao Developers](https://developers.kakao.com) for the API
- [VSCode Extension API](https://code.visualstudio.com/api) documentation

---

**Note:** This extension is not affiliated with or endorsed by Kakao Corp.
