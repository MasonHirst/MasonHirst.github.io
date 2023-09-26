const socketio = require("socket.io");
const { new4LetterId, dealNimmtHands } = require("../utility/helperFunctions");

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
      console.log(data);
      const { gameCode, userToken, isHost, playerName } = data;
      if (nimmtRooms[gameCode].gamestate !== "WAITING_FOR_PLAYERS") {
        return console.error("game already started");
      }
      socket.currentGameCode = gameCode;
      socket.join(gameCode);
      if (isHost && !nimmtRooms[gameCode].hosts.includes(userToken)) {
        nimmtRooms[gameCode].hosts.push(userToken);
      } else if (!isHost) {
        // if the players array already includes an object with the same userToken, purge the first one
        const playerIndex = nimmtRooms[gameCode].players.findIndex(
          (player) => player.userToken === userToken
        );
        if (playerIndex > -1) {
          nimmtRooms[gameCode].players.splice(playerIndex, 1);
        }
        const playerObj = {
          userToken,
          playerName,
          selectedCard: null,
          cards: [],
          pointCards: [],
          totalScore: 0,
          isReady: false,
        };
        nimmtRooms[gameCode].players.push(playerObj);
      }
      io.to(gameCode).emit("someone-joined-game", nimmtRooms[gameCode]);
    });

    socket.on("update-game-state", (data) => {
      // console.log(dealNimmtHands(
      //   {
      //     players: [
      //       {
      //         cards: [],
      //       },
      //     ],
      //     tableStacks: [],
      //   }
      // ))

      const { gameCode, state } = data;
      if (!nimmtRooms[gameCode]) return console.error("game not found");
      if (nimmtRooms[gameCode].gameState === state) return console.error("game state already updated")
      if (state === 'PICKING_CARDS' && nimmtRooms[gameCode].gameState === 'WAITING_FOR_PLAYERS') {
        nimmtRooms[gameCode] = dealNimmtHands(nimmtRooms[gameCode], nimmtRooms[gameCode].players.length)
      }

      console.log("updating game state: ", state);
      nimmtRooms[gameCode].gameState = state;
      io.to(gameCode).emit("game-state-updated", nimmtRooms[gameCode]);
    });

    // socket.join("roomNumber 3");
    // io.to("roomNumber 3").emit("message", "hello from roomNumber 3");

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
        const playerIndex = players.indexOf(socket.userToken);
        if (playerIndex > -1) {
          players.splice(playerIndex, 1);
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
      console.log("creating new room");
      const existingRooms = Array.from(io.sockets.adapter.rooms.keys());
      let id = new4LetterId();
      // if id already exists, generate a new one
      while (existingRooms.includes(id)) {
        id = new4LetterId();
      }

      const newRoom = {
        code: id,
        players: [],
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
      console.log("checking game code: ", gameCode);
      if (!nimmtRooms[gameCode]) {
        return res.status(202).send("Game not found");
      }

      res.status(200).send(nimmtRooms[gameCode]);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },
};
