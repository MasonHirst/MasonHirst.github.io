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

  const sortedPlayers = Object.values(state.players)
    .filter((p) => !p.cardIsStacked)
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
    // Auto-select when a player has only one card left — no real choice to make.
    // Countdown is NOT started here; the host emits `animation-complete` once the
    // previous round's stacking animation finishes, which triggers the countdown then.
    Object.values(state.players).forEach((p) => {
      if (p.cards.length === 1) {
        p.selectedCard = p.cards[0];
      }
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
  let quip = '';

  if (stackIndex === -1) {
    // Card is lower than every stack top — player must choose a row
    if (player.needsToPickRow && player.pickedRow !== null) {
      const rowToTake = tableStacks[player.pickedRow];
      pointsEarned = rowToTake.reduce((acc, c) => acc + c.bullHeads, 0);
      rowCardsTaken = [...rowToTake];
      quip = getTookPointsQuip(pointsEarned);
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
    quip = getTookPointsQuip(pointsEarned);
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
      quip,
      // Full stack state after this move — client settles into this after the animation
      stackAfter: [...tableStacks[stackIndex]],
    },
  };
}

function getTookPointsQuip(points) {
  if (points < 5) return lowQuips[Math.floor(Math.random() * lowQuips.length)];
  if (points < 10) return medQuips[Math.floor(Math.random() * medQuips.length)];
  return highQuips[Math.floor(Math.random() * highQuips.length)];
}

const lowQuips = [
  "I've seen worse. Like when I tried to cook.",
  'Try taking zero points next time. Revolutionary, I know.',
  'Tis just a scratch!',
  "Like getting a 'B' in P.E. class.",
  'Warm-up round, right?',
  "Taking points? That's so last season.",
  'Like falling off a bike.',
  "Just a few points, but who's counting? Oh, right, we are.",
];

const medQuips = [
  'Not a great look for you.',
  'Classic move for those who enjoy a challenge.',
  'The pinnacle of strategic brilliance, clearly.',
  'Because winning was just too mainstream, right?',
  'Who needs points anyway? Certainly not you, it seems.',
  "Taking points, because life is just too easy, isn't it?",
  'Like breadcrumbs on the trail to defeat.',
  'Clearly you love a good uphill battle.',
  "I'd say that was unexpected, but I'd be lying.",
  "Well, that's one way to keep it interesting.",
  'Maybe try playing with a blindfold next time? Might improve your score.',
];

const highQuips = [
  'You might just be a lost cause.',
  'Embrace the thrill of impending doom.',
  "I'd love to see how you play chess.",
  'Dun Dun Dun...',
  'Winning too mainstream for you? Clearly.',
  'Winning is overrated, right?',
  'Are you ok?',
  "You just love uphill battles, don't you?",
  'Do you think points are good? They are not.',
  'Taking points with gusto! Not exactly the best strategy.',
];

module.exports = {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  computeStackingSequence,
};
