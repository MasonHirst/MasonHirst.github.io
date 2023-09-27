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
    console.log("swear word detected, trying again");
    return new4LetterId();
  }
  return id;
}


function dealNimmtHands(gameData) {
  // deal 10 cards at random to each player in the list of players
  const deck = nimmtCards;
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
  return gameData;
}

function playerHasCard(hand, card) {
  for (let i = 0; i < hand.length; i++) {
    if (hand[i].number === card.number) return true;
  }
  return false;
}


function nimmtAllowJoin(gameData, isHost, userToken) {
  if (isHost) return true;
  if (gameData.players[userToken]) return true;
  if (
    gameData.gameState === "WAITING_FOR_PLAYERS" &&
    Object.values(gameData.players).length < 10
  ) {
    return true;
  }
  return false;
}

module.exports = {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  playerHasCard,
};
