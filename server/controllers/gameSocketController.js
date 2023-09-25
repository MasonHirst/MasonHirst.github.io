const socketio = require("socket.io");
const { new4LetterId } = require("../utility/helperFunctions");

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
      socket.currentGameCode = gameCode;
      socket.join(gameCode);
      if (isHost) {
        nimmtRooms[gameCode].hosts.push(userToken);
      } else {
        const playerObj = {
          userToken,
          playerName,
          selectedCard: null,
          score: 0,
          isReady: false,
        };
        nimmtRooms[gameCode].players.push(playerObj);
      }
      io.to(gameCode).emit("someone-joined-game", nimmtRooms[gameCode]);
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
            "host-left-game",
            nimmtRooms[currentGameCode]
          );
        }
        const playerIndex = players.indexOf(socket.userToken);
        if (playerIndex > -1) {
          players.splice(playerIndex, 1);
          io.to(currentGameCode).emit(
            "player-left-game",
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
        gameState: "WAITING-FOR-PLAYERS",
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
