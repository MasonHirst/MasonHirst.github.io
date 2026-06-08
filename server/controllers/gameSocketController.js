const socketio = require('socket.io');
const {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  computeStackingSequence,
} = require('../utility/helperFunctions');

const nimmtRooms = {};

// Countdown state stored per game code so multiple simultaneous games don't interfere.
// { [gameCode]: { interval: Timeout, value: number } }
const countdowns = {};

let io;

function attachSocketServer(server) {
  io = socketio(server, {
    cors: {
      origin: [
        'https://masonhirst.github.io',
        'http://localhost:4200',
        'https://masonhirst.com',
        'https://www.masonhirst.com',
        'https://portfolio.masonhirst.com',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const { token } = socket.handshake.query;
    if (!token) console.error('NO TOKEN PROVIDED BY CLIENT');
    else socket.userToken = token;

    socket.on('join-game', ({ gameCode, userToken, isHost, playerName }) => {
      const room = nimmtRooms[gameCode];
      if (!room) {
        return socket.send({ type: 'not-allowing-join', message: 'game-not-found' });
      }

      const allowJoin = nimmtAllowJoin(room, isHost, userToken, playerName);
      if (!allowJoin.canJoin) {
        return socket.send({ type: 'not-allowing-join', message: allowJoin.error });
      }

      socket.currentGameCode = gameCode;
      socket.join(gameCode);

      if (isHost) {
        if (!room.hosts.includes(userToken)) room.hosts.push(userToken);
      } else {
        if (!room.players[userToken]) {
          room.players[userToken] = {
            userToken,
            socketId: socket.id,
            playerName,
            selectedCard: null,
            cardIsStacked: false,
            needsToPickRow: false,
            pickedRow: null,
            cards: [],
            pointCards: [],
            roundScores: [],
          };
        } else {
          // Reconnecting player — refresh socket id
          room.players[userToken].socketId = socket.id;
        }
      }

      io.to(gameCode).emit('someone-joined-game', room);
    });

    socket.on('start-fresh-game', ({ gameCode }) => {
      const room = nimmtRooms[gameCode];
      if (!room) return;
      dealNimmtHands(room, true);
      room.gameState = 'PICKING_CARDS';
      io.to(gameCode).emit('game-updated', room);
    });

    socket.on('start-next-round', ({ gameCode }) => {
      const room = nimmtRooms[gameCode];
      if (!room) return;
      dealNimmtHands(room, false);
      room.gameState = 'PICKING_CARDS';
      room.gameNumber++;
      io.to(gameCode).emit('game-updated', room);
    });

    socket.on('kick-player', ({ gameCode, playerId }) => {
      const room = nimmtRooms[gameCode];
      if (!room || !room.players[playerId]) return;
      io.to(room.players[playerId].socketId).emit('kicked-from-game');
      delete room.players[playerId];
      io.to(gameCode).emit('game-updated', room);
    });

    socket.on('select-card', ({ gameCode, userToken, card }) => {
      const room = nimmtRooms[gameCode];
      if (!room || room.gameState !== 'PICKING_CARDS') return;
      const player = room.players[userToken];
      if (!player) return;

      const hasCard = player.cards.some((c) => c.number === card.number);
      if (!hasCard) return;

      // Toggle: selecting the same card deselects it
      if (player.selectedCard?.number === card.number) {
        player.selectedCard = null;
      } else {
        player.selectedCard = card;
      }

      const allSelected = Object.values(room.players).every((p) => p.selectedCard);
      manageCountdown(gameCode, allSelected);
      io.to(gameCode).emit('game-updated', room);
    });

    // Host emits this once its stacking-sequence animation queue empties.
    // Triggers the next round's countdown if all players have already selected.
    socket.on('animation-complete', ({ gameCode }) => {
      const room = nimmtRooms[gameCode];
      if (!room) return;

      // Pair to runStackingPhase / handlePlayerSelectRow: when the round closed out into
      // GAME_REVIEW we deferred the game-updated broadcast so non-host clients wouldn't
      // jump to the review screen mid-animation. Flush it now that the host has finished
      // playing the closing animation + 3-second hold.
      if (room.gameState === 'GAME_REVIEW') {
        io.to(gameCode).emit('game-updated', room);
      }

      if (room.gameState !== 'PICKING_CARDS') return;
      const players = Object.values(room.players);
      if (players.length === 0) return;
      const allSelected = players.every((p) => p.selectedCard);
      if (allSelected) manageCountdown(gameCode, true);
    });

    // Host emits this when its replay modal opens (busy=true) and closes (busy=false).
    // While busy, the countdown is deferred so it doesn't run silently underneath
    // the replay overlay and skip the host audience past the reveal phase.
    socket.on('host-busy', ({ gameCode, busy }) => {
      const room = nimmtRooms[gameCode];
      if (!room) return;
      room.hostBusy = !!busy;
      if (!busy && room.pendingCountdown) {
        room.pendingCountdown = false;
        manageCountdown(gameCode, true);
      }
    });

    socket.on('disconnect', () => {
      const { currentGameCode } = socket;
      if (!currentGameCode || !nimmtRooms[currentGameCode]) return;
      const room = nimmtRooms[currentGameCode];

      const hostIndex = room.hosts.indexOf(socket.userToken);
      if (hostIndex > -1) room.hosts.splice(hostIndex, 1);

      // Only remove a player from the room while in the lobby; mid-game they stay in the data
      if (room.players[socket.userToken] && room.gameState === 'WAITING_FOR_PLAYERS') {
        delete room.players[socket.userToken];
      }

      io.to(currentGameCode).emit('someone-left-game', room);
    });
  });
}

// Starts or clears the 3-second countdown before the stacking phase.
// Emits `counting-down` with the current value (3/2/1) while ticking, or null when cancelled.
// Idempotent when `start=true` and a countdown is already running (no-op).
// If the host has signalled it is busy (replay modal open), defer the start until
// host-busy=false arrives so the countdown plays for the live audience.
function manageCountdown(gameCode, start) {
  if (start && countdowns[gameCode]) return;
  const room = nimmtRooms[gameCode];
  if (start && room?.hostBusy) {
    room.pendingCountdown = true;
    return;
  }

  if (countdowns[gameCode]) {
    clearInterval(countdowns[gameCode].interval);
    delete countdowns[gameCode];
  }

  io.to(gameCode).emit('counting-down', start ? 3 : null);
  if (!start) return;

  let value = 3;
  countdowns[gameCode] = {
    value,
    interval: setInterval(() => {
      value--;
      if (value > 0) {
        io.to(gameCode).emit('counting-down', value);
      } else {
        clearInterval(countdowns[gameCode].interval);
        delete countdowns[gameCode];
        io.to(gameCode).emit('counting-down', null);
        // Re-verify: a deselect socket event may have been queued behind this timer fire,
        // OR the deselect handler may have set selectedCard=null without successfully
        // cancelling the interval in time. Skipping runStackingPhase here keeps the room
        // in PICKING_CARDS — the next select-card will re-trigger manageCountdown.
        const liveRoom = nimmtRooms[gameCode];
        if (!liveRoom || liveRoom.gameState !== 'PICKING_CARDS') return;
        const allStillSelected = Object.values(liveRoom.players).every(
          (p) => p.selectedCard,
        );
        if (!allStillSelected) return;
        runStackingPhase(gameCode);
      }
    }, 1000),
  };
}

// Called once the countdown reaches zero.
// Computes the full sequence of card placements and emits it for the client to animate.
// Also applies the resolved (or intermediate) state to the real room object.
function runStackingPhase(gameCode) {
  const room = nimmtRooms[gameCode];
  if (!room) return;

  room.gameState = 'STACKING_CARDS';

  const result = computeStackingSequence(room);
  applySequenceResult(gameCode, result);

  io.to(gameCode).emit('stacking-sequence', {
    moves: result.moves,
    pausedForPlayer: result.pausedForPlayer,
    finalGameState: result.finalGameState,
  });

  // Broadcast policy:
  // - If the round just ended (GAME_REVIEW), DEFER the game-updated broadcast until
  //   the host emits `animation-complete`. Otherwise non-host clients snap straight to
  //   the review screen while the host is still playing its closing animation + 3s hold.
  //   The host applies finalGameState locally via finishAnimation, so it doesn't need
  //   this broadcast to reach its own review view.
  // - Otherwise (mid-round next-picking transition OR a pick-a-row pause): broadcast
  //   immediately so clients can either pick their next card or render the pick-a-row UI.
  const isReviewTransition =
    result.finalGameState && result.finalGameState.gameState === 'GAME_REVIEW';
  if (!isReviewTransition) {
    io.to(gameCode).emit('game-updated', nimmtRooms[gameCode]);
  }
}

// Applies a computeStackingSequence result to the live room.
function applySequenceResult(gameCode, result) {
  if (result.finalGameState) {
    nimmtRooms[gameCode] = result.finalGameState;
  } else {
    // Paused — reflect the intermediate state (needsToPickRow set on the blocked player)
    nimmtRooms[gameCode].players = result.intermediateState.players;
    nimmtRooms[gameCode].tableStacks = result.intermediateState.tableStacks;
  }
}

module.exports = {
  attachSocketServer,

  createNimmtRoom: async (_req, res) => {
    try {
      const existingCodes = Array.from(io.sockets.adapter.rooms.keys());
      let code = new4LetterId();
      while (existingCodes.includes(code)) code = new4LetterId();

      nimmtRooms[code] = {
        code,
        players: {},
        hosts: [],
        tableStacks: [],
        gameState: 'WAITING_FOR_PLAYERS',
        gameNumber: 1,
        lastAction: Date.now(),
      };

      res.status(200).send(nimmtRooms[code]);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },

  checkNimmtGameCode: async (req, res) => {
    try {
      const { gameCode } = req.params;
      if (!nimmtRooms[gameCode]) return res.status(404).send('Game not found');
      res.status(200).send(nimmtRooms[gameCode]);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },

  // Player submits which row to take when their card was lower than all stack tops.
  // Resumes the stacking sequence from the point it was paused.
  handlePlayerSelectRow: async (req, res) => {
    try {
      const { gameCode, userToken, rowIndex } = req.body;
      const room = nimmtRooms[gameCode];
      if (!room) return res.status(404).send('Game not found');
      const player = room.players[userToken];
      if (!player) return res.status(404).send('Player not found');

      player.pickedRow = rowIndex;

      const result = computeStackingSequence(room);
      applySequenceResult(gameCode, result);

      // Continuation event — same shape as stacking-sequence but for the remaining moves
      io.to(gameCode).emit('stacking-sequence-continuation', {
        moves: result.moves,
        pausedForPlayer: result.pausedForPlayer,
        finalGameState: result.finalGameState,
      });

      // Same broadcast policy as runStackingPhase: if the continuation closes out the
      // round (GAME_REVIEW), defer until the host's animation-complete so clients don't
      // jump to the review screen ahead of the host audience.
      const isReviewTransition =
        result.finalGameState && result.finalGameState.gameState === 'GAME_REVIEW';
      if (!isReviewTransition) {
        io.to(gameCode).emit('game-updated', nimmtRooms[gameCode]);
      }
      res.status(200).send(true);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },

  checkGameCodeExists: async (req, res) => {
    try {
      const { gameCode } = req.params;
      res.status(200).send(!!nimmtRooms[gameCode]);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },
};
