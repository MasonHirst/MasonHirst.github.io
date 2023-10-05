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
      player.pointCards.push(...tableStacks[player.pickedRow]);
      tableStacks[player.pickedRow] = [player.selectedCard];
    } else {
      player.needsToPickRow = true;
      return "pick-row";
    }
  } else if (tableStacks[stackIndex].length >= 5) {
    player.pointCards.push(...tableStacks[stackIndex]);
    tableStacks[stackIndex] = [player.selectedCard];
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

module.exports = {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  playerHasCard,
  nimmtStackCards,
};
