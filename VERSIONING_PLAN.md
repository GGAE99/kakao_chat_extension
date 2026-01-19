# KakaoTalk for VSCode - Development Plan

## Overview

A VSCode extension that enables sending KakaoTalk messages directly from the editor via the official Kakao API.

**Important Limitation:** The official Kakao Talk API only supports *sending* messages, not receiving real-time chat. This extension will function as a **message sender** rather than a full chat client.

---

## Kakao API Cost Information

### Free Tier (No Cost)

| Item | Free Quota |
|------|------------|
| Daily messages | 30,000 requests |
| Per sender | 100/day |
| Per recipient | 100/day |
| Per sender-recipient pair | 20/day |
| Monthly total (all APIs) | 3,000,000 requests |

**For personal use, the free tier is sufficient.** You can send up to 100 messages per day to yourself at no cost.

### If You Exceed Free Limits

- 50 KRW per message (~$0.04 USD)
- Discounted to 10 KRW until December 2026

**Conclusion: For a personal VSCode extension, you will NOT be charged** as long as you stay within the free quota.

Sources:
- [Kakao Developers Quota](https://developers.kakao.com/docs/latest/en/getting-started/quota)
- [Kakao Developers Paid API](https://developers.kakao.com/docs/latest/en/app-setting/paid-api)

---

## Development Steps

### Step 1: Project Initialization ✅
- [x] Create project folder structure
- [x] Initialize `package.json` with `npm init`
- [x] Install TypeScript and VSCode type definitions
- [x] Create `tsconfig.json`
- [x] Setup esbuild for bundling
- [x] Create `.vscode/launch.json` for debugging
- [x] Create basic `src/extension.ts` (activate/deactivate)

**Deliverable:** Extension loads in debug mode (F5)

---

### Step 2: Extension Manifest Configuration ✅
- [x] Configure `package.json` contributes section
- [x] Add sidebar view container (activity bar icon)
- [x] Add webview view for sidebar
- [x] Register basic commands (login, logout)
- [x] Add extension icon placeholder

**Deliverable:** KakaoTalk icon appears in activity bar

---

### Step 3: Token Manager (Secure Storage) ✅
- [x] Create `src/auth/tokenManager.ts`
- [x] Implement SecretStorage wrapper
- [x] Methods: storeTokens, getAccessToken, getRefreshToken, clearTokens
- [x] Add token expiry checking

**Deliverable:** Can securely store/retrieve tokens

---

### Step 4: URI Handler (OAuth Callback) ✅
- [x] Create `src/auth/uriHandler.ts`
- [x] Register `vscode://` URI handler
- [x] Parse authorization code from callback URL
- [x] Handle OAuth errors

**Deliverable:** VSCode receives OAuth callback

---

### Step 5: Kakao OAuth Flow ✅
- [x] Create `src/auth/kakaoOAuth.ts`
- [x] Build authorization URL with scopes
- [x] Open browser for Kakao login
- [x] Exchange authorization code for tokens
- [x] Store tokens via TokenManager

**Deliverable:** Complete login flow works

---

### Step 6: Authentication Provider ✅
- [x] OAuth integrated in extension.ts
- [x] Auth state events via KakaoOAuth
- [x] Login/logout functionality
- [x] Token refresh mechanism

**Deliverable:** Auth state syncs across windows

---

### Step 7: Kakao API Client ✅
- [x] Create `src/api/kakaoClient.ts`
- [x] Setup axios with base URL
- [x] Add Authorization header interceptor
- [x] Handle 401 errors (trigger token refresh)
- [x] Add request/response logging (debug)

**Deliverable:** Authenticated API calls work

---

### Step 8: Message API ✅
- [x] Create `src/api/messageApi.ts`
- [x] Implement sendToMe (text template)
- [x] Implement sendToMe (feed template)
- [x] Add template type definitions
- [x] Handle API errors gracefully

**Deliverable:** Can send message to yourself

---

### Step 9: Basic Sidebar Webview ✅
- [x] Create `src/webview/SidebarProvider.ts`
- [x] Implement WebviewViewProvider
- [x] Create basic HTML template
- [x] Setup webview <-> extension messaging
- [x] Add login/logout buttons

**Deliverable:** Sidebar shows login state

---

### Step 10: Message Composer UI ✅
- [x] Add message input textarea
- [x] Add send button
- [x] Handle send button click
- [x] Show loading state during send
- [x] Show success/error feedback

**Deliverable:** Can send message from sidebar

---

### Step 11: Notification Service ✅
- [x] Create `src/services/notificationService.ts`
- [x] Show toast on message sent
- [x] Show error notifications
- [x] Add notification settings option

**Deliverable:** Toast appears after send

---

### Step 12: Friends API (Optional)
- [ ] Create `src/api/friendsApi.ts`
- [ ] Fetch friends list
- [ ] Display friends in sidebar
- [ ] Implement friend selection
- [ ] Send to selected friends (max 5)

**Deliverable:** Can message friends

---

### Step 13: Code Snippet Feature
- [ ] Add editor context menu command
- [ ] Get selected text from editor
- [ ] Format code as message
- [ ] Send via existing message API

**Deliverable:** Right-click to send code

---

### Step 14: Settings & Configuration
- [ ] Add extension settings in package.json
- [ ] Default template preference
- [ ] Notification on/off toggle
- [ ] Read settings in code

**Deliverable:** User can configure extension

---

### Step 15: UI Polish
- [ ] Create proper extension icon (SVG)
- [ ] Apply VSCode theme colors
- [ ] Add loading spinners
- [ ] Improve error messages
- [ ] Test dark/light themes

**Deliverable:** Professional appearance

---

### Step 16: Testing
- [ ] Setup test framework
- [ ] Unit tests for TokenManager
- [ ] Unit tests for API client
- [ ] Integration tests for commands
- [ ] Manual testing checklist

**Deliverable:** Tests pass

---

### Step 17: Documentation
- [ ] Write README.md
- [ ] Add screenshots
- [ ] Kakao Developer Console setup guide
- [ ] Create CHANGELOG.md
- [ ] Add LICENSE file

**Deliverable:** Ready for users

---

### Step 18: Publishing
- [ ] Create publisher account (marketplace)
- [ ] Package with vsce
- [ ] Test .vsix locally
- [ ] Publish to marketplace

**Deliverable:** Extension live on marketplace

---

## Project Structure

```
kakaotalk_for_vscode/
├── .vscode/
│   └── launch.json
├── src/
│   ├── extension.ts
│   ├── auth/
│   │   ├── authProvider.ts
│   │   ├── kakaoOAuth.ts
│   │   ├── tokenManager.ts
│   │   └── uriHandler.ts
│   ├── api/
│   │   ├── kakaoClient.ts
│   │   ├── messageApi.ts
│   │   └── friendsApi.ts
│   ├── webview/
│   │   └── SidebarProvider.ts
│   └── services/
│       └── notificationService.ts
├── resources/
│   └── icons/
├── package.json
├── tsconfig.json
├── esbuild.js
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## Version History

### Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Changelog

#### [Unreleased]
- Initial development

#### [0.0.1] - TBD
**Initial Release**
- Kakao OAuth login/logout
- Send message to yourself (text template)
- Sidebar webview UI
- VSCode toast notifications

### Planned Versions

| Version | Milestone | Steps |
|---------|-----------|-------|
| 0.0.1 | MVP - Basic send to me | 1-11 |
| 0.1.0 | Rich templates (feed, list) | - |
| 0.2.0 | Friends messaging | 12 |
| 0.3.0 | Code snippet sharing | 13 |
| 0.4.0 | Settings & customization | 14 |
| 0.5.0 | UI polish | 15 |
| 0.9.0 | Testing & documentation | 16-17 |
| 1.0.0 | Marketplace release | 18 |

---

## Verification Checklist

After each step, verify:
1. No TypeScript errors
2. Extension activates (F5 debug)
3. Feature works as expected
4. No console errors

Final verification:
- [ ] OAuth flow completes
- [ ] Token persists after restart
- [ ] Send message works
- [ ] Notification appears
- [ ] Settings apply correctly

---

## Release Checklist

Before each release:
- [ ] All tests pass
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] No console errors
- [ ] README reflects features
