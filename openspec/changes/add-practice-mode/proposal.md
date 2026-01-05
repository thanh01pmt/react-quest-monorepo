# Change: Add Practice Mode to Quest Player

## Why

Quest Player hiện tại chỉ có route `/play` để chơi các thử thách có sẵn. Người chơi cần một chế độ luyện tập tự do (`/practice`) để:
- Chọn chủ đề muốn ôn luyện (loop, conditional, function,...)
- Điều chỉnh số lượng câu hỏi và độ khó theo ý muốn
- Theo dõi tiến trình học tập qua hệ thống điểm
- Chia sẻ challenge với bạn bè qua link

## What Changes

### Phase 1: Core Practice Mode
- **[NEW]** Route `/practice` với Practice Configuration UI
- **[NEW]** Shared Template system (Markdown notebook format)
- **[NEW]** Firebase Authentication (Google Sign-In, Email/Password)
- **[NEW]** Local template fallback + remote template override
- **[NEW]** Basic scoring system per concept category
- **[NEW]** Session persistence (IndexedDB với base64 encoding)

### Phase 2: Challenge Sharing *(Future)*
- Shareable challenge links với deterministic seed
- Leaderboards cho shared challenges

### Phase 3: Social Features *(Future)*
- User-created templates
- Social features

---

> [!IMPORTANT]
> **Phase 1 là scope của proposal này.** Phase 2 và 3 sẽ có proposal riêng.

---

## Proposed Architecture

### Template Format (Markdown Notebook)

```markdown
---
id: staircase-with-jump
name: "Staircase with Jump"
category: loop
difficulty: 4
tags: ["repeat_n", "pattern_recognition"]
version: 1
---

# Description
Tạo địa hình cao với lệnh nhảy.

## Parameters
```js
var _MIN_CRYSTAL_NUM_ = 3;
var _MAX_CRYSTAL_NUM_ = 6;
```

## Solution Code
```js
// Code here
```
```

### Firebase Data Model

```
/users/{uid}
  ├── profile: { displayName, photoURL }
  ├── progress: { loop: {xp, level}, ... }
  └── sessions/{sessionId}: { config, exercises, completedAt }
```

### Template Loading Strategy

```
1. App starts
2. Load bundled templates (static import)
3. If Firebase connected:
   a. Fetch remote templates
   b. Override local if version newer
4. Cache merged templates
```

---

## Impact

### New Files
| Path | Description |
|------|-------------|
| `packages/shared-templates/` | Shared template package |
| `apps/react-quest-app/src/pages/PracticePage/` | Practice mode UI |
| `apps/react-quest-app/src/services/firebase/` | Firebase integration |
| `apps/react-quest-app/src/services/PracticeGenerator.ts` | Exercise generator |
| `apps/react-quest-app/src/stores/practiceStore.ts` | Practice state management |

### Modified Files
| Path | Change |
|------|--------|
| `apps/react-quest-app/src/App.tsx` | Add `/practice` route |
| `apps/react-quest-app/package.json` | Add Firebase dependencies |

---

## Verification Plan

### Automated Tests
- Unit tests for `PracticeGenerator` (deterministic output với seed)
- Unit tests for template parser (Markdown → TemplateConfig)
- Integration tests for Firebase auth flow (mock)

### Manual Verification
1. **Auth Flow**: Sign in with Google → verify user profile displays
2. **Practice Config**: Select topics → adjust difficulty → start session
3. **Template Loading**: Disconnect network → verify local templates load
4. **Scoring**: Complete exercises → verify XP accumulates correctly
5. **Session Persistence**: Refresh page mid-session → verify resume works

### Browser Testing
- Chrome, Firefox, Safari on Desktop
- Chrome on Android, Safari on iOS

---

## Open Questions

1. ~~Auth providers~~ → Confirmed: Google + Email/Password
2. ~~Template format~~ → Confirmed: Markdown notebook
3. ~~Encryption~~ → Confirmed: Base64 for privacy
4. ~~Template workflow~~ → Confirmed: Builder export → commit → Player uses
