import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('FlowFrame Collab Server is Running!');
});

const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (user) => {
        const { projectId } = user;
        if (!projectId) return;

        console.log(`User ${user.name} joined project: ${projectId}`);
        socket.join(projectId);

        // Broadcast to others in the room
        socket.to(projectId).emit('user-joined', user);
    });

    socket.on('move', (data) => {
        const { projectId } = data;
        if (!projectId) return;

        // Broadcast to everyone else in the room
        socket.to(projectId).emit('cursor-update', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3002;
httpServer.listen(PORT, () => {
    console.log(`Collab server running on http://localhost:${PORT}`);
});
