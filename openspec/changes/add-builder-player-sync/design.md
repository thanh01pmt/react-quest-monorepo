# Design: Builder-to-Player Sync Architecture

## Context

The React Quest monorepo contains two apps:
- **React Quest Builder** (`apps/map-builder-app`) - For building game levels
- **React Quest Player** (`apps/react-quest-app`) - For playing/testing levels

When deployed to Netlify, these apps run on different subdomains and cannot share localStorage.

## Goals
- Enable seamless quest testing from Builder to Player
- Support both local development and production deployment
- Minimize friction in the iteration cycle
- Keep implementation simple and maintainable

## Non-Goals
- Real-time sync (user must explicitly trigger sync)
- Multi-quest management (only one "builder quest" at a time)
- Bidirectional sync (Player cannot send data back to Builder)

## Decisions

### Decision 1: Dual-Mode Sync Strategy

**Chosen approach**: Use localStorage for local development, URL-based sharing for production.

**Rationale**:
- localStorage is the simplest solution for same-origin (localhost)
- URL-based sharing works across any origin and doesn't require a backend
- Users can configure the Player URL to point anywhere (localhost, staging, production)

**Alternatives considered**:
- BroadcastChannel API: Only works same-origin
- Backend sync service: Adds complexity and hosting requirements
- IndexedDB with Service Workers: Overkill for this use case

### Decision 2: Compression with pako

**Chosen approach**: Use gzip compression (via pako) before base64 encoding for URL sync.

**Rationale**:
- Quest JSON can be large (10-30KB)
- Base64 encoding increases size by ~33%
- Gzip typically reduces JSON size by 70-80%
- URL length limits vary by browser (2000-8000 chars for path+query)
- Combined gzip+base64 keeps most quests under 5KB encoded

**Example**:
```
Original JSON: 25,000 bytes
Gzip compressed: 5,000 bytes
Base64 encoded: 6,600 bytes
URL-safe: ~6,600 chars (well within limits)
```

### Decision 3: Player URL Configuration

**Chosen approach**: Store Player URL in Builder's localStorage, with sensible defaults.

**Defaults**:
- Local: `http://localhost:5173`
- Production: User must configure (no default production URL)

**UI**: Collapsible input field in QuestDetailsPanel's "Import/Export" section.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         BUILDER                                  │
│                                                                  │
│  [Quest Editor] ──▶ outputJsonString ──▶ "Send to Player" btn   │
│                                              │                   │
│                                              ▼                   │
│                                    ┌─────────────────┐          │
│                                    │ PlayerSyncService│          │
│                                    └────────┬────────┘          │
│                                              │                   │
│                          ┌───────────────────┼───────────────┐  │
│                          │                   │               │  │
│                          ▼                   ▼               │  │
│                    [localStorage]     [URL generation]       │  │
│                    + open /sync       /sync?quest=...        │  │
│                    (local mode)       (production mode)      │  │
└────────────────────────┬─────────────────────┬───────────────┘
                         │                     │
                         ▼                     ▼
┌────────────────────────┴─────────────────────┴───────────────┐
│                       PLAYER /sync                            │
│                                                               │
│  [Route: /sync]                                               │
│       │                                                       │
│       ├──▶ Check URL params (?quest=...)                      │
│       │         │                                             │
│       │         └──▶ Decode ──▶ Parse ──▶ SyncPage            │
│       │                                                       │
│       └──▶ Check localStorage (builderQuest)                  │
│                 │                                             │
│                 └──▶ Parse ──▶ SyncPage                       │
│                                                               │
│  [SyncPage Component]                                         │
│       │                                                       │
│       ├──▶ Display quest info                                 │
│       ├──▶ "Play" ──▶ Start QuestPlayer                       │
│       │                   │                                   │
│       │                   └──▶ On complete ──▶ Return /sync   │
│       │                                                       │
│       └──▶ "Back to Home" ──▶ Clear localStorage              │
│                            ──▶ Navigate to /                  │
└───────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| URL too long for very large quests | Show warning if encoded size > 7000 chars; suggest using local sync |
| Quest data visible in browser history | Document in changelog; optional encryption for sensitive content |
| Stale localStorage data | Always check URL params first; "Clear" button resets state |
| Incompatible quest versions | Validate quest schema on load; show error if missing required fields |

## Open Questions

1. **Should we add a "Copy URL" button** in addition to "Open in Player"?
   - Pro: User controls when to open, can share URL
   - Con: Extra button, more UI complexity

2. **Should we support multiple builder quests in Player?**
   - Current decision: No, keep it simple (one at a time)
   - Can reconsider if user feedback indicates need

3. **Should we add encryption for production sync?**
   - Current decision: Not in MVP, document security implications
   - Can add optional encryption in future iteration
