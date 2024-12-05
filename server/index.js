// ! IMPORTS
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const os = require("os");

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
const USE_LOCAL_IP = process.env.USE_LOCAL_IP === "true";
let host;

if (USE_LOCAL_IP) {
  host = getLocalIPAddress();
}

if (host) {
  server.listen(PORT, host, () =>
    console.log(`Server running on host ${host}, port ${PORT}`)
  );
} else {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

console.log('STARTING THE SERVER BRO! V1')

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        // Only consider IPv4 addresses and exclude internal (localhost)
        return alias.address;
      }
    }
  }
  return null; // Return null if no local IP address is found
}
