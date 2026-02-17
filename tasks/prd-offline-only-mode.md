# PRD: Offline-Only Anytype — Remove All Online Functionality

## Introduction

Strip Anytype of all network-dependent functionality to create a fully offline, privacy-focused variant. No data leaves the user's machine — no cloud sync, no remote accounts, no telemetry, no external API calls. The app becomes a local-only knowledge management tool secured by a passphrase/PIN, with file-based export/import replacing cloud sync for data portability.

This affects both the TypeScript/Electron frontend (`anytype-ts`) and the Go middleware (`anytype-heart`).

## Goals

- Zero network calls — the application must not make any outbound connections
- Remove all cloud sync, P2P sync, sharing, publishing, and membership features
- Replace account creation/login with a local vault secured by passphrase or PIN
- Replace cloud backup with local file-based export/import
- Remove all online-dependent UI (membership, sharing, sync status, invite flows)
- Ensure the core editing, block-based document, and local storage experience remains fully functional

## User Stories

### US-001: Force Local-Only Network Mode in Middleware
**Description:** As a developer, I need the middleware (anytype-heart) to always start in local-only mode so that no network connections are ever attempted.

**Acceptance Criteria:**
- [ ] Middleware is always started with `NetworkMode.Local` (value `1`)
- [ ] Remove the ability to pass `NetworkMode.Default` or `NetworkMode.Custom` to `AccountCreate` and `AccountSelect`
- [ ] Remove or disable any network listener, DHT bootstrap, relay, or STUN/TURN logic in anytype-heart
- [ ] Verify with network monitoring that zero outbound connections are made on app start and during normal use
- [ ] Typecheck passes

### US-002: Replace Auth Flow with Local Vault Unlock
**Description:** As a user, I want to open the app and either create a new local vault with a passphrase or unlock an existing one, without any sign-up or cloud account.

**Acceptance Criteria:**
- [ ] Remove the sign-up/login selection screen (`component/page/auth/select.tsx`)
- [ ] Remove email verification step from onboarding (`component/page/auth/onboard.tsx` Stage.Email)
- [ ] Remove account recovery screen (`component/page/auth/login.tsx` network recovery path)
- [ ] First launch shows: "Create vault" → user sets a passphrase → vault is created locally
- [ ] Subsequent launches show: "Unlock vault" → user enters passphrase → vault opens
- [ ] Remove account deletion flow (`component/page/auth/deleted.tsx`) — user simply deletes the vault folder
- [ ] Remove migration flow if it depends on network (`component/page/auth/migrate.tsx`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Remove Sync Status UI
**Description:** As a user, I should not see any sync indicators since everything is local.

**Acceptance Criteria:**
- [ ] Remove sync status widget (`component/util/sync.tsx`) from the header/toolbar
- [ ] Remove sync status menu (`component/menu/syncStatus.tsx`)
- [ ] Remove all references to `syncStatusMap`, `syncStatusUpdate`, `getSyncStatus`, `getNotSynced` from auth store (`store/auth.ts`)
- [ ] Remove sync-related badge on "Remote Storage" settings item
- [ ] Remove P2P device count and sync counters from UI
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Remove Space Sharing and Invite System
**Description:** As a user, I should not see any sharing, invite, or collaboration features since the app is offline-only.

**Acceptance Criteria:**
- [ ] Remove Share/Members settings page (`component/page/main/settings/space/share.tsx` and `share/members.tsx`)
- [ ] Remove "Members" or "Share" menu item from space settings sidebar
- [ ] Remove invite popups (`popup/invite/confirm.tsx`, `popup/invite/qr.tsx`, `popup/invite/request.tsx`)
- [ ] Remove invite page (`component/page/main/invite.tsx`)
- [ ] Remove share popup (`popup/share.tsx`)
- [ ] Remove all `SpaceInvite*`, `SpaceJoin*`, `SpaceRequest*`, `SpaceParticipant*`, `SpaceMakeShareable`, `SpaceStopSharing` gRPC command wrappers from `lib/api/command.ts`
- [ ] Remove notification handling for join requests (`component/notification/index.tsx` — space join request notifications)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Remove Publishing Features
**Description:** As a user, I should not see any "publish to web" functionality.

**Acceptance Criteria:**
- [ ] Remove publishing settings page (`component/page/main/settings/data/publish.tsx`)
- [ ] Remove "Published Data" item from settings sidebar
- [ ] Remove all `Publishing*` gRPC command wrappers from `lib/api/command.ts`
- [ ] Remove any "Publish" buttons/menu items on individual objects
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Remove Membership and Payment System
**Description:** As a user, I should not see any membership tiers, upgrade prompts, or payment flows.

**Acceptance Criteria:**
- [ ] Remove membership settings page (`component/page/main/settings/membership.tsx`)
- [ ] Remove "Membership" item from settings sidebar (currently gated by `isOnline && isAnytypeNetwork()`)
- [ ] Remove membership popup (`popup/membership.tsx`)
- [ ] Remove all `Membership*` gRPC command wrappers from `lib/api/command.ts`
- [ ] Remove `UpsellBanner` component and all references to membership upgrade prompts
- [ ] Remove `membership`, `membershipSet`, `membershipUpdate` from auth store
- [ ] Remove membership-related tier types and interfaces
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Remove Remote Storage Settings — Replace with Local Storage Only
**Description:** As a user, I want to see only local storage usage and manage my local data, not remote/cloud storage.

**Acceptance Criteria:**
- [ ] Remove or repurpose "Remote Storage" settings page (`component/page/main/settings/space/storage.tsx`)
- [ ] Remove references to remote storage usage, "not synced" files, and sync error states
- [ ] Show local disk usage for the vault instead
- [ ] Remove `spaceStorage` remote tracking from common store
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Add Local File-Based Export/Import
**Description:** As a user, I want to export my entire vault (or individual spaces/objects) to a file and import from a file, replacing cloud sync for data portability.

**Acceptance Criteria:**
- [ ] Export option in settings: "Export vault to file" → saves a `.zip` or `.any` archive to a user-selected path
- [ ] Import option in settings: "Import vault from file" → reads archive and merges/replaces data
- [ ] Export/import individual spaces
- [ ] Export/import individual objects (if not already supported)
- [ ] Progress indicator during export/import
- [ ] Error handling for corrupt or incompatible archives
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Remove Network-Related gRPC Commands and Utilities
**Description:** As a developer, I need to clean up all unused network-related code from the frontend.

**Acceptance Criteria:**
- [ ] Remove or stub the following gRPC command wrappers from `lib/api/command.ts`:
  - `AccountRecover` (network-based recovery)
  - `MembershipGetStatus`, `MembershipGetTiers`, `MembershipGetPortalLinkUrl`, `MembershipGetVerificationEmail`, `MembershipVerifyEmailCode`, `MembershipRegisterPaymentRequest`, `MembershipFinalize`, `MembershipCodeGetInfo`, `MembershipCodeRedeem`
  - `SpaceInviteGenerate`, `SpaceInviteChange`, `SpaceInviteView`, `SpaceInviteRevoke`, `SpaceInviteGetCurrent`, `SpaceStopSharing`, `SpaceMakeShareable`, `SpaceJoin`, `SpaceJoinCancel`, `SpaceRequestApprove`, `SpaceRequestDecline`, `SpaceParticipantPermissionsChange`, `SpaceParticipantRemove`
  - `PublishingCreate`, `PublishingRemove`, `PublishingList`, `PublishingResolveUri`, `PublishingGetStatus`
  - `NotificationList`, `NotificationReply` (if only used for share notifications)
  - `DeviceList` (P2P device listing)
  - `LinkPreview` (if it fetches external URLs)
  - `DebugNetCheck`
- [ ] Remove `isAnytypeNetwork()`, `isDevelopmentNetwork()` utility checks from `lib/util/data.ts` — always treat as local
- [ ] Remove `isOnline` / `isOnlineSet` from common store
- [ ] Typecheck passes

### US-010: Remove Online-Dependent UI Conditionals
**Description:** As a developer, I need to clean up conditional logic that checks for online/network state.

**Acceptance Criteria:**
- [ ] Remove all `S.Common.isOnline` conditionals — the app is always "offline"
- [ ] Remove all `U.Data.isAnytypeNetwork()` conditionals — never on Anytype network
- [ ] Remove all `U.Data.isLocalNetwork()` conditionals — always local, so these checks are always true
- [ ] Remove network mode selection from any settings or config UI
- [ ] Remove `networkConfig`, `networkConfigSet` from auth store — always local mode
- [ ] Typecheck passes

### US-011: Strip Network Code from Middleware (anytype-heart)
**Description:** As a developer, I need to remove or disable all networking code in the Go middleware to ensure zero outbound connections.

**Acceptance Criteria:**
- [ ] Disable or remove IPFS/libp2p networking stack
- [ ] Disable or remove Any-Sync protocol client
- [ ] Disable or remove DHT, relay, STUN/TURN connections
- [ ] Remove account recovery via network
- [ ] Remove space sync service
- [ ] Remove file pinning/remote file storage service
- [ ] Remove publishing service
- [ ] Remove membership/payment verification service
- [ ] Remove notification service (network-based notifications)
- [ ] Ensure `AccountCreate` and `AccountSelect` only accept `NetworkMode.Local`
- [ ] All data operations work purely against local badger/SQLite stores
- [ ] Build succeeds
- [ ] Integration tests pass with no network calls

### US-012: Remove Analytics and Telemetry
**Description:** As a user, I expect zero telemetry in an offline-only privacy-focused app.

**Acceptance Criteria:**
- [ ] Remove or disable all analytics event tracking (Amplitude, Mixpanel, or custom analytics)
- [ ] Remove analytics-related gRPC commands if any
- [ ] Remove analytics initialization from app startup
- [ ] No analytics-related network requests on any user action
- [ ] Typecheck passes

### US-013: Clean Up Settings Sidebar
**Description:** As a user, I want a clean settings page with only relevant offline options.

**Acceptance Criteria:**
- [ ] Settings sidebar shows only:
  - Account (profile, passphrase change, vault deletion instructions)
  - Space settings (name, icon, local storage)
  - Data management (local storage usage, export/import)
  - Appearance (theme, language, etc.)
  - General preferences (existing non-network settings)
- [ ] Removed items: Membership, Published Data, Remote Storage, Share/Members
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The application MUST NOT make any outbound network connections under any circumstances
- FR-2: The middleware MUST always start in `NetworkMode.Local` (value `1`) with no option to change
- FR-3: Account creation MUST be local-only — passphrase creates a local vault, no email or cloud account
- FR-4: Vault unlock MUST use a local passphrase or PIN, verified entirely on-device
- FR-5: All gRPC commands related to sync, sharing, publishing, membership, and network checks MUST be removed or permanently stubbed
- FR-6: Export MUST produce a portable archive file (`.zip` or `.any`) containing all vault data
- FR-7: Import MUST be able to restore a vault from a previously exported archive
- FR-8: The sync status widget, menu, and all related UI MUST be removed
- FR-9: Space sharing (invites, join requests, participant management) MUST be removed entirely
- FR-10: Publishing to web MUST be removed entirely
- FR-11: Membership tiers, payment flows, and upgrade prompts MUST be removed entirely
- FR-12: Analytics and telemetry MUST be removed or disabled
- FR-13: Settings pages MUST only show locally-relevant options
- FR-14: The core block editor, object creation, dataview/kanban, search, and all local features MUST continue to work without regression

## Non-Goals

- No replacement for real-time collaboration — this is a single-user offline tool
- No LAN/local network sync between devices (even without internet)
- No encrypted cloud backup integration (e.g. S3, iCloud, Google Drive) — just plain file export
- No migration wizard from online Anytype accounts — users export from online version, import here
- No changes to the block editor, object types, relations, or local data model
- No mobile app changes (this PRD covers desktop only: `anytype-ts` + `anytype-heart`)

## Design Considerations

- The first-launch experience should feel simple: "Create vault" → set passphrase → start using
- Returning users see: "Unlock vault" → enter passphrase → workspace loads
- Export/Import should be accessible from Settings → Data Management
- Remove empty sections gracefully — don't leave blank pages or broken navigation
- Reuse existing Anytype export infrastructure (`Action.export`, `Action.import`) where possible
- The app should still feel like Anytype — same design language, just fewer features

## Technical Considerations

- **anytype-heart changes are critical path** — the middleware must be modified to never initiate network connections. This may involve compile-time flags or removing packages.
- **gRPC proto files** — command removal in `anytype-ts` must align with middleware. Unused protos can remain but should not be called.
- **Electron main process** — `electron/js/server.js` spawns the middleware. May need to pass a `--local-only` flag or environment variable.
- **Storage** — all data stays in the local vault directory (typically `~/.anytype/`). No change to local storage engine (badger/SQLite).
- **Existing export/import** — Anytype already has export (Markdown, Protobuf) and import features. US-008 may build on these rather than creating a new system.
- **Build pipeline** — consider a build flag (`OFFLINE_ONLY=true`) to conditionally compile out network code, especially in the Go middleware where dead code isn't automatically stripped.
- **Testing** — network monitoring (e.g. `lsof -i`, Wireshark, Little Snitch) should be part of verification to confirm zero connections.

## Success Metrics

- Zero outbound network connections verified via network monitoring tools during a full user session (create vault, create objects, edit, search, export, import, close)
- All existing local features (block editor, objects, types, relations, sets, collections, kanban, graph, search) work without regression
- App starts and is usable within the same timeframe as current local-only mode
- Export/import round-trip preserves all data without loss
- Clean settings UI with no dead links, empty pages, or broken references

## Open Questions

- Should the passphrase unlock use the existing mnemonic phrase system or a simpler PIN/password?
  - Answer: Keep passphrase
- Should we keep the `LinkPreview` command for pasting URLs into documents (it fetches metadata from external URLs) or strip it too for zero-network purity?
  - Answer: The `LinkPreview` can still exist
- Should Electron auto-update (`electron-updater`) be removed as well, or kept for distributing offline-only updates?
  - Answer: Remove auto-update
- What is the best archive format for export/import — reuse Anytype's existing protobuf export, or create a simpler zip-based format?
  - Answer: Current protobuf should still be used
- Should we use a compile-time build flag in anytype-heart or runtime configuration to enforce local-only mode?
  - Answer: No flags, just remove network functionality
- How should we handle existing Anytype vaults that were previously synced — warn the user that sync data will be ignored?
  - Answer: Just add a disclaimer at the onboarding screens that this is a offline-only app
