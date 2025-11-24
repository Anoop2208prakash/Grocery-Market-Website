import http from 'http';
import app from './app';
import { initSocket } from './socket'; // <-- Import

const PORT = process.env.PORT || 5000;

// 1. Create HTTP server from Express app
const server = http.createServer(app);

// 2. Initialize Socket.io
initSocket(server);

// 3. Listen using the HTTP server, NOT app.listen
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});