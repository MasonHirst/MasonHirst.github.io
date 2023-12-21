const socketio = require("socket.io");
const {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
  nimmtStackCards,
} = require("../utility/helperFunctions");

const nimmtRooms = {};
const clients = {};
let io;

async function attachSocketServer(server) {
  io = socketio(server, {
    cors: "localhost:4200",
  });
  io.on("connection", (socket) => {
    const { token } = socket.handshake.query;
    if (!token) console.error("----- NO TOKEN PROVIDED BY CLIENT");
    else socket.userToken = token;

    socket.on("join-game", (data) => {
      const { gameCode, userToken, isHost, playerName } = data;
      const allowJoin = nimmtAllowJoin(
        nimmtRooms[gameCode],
        isHost,
        userToken,
        playerName
      );
      if (!allowJoin.canJoin) {
        socket.send({ type: "not-allowing-join", message: allowJoin.error });
        return console.error(allowJoin.error);
      }
      socket.currentGameCode = gameCode;
      socket.join(gameCode);
      if (isHost && !nimmtRooms[gameCode].hosts.includes(userToken)) {
        nimmtRooms[gameCode].hosts.push(userToken);
      } else if (!isHost) {
        // if the players object already includes an object with the same userToken, purge the first one
        if (!nimmtRooms[gameCode].players[userToken]) {
          const playerObj = {
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
          nimmtRooms[gameCode].players[userToken] = playerObj;
        }
      }
      io.to(gameCode).emit("someone-joined-game", nimmtRooms[gameCode]);
    });

    socket.on("start-fresh-game", (data) => {
      // for new games and fresh data
      const { gameCode } = data;
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      nimmtRooms[gameCode] = dealNimmtHands(nimmtRooms[gameCode], true);
      nimmtRooms[gameCode].gameState = "PICKING_CARDS";
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

    socket.on("start-next-round", (data) => {
      // for continuing games
      const { gameCode } = data;
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      nimmtRooms[gameCode] = dealNimmtHands(nimmtRooms[gameCode], false);
      nimmtRooms[gameCode].gameState = "PICKING_CARDS";
      nimmtRooms[gameCode].gameNumber++;
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

    socket.on("kick-player", (data) => {
      const { gameCode, playerId } = data;
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      if (!nimmtRooms[gameCode].players[playerId]) {
        return console.error("player not found");
      }
      console.log(
        "kicking player socketId: ",
        nimmtRooms[gameCode].players[playerId].socketId
      );
      io.to(nimmtRooms[gameCode].players[playerId].socketId).emit(
        "kicked-from-game"
      );
      delete nimmtRooms[gameCode].players[playerId];
      // send a message just to the kicked player
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

    // when a player picks a card, validate their choice. then if all players have a card picked,
    // start a countdown. If a player changes their card, reset the countdown. If the countdown
    // reaches 0, move to the next game state
    let interval;
    let countdown = 3;
    socket.on("select-card", (data) => {
      const { gameCode, userToken, card } = data;
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      if (nimmtRooms[gameCode].gameState !== "PICKING_CARDS") {
        return console.error("game state not correct");
      }
      const player = nimmtRooms[gameCode].players[userToken];
      if (!player) return console.error("player not found");
      const hasCard = player.cards.some(
        (handCard) => handCard.number === card.number
      );
      if (!hasCard) {
        return console.error("player does not have that card");
      }
      if (player.selectedCard && player.selectedCard.number === card.number) {
        player.selectedCard = null;
      } else {
        player.selectedCard = card;
      }
      const allPlayersHaveSelectedCard = Object.values(
        nimmtRooms[gameCode].players
      ).every((player) => player.selectedCard);
      startCountdown(gameCode, allPlayersHaveSelectedCard);
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

    function startCountdown(gameCode, start) {
      io.to(gameCode).emit("counting-down", start);
      if (interval) {
        clearInterval(interval);
        countdown = 3;
      }
      if (start) {
        interval = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            nimmtRooms[gameCode].gameState = "STACKING_CARDS";
            io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
            tryStackingCards(gameCode);
            clearInterval(interval);
            countdown = 3;
          }
        }, 1000);
      }
    }

    // socket.join("roomNumber 3");
    // io.to("roomNumber 3").emit("message", "hello from roomNumber 3");

    socket.on("get-game", (data) => {
      socket.send(nimmtRooms[data.gameCode]);
    });

    socket.on("disconnect", () => {
      const { currentGameCode } = socket;
      if (currentGameCode) {
        socket.leave(currentGameCode);
        const { hosts, players } = nimmtRooms[currentGameCode];
        const hostIndex = hosts.indexOf(socket.userToken);
        if (hostIndex > -1) {
          hosts.splice(hostIndex, 1);
          io.to(currentGameCode).emit(
            "someone-left-game",
            nimmtRooms[currentGameCode]
          );
        }
        if (players[socket.userToken]) {
          if (nimmtRooms[currentGameCode].gameState === "WAITING_FOR_PLAYERS") {
            delete nimmtRooms[currentGameCode].players[socket.userToken];
          }
          io.to(currentGameCode).emit(
            "someone-left-game",
            nimmtRooms[currentGameCode]
          );
        }
      }
    });
  });
}

async function tryStackingCards(gameCode) {
  const filteredPlayers = Object.values(nimmtRooms[gameCode].players)
    .filter((player) => player.cardIsStacked === false)
    .sort((a, b) => a.selectedCard.number - b.selectedCard.number);
  for (const player of filteredPlayers) {
    await sleep(1500);
    const result = nimmtStackCards(nimmtRooms[gameCode], player);
    if (result) {
      if (result.message === "player-took-row") {
        io.to(gameCode).emit("player-took-row", result.data);
      } else if (result.message === "pick-row") {
        return io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
      }
    } 
    io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    // else {
    //   io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    // }
  }
  // if all players have stacked their cards, move to next round
  const allPlayersHaveStackedCards = Object.values(
    nimmtRooms[gameCode].players
  ).every((player) => player.cardIsStacked);
  if (allPlayersHaveStackedCards) {
    handleMoveNextRound(gameCode);
  }
}

function sleep(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleMoveNextRound(gameCode) {
  playerCardCount = Object.values(nimmtRooms[gameCode].players)[0].cards.length;
  if (playerCardCount === 0) {
    // TODO: calculate round scores
    Object.values(nimmtRooms[gameCode].players).forEach((player) => {
      player.roundScores.push([...player.pointCards]);
    });
    nimmtRooms[gameCode].gameState = "GAME_REVIEW";
    setTimeout(() => {
      return io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    }, 3000);
  } else {
    nimmtRooms[gameCode].gameState = "PICKING_CARDS";
    // reset all players' cardIsStacked to false
    Object.values(nimmtRooms[gameCode].players).forEach((player) => {
      player.cardIsStacked = false;
      player.selectedCard = null;
    });
    io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
  }
}

module.exports = {
  attachSocketServer,
  createNimmtRoom: async (req, res) => {
    try {
      const existingRooms = Array.from(io.sockets.adapter.rooms.keys());
      let id = new4LetterId();
      // if id already exists, generate a new one
      while (existingRooms.includes(id)) {
        id = new4LetterId();
      }

      const newRoom = {
        code: id,
        players: {},
        hosts: [],
        tableStacks: [],
        gameState: "WAITING_FOR_PLAYERS",
        gameNumber: 1,
        lastAction: Date.now(),
      };

      nimmtRooms[id] = newRoom;
      res.status(200).send(nimmtRooms[id]);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },

  checkNimmtGameCode: async (req, res) => {
    try {
      const { gameCode } = req.params;
      if (!nimmtRooms[gameCode]) {
        console.error("game not found");
        return res.status(202).send("Game not found");
      }

      res.status(200).send(nimmtRooms[gameCode]);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },

  handlePlayerSelectRow: async (req, res) => {
    try {
      const { gameCode, userToken, rowIndex } = req.body;
      nimmtRooms[gameCode].players[userToken].pickedRow = rowIndex;
      tryStackingCards(gameCode);
      res.status(200).send(true);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },

  checkGameCodeExists: async (req, res) => {
    try {
      const { gameCode } = req.params;
      if (!nimmtRooms[gameCode]) {
        console.error("game room not found");
        return res.status(202).send(false);
      } else {
        res.status(200).send(true);
      }
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },
};
