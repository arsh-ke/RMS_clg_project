const { Server } = require('socket.io');

let io;
const userSockets = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('register', (data) => {
      const { userId, role } = data;
      userSockets.set(userId, { socketId: socket.id, role });
      socket.join(`role_${role}`);
      console.log(`User ${userId} registered with role ${role}`);
    });

    socket.on('disconnect', () => {
      for (const [userId, data] of userSockets.entries()) {
        if (data.socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role_${role}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  const userData = userSockets.get(userId);
  if (userData && io) {
    io.to(userData.socketId).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToRole,
  emitToUser,
  emitToAll
};
