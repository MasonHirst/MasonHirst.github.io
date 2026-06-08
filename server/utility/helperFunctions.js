const swearWords = require('./swearWords');
const nimmtCards = require('./nimmtCards');

function new4LetterId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  if (swearWords.includes(id)) return new4LetterId();
  return id;
}

function dealNimmtHands(gameData, isFreshGame) {
  Object.values(gameData.players).forEach((player) => {
    player.pointCards = [];
    player.cardIsStacked = false;
    player.selectedCard = null;
    player.needsToPickRow = false;
    player.pickedRow = null;
    if (isFreshGame) player.roundScores = [];
  });

  const deck = [...nimmtCards];

  Object.values(gameData.players).forEach((player) => {
    player.cards = [];
    for (let j = 0; j < 10; j++) {
      const idx = Math.floor(Math.random() * deck.length);
      player.cards.push(deck.splice(idx, 1)[0]);
    }
    player.cards.sort((a, b) => a.number - b.number);
  });

  gameData.tableStacks = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    gameData.tableStacks.push([deck.splice(idx, 1)[0]]);
  }
  gameData.tableStacks.sort((a, b) => a[0].number - b[0].number);

  return gameData;
}

function nimmtAllowJoin(gameData, isHost, userToken, playerName) {
  if (isHost) return { canJoin: true };
  if (gameData.players[userToken]) return { canJoin: true };
  if (!playerName) return { canJoin: false, error: 'no-player-name' };
  if (
    gameData.gameState === 'WAITING_FOR_PLAYERS' &&
    Object.values(gameData.players).length < 10
  ) {
    return { canJoin: true };
  }
  return { canJoin: false, error: 'cannot-join' };
}

// Pure function — deep-clones game state and simulates all card placements for the round.
// Returns:
//   { moves, pausedForPlayer: null, intermediateState: null, finalGameState }  — all resolved
//   { moves, pausedForPlayer, intermediateState, finalGameState: null }         — paused mid-sequence
//
// moves[]: ordered array of placement events for the client animator, one per card played.
// pausedForPlayer: player whose card is lower than all stack tops and must choose a row.
// intermediateState: cloned state at the pause point — apply to real room when paused.
// finalGameState: fully resolved state — apply to real room when complete.
function computeStackingSequence(gameData) {
  const state = JSON.parse(JSON.stringify(gameData));
  const moves = [];

  // Defensive: require a non-null selectedCard. Belt-and-suspenders against any path
  // that might invoke this with a stale state (e.g., a deselect that raced the countdown
  // tick). The interval callback already re-checks allSelected, so this filter normally
  // matches all non-stacked players — but if it doesn't, we'd rather skip a player than
  // crash the sort on `null.number`.
  const sortedPlayers = Object.values(state.players)
    .filter((p) => !p.cardIsStacked && p.selectedCard)
    .sort((a, b) => a.selectedCard.number - b.selectedCard.number);

  for (const player of sortedPlayers) {
    const result = applyPlayerMove(state, player.userToken);

    if (result.needsToPickRow) {
      return {
        moves,
        pausedForPlayer: {
          playerToken: player.userToken,
          playerName: player.playerName,
          card: player.selectedCard,
          // Let the client show what each row costs so the player can make an informed choice
          stackOptions: state.tableStacks.map((stack, i) => ({
            stackIndex: i,
            cards: [...stack],
            totalBullHeads: stack.reduce((acc, c) => acc + c.bullHeads, 0),
          })),
        },
        intermediateState: state,
        finalGameState: null,
      };
    }

    moves.push(result.move);
  }

  // All cards placed — advance game state
  const cardCount = Object.values(state.players)[0].cards.length;
  if (cardCount === 0) {
    // Hands empty: round over
    Object.values(state.players).forEach((p) => {
      p.roundScores.push([...p.pointCards]);
    });
    state.gameState = 'GAME_REVIEW';
  } else {
    // Cards remain: next picking phase
    Object.values(state.players).forEach((p) => {
      p.cardIsStacked = false;
      p.selectedCard = null;
    });
    state.gameState = 'PICKING_CARDS';
  }

  return { moves, pausedForPlayer: null, intermediateState: null, finalGameState: state };
}

// Applies one player's card placement to the simulated state in-place.
// Returns { move } on success, or { needsToPickRow: true } when the player must choose a row.
// stackAfter reflects the stack contents AFTER the placement (used by the client to settle state).
function applyPlayerMove(state, playerToken) {
  const player = state.players[playerToken];
  const { tableStacks } = state;

  // Find the best destination: largest top-card number still smaller than the played card.
  // Cards are stored with index 0 = top (most recently placed), prepended via unshift.
  let stackIndex = -1;
  for (let i = 0; i < tableStacks.length; i++) {
    const topCard = tableStacks[i][0];
    if (topCard.number < player.selectedCard.number) {
      if (stackIndex < 0 || topCard.number > tableStacks[stackIndex][0].number) {
        stackIndex = i;
      }
    }
  }

  let tookRow = false;
  let rowCardsTaken = [];
  let pointsEarned = 0;

  if (stackIndex === -1) {
    // Card is lower than every stack top — player must choose a row
    if (player.needsToPickRow && player.pickedRow !== null) {
      const rowToTake = tableStacks[player.pickedRow];
      pointsEarned = rowToTake.reduce((acc, c) => acc + c.bullHeads, 0);
      rowCardsTaken = [...rowToTake];
      player.pointCards.push(...rowToTake);
      tableStacks[player.pickedRow] = [player.selectedCard];
      stackIndex = player.pickedRow;
      tookRow = true;
    } else {
      player.needsToPickRow = true;
      return { needsToPickRow: true };
    }
  } else if (tableStacks[stackIndex].length >= 5) {
    // Stack has 5 cards — player automatically takes it as penalty
    const rowToTake = tableStacks[stackIndex];
    pointsEarned = rowToTake.reduce((acc, c) => acc + c.bullHeads, 0);
    rowCardsTaken = [...rowToTake];
    player.pointCards.push(...rowToTake);
    tableStacks[stackIndex] = [player.selectedCard];
    tookRow = true;
  } else {
    tableStacks[stackIndex].unshift(player.selectedCard);
  }

  player.cards = player.cards.filter((c) => c.number !== player.selectedCard.number);
  player.cardIsStacked = true;
  player.needsToPickRow = false;
  player.pickedRow = null;

  return {
    move: {
      playerToken,
      playerName: player.playerName,
      card: player.selectedCard,
      stackIndex,
      tookRow,
      rowCardsTaken,
      pointsEarned,
      // Full stack state after this move — client settles into this after the animation
      stackAfter: [...tableStacks[stackIndex]],
    },
  };
}

module.exports = {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  computeStackingSequence,
};
