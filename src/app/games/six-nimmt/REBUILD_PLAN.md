# 6-Nimmt! — Rebuild Plan

This document tracks the planned rebuild of the 6-nimmt game. The primary driver is improving animations and visual clarity, especially during the card stacking phase. All game rules and functionality must stay identical to the current implementation (see `SIX_NIMMT_DOCS.md`).

---

## Table of Contents

1. [Core Problem Statement](#1-core-problem-statement)
2. [Root Cause: Why Animations Are Broken Today](#2-root-cause-why-animations-are-broken-today)
3. [Architecture Changes Required](#3-architecture-changes-required)
4. [Animation Design](#4-animation-design)
5. [UI Layout Redesign](#5-ui-layout-redesign)
6. [Technology Decisions](#6-technology-decisions)
7. [Component Plan](#7-component-plan)
8. [Implementation Phases](#8-implementation-phases)
9. [Open Questions / Decisions Needed](#9-open-questions--decisions-needed)

---

## 1. Core Problem Statement

The game is functionally correct but nearly impossible to follow visually:

- **Cards teleport.** When the stacking phase runs, a player's selected card disappears from their slot and instantly appears on a stack. There is no motion, no trajectory, no pause — it is impossible to know which card belonged to which player after the fact.
- **Row-take penalty is invisible.** When a player's card is the 6th on a stack (or lower than all stack tops), the stack disappears and a toast notification appears. There is no visual "sweep" of the cards leaving the table, no drama, no clarity about what just happened.
- **Everything happens at once.** All cards are processed server-side in one synchronous loop. The client receives only the final resolved state — it has no information about the *sequence* of events.
- **Card motion is impossible to track.** There is no animation when a card moves from a player's slot to a stack, and no visual feedback when a row is taken — so players can't follow what just happened even if they're watching closely.

---

## 2. Root Cause: Why Animations Are Broken Today

The fundamental architectural problem is:

> The server processes all card placements in one synchronous loop and emits a single `game-updated` event with the final state. The client never sees the intermediate steps.

```
Current flow:
  all players select → server resolves all in loop → emits final state → client renders final state

Needed flow:
  all players select → server sends sequence of moves → client animates each move one-by-one
```

Without per-move data, it is impossible to animate card trajectories — the client does not know "card 37 went to stack 2" vs "card 37 triggered a row take on stack 2 and Alice took 8 points." All of that information exists on the server during processing but is currently thrown away.

---

## 3. Architecture Changes Required

### 3a. New Server Event: `stacking-sequence`

After all players select their cards, before (or instead of) emitting `game-updated`, the server should emit a `stacking-sequence` event containing the full ordered list of card placement moves.

```js
// Example payload shape
{
  moves: [
    {
      playerToken: "abc",
      playerName: "Alice",
      card: { number: 14, bullHeads: 1 },
      stackIndex: 1,              // which stack (0-3) the card goes to
      tookRow: false,             // did this player take the row?
      rowCardsTaken: [],          // cards swept up (empty if tookRow is false)
      pointsFromRow: 0,           // bull heads taken (0 if no row taken)
      newStackState: [...]        // the stack after this move (for client to settle into)
    },
    ...
  ],
  finalGameState: { ... }         // full resolved gameData to settle into after animation
}
```

The client receives this, plays the animation sequence in order (one move at a time), then applies `finalGameState` to clean up.

The existing `game-updated` event still fires afterward so any client that missed the sequence (late-joining observer) still gets the correct state.

### 3b. Per-move `player-took-row` events

The current `player-took-row` event fires as a toast. In the rebuild this can be folded into the `stacking-sequence` moves array — each move that has `tookRow: true` triggers the toast/animation at the right moment in the sequence.

### 3c. Server timing change

The server's `tryStackingCards()` currently processes cards synchronously. For the rebuild it only needs to:
1. Compute the full sequence of moves (pure logic, no side effects).
2. Emit `stacking-sequence` with the moves array and final state.
3. Apply the final state to `nimmtRooms[gameCode]`.

No per-move delays on the server — all the timing lives in the client animation layer.

### 3d. `needsToPickRow` pause still required

When a player's card is lower than all stack tops, the sequence is interrupted and the player must pick a row. This still needs to pause the sequence mid-way on the client. The `moves` array would be split:

```js
{
  movesBefore: [...],      // process and animate these first
  pausedForPlayer: {       // then pause here
    playerToken: "abc",
    playerName: "Alice",
    card: { number: 3, bullHeads: 1 },
    stackOptions: [        // show these to the player so they can choose
      { stackIndex: 0, cards: [...], totalBullHeads: 5 },
      ...
    ]
  },
  movesAfter: null         // filled in after player chooses
}
```

After the player picks a row, the server sends the continuation as a new `stacking-sequence-continuation` event.

---

## 4. Animation Design

### 4a. Card Placement Animation (the main one)

**Trigger**: Each move in the `stacking-sequence`.

**Steps**:
1. The played card is visible in the player's "selected card" slot on the host screen.
2. Animate the card flying from that slot to the target stack position using GSAP `gsap.to()` with a tween on `x`/`y` position. Duration: ~0.5s with an ease-out curve.
3. Card lands on the stack (appended to stack array in DOM), source slot becomes empty.
4. Brief pause (300ms) before next move begins.

**Implementation technique — FLIP**:
- Before the move: record `getBoundingClientRect()` of the player's card slot.
- After Angular renders the card in its new stack position: record the new rect.
- Invert the transform (translate card back to old position visually).
- Play `gsap.to(card, { x: 0, y: 0, duration: 0.5 })` to animate it flying forward.

### 4b. Row-Take Animation (the dramatic one)

**Trigger**: A move where `tookRow: true`.

**Steps**:
1. Play card lands on stack as normal (step above).
2. Highlight the full stack with a red/orange glow (CSS box-shadow pulse, ~0.3s).
3. Animate each card in the stack flying off to the player's penalty area (GSAP `stagger` on the existing cards, then the newly placed card). Duration per card: ~0.25s, stagger: 0.08s. Cards should fan out slightly as they travel.
4. Stack is now empty except for the player's card, which slides into position as the new top.
5. Player's penalty count updates with a flash animation (CSS scale bounce + color flash on the score number).
6. Toast notification fires at this moment.

### 4c. Card Reveal

**Trigger**: Transition from `PICKING_CARDS` → `STACKING_CARDS`.

**Steps**:
1. Each player's "selected card" slot shows a face-down placeholder during `PICKING_CARDS`.
2. On transition, cards flip face-up one by one (or all at once with a stagger), using a CSS 3D Y-axis rotation (the classic card flip: `rotateY(0deg) → rotateY(90deg) → swap face → rotateY(0deg)`).
3. The reveal ordering: ascending by card number (lowest first, for drama).

### 4d. Countdown

**Trigger**: `counting-down` socket event (fires 3, 2, 1).

**Current behavior**: The number shows in the component title, barely noticeable.

**New behavior**: Large centered overlay on the host screen. Each number animates in with a scale-down + fade: starts at `scale(2) opacity(0)`, ends at `scale(1) opacity(1)`. Then fades out. After "1", a brief "GO!" flash before cards are revealed.

### 4e. Card Selection (client screen)

**Trigger**: Player taps a card in their hand.

**Current behavior**: Card lifts up slightly via a `bottom` CSS offset (already implemented).

**New behavior**: Keep the lift, but add a brief scale-up (1.05x) and a pop shadow effect on selection. Deselecting should animate back down. This is already partially there — just needs a CSS transition added.

### 4f. Row Selection Overlay (client screen)

**Trigger**: `player.needsToPickRow === true`.

**Current behavior**: 4 plain buttons labeled "Row 1–4".

**New behavior**: Overlay slides up from the bottom. Each option shows:
- The actual cards currently on that stack (mini card components).
- The total bull heads for that stack.
- A color indicator (green = cheapest, red = most expensive).
- Tap to confirm, with a brief confirmation flash before sending the HTTP request.

### 4g. Score Update Flash

**Trigger**: Any time a player's round score increases.

**New behavior**: The score number does a quick color flash (white → yellow → white) + a subtle scale bounce when it updates. CSS `@keyframes` on the element, triggered by adding/removing a class.

---

## 5. Visual Design

**Theme: Dark table / poker room.**

### Host Screen

The layout structure stays the same (stacks left, player list right). The visual treatment gets a full overhaul.

**Background**: Deep green felt — `#1a3a2a` or a CSS radial gradient from `#1f4a30` to `#0f2016`. Subtle noise/texture via CSS `filter` or a small repeating SVG pattern to mimic cloth.

**Stacks area**:
- Each stack row gets a dark inset panel (rounded, slight inner shadow) so the table area reads as a "play surface."
- Row number labels styled as bold gold text (`#d4af37`), larger than current.
- Active stack (being targeted during `STACKING_CARDS`) pulses with a gold glow.

**Player panels** (right column):
- Each player gets a styled "seat" card: dark background (`#0d2218`), rounded corners, subtle gold border.
- Player name in white, bold.
- Round score: large, bright yellow number + bull head icon. Turns red when high (10+).
- Total score: smaller, muted.
- Selected card slot: outlined box with dashed gold border when empty, solid when a card is placed.
- Spinner (waiting to pick row): replace Bootstrap spinner with a pulsing gold dot or animated icon.
- Active player during stacking: gold border highlights the panel.

**Typography**:
- Headers / game state label: Google Font `Cinzel` (serif, regal, reads as "game font").
- Player names and scores: system sans-serif, heavy weight.
- Load `Cinzel` via `@import` in the global stylesheet.

**Countdown overlay**:
- Full-screen dark overlay (`rgba(0,0,0,0.75)`).
- Large centered number (Cinzel, 20vw, gold) that scales down + fades in, then fades out.
- "GO!" flash in green after "1".

### Client Screen

The client layout also stays the same. Visual updates:
- Match the dark green background.
- Header bar: dark wood-tone (`#1a0f0a`) with player name in Cinzel and score in gold.
- Card hand: cards stand out naturally (white cards on dark green).
- `PickARowComponent`: dark bottom sheet, each row option shows the actual mini cards + red bull head total, color-coded cheapest → most expensive (green border → red border).

---

## 6. Technology Decisions

### Animation Library: GSAP

**Recommendation: use GSAP (GreenSock).**

Reasons:
- The "card flying from position A to position B" animation requires tweening absolute `x`/`y` coordinates computed from DOM rects at runtime. Angular's built-in animation module (`@angular/animations`) is declarative and state-driven — it is not designed for this kind of spatial, DOM-position-aware tween.
- GSAP handles this trivially: `gsap.to(element, { x: deltaX, y: deltaY, duration: 0.5, ease: "power2.out" })`.
- GSAP also has `stagger` built in (used for row-take sweep).
- Free for non-commercial use; `gsap` npm package.

Install: `npm install gsap`

For Angular, inject GSAP calls inside `ngAfterViewChecked` or triggered explicitly from the animation queue — never in the template.

### CSS for simpler animations

Card selection lift, score flash, countdown overlay, card flip reveal — these are all CSS transition/keyframe animations. No need for GSAP on these. Use Angular's `[class.selected]` binding + CSS transitions.

### Angular Animation Module

Use `@angular/animations` for route-level transitions (e.g. sliding in the game review screen) and for the row-selection bottom-sheet slide-up. These are state-driven transitions that the built-in module handles well.

---

## 7. Component Plan

The rebuild keeps the same overall component tree structure, but with significant internal changes. New components are marked **NEW**.

### Backend changes

| File | Change |
|---|---|
| `controllers/gameSocketController.js` | Extract the stacking loop into a `computeStackingSequence()` function that returns a moves array instead of mutating state directly. Emit `stacking-sequence` before applying final state. |
| `utility/helperFunctions.js` | Add `computeStackingSequence(gameData)` → returns `{ moves, finalGameData }`. |

### Frontend changes

| Component | Change |
|---|---|
| `six-nimmt.service.ts` | Add listener for `stacking-sequence` event; expose an `stackingSequenceEmit` EventEmitter. |
| `host-screen/game-table/` | Keep existing layout. Add `stacking-sequence` consumption and GSAP animation queue. Add stable DOM refs for player card slots and stacks. |
| `nimmt-card/` | Add `@Input() faceDown`, `@Input() animating`. Add CSS 3D flip styles. |
| `client-screen/card-select/` | Add CSS transitions to card selection. |
| `client-screen/card-select/pick-a-row/` | Redesign as a bottom sheet showing actual stack contents. |
| **NEW** `host-screen/countdown-overlay/` | Fullscreen countdown animation component (3, 2, 1, GO!). |
| **NEW** `host-screen/card-animator/` | Service or directive that holds the GSAP animation queue and processes `stacking-sequence` moves one at a time. |

---

## 8. Implementation Phases

### Phase 1 — Backend: emit stacking sequence ✅ COMPLETE

- [x] Add `computeStackingSequence(gameData)` to `helperFunctions.js`. Pure function — deep-clones state, returns `{ moves, pausedForPlayer, intermediateState, finalGameState }`.
- [x] In `gameSocketController.js`, call this after countdown, emit `stacking-sequence`, then emit `game-updated` with final state.
- [x] Per-game `countdowns` map (keyed by `gameCode`) fixes multi-game countdown interference bug.
- [x] `stacking-sequence-continuation` event resumes sequence after player picks a row.
- [x] All sleep/delay removed from server — timing is fully client-driven.

### Phase 2 — Frontend foundation: consume the sequence ✅ COMPLETE

- [x] `stacking-sequence` and `stacking-sequence-continuation` listeners added to `six-nimmt.service.ts`.
- [x] Exposed via `stackingSequence$` and `stackingContinuation$` RxJS Subjects.
- [x] `isAnimating` signal added — set true on sequence start, false in `finishAnimation()`.
- [x] Bug fix: `game-updated` handler always updates `gameData` regardless of `isAnimating` (required for pick-a-row overlay on client screen).

### Phase 3 — Card placement animation ✅ COMPLETE

- [x] GSAP installed (`npm install gsap`).
- [x] `player-slot-{token}` IDs on each player card slot; `card-{number}` IDs on each `<app-nimmt-card>`.
- [x] `GameTableComponent` local signals: `localStacks`, `localPlayers`, `activeToken`, `cardsRevealed`.
- [x] Effect syncs local state from `gameData` only when `!isAnimating()`.
- [x] GSAP FLIP: record source rect → update DOM → `setTimeout(0)` → read dest rect → `gsap.set` delta → `gsap.to` zero.
- [x] Sequential processing via `processNextMove()` / `moveQueue`.

### Phase 4 — Row-take animation ✅ COMPLETE

- [x] `cloneStackCards(stackIndex)`: clones existing `app-nimmt-card` DOM nodes, fix-positions them on `document.body`.
- [x] `animateSweep(clones, move)`: clones converge on `player-panel-{token}` (motion `sine.inOut`, ~1s) with parallel staggered fade-out.
- [x] Stack row flashes with `row-flash` CSS class.
- [x] `flashScore(move)`: `player-panel-{token}` flashes with `score-flash` CSS class; floating yellow `.score-popup` "+N" element pops on the panel.

### Phase 5 — Reveal and countdown ✅ COMPLETE

- [x] `CountdownOverlayComponent` built: full-screen overlay, Cinzel gold number, `pop-in` CSS keyframe.
- [x] `showNumber` signal toggled false→true (16ms) each tick to restart CSS animation cleanly.
- [x] `NimmtCardComponent` `faceDown` input added: CSS 3D Y-axis flip, dark green card back with gold border.
- [x] Card reveal in `startSequence(isFirst=true)`: `cardsRevealed` false → true (400ms flip) before first move.
- [x] `HostScreenComponent.view()` computed signal locks to `'table'` while `isAnimating()` is true.

### Phase 6 — Client screen polish ✅ COMPLETE

- [x] `PickARowComponent` redesigned as a slide-up bottom sheet showing actual stack cards + bull head cost, cheapest row highlighted green.

---

## 9. Bugs Found and Fixed During Testing

### Bug: `allowSignalWrites` missing from effects (FIXED)

**Symptom**: Host screen showed "PICK YOUR CARDS!" label but board was completely blank — no stacks, no player panels.

**Root cause**: In Angular 18, effects that synchronously write to other signals require `{ allowSignalWrites: true }`. Without it, signal writes inside effects are silently dropped. The effect in `GameTableComponent` syncs `localStacks`, `localPlayers`, and `cardsRevealed` from `gameData`, but all three writes were silently no-ops.

**Fix**: Added `{ allowSignalWrites: true }` to:
- `GameTableComponent` constructor effect (syncs local display state)
- `CountdownOverlayComponent` constructor effect (toggles `showNumber` signal)

**Files changed**: `game-table.component.ts`, `countdown-overlay.component.ts`

---

### Bug: Socket room not rejoined on reconnect (FIXED)

**Symptom**: Clicking cards on the client screen did nothing. No visual feedback, no card lifting.

**Root cause**: When the socket (re)connects, the `connect` handler only ran `checkGameExists` (an HTTP call). It never called `join-game` via socket. Without `socket.join(gameCode)` being called on the server, the client's socket is not in the Socket.io room. The server processes `select-card` correctly and emits `game-updated` to the room — but the client doesn't receive it because it's not in the room.

This affects both initial page load at `/client/:code` (if `ngOnInit` fires before socket connects and the buffered `join-game` races against reconnect) and all subsequent reconnects.

**Fix**: The `connect` handler in `six-nimmt.service.ts` now also emits `join-game` directly (not via `sendSocketMessage`) when the current URL contains `/host/` or `/client/`. This ensures the socket is in the room on every (re)connect, independently of component lifecycle.

```ts
this.socket.on('connect', () => {
  const code = this.codeFromUrl();
  if (!code) return;
  this.checkGameExists(code);
  const path = location.pathname;
  if (path.includes('/host/')) {
    this.socket.emit('join-game', { gameCode: code, userToken: this.userToken, isHost: true });
  } else if (path.includes('/client/')) {
    const playerName = localStorage.getItem('playerName') ?? '';
    this.socket.emit('join-game', { gameCode: code, userToken: this.userToken, isHost: false, playerName });
  }
});
```

**Files changed**: `six-nimmt.service.ts`

---

### Bug: `shortid` default import (FIXED)

**Symptom**: Build error: `Module can only be default-imported using 'allowSyntheticDefaultImports'`.

**Fix**: All `shortid` imports must use named import: `import { generate as shortId } from 'shortid'`.

**Files changed**: `six-nimmt.service.ts`, `pinochle-state.service.ts`

---

### Bug: No host-screen indicator during pick-a-row pause (FIXED)

**Symptom**: When the stacking sequence paused waiting for a player to pick a row, the host screen showed nothing — no message, no badge, no highlight. The host couldn't tell anything was happening; the screen just looked frozen.

**Root cause**: The HTML already had a `pick-row-badge` element gated on `player.needsToPickRow` in `localPlayers()`, but `localPlayers` is only synced from `gameData` when `!isAnimating()`. During a pause, `isAnimating` stays `true` (waiting for `stacking-sequence-continuation`), so the snapshot of `localPlayers` taken at sequence start (where `needsToPickRow=false`) never gets updated — even though `gameData` now reflects the intermediate state where the paused player has `needsToPickRow=true`.

**Fix**: `GameTableComponent` now tracks the pause explicitly via `pausedForToken` / `pausedForName` signals, sourced from `result.pausedForPlayer` (the server has always sent this on `stacking-sequence`/`stacking-sequence-continuation` — the client just wasn't using it). Set in `processNextMove` when the queue empties without a final state; cleared at the top of each `startSequence` call. UI uses it three ways:
- State bar shows `Waiting for {name} to pick a row…`
- Paused player's panel gets a `awaiting-row-pick` class with a pulsing gold glow
- The existing `pick-row-badge` is now driven by `pausedForToken() === player.userToken` instead of the never-updated local flag

**Files changed**: `game-table.component.ts`, `game-table.component.html`, `game-table.component.css`

---

### Bug: Countdown dark overlay never lifts (FIXED)

**Symptom**: When the countdown started after players selected their cards, the screen darkened (from the countdown overlay's `rgba(0,0,0,0.55)` background). After the countdown finished, the dark layer remained — the overlay never disappeared.

**Root cause**: In `manageCountdown` (server), when the countdown ticked down to zero, it cleared the interval and called `runStackingPhase` but **never emitted `counting-down` with `null`**. The `null` emission only happened in the cancellation branch (when a player deselected mid-countdown). So the client's `countdown()` signal stayed at the last emitted value (`1`), and `CountdownOverlayComponent.visible = computed(() => countdown() !== null)` remained `true` forever — the overlay stayed mounted.

**Fix**: In `server/controllers/gameSocketController.js`, `manageCountdown` now emits `counting-down` with `null` right before calling `runStackingPhase` when the countdown completes naturally.

**Files changed**: `server/controllers/gameSocketController.js`

---

## 10. Current State / Next Steps

### What's working
- Build is clean (`ng build --configuration development` passes with no errors)
- Host screen renders stacks and player panels correctly (after `allowSignalWrites` fix)
- Dark poker-room theme applied throughout

### What's still unverified (needs testing)

Both servers must run simultaneously:
```bash
# Terminal 1 — Angular dev server
npm start

# Terminal 2 — Express/socket.io server
cd server && node index.js
```

Test checklist:
- [ ] **Card selection** — Client can tap a card; card lifts; selected card shows on host panel
  - Diagnostic logs are currently in place: open browser console and click a card
  - `[NimmtCard] handleClick` should log — if it doesn't, CSS `pointer-events` is blocking
  - `[CardSelect] selectCard` should log next — if `isPicking: false`, game isn't in PICKING_CARDS
  - If both log but nothing changes, socket room membership fix should resolve it
  - **Remove the console.logs once the issue is confirmed fixed** (see files below)
- [ ] Players join, game starts, countdown overlay plays (3, 2, 1)
- [ ] All players pick cards; stacking phase triggers card reveal flip
- [ ] Cards animate from player slots to stacks one at a time (GSAP FLIP)
- [ ] Row-take: sweep animation converges on player panel, score flash, "+N" popup
- [ ] Pick-a-row: sequence pauses, overlay appears on client, player picks, continuation resumes
- [ ] Game ends, review screen shows, next round / new game work
- [ ] Multiple rounds accumulate scores correctly

### Temporary diagnostic code to remove after testing

These `console.log` statements were added to debug card selection and must be removed:

- `nimmt-card.component.ts` → `handleClick()` method
- `card-select.component.ts` → `selectCard()` method
