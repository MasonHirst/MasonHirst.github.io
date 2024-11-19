swearWords = require("./swearWords");
nimmtCards = require("./nimmtCards");

function new4LetterId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters.charAt(randomIndex);
  }
  if (swearWords.includes(id)) {
    console.error("swear word detected, trying again");
    return new4LetterId();
  }
  return id;
}

function dealNimmtHands(gameData, isFreshGame) {
  // reset each player's point cards array to empty
  Object.values(gameData.players).forEach((player) => {
    player.pointCards = [];
    player.cardIsStacked = false;
    player.selectedCard = null;
    player.needsToPickRow = false;
    player.pickedRow = null;
  });
  if (isFreshGame) {
    Object.values(gameData.players).forEach((player) => {
      player.roundScores = [];
    });
  }
  // deal 10 cards at random to each player in the list of players
  const deck = [...nimmtCards];
  const playerKeys = Object.keys(gameData.players);
  for (let i = 0; i < playerKeys.length; i++) {
    gameData.players[playerKeys[i]].cards = [];
    for (let j = 0; j < 10; j++) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck.splice(randomIndex, 1)[0];
      gameData.players[playerKeys[i]].cards.push(card);
    }
    // sort the cards in ascending order. each card has a property called number. sort by that number
    gameData.players[playerKeys[i]].cards.sort((a, b) => a.number - b.number);
  }
  // deal 4 cards at random to the table
  gameData.tableStacks = [];
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck.splice(randomIndex, 1)[0];
    gameData.tableStacks.push([card]);
  }
  // sort the cards in ascending order. each card has a property called number. sort by that number
  gameData.tableStacks.sort((a, b) => a[0].number - b[0].number);
  return gameData;
}

function playerHasCard(hand, card) {
  for (let i = 0; i < hand.length; i++) {
    if (hand[i].number === card.number) return true;
  }
  return false;
}

function nimmtStackCards(gameData, playerObj) {
  let returnMessage = null;
  const { tableStacks } = gameData;
  const player = gameData.players[playerObj.userToken];
  if (player.cardIsStacked) return;
  if (!player.selectedCard) return;
  // find where their card should go
  let stackIndex = -1;
  for (let i = 0; i < tableStacks.length; i++) {
    if (tableStacks[i][0].number < player.selectedCard.number) {
      if (stackIndex < 0) {
        stackIndex = i;
      } else if (tableStacks[i][0].number > tableStacks[stackIndex][0].number) {
        stackIndex = i;
      }
    }
  }
  // handle the card stacking accordingly
  if (stackIndex === -1) {
    if (player.needsToPickRow && player.pickedRow !== null) {
      // calculate the points for the row they picked and emit an event
      const rowToTake = tableStacks[player.pickedRow];
      let totalPoints = rowToTake.reduce(
        (acc, card) => acc + card.bullHeads,
        0
      );
      player.pointCards.push(...rowToTake);
      tableStacks[player.pickedRow] = [player.selectedCard];
      returnMessage = {
        message: "player-took-row",
        data: {
          playerName: player.playerName,
          takenRow: player.pickedRow,
          totalPoints,
          quip: getTookPointsQuip(totalPoints),
        },
      };
    } else {
      player.needsToPickRow = true;
      return { message: "pick-row" };
    }
  } else if (tableStacks[stackIndex].length >= 5) {
    // calculate the points for the row they picked and emit an event
    const rowToTake = tableStacks[stackIndex];
    let totalPoints = rowToTake.reduce((acc, card) => acc + card.bullHeads, 0);
    player.pointCards.push(...rowToTake);
    tableStacks[stackIndex] = [player.selectedCard];
    returnMessage = {
      message: "player-took-row",
      data: {
        playerName: player.playerName,
        takenRow: stackIndex,
        totalPoints,
        quip: getTookPointsQuip(totalPoints),
      },
    };
  } else {
    tableStacks[stackIndex].unshift(player.selectedCard);
  }
  const filteredCards = player.cards.filter(
    (card) => card.number !== player.selectedCard.number
  );
  player.cards = filteredCards;
  player.cardIsStacked = true;
  player.needsToPickRow = false;
  player.pickedRow = null;
  if (returnMessage) return returnMessage;
}

function nimmtAllowJoin(gameData, isHost, userToken, playerName) {
  if (isHost) return { canJoin: true };
  if (gameData.players[userToken]) return { canJoin: true };
  if (!playerName) return { canJoin: false, error: "no-player-name" };
  if (
    gameData.gameState === "WAITING_FOR_PLAYERS" &&
    Object.values(gameData.players).length < 10
  ) {
    return { canJoin: true };
  }
  return { canJoin: false, error: "cannot-join" };
}

function getTookPointsQuip(points) {
  if (points < 5) {
    return lowQuips[Math.floor(Math.random() * lowQuips.length)];
  } else if (points < 10) {
    return medQuips[Math.floor(Math.random() * medQuips.length)];
  } else {
    return highQuips[Math.floor(Math.random() * highQuips.length)];
  }
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
  "I'd love you see how you play chess.",
  'Dun Dun Dun...',
  'Winning too mainstream for you? Clearly.',
  "Winning is overrated, right?",
  'Are you ok?',
  "You just love uphill battles, don't you?",
  'Do you think points are good? They are not.',
  'Taking points with gusto! Not exactly the best strategy.',
];

module.exports = {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  playerHasCard,
  nimmtStackCards,
};
