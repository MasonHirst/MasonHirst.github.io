// ! IMPORTS
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

//! Middleware
const join = path.join(__dirname, ".", "build");
app.use(express.static(join));

app.use(express.json());
app.use(cors());
const server = http.createServer(app);

//! Endpoints
const {
  attachSocketServer,
  createNimmtRoom,
  checkNimmtGameCode,
  handlePlayerSelectRow,
  checkGameCodeExists,
} = require("./controllers/gameSocketController");

app.get("/api/games/:gameCode", checkGameCodeExists);
app.post("/api/nimmt/create", createNimmtRoom);
app.get("/api/nimmt/check-game-code/:gameCode", checkNimmtGameCode);
app.post("/api/nimmt/player/choose-row", handlePlayerSelectRow);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, ".", "build", "index.html"));
});

//! Socket.io
attachSocketServer(server);

//! Server listen
const PORT = process.env.PORT || 8080;
let host;
// host = "10.0.0.251";
// host = '192.168.12.196'
// host = '10.254.1.50'

if (host) {
  server.listen(PORT, host, () =>
    console.log(`Server running on host ${host}, port ${PORT}`)
  );
} else {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
