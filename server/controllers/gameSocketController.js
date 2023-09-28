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
      if (!nimmtAllowJoin(nimmtRooms[gameCode], isHost, userToken)) {
        socket.send("not-allowing-join");
        return console.error("not allowing join");
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

    socket.on("update-game-state", async (data) => {
      const { gameCode } = data;
      const { gameState } = nimmtRooms[gameCode];
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      if (gameState === "WAITING_FOR_PLAYERS") {
        nimmtRooms[gameCode] = dealNimmtHands(nimmtRooms[gameCode]);
        nimmtRooms[gameCode].gameState = "PICKING_CARDS";
      } else if (gameState === "PICKING_CARDS") {
        nimmtRooms[gameCode].gameState = "STACKING_CARDS";
        await tryStackingCards(gameCode);
      } else if (gameState === "STACKING_CARDS") {
        let validRound = true
        Object.values(nimmtRooms[gameCode].players).forEach((player) => {
          if (player.needsToPickRow || !player.cardIsStacked) {
            return
          }
          player.cardIsStacked = false;
          player.selectedCard = null;
        });
        if (!validRound) return
        nimmtRooms[gameCode].roundNumber++;
        nimmtRooms[gameCode].gameState = "PICKING_CARDS";
      }
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

    socket.on("player-select-row", async (data) => {
      const { gameCode, userToken, rowIndex } = data;
      nimmtRooms[gameCode].players[userToken].pickedRow = rowIndex;
      tryStackingCards(data.gameCode);
    });

    async function tryStackingCards(gameCode) {
      console.log("stacking cards --------------");
      const filteredPlayers = Object.values(nimmtRooms[gameCode].players)
        .filter((player) => player.cardIsStacked === false)
        .sort((a, b) => a.selectedCard.number - b.selectedCard.number);

      for (const player of filteredPlayers) {
        await sleep();
        const result = nimmtStackCards(nimmtRooms[gameCode], player);
        if (result) {
          console.log("result of card stacking------------:", result);
          io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
          return;
        } else {
          console.log("no result of card stacking------------:");
          io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
        }
      }
    }

    function sleep(ms = 2000) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let interval;
    let countdown = 5;
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
      if (allPlayersHaveSelectedCard) {
        interval = setInterval(() => {
          console.log(countdown);
          countdown--;
          if (countdown <= 0) {
            nimmtRooms[gameCode].gameState = "STACKING_CARDS";
            io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
            tryStackingCards(gameCode);
            clearInterval(interval);
            countdown = 5;
          }
        }, 1000);
      } else {
        if (interval) {
          clearInterval(interval);
          countdown = 5;
        }
      }
      io.to(gameCode).emit("counting-down", allPlayersHaveSelectedCard);
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

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
          // todo this emit is broken, client is not getting it
          io.to(currentGameCode).emit(
            "someone-left-game",
            nimmtRooms[currentGameCode]
          );
        }
        if (players[socket.userToken]) {
          io.to(currentGameCode).emit(
            "someone-left-game",
            nimmtRooms[currentGameCode]
          );
        }
      }
    });
  });
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
        roundNumber: 0,
        gameNumber: 0,
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
};
