# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run start:dev` - Start development with hot reload (macOS/Linux)
- `npm run start:dev-win` - Start development with hot reload (Windows)
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Testing and Quality
- `npm run precommit` - Run pre-commit checks (lint-staged)
- Always run `npm run typecheck` and `npm run lint` after making changes

### Distribution
- `npm run dist:mac` - Build macOS distribution
- `npm run dist:win` - Build Windows distribution  
- `npm run dist:linux` - Build Linux distribution

### Development Setup
Before development, you need the anytype-heart middleware:
1. Run `./update.sh <platform> <arch>` to fetch middleware
2. Start anytypeHelper binary in background
3. Use `SERVER_PORT` env var to specify gRPC port

## Architecture Overview

### High-Level Structure
Anytype is an Electron-based desktop application with TypeScript/React frontend communicating with a Go-based middleware (anytype-heart) via gRPC.

**Key Components:**
- **Electron Main Process** (`electron.js`) - Window management, IPC, system integration
- **React Frontend** (`src/ts/`) - UI components and business logic
- **gRPC Middleware** - Backend logic (separate anytype-heart repository)
- **Block-based Editor** - Document editing with composable blocks

### Frontend Architecture (src/ts/)

**Entry Points:**
- `entry.tsx` - Application entry point
- `app.tsx` - Main React application component

**Core Libraries (`lib/`):**
- `api/` - gRPC communication (dispatcher, commands, mapper)
- `keyboard.ts` - Keyboard shortcuts and input handling
- `storage.ts` - Local storage management
- `renderer.ts` - Electron IPC communication
- `util/` - Utility functions (common, data, router, etc.)

**State Management (`store/`):**
- MobX-based stores for different domains:
- `common.ts` - Global application state
- `auth.ts` - Authentication state
- `block.ts` - Document block state
- `detail.ts` - Object detail state
- `menu.ts`, `popup.ts` - UI state

**Component Structure (`component/`):**
- `block/` - Document block components (text, dataview, media, etc.)
- `page/` - Page-level components (auth, main, settings)
- `menu/` - Context menus and dropdowns
- `popup/` - Modal dialogs
- `sidebar/` - Left/right sidebars
- `util/` - Reusable UI utilities

### Key Architectural Patterns

**Block-Based Documents:**
- Documents are composed of blocks (text, images, databases, etc.)
- Each block type has corresponding model, content, and component
- Block operations handled via gRPC commands

**MobX State Management:**
- Reactive state with MobX stores
- Components observe store changes automatically
- Stores organized by domain (auth, blocks, UI, etc.)

**gRPC Communication:**
- Frontend communicates with middleware via gRPC
- Commands in `lib/api/command.ts`
- Response mapping in `lib/api/mapper.ts`
- Real-time updates via gRPC streaming

**Electron Integration:**
- Main process handles system integration
- Renderer process handles UI
- IPC communication for file operations, updates, etc.

## Development Workflow

### Making Changes
1. Identify the relevant component in `src/ts/component/`
2. Check corresponding interfaces in `src/ts/interface/`
3. Look for related stores in `src/ts/store/`
4. Update models in `src/ts/model/` if needed
5. Add gRPC commands in `src/ts/lib/api/` if backend changes needed

### File Organization
- **Components**: UI components in `src/ts/component/`
- **Styles**: SCSS files in `src/scss/` (organized to match components)
- **Assets**: Images and icons in `src/img/`
- **Configuration**: Electron config in `electron/`
- **Build**: Rspack configuration in `rspack.config.js`

### Key Development Notes
- Uses Rspack for bundling (faster Webpack alternative)
- TypeScript with React 17
- MobX for state management
- Custom block-based editor system
- gRPC for backend communication
- Electron for desktop app packaging

### Important Patterns
- All UI text should use `translate()` function for i18n
- Block operations should go through the command system
- Use existing utility functions in `lib/util/` before creating new ones
- Follow existing component patterns in `component/` directory
- Store updates should trigger UI re-renders automatically via MobX

## Browser Testing with CDP

The app runs in Electron and requires the anytype-heart middleware. To test UI changes, connect to Electron via Chrome DevTools Protocol (CDP).

### Starting the servers
1. **Start the heart server** (gRPC + gRPC-web proxy):
   ```
   cd /path/to/anytype-heart && make run-server
   ```
   Look for `gRPC Web proxy started at: 127.0.0.1:<PORT>` in stdout — this is the port you need.
2. **Start Electron with CDP enabled** (uses the gRPC-web proxy port, NOT the gRPC port):
   ```
   make run-local
   ```
   This runs `npm run start:dev-debug` which passes `--remote-debugging-port=9222` to Electron.

### CDP Helper Scripts

Reusable scripts in `.playwright-mcp/` handle CDP communication for executing some actions. After making changes to the UI, always test it before considering it done. To test, determine which actions are needed to verify the task and if they're not covered by a helper script, create one for that.

Current scripts are:

**Evaluate JavaScript in Electron:**
```
node .playwright-mcp/cdp.js '<javascript expression>'
```
Auto-connects to the Anytype window on port 9222, evaluates the expression, prints the result. Supports `awaitPromise` for async expressions.

**Take a screenshot:**
```
node .playwright-mcp/screenshot.js [output.png]
```
Saves a PNG screenshot of the Electron window (default: `/tmp/anytype-screenshot.png`).

**Simulate drag and drop:**
```
node .playwright-mcp/drag.js <sourceSelector> <targetSelector> [options]
```
Simulates drag and drop between two elements. Options:
- `--type=native` - Use CDP Input domain for native mouse simulation (most reliable, use for Anytype blocks)
- `--type=html5` - Use HTML5 Drag and Drop API
- `--type=mouse` - Use synthetic mouse events (mousedown/mousemove/mouseup)
- `--delay=N` - Milliseconds between events (default: 50)
- `--offset=X,Y` - Offset from center of source element
- `--steps=N` - Number of intermediate steps for native drag (default: 10)

For Anytype block reordering, use `--type=native` and target the drag handles (`.icon.dnd` elements inside `.wrapMenu`). Hover over a block to reveal the handle. To place item X below item Y, drag X's handle to the item *after* Y.

**Examples:**
```bash
# Get page text
node .playwright-mcp/cdp.js 'document.body.innerText.substring(0, 500)'

# Check what's on screen
node .playwright-mcp/screenshot.js /tmp/check.png

# Click a button
node .playwright-mcp/cdp.js 'document.querySelector(".button.accent").click(); "clicked"'

# Reorder Anytype blocks (native drag)
node .playwright-mcp/drag.js '.icon.dnd.source-handle' '.icon.dnd.target-handle' --type=native --delay=200 --steps=25
```

### First Launch: InitialSetParameters

When using `ANYTYPE_USE_SIDE_SERVER`, the external heart server does **not** receive `InitialSetParameters` automatically. You must call it before `AccountCreate`/`AccountSelect` or the middleware will panic.

**Recommended approach:** On first launch, call ISP via CDP, then restart Electron. The server remembers ISP was called, so subsequent launches work without it.

```bash
node .playwright-mcp/cdp.js '
var __webpack_require__;
webpackChunkanytype.push([["_"], {}, function(req) { __webpack_require__ = req; }]);
var C;
for (var id of Object.keys(__webpack_require__.m)) {
  try { var m = __webpack_require__(id); if (m && m.InitialSetParameters) { C = m; break; } } catch(e) {}
}
new Promise((resolve) => {
  C.InitialSetParameters(1, "0.50.11", "", "warn", true, false, (msg) => resolve(JSON.stringify(msg)));
})
'
```
Platform values: 1=Mac, 2=Windows, 3=Linux.

### Navigating to pages

Extract webpack require first (if not already done), then use `Action.openSettings`:
```bash
node .playwright-mcp/cdp.js '
var __webpack_require__;
webpackChunkanytype.push([["_"], {}, function(req) { __webpack_require__ = req; }]);
var Action;
for (var id of Object.keys(__webpack_require__.m)) {
  try { var m = __webpack_require__(id); if (m && m.Action && m.Action.openSettings) { Action = m.Action; break; } } catch(e) {}
}
Action.openSettings("dataIndex", "settings"); "navigated"
'
```

### Notes
- The app cannot render in a regular browser — it requires Electron's IPC bridge. Always connect via CDP, not `http://localhost:8080` directly.
- `--remote-debugging-port` must reach the `npx electron .` process directly. npm doesn't forward args through `npm-run-all`, which is why `start:dev-debug` exists as a separate script chain.
- Typecheck errors in `dist/lib/pkg/` and `node_modules/` are pre-existing and unrelated to source changes.
- The `make run-local` command also pipes the server output to the file server.log
