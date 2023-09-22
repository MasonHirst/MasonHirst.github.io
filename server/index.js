// ! IMPORTS
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
// const socketio = require("socket.io");

//! Middleware
app.use(express.json());
app.use(cors());
const server = http.createServer(app);

//! Endpoints
const {
  attachSocketServer,
  createNimmtRoom,
  checkNimmtGameCode,
} = require("./controllers/gameSocketController");

app.post("/api/nimmt/create", createNimmtRoom);
app.get("/api/nimmt/check-game-code/:gameCode", checkNimmtGameCode);

//! Socket.io
attachSocketServer(server);

//! Server listen
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
