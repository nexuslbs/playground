const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3000;

// Connected clients map: id -> { ws, username }
const clients = new Map();
let nextId = 1;

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

function broadcast(data, excludeId = null) {
  const message = JSON.stringify(data);
  for (const [id, client] of clients) {
    if (id !== excludeId && client.ws.readyState === 1) {
      client.ws.send(message);
    }
  }
}

function broadcastUserList() {
  const users = Array.from(clients.values()).map(c => c.username);
  broadcast({ type: 'users', users });
}

wss.on('connection', (ws) => {
  const id = nextId++;
  let username = `User${id}`;

  clients.set(id, { ws, username });

  // Send the new client their assigned id
  ws.send(JSON.stringify({ type: 'welcome', id, username }));

  // Notify everyone of the new connection
  broadcast({ type: 'system', message: `${username} joined the chat` });
  broadcastUserList();

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'set-username') {
        const oldName = username;
        username = msg.username || `User${id}`;
        clients.get(id).username = username;
        broadcast({ type: 'system', message: `${oldName} is now known as ${username}` });
        broadcastUserList();
        // Confirm to sender
        ws.send(JSON.stringify({ type: 'username-set', username }));
      } else if (msg.type === 'message') {
        const chatMessage = {
          type: 'message',
          id: Date.now(),
          username,
          text: msg.text,
          time: new Date().toLocaleTimeString()
        };
        broadcast(chatMessage);
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    broadcast({ type: 'system', message: `${username} left the chat` });
    broadcastUserList();
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
