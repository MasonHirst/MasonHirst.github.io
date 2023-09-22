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
    else socket.id = token;

    console.log(
      "bro someone connected, client count is ",
      io.engine.clientsCount
    );

    // socket.join("roomNumber 3");
    // io.to("roomNumber 3").emit("message", "hello from roomNumber 3");

    // const socketsInRoom = io.sockets.adapter.rooms.get("roomNumber 3");
    // console.log("socket.rooms: ", Array.from(socketsInRoom));

    socket.on("disconnect", () => {
      console.log(
        "bro someone disconnected, client count is ",
        io.engine.clientsCount
      );
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
        id,
        players: [],
        gameState: "joining",
        roundNumber: 1,
        lastAction: Date.now(),
      };

      nimmtRooms[id] = newRoom;
      res.status(200).send(id);
    } catch (err) {
      console.error(err);
      res.status(503).send(err);
    }
  },
};
