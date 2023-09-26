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
  for (let i = 0; i < gameData.players.length; i++) {
    gameData.players[i].cards = [];
    for (let j = 0; j < 10; j++) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck.splice(randomIndex, 1)[0];
      gameData.players[i].cards.push(card);
    }
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

module.exports = {
  new4LetterId,
  dealNimmtHands,
};
