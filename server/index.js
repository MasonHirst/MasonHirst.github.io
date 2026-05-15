const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());
app.use(cors());

const {
  attachSocketServer,
  createNimmtRoom,
  checkNimmtGameCode,
  handlePlayerSelectRow,
  checkGameCodeExists,
} = require('./controllers/gameSocketController');

app.get('/api/games/:gameCode', checkGameCodeExists);
app.post('/api/nimmt/create', createNimmtRoom);
app.get('/api/nimmt/check-game-code/:gameCode', checkNimmtGameCode);
app.post('/api/nimmt/player/choose-row', handlePlayerSelectRow);

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

attachSocketServer(server);

const PORT = process.env.PORT || 8080;
const USE_LOCAL_IP = process.env.USE_LOCAL_IP === 'true';

if (USE_LOCAL_IP) {
  const host = getLocalIP();
  server.listen(PORT, host, () => console.log(`Server running on ${host}:${PORT}`));
} else {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

function getLocalIP() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address;
    }
  }
  return null;
}
