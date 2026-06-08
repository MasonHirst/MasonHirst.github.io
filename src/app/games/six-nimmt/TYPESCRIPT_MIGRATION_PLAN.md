# 6-nimmt! TypeScript Migration Plan

Goal: convert the Express/Socket.io server to TypeScript, eliminate `any` from the 6-nimmt frontend, and share types between server and client.

## Decisions to lock in before phase 1

1. **Where do shared types live?** Recommend a top-level `shared/` folder (one file: `shared/nimmt.ts`). Angular gets a `@shared/*` path alias; the server's tsconfig includes that folder directly. No monorepo tooling, no symlinks.
2. **How does the server run in dev/prod?** Recommend **`tsx`** for dev (`tsx watch index.ts`, near-zero config, native TS) + a multi-stage Docker build that runs `tsc` and ships compiled JS. Alternative: ship `tsx` as a runtime dep and skip the build step — simpler, slightly heavier image.
3. **Strict mode?** Recommend turning it on only at the **end** of the migration (Phase 5). Trying to flip it on day 1 turns every `any` into a blocker.

## Phase 1 — Shared types & server scaffolding (no behavior change)

- Create `shared/nimmt.ts` with the canonical shapes. Start with what's already implicit in the code:

  ```ts
  export type GameState =
    | 'WAITING_FOR_PLAYERS' | 'PICKING_CARDS' | 'STACKING_CARDS' | 'GAME_REVIEW';

  export interface Card { number: number; bullHeads: number; }

  export interface Player {
    userToken: string; socketId: string; playerName: string;
    selectedCard: Card | null; cardIsStacked: boolean;
    needsToPickRow: boolean; pickedRow: number | null;
    cards: Card[]; pointCards: Card[]; roundScores: Card[][];
  }

  export interface GameData {
    code: string; players: Record<string, Player>; hosts: string[];
    tableStacks: Card[][]; gameState: GameState; gameNumber: number;
    lastAction: number; hostBusy?: boolean; pendingCountdown?: boolean;
  }

  export interface Move {
    playerToken: string; playerName: string; card: Card;
    stackIndex: number; tookRow: boolean; rowCardsTaken: Card[];
    pointsEarned: number; stackAfter: Card[];
  }

  export interface PausedForPlayer {
    playerToken: string; playerName: string; card: Card;
    stackOptions: { stackIndex: number; cards: Card[]; totalBullHeads: number; }[];
  }

  // Socket maps (consumed by socket.io's typed Server/Socket)
  export interface ServerToClient {
    'someone-joined-game': (data: GameData) => void;
    'game-updated': (data: GameData) => void;
    'someone-left-game': (data: GameData) => void;
    'kicked-from-game': () => void;
    'counting-down': (value: number | null) => void;
    'stacking-sequence': (data: { moves: Move[]; pausedForPlayer: PausedForPlayer | null; finalGameState: GameData | null }) => void;
    'stacking-sequence-continuation': (data: { moves: Move[]; pausedForPlayer: PausedForPlayer | null; finalGameState: GameData | null }) => void;
    message: (m: { type: 'not-allowing-join'; message: 'no-player-name' | 'cannot-join' | 'game-not-found' }) => void;
  }

  export interface ClientToServer {
    'join-game': (p: { gameCode: string; userToken?: string; isHost: boolean; playerName?: string }) => void;
    'select-card': (p: { gameCode: string; userToken: string; card: Card }) => void;
    'animation-complete': (p: { gameCode: string }) => void;
    'host-busy': (p: { gameCode: string; busy: boolean }) => void;
    'kick-player': (p: { gameCode: string; playerId: string }) => void;
    'start-fresh-game': (p: { gameCode: string }) => void;
    'start-next-round': (p: { gameCode: string }) => void;
  }
  ```

- Add `server/tsconfig.json` (`module: commonjs`, `target: es2020`, `resolveJsonModule: true`, `strict: false` for now, includes `../shared/`).
- Add devDeps in `server/package.json`: `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cors`. (socket.io ships its own types.)
- Update `server/package.json` scripts: `"server:dev": "tsx watch index.ts"`, `"build": "tsc"`, `"server": "node dist/index.js"`.
- Update root `tsconfig.app.json` with `paths: { "@shared/*": ["shared/*"] }`.

## Phase 2 — Convert server (3 files)

In order, run after each so you catch breakage early:

1. `server/utility/helperFunctions.js` → `.ts`. Pure functions over `GameData`. Biggest win for type inference downstream. Switch `require` → `import`. JSON imports become typed via `resolveJsonModule`.
2. `server/controllers/gameSocketController.js` → `.ts`. Use `Server<ClientToServer, ServerToClient>` and `Socket<ClientToServer, ServerToClient>`. The `nimmtRooms: Record<string, GameData>` and `countdowns: Record<string, { interval: NodeJS.Timeout; value: number }>` were the worst offenders for `any` previously.
3. `server/index.js` → `.ts`. Typed Express `Request`/`Response` for the four REST handlers (`createNimmtRoom`, `checkNimmtGameCode`, `handlePlayerSelectRow`, `checkGameCodeExists`).

## Phase 3 — Sweep frontend `any` (~80 sites)

Top-down by blast radius:

1. **`six-nimmt.service.ts`** — types every socket payload at once (12 of the 80 sites). Pull `Socket<ServerToClient, ClientToServer>` from `socket.io-client`. `gameData` becomes `signal<GameData | null>`, `lastReplay` becomes `signal<{ snapshot: GameData; moves: Move[]; finalGameState: GameData | null } | null>`.
2. **`game-table.component.ts`** — `localPlayers`, `localStacks`, `moveQueue`, `pendingFinalState`, `pendingPausedPlayer`. Probably 20+ sites.
3. **`replay-modal.component.ts`** — mirrors the game-table types.
4. **Card-handling leaves** — `nimmt-card.component.ts`, `card-select.component.ts`, `pick-a-row.component.ts` — single `@Input() card: Card`, `stacks: Card[][]`.
5. **Timers** — `private settlingTimer: ReturnType<typeof setTimeout> | null = null;` etc.

## Phase 4 — Docker

Multi-stage Dockerfile: build stage installs all deps + runs `npm run build` (tsc); runtime stage installs `--omit=dev`, copies `dist/`, runs `node dist/index.js`. About 10 lines of diff.

## Phase 5 — Tighten

- Flip `"strict": true` in `server/tsconfig.json`; fix the fallout (mostly `noImplicitAny` and `strictNullChecks`).
- Add an ESLint rule `"@typescript-eslint/no-explicit-any": "error"` scoped to `server/` + `src/app/games/six-nimmt/` to prevent regression.

## Risks / things to watch

- **State machine drift**: the `GameState` union is used in *many* `===` checks across both codebases — typo-renaming it (e.g. lowercase) would touch 50+ lines, so keep the strings exactly as today.
- **`require('shortid')`** has loose types; `@types/shortid` is already installed, may need a deep import.
- **Socket.io reconnect path** in `six-nimmt.service.ts:50-72` re-emits `join-game` on every `connect` — typing this surfaces an edge case where `userToken` is `undefined` when no token was supplied; today it's silently `undefined` on the wire. Good thing to catch.
- **`gameSocketController.handlePlayerSelectRow` is a REST endpoint, but everything else in that file is socket-based.** Worth deciding during Phase 2 whether to leave it REST or migrate to a socket event for type-consistency (would also remove the only POST endpoint we have).

## Smallest viable first slice

Phase 1 + Phase 2 step 1 (just `helperFunctions.ts`) — about an hour of work, fully reversible, lets you validate the toolchain end-to-end before committing to the rest.
