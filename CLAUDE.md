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

## Browser Testing with Playwright/CDP

The app runs in Electron and requires the anytype-heart middleware. To test UI changes in a browser:

### Starting the servers
1. **Start the heart server with TWO ports** (gRPC + gRPC-web proxy):
   ```
   cd /path/to/anytype-heart && make run-server
   ```
   Look for `gRPC Web proxy started at: 127.0.0.1:<PORT>` in stdout — this is the port you need.
2. **Start Electron with the gRPC-web proxy address** (NOT the gRPC port):
   ```
   make run-local
   ```

### Connecting via CDP
- List targets: `curl -s http://127.0.0.1:9222/json` — find the target with `"title": "... - Anytype"`
- Interact via WebSocket using the target's `webSocketDebuggerUrl` and Chrome DevTools Protocol (`Runtime.evaluate`, `Page.captureScreenshot`, etc.)
- Node.js example: `const ws = new WebSocket(targetWsUrl); ws.send(JSON.stringify({id:1, method:'Runtime.evaluate', params:{expression:'document.body.innerText'}}))`

### Gotcha: InitialSetParameters
When using `ANYTYPE_USE_SIDE_SERVER`, the external heart server does **not** receive `InitialSetParameters` automatically (normally the bundled middleware gets this during Electron startup). You must call it before `AccountCreate`/`AccountSelect` or the middleware will panic.

**Recommended approach:** On first launch, call ISP via CDP, then restart Electron. The server remembers ISP was called, so subsequent Electron launches work without calling ISP again.

To call it from the Electron renderer console via CDP:
```js
// Extract webpack require
var __webpack_require__;
webpackChunkanytype.push([['_'], {}, function(req) { __webpack_require__ = req; }]);
// Find the command module
var C;
for (var id of Object.keys(__webpack_require__.m)) {
  try { var m = __webpack_require__(id); if (m?.InitialSetParameters) { C = m; break; } } catch(e) {}
}
// Call it with callback (platform: 1=Mac, 2=Windows, 3=Linux)
C.InitialSetParameters(1, '0.50.11', '', 'warn', true, false, (msg) => console.log(JSON.stringify(msg)));
```

### Navigating to pages via CDP
To programmatically navigate to settings pages:
```js
// Find Action module
var Action;
for (var id of Object.keys(__webpack_require__.m)) {
  try { var m = __webpack_require__(id); if (m?.Action?.openSettings) { Action = m.Action; break; } } catch(e) {}
}
// Navigate to a settings page
Action.openSettings('spaceStorage', 'settings');
```

### Notes
- The app cannot render in a regular browser — it requires Electron's IPC bridge (`Renderer` module). Always connect to the Electron window via CDP, not `http://localhost:8080` directly.
- Typecheck errors in `dist/lib/pkg/` and `node_modules/` are pre-existing and unrelated to source changes.
