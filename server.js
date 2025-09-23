const express = require('express');
const app = express();

const http = require('http')
const { Server } = require("socket.io");
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
// Allow all origins in development to avoid connect_error due to origin mismatch
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const userSocketMap = {};

function getAllConnectedClients(roomId){
    // map through all the socket ids and get the user names
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

io.on('connection', (socket) => {
    console.log('a user connected',socket.id);

    socket.on(ACTIONS.JOIN, ({roomId,username}) =>{
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({socketId}) => {
            io.to(socketId).emit(ACTIONS.JOINED,{
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({roomId,code}) => {
        console.log('CODE_CHANGE from', socket.id, 'room', roomId);
        //broadcast to all the other clients except the one who is typing
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code});
        // meaning send to all the clients in the room except the sender
    })

    socket.on(ACTIONS.SYNC_CODE, ({socketId,code}) => {
        console.log('SYNC_CODE to', socketId, 'from', socket.id);
        // send current code to a specific client
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code});
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];

        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED,{
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
        // for offlicaly leaveing the room
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));