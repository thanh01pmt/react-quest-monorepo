# Change: Add Builder-to-Player Sync Mechanism

## Why

Currently, there is no direct way to test a quest created in the **React Quest Builder** (port 5174 / Netlify) using the **React Quest Player** (port 5173 / Netlify). Users must manually export the JSON file from Builder, then import it into Player's `quests/` folder and reload. This is tedious and slows down the iteration cycle.

This change introduces a **sync mechanism** that allows Builder to send a quest directly to Player for immediate testing, without manual file management.

## What Changes

### Sync Strategy: Dual-Mode (Local + Production)

| Environment | Method | URL Pattern |
|-------------|--------|-------------|
| **Local Development** (same origin) | `localStorage` | `http://localhost:5173/sync` |
| **Production** (Netlify) | **URL-based** | `https://player-url.netlify.app/sync?quest=<encoded>` |

> **Note**: Chức năng sync được đặt ở route riêng `/sync` thay vì trang chính. Điều này giúp:
> - Tách biệt flow test từ Builder khỏi flow chơi game bình thường
> - Dễ dàng nhận biết người dùng đang trong chế độ "Builder Sync"
> - Không ảnh hưởng đến các route hiện có (`/quest/:id`, `/topic/:id`, etc.)

### Builder Changes
1. Add **"Send to Player" button** to `QuestDetailsPanel` component
2. Add **Player URL configuration** in Settings (defaulting to `http://localhost:5173` for local, configurable for production)
3. For **local sync**: Write quest JSON to `localStorage.setItem('builderQuest', ...)` and open `/sync` route
4. For **production sync**: 
   - Compress quest JSON using `pako` (gzip)
   - Encode to base64
   - Open Player URL with `/sync?quest=<encoded>` path
5. Add **visual feedback** (success/error toast) after sync action

### Player Changes
1. Add **new route `/sync`** to handle builder quests
2. **`/sync` route** (no query param): Load quest from `localStorage.getItem('builderQuest')`
3. **`/sync?quest=<base64>`**: Decode and load quest from URL parameter
4. Show **"Builder Mode" banner** on sync page with:
   - Quest info (ID, level)
   - "Play" button to start
   - "Back to Home" button to exit sync mode
5. After playing, return to `/sync` page (not home) to allow quick iteration

## Impact

- **Builder**: Adds 1 button and optional config to `QuestDetailsPanel`
- **Player**: Adds URL/localStorage reading logic to `App.tsx`
- **Dependencies**: Add `pako` for gzip compression (optional, reduces URL length)
- **No breaking changes**: Normal quest loading flow is unaffected

## Quest JSON Structure Reference

The quest JSON must contain these fields for Player to work correctly:

```json
{
  "id": "QUEST_ID",
  "gameType": "maze",
  "topic": "topic-title-...",
  "level": 1,
  "titleKey": "Challenge.QUEST_ID.Title",
  "descriptionKey": "Challenge.QUEST_ID.Description",
  "translations": {
    "vi": { "...": "..." },
    "en": { "...": "..." }
  },
  "supportedEditors": ["blockly", "monaco"],
  "blocklyConfig": {
    "toolbox": { "kind": "categoryToolbox", "contents": [...] },
    "maxBlocks": 10,
    "startBlocks": "<xml>...</xml>",
    "toolboxPresetKey": "..."
  },
  "gameConfig": {
    "type": "maze",
    "renderer": "3d",
    "introScene": { "enabled": true, ... },
    "blocks": [...],
    "players": [{ "id": "player1", "start": { "x": 7, "y": 1, "z": 7, "direction": 0 } }],
    "collectibles": [...],
    "interactibles": [...],
    "finish": { "x": 1, "y": 1, "z": 7 }
  },
  "solution": {
    "type": "reach_target",
    "itemGoals": { "crystal": 3, "switch": 2 },
    "optimalBlocks": 10,
    "rawActions": [...],
    "basicSolution": {...},
    "structuredSolution": {...}
  },
  "sounds": {
    "win": "/assets/maze/win.mp3",
    "fail": "/assets/maze/fail_pegman.mp3"
  }
}
```

> **Note**: Builder's `outputJsonString` useMemo already generates this structure correctly. The existing "Export Quest JSON" button in `QuestDetailsPanel` uses the same data.

## Security Considerations

- URL-based sync may expose quest data in browser history
- For sensitive quests, recommend using local sync only
- Consider adding optional encryption for production sync
