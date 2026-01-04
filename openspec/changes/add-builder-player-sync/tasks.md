# Tasks: Add Builder-to-Player Sync Mechanism

## 1. Builder App Changes

### 1.1 Add Sync Service Utility
- [x] 1.1.1 Create `apps/map-builder-app/src/services/PlayerSyncService.ts`
  - [x] Implement `syncToPlayer(quest: Quest, playerUrl: string): void`
  - [x] Implement `getPlayerUrl(): string` (read from localStorage or default)
  - [x] Implement `setPlayerUrl(url: string): void`
  - [x] Implement `isLocalSync(): boolean` (check if same origin)
  - [x] Implement `compressQuest(quest: Quest): string` (gzip + base64)

### 1.2 Update QuestDetailsPanel
- [x] 1.2.1 Add "Send to Player" button below "Export Quest JSON"
- [x] 1.2.2 Add Player URL input field (collapsible, in Settings section)
- [x] 1.2.3 Implement click handler:
  - If local (`localhost`): save to localStorage, open `/sync` route
  - If production: open new tab with `/sync?quest=<encoded>`
- [x] 1.2.4 Add success/error toast feedback

### 1.3 Add pako Dependency (Optional)
- [ ] 1.3.1 Add `pako` to `apps/map-builder-app/package.json`
- [ ] 1.3.2 Add type definitions `@types/pako`

---

## 2. Player App Changes

### 2.1 Create Sync Page Component
- [x] 2.1.1 Create `apps/react-quest-app/src/pages/SyncPage.tsx`
  - [x] Display "Builder Mode" header/banner
  - [x] Show quest info (ID, level, title)
  - [x] "Play" button to start quest
  - [x] "Back to Home" button to exit sync mode
  - [x] Handle loading states and errors

### 2.2 Add Sync Route
- [x] 2.2.1 Add route `/sync` to `App.tsx` router
- [x] 2.2.2 Route logic:
  - Check URL param `?quest=<encoded>` first
  - If no URL param, check `localStorage.getItem('builderQuest')`
  - If neither, show "No quest available" message

### 2.3 Add Quest Loader Service
- [x] 2.3.1 Create `apps/react-quest-app/src/services/QuestLoaderService.ts`
  - [x] Implement `loadFromUrl(): Quest | null` (parse `?quest=` param)
  - [x] Implement `loadFromLocalStorage(): Quest | null`
  - [x] Implement `clearBuilderQuest(): void`
  - [x] Implement `decompressQuest(encoded: string): Quest` (base64 + gunzip)

### 2.4 Update Quest Player Navigation
- [x] 2.4.1 Detect if quest was loaded via sync
- [x] 2.4.2 After quest completion: navigate back to `/sync` (not home)
- [x] 2.4.3 Show "Return to Builder Mode" option

### 2.5 Add pako Dependency
- [ ] 2.5.1 Add `pako` to `apps/react-quest-app/package.json`
- [ ] 2.5.2 Add type definitions `@types/pako`

---

## 3. Testing & Verification

### 3.1 Local Sync Test
- [ ] 3.1.1 Open Builder at `localhost:5174`
- [ ] 3.1.2 Create/load a quest
- [ ] 3.1.3 Click "Send to Player"
- [ ] 3.1.4 Verify Player opens at `localhost:5173/sync`
- [ ] 3.1.5 Verify SyncPage displays quest info
- [ ] 3.1.6 Click "Play" and verify quest loads
- [ ] 3.1.7 Complete quest and verify return to `/sync`
- [ ] 3.1.8 Click "Back to Home" and verify normal mode

### 3.2 URL Sync Test
- [ ] 3.2.1 Set Player URL to production URL
- [ ] 3.2.2 Click "Send to Player"
- [ ] 3.2.3 Verify new tab opens with `/sync?quest=...` URL
- [ ] 3.2.4 (On deployed Player) Verify quest loads from URL param

### 3.3 Edge Cases
- [ ] 3.3.1 Test with very large quest (>100 blocks)
- [ ] 3.3.2 Test URL length limits (may need chunking for very large quests)
- [ ] 3.3.3 Test invalid/corrupted quest data handling
- [ ] 3.3.4 Test `/sync` route with no quest data (should show error)
- [ ] 3.3.5 Test refresh on `/sync` page (should reload same quest)
