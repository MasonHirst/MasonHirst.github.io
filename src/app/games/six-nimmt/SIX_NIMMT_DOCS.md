# 6-Nimmt! — Implementation Reference

This document describes the **current rebuilt implementation** of the 6-nimmt! multiplayer card game. Use it as a reference for understanding the architecture, socket protocol, data structures, and component hierarchy.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Game Rules](#2-game-rules)
3. [State Machine](#3-state-machine)
4. [Backend](#4-backend)
   - [HTTP Endpoints](#http-endpoints)
   - [Socket Events](#socket-events)
   - [Card Stacking Logic](#card-stacking-logic)
   - [Helper Utilities](#helper-utilities)
5. [Data Structures](#5-data-structures)
6. [Frontend — Angular 18](#6-frontend--angular-18)
   - [Routing](#routing)
   - [Service Layer](#service-layer)
   - [Host Flow](#host-flow)
   - [Client Flow](#client-flow)
   - [Shared Components](#shared-components)
7. [Animation Architecture](#7-animation-architecture)
8. [Dependencies](#8-dependencies)
9. [File Manifest](#9-file-manifest)

---

## 1. Architecture Overview

| Layer | Tech | Purpose |
|---|---|---|
| Frontend | Angular 18, Socket.io-client, GSAP | SPA served from same origin |
| Backend | Express.js + Socket.io | REST + WebSocket real-time sync |
| Hosting | Docker, portfolio.masonhirst.com | Server serves the Angular build |

- All game state lives **on the server** in memory (no database).
- The frontend is essentially a dumb display layer — it emits socket events and renders whatever game state the server pushes back.
- Player identity is a random `shortid` token stored in `localStorage`. No login required.
- All animation timing is **client-driven** — the server emits a sequence of moves and the client animates them one-by-one. No `sleep()` on the server.

---

## 2. Game Rules

### The Deck
- 104 cards numbered 1–104.
- Each card has a **bull head** value (penalty points):
  - Default: 1 bull head
  - Ends in 5 (except 55): 2 bull heads
  - Ends in 0 (except 60): 3 bull heads
  - Doubles (11, 22, 33, 44, 66, 77, 88, 99): 5 bull heads
  - 55: 7 bull heads (maximum)
  - 60: 3 bull heads (ends in 0)

### Setup
- 2–10 players.
- Each player is dealt **10 cards** (sorted ascending).
- **4 stacks** are dealt — one card each (sorted ascending) — placed face-up on the table.

### Each Round (10 rounds per game)
1. All players simultaneously choose one card from their hand and reveal it.
2. Cards are placed on stacks in ascending order of card number.
3. **Placement rule**: A card goes on the stack whose top card is the largest number still smaller than the played card.
4. **Taking a row (penalty)**:
   - If a card is the 6th card on a stack, the player takes all 5 previous cards as penalty points (their card becomes the new top of that stack).
   - If a card is lower than all 4 stack tops, the player **must** choose a row to take. All cards on that row become their penalty cards; their card becomes the new top.
5. Penalty cards accumulate as **bull head** points.

### End Condition
- After all 10 rounds, scores are tallied.
- If any player reaches **66 or more bull heads**, the game ends and that player loses (lowest score wins).
- If no one hits 66, start another game (scores carry over across rounds, reset when starting a fresh game).

---

## 3. State Machine

```
WAITING_FOR_PLAYERS
        │
        │  host/first player clicks "Start Game" (min 2 players)
        ▼
  PICKING_CARDS  ◄────────────────────────────────────┐
        │                                              │
        │  all players select a card                  │
        │  → 3-second countdown                       │
        ▼                                             │
 STACKING_CARDS                                      │
        │                                             │
        │  server emits stacking-sequence             │
        │  client animates each move one-by-one      │
        │  (may pause for a player to pick a row)    │
        │                                             │
        │  if cards remain in hands ─────────────────┘
        │
        │  if hands are empty (10 rounds done)
        ▼
   GAME_REVIEW
        │
        │  "Next Round" → resets scores, new deal
        │  "New Game"   → resets everything
```

**State values** (string constants used throughout):
- `"WAITING_FOR_PLAYERS"`
- `"PICKING_CARDS"`
- `"STACKING_CARDS"`
- `"GAME_REVIEW"`

---

## 4. Backend

**Location**: `server/`  
**Entry point**: `server/index.js`  
**Port**: `8080` (dev) or `process.env.PORT` (prod)

The server serves the Angular build from `/build` and falls through to `index.html` for all non-API routes.

### HTTP Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/nimmt/create` | Create a new game room. Returns `{ gameCode }`. |
| `GET` | `/api/nimmt/check-game-code/:gameCode` | Check if a game code exists. Returns full game data or 404. |
| `POST` | `/api/nimmt/player/choose-row` | Player selects which row to take when their card can't stack. Body: `{ gameCode, userToken, rowIndex }`. |
| `GET` | `/api/games/:gameCode` | Generic game check (used by shared game-room handler). |
| `GET` | `*` | Serve `index.html` (SPA fallback). |

### Socket Events

All socket events include `gameCode` and `userToken` in the payload.

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-game` | `{ gameCode, userToken, playerName, isHost }` | Join or rejoin a room. `playerName` required for new players. |
| `start-fresh-game` | `{ gameCode, userToken }` | Start a brand new game (resets all scores). |
| `start-next-round` | `{ gameCode, userToken }` | Start the next round (preserves cumulative scores). |
| `kick-player` | `{ gameCode, userToken, targetToken }` | Host removes a player. |
| `select-card` | `{ gameCode, userToken, card }` | Player selects (or deselects) a card. |
| `animation-complete` | `{ gameCode, userToken }` | Host signals its stacking animation queue finished. Server uses this to start the countdown when 1-card auto-selection has populated all `selectedCard` fields ahead of time. |

#### Server → Client

| Event | Payload | Description |
|---|---|---|
| `someone-joined-game` | `gameData` | Broadcast when any player joins. |
| `someone-left-game` | `gameData` | Broadcast when any player disconnects. |
| `game-updated` | `gameData` | Full game state pushed after any state change. Always fires, even mid-animation. |
| `counting-down` | `number \| null` | Countdown tick value (3, 2, 1). `null` when countdown ends. |
| `kicked-from-game` | — | Sent only to the kicked player. |
| `message` | `{ type, message }` | Error or info messages (e.g., `not-allowing-join`). |
| `stacking-sequence` | `{ moves: Move[], finalGameState }` | Ordered list of card placements for client animation. Emitted once all players have selected cards. |
| `stacking-sequence-continuation` | `{ moves: Move[], finalGameState }` | Resumes the sequence after a player picks a row. Same shape as `stacking-sequence`. |

**Move object shape** (each element of the `moves` array):
```js
{
  playerToken: string,
  playerName: string,
  card: { number, bullHeads },
  stackIndex: number,       // which stack (0–3)
  tookRow: boolean,         // did this player take the row?
  rowCardsTaken: Card[],    // cards swept up (empty if tookRow is false)
  pointsEarned: number,     // bull heads taken (0 if no row taken)
  stackAfter: Card[],       // stack state after this move
}
```

### Card Stacking Logic

The server no longer processes cards synchronously and emits only a final state. Instead:

**`computeStackingSequence(gameData)`** — pure function in `helperFunctions.js`:
1. Deep-clones the game state (no mutation of the real room).
2. Collects all players who have a `selectedCard`.
3. Sorts players ascending by `selectedCard.number`.
4. For each player in order, calls `applyPlayerMove(clonedState, playerToken)`:
   - Finds the best stack (largest top card that is still smaller than played card).
   - **No valid stack** (card is lower than all stack tops):
     - If `player.pickedRow !== null`: use that row as the target, set `tookRow: true`.
     - If `player.pickedRow === null`: stop processing. Return `{ needsToPickRow: true }`.
   - **Valid stack with 5 cards**: player takes the row automatically, `tookRow: true`.
   - **Valid stack with < 5 cards**: card appended, `tookRow: false`.
5. Returns `{ moves, pausedForPlayer, intermediateState, finalGameState }`.
   - If `pausedForPlayer` is set, `intermediateState` captures the partial run (for the continuation call).

**`runStackingPhase(gameCode)`** in `gameSocketController.js`:
1. Calls `computeStackingSequence`.
2. Emits `stacking-sequence` with moves + finalGameState (or intermediateState if paused).
3. Applies the appropriate state to `nimmtRooms[gameCode]`.
4. Emits `game-updated`.

**`handlePlayerSelectRow`** in `gameSocketController.js`:
- Called via HTTP POST when player picks a row.
- Sets `pickedRow` on the player.
- Calls `computeStackingSequence` again from the intermediate state.
- Emits `stacking-sequence-continuation` + `game-updated`.

**`handleMoveNextRound(gameData)`**:
- If any player still has cards → reset `selectedCard`, `cardIsStacked`, `needsToPickRow`, `pickedRow` → set state to `"PICKING_CARDS"` → emit `game-updated`.
- If hands are empty → push `pointCards` into `player.roundScores` → set state to `"GAME_REVIEW"` → emit `game-updated`.

**Per-game countdown**: `countdowns = {}` map keyed by `gameCode`. Each game has its own interval; `manageCountdown(gameCode, start)` clears/restarts it independently. Prevents interference when multiple games are active.

### Helper Utilities

**`server/utility/helperFunctions.js`**

| Function | Description |
|---|---|
| `new4LetterId()` | Generates a random 4-uppercase-letter game code, filtered against `swearWords.json`. |
| `dealNimmtHands(gameData, isFreshGame)` | Shuffles deck, deals 10 cards per player (sorted asc), deals 4 single-card stacks (sorted asc). If `isFreshGame`, resets `roundScores`. |
| `nimmtAllowJoin(gameData, isHost, userToken, playerName)` | Returns `{ allowed: bool, message: string }`. Blocks joins if: game not in WAITING_FOR_PLAYERS, no playerName, or player count ≥ 10. Returning players (same token) always allowed. |
| `computeStackingSequence(gameData)` | Pure function. Deep-clones state, simulates all card placements, returns `{ moves, pausedForPlayer, intermediateState, finalGameState }`. |
| `applyPlayerMove(state, playerToken)` | Applies one player's card to the cloned state. Returns `{ move }` or `{ needsToPickRow: true }`. |

---

## 5. Data Structures

### Game Room Object

```js
{
  code: "ABCD",
  gameState: "WAITING_FOR_PLAYERS",
  gameNumber: 1,
  lastAction: Date.now(),
  hosts: ["userToken1"],
  tableStacks: [
    [{ number: 7, bullHeads: 1 }],
    [{ number: 23, bullHeads: 2 }],
    [{ number: 56, bullHeads: 7 }],
    [{ number: 89, bullHeads: 1 }],
  ],
  players: {
    "userToken1": {
      userToken: "userToken1",
      socketId: "abc123",
      playerName: "Alice",
      cards: [{ number, bullHeads }, ...],
      selectedCard: { number, bullHeads } | null,
      cardIsStacked: false,
      needsToPickRow: false,
      pickedRow: null,
      pointCards: [{ number, bullHeads }, ...],
      roundScores: [
        [{ number, bullHeads }, ...],
        ...
      ]
    },
    ...
  }
}
```

### Card Object

```js
{ number: 1–104, bullHeads: 1–7 }
```

### Bull Head Distribution

| Condition | Bull Heads |
|---|---|
| Default | 1 |
| Number ends in 5 (5, 15, 25, 35, 45, 65, 75, 85, 95) | 2 |
| Number ends in 0 (10, 20, 30, 40, 50, 70, 80, 90, 100) | 3 |
| Double digits (11, 22, 33, 44, 66, 77, 88, 99) | 5 |
| 55 | 7 |
| 60 | 3 |

---

## 6. Frontend — Angular 18

### Routing

```
/games/6-nimmt!                  → SixNimmtComponent       (lobby/join screen)
/games/6-nimmt!/host/:gameCode   → HostScreenComponent     (host/TV display)
/games/6-nimmt!/client/:gameCode → ClientScreenComponent   (player phone)
```

### Service Layer

**`six-nimmt.service.ts`** — singleton, `providedIn: 'root'`.

**Socket initialization**:
- Dev (`localhost`): connects to `ws://localhost:8080`
- Prod: connects to `wss://portfolio.masonhirst.com`
- Query param: `token=<userToken>` (shortid from localStorage, generated on first visit)

**Key signals and subjects**:

| Property | Type | Description |
|---|---|---|
| `gameData` | `Signal<any>` | Current full game state from server |
| `countdown` | `Signal<number \| null>` | Current countdown value; null when inactive |
| `isAnimating` | `Signal<boolean>` | True while the client is playing a stacking animation |
| `stackingSequence$` | `Subject<any>` | Emits when `stacking-sequence` arrives from server |
| `stackingContinuation$` | `Subject<any>` | Emits when `stacking-sequence-continuation` arrives |

**Methods**:

| Method | Description |
|---|---|
| `sendSocketMessage(type, body)` | Emits socket event; automatically appends `gameCode` and `userToken` |
| `checkGameExists(gameCode?)` | GET check; on failure redirects to `/games/6-nimmt!` |
| `finishAnimation(finalGameState)` | Sets `isAnimating(false)`; updates `gameData` |
| `isFirstPlayer()` | Returns true if current user is the first entry in `gameData.players` |
| `getRoundScore(player)` | Sums `bullHeads` across `player.pointCards` |
| `getTotalScore(player)` | Sums `bullHeads` across all `player.roundScores` |

**Socket listeners**:
- `connect` → calls `checkGameExists()` (HTTP) **and** re-emits `join-game` if currently on a `/host/` or `/client/` URL. This ensures the socket is in the server room after any (re)connect, independently of component lifecycle. Without this, `game-updated` responses would not reach the client after a reconnect.
- `message` → SweetAlert if type is `not-allowing-join`; redirects to lobby if `no-player-name`
- `someone-joined-game` → updates `gameData`; navigates host to `/host/:code`, player to `/client/:code`
- `game-updated` → **always** updates `gameData` (even during animation — required for pick-a-row overlay on client)
- `counting-down` → updates `countdown` signal
- `kicked-from-game` → SweetAlert + redirect to lobby
- `stacking-sequence` → sets `isAnimating(true)`, emits on `stackingSequence$`
- `stacking-sequence-continuation` → emits on `stackingContinuation$`

---

### Host Flow

The host screen is a TV/shared display. It renders different sub-components based on a `view()` computed signal.

#### `HostScreenComponent`

```ts
readonly view = computed(() => {
  if (this.nimmtService.isAnimating()) return 'table';
  const state = this.gameData()?.gameState;
  if (state === 'WAITING_FOR_PLAYERS') return 'join';
  if (state === 'GAME_REVIEW') return 'review';
  return 'table';
});
```

Locking `view` to `'table'` while `isAnimating()` prevents the view from switching away mid-animation.

Contains `<app-countdown-overlay>` always — it self-shows when `countdown()` is non-null.

#### `CountdownOverlayComponent`

Full-screen overlay that shows the countdown number (3, 2, 1) with a pop-in CSS animation.

- Reads `countdown` signal from the service.
- `visible = computed(() => countdown() !== null)`.
- `showNumber` signal briefly toggles false → true (16ms) on each tick, causing `*ngIf="showNumber()"` to remove/re-add the element and restart the CSS animation cleanly.
- CSS: `pop-in` keyframe — scale 1.8→1→0.7 with opacity, `Cinzel` font, gold color.

#### `JoinPageComponent`

- Displays game code (click to copy).
- Lists all joined players with a **Kick** button per player.
- **Start Game** button — disabled until 2+ players joined.
- Socket events emitted: `start-fresh-game`, `kick-player`.

#### `GameTableComponent`

The most complex component. Manages the animation queue and all local display state during stacking.

**Angular 18 signal note**: effects that synchronously write to other signals require `{ allowSignalWrites: true }` in the options object. Without it, signal writes inside effects are silently no-ops — the effect runs but nothing changes. This caught us when `localStacks` and `localPlayers` were never being populated despite `gameData` being set correctly.

**Local signals** (separate from `gameData` to allow animation to run without interference):

| Signal | Type | Description |
|---|---|---|
| `localStacks` | `Signal<Card[][]>` | Stack display state, mutated per move |
| `localPlayers` | `Signal<Record<string, any>>` | Player display state, mutated per move |
| `activeToken` | `Signal<string \| null>` | Player whose card is currently flying |
| `cardsRevealed` | `Signal<boolean>` | Controls face-down/face-up flip on player cards |

An `effect()` syncs `localStacks` and `localPlayers` from `gameData` only when `!isAnimating()`.

**Animation queue**:
- Subscribes to `stackingSequence$` and `stackingContinuation$` in `ngOnInit`.
- `startSequence(moves, finalGameState, isFirst: boolean)`:
  - `isFirst=true`: snapshot `gameData` into local signals, flip cards face-up (400ms), then start queue.
  - `isFirst=false` (continuation): skip snapshot and flip, call `processNextMove()` immediately.
- `processNextMove()`: pops from `moveQueue`, calls `animateMove(move)`, recurses on completion.
- When queue is empty and `pendingFinalState !== null`: calls `nimmtService.finishAnimation()`.

**DOM IDs used by GSAP**:
- `player-slot-{token}` — source rect for card flight
- `card-{number}` — destination element (on `<app-nimmt-card>`)
- `stack-row-{index}` — target for sweep clone capture
- `player-panel-{token}` — score flash target

#### `GameReviewPageComponent`

- Score table: rows = rounds, columns = players.
- Totals at bottom.
- If any player has 66+ total bull heads, shows "Game Over" + loser name.
- Buttons: **Next Round**, **New Game**, **End This Game**.
- Socket events emitted: `start-next-round`, `start-fresh-game`.

---

### Client Flow

The client screen is the player's phone view.

#### `ClientScreenComponent`

- Dark green header showing player name + total score.
- Renders based on `gameData()?.gameState`:
  - `JoinedPageComponent` → `WAITING_FOR_PLAYERS`
  - `CardSelectComponent` → `PICKING_CARDS` or `STACKING_CARDS`
  - `GameReviewClientComponent` → `GAME_REVIEW`

#### `JoinedPageComponent`

- Waiting message for non-first players.
- **Start Game** button for first player.

#### `CardSelectComponent`

- Displays player's hand as a row of `NimmtCardComponent`s.
- Cards are selectable only during `PICKING_CARDS`.
- During `STACKING_CARDS`, cards are locked.
- Renders `<app-pick-a-row>` when `player.needsToPickRow === true`.

#### `PickARowComponent`

Bottom sheet that slides up from the bottom when the player must choose a row.

- Shows actual cards on each stack (mini `NimmtCardComponent`s).
- Shows total bull heads per stack.
- Cheapest row highlighted green; most expensive highlighted red.
- On selection: sends HTTP POST `/api/nimmt/player/choose-row`.

#### `GameReviewClientComponent`

- First player sees **Start Next Round** button.
- Other players see a waiting message.

---

### Shared Components

#### `NimmtCardComponent`

Inputs:

| Input | Type | Default | Description |
|---|---|---|---|
| `card` | `{ number, bullHeads }` | — | Card data to display |
| `height` | number | — | Card height in px |
| `selectable` | boolean | false | Whether card can be clicked/selected |
| `faceDown` | boolean | false | Triggers CSS 3D Y-axis flip to show card back |
| `borderColor` | string | — | CSS color for card border |
| `borderWidth` | number | — | Border width in px |
| `backgroundColor` | string | — | CSS background color |

- Card number in all four corners.
- Bull head icons in the center.
- When `faceDown=true`: dark green card back (`#1a3a2a`) with gold border and diagonal stripe pattern, via CSS `transform-style: preserve-3d` and `rotateY(180deg)`.
- `[id]="'card-' + card.number"` is set on the component host element so GSAP can target it by card number (unique across the 104-card deck).

---

## 7. Animation Architecture

### Card Placement (FLIP technique)

1. Record `getBoundingClientRect()` of `#player-slot-{token}` (source).
2. Update `localPlayers` (remove card from slot) and `localStacks` (add card to stack).
3. `setTimeout(0)` — wait for Angular to render.
4. Find `#card-{number}` in the DOM (now in its stack position).
5. Compute delta: `dx = fromRect.left - toRect.left`, `dy = fromRect.top - toRect.top`.
6. `gsap.set(cardEl, { x: dx, y: dy, zIndex: 100 })` — visually snap card back to source.
7. `gsap.to(cardEl, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' })` — animate to destination.
8. On complete: clear GSAP props; if `tookRow`, run sweep animation; else pause 250ms and resolve.

### Row-Take Sweep

1. Before updating the stack, `cloneStackCards(stackIndex)` clones each `app-nimmt-card` element, positions clones with `position: fixed` matching original rects, appends to `document.body`.
2. Update `localStacks` (new stack top is the incoming card, old cards gone from DOM).
3. `animateSweep` is kicked off in parallel with the played card's flight (started at ~75% of flight duration so the row-drain overlaps with the new card settling):
   - Flash `stack-row-{index}` with `row-flash` CSS class.
   - Motion tween: clones converge on `#player-panel-{token}` (center rect), scaling to `0.18` with a small random rotation, `sine.inOut` ease, ~1s.
   - Parallel fade tween: opacity → 0 held back to start at ~60% of motion, so clones stay visible until they arrive at the panel.
   - On complete: remove clones, call `flashScore(move)`.
4. `flashScore`: adds `score-flash` CSS class to `#player-panel-{token}` and drops a `.score-popup` "+N" element that GSAP scales/rotates in with a `back.out(2.2)` overshoot, holds, then drifts up and fades out.

### Card Reveal Flip

When `startSequence(isFirst=true)`:
1. `cardsRevealed.set(false)` — all player cards render with `faceDown=true`.
2. `setTimeout(200)` → `cardsRevealed.set(true)` — triggers CSS 3D flip to face-up.
3. `setTimeout(500)` → begin `processNextMove()`.

The CSS flip is on `NimmtCardComponent`: `.face-down` class applies `rotateY(180deg)` with `transition: transform 0.4s`.

---

## 8. Dependencies

### Frontend (`package.json`)

| Package | Version | Purpose |
|---|---|---|
| `@angular/core` | `^18.2.12` | Framework |
| `socket.io-client` | `4.7.2` | WebSocket client |
| `gsap` | `^3.15.x` | Card flight and sweep animations |
| `axios` | `1.4.0` | HTTP calls |
| `sweetalert2` | `11.14.5` | Modal dialogs |
| `shortid` | `2.2.16` | Generate user tokens |
| `bootstrap` | `5.3.0` | CSS framework |

**Note on `shortid` import**: Must use `import { generate as shortId } from 'shortid'` — default import fails without `allowSyntheticDefaultImports`.

**Google Fonts**: `Cinzel` (game-themed headings) and `Lilita One` (card numbers and "+N" popups) loaded via `@import` in `src/styles.css`.

### Backend (`server/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `express` | `4.18.2` | HTTP server |
| `socket.io` | `4.7.2` | WebSocket server |
| `cors` | `2.8.5` | CORS middleware |
| `dotenv` | `16.3.1` | Environment variable loading |

---

## 9. File Manifest

### Backend

```
server/
├── index.js                          # Express + Socket.io setup, HTTP routes
├── package.json
├── controllers/
│   └── gameSocketController.js       # Socket handlers, runStackingPhase, countdowns map
└── utility/
    ├── helperFunctions.js            # computeStackingSequence, dealNimmtHands, nimmtAllowJoin
    ├── nimmtCards.json               # All 104 cards with number + bullHeads
    └── swearWords.json               # Filtered from game code generation
```

### Frontend

```
src/app/games/six-nimmt/
├── SIX_NIMMT_DOCS.md                 # This file
├── REBUILD_PLAN.md                   # Rebuild planning and phase tracking
├── six-nimmt.service.ts              # Socket, signals, animation coordination
├── six-nimmt.component.ts            # Lobby: create or join a game
├── six-nimmt.component.html
├── six-nimmt.component.css
├── host-screen/
│   ├── host-screen.component.ts      # view() computed signal, isAnimating guard
│   ├── host-screen.component.html
│   ├── host-screen.component.css
│   ├── countdown-overlay/            # Full-screen 3-2-1 countdown overlay
│   │   ├── countdown-overlay.component.ts
│   │   ├── countdown-overlay.component.html
│   │   └── countdown-overlay.component.css
│   ├── join-page/                    # WAITING_FOR_PLAYERS host view
│   │   ├── join-page.component.ts
│   │   ├── join-page.component.html
│   │   └── join-page.component.css
│   ├── game-table/                   # PICKING_CARDS / STACKING_CARDS host view + animations
│   │   ├── game-table.component.ts
│   │   ├── game-table.component.html
│   │   └── game-table.component.css
│   └── game-review-page/             # GAME_REVIEW host view
│       ├── game-review-page.component.ts
│       ├── game-review-page.component.html
│       └── game-review-page.component.css
├── client-screen/
│   ├── client-screen.component.ts    # Root client view, state router
│   ├── client-screen.component.html
│   ├── client-screen.component.css
│   ├── joined-page/                  # WAITING_FOR_PLAYERS client view
│   │   ├── joined-page.component.ts
│   │   ├── joined-page.component.html
│   │   └── joined-page.component.css
│   ├── card-select/                  # PICKING_CARDS / STACKING_CARDS client view
│   │   ├── card-select.component.ts
│   │   ├── card-select.component.html
│   │   ├── card-select.component.css
│   │   └── pick-a-row/               # Slide-up bottom sheet: pick a row to take
│   │       ├── pick-a-row.component.ts
│   │       ├── pick-a-row.component.html
│   │       └── pick-a-row.component.css
│   └── game-review-client/           # GAME_REVIEW client view
│       ├── game-review-client.component.ts
│       ├── game-review-client.component.html
│       └── game-review-client.component.css
└── nimmt-card/                       # Shared card component (supports faceDown)
    ├── nimmt-card.component.ts
    ├── nimmt-card.component.html
    └── nimmt-card.component.css
```

### Other Relevant Frontend Files

```
src/
├── styles.css                        # Cinzel font import, global CSS
src/app/
├── app-routing.module.ts             # Registers /games/6-nimmt! routes
└── app.module.ts                     # Declares all nimmt components incl. CountdownOverlay
```
