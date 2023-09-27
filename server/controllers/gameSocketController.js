const socketio = require("socket.io");
const {
  new4LetterId,
  dealNimmtHands,
  nimmtAllowJoin,
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
            cards: [],
            pointCards: [],
            totalScore: 0,
            isReady: false,
          };
          nimmtRooms[gameCode].players[userToken] = playerObj;
        }
      }
      io.to(gameCode).emit("someone-joined-game", nimmtRooms[gameCode]);
    });

    socket.on("update-game-state", (data) => {
      const { gameCode } = data;
      const { gameState } = nimmtRooms[gameCode];
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      if (gameState === "WAITING_FOR_PLAYERS") {
        nimmtRooms[gameCode] = dealNimmtHands(nimmtRooms[gameCode]);
        nimmtRooms[gameCode].gameState = "PICKING_CARDS";
      } else if (gameState === "PICKING_CARDS") {
        nimmtRooms[gameCode].gameState = "STACKING_CARDS";
      }

      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

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
      io.to(gameCode).emit("game-updated", nimmtRooms[gameCode]);
    });

    // socket.join("roomNumber 3");
    // io.to("roomNumber 3").emit("message", "hello from roomNumber 3");\

    socket.on("get-game", (data) => {
      console.log("get-game---------------------", data);
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
