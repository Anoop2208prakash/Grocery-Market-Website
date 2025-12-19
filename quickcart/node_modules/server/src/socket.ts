import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  // Fix: Add ': Socket' type definition
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Fix: Add ': string' type definition
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};