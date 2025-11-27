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

    socket.on('node-change', (data) => {
        const { projectId, changes } = data;
        if (!projectId) return;
        socket.to(projectId).emit('node-change', changes);
    });

    socket.on('edge-change', (data) => {
        const { projectId, changes } = data;
        if (!projectId) return;
        socket.to(projectId).emit('edge-change', changes);
    });

    socket.on('view-mode-change', (data) => {
        const { projectId, mode } = data;
        if (!projectId) return;
        socket.to(projectId).emit('view-mode-change', mode);
    });

    // -- State Syncing --
    socket.on('request-state', (projectId) => {
        // Ask everyone (or just one person) in the room for the state
        // We'll emit to the room, and the first client to respond "wins" (or we rely on the host)
        // Ideally, we'd pick one, but broadcasting 'request-state' to the room works for simple p2p-like sync
        socket.to(projectId).emit('request-state', socket.id); // Send requester's socket ID
    });

    socket.on('sync-state', (data) => {
        const { targetSocketId, state } = data;
        // Send state directly to the requester
        io.to(targetSocketId).emit('receive-state', state);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3002;
httpServer.listen(PORT, () => {
    console.log(`Collab server running on http://localhost:${PORT}`);
});
