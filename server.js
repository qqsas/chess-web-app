const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, '.')));

// WebSocket logic
wss.on('connection', (ws) => {
  console.log("Player connected");

  ws.on('message', (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log("Player disconnected");
  });
});

// Start server on port 8080
server.listen(8080, () => {
  console.log('HTTP and WebSocket server running on http://localhost:8080');
});
