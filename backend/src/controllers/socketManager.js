import { Server } from "socket.io";

const MAX_PARTICIPANTS_PER_ROOM = Math.max(
    1,
    Math.min(200, Number.parseInt(process.env.MAX_PARTICIPANTS ?? "10", 10) || 10)
);
const MAX_MESSAGES_PER_ROOM = 100;
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_DISPLAY_NAME_LENGTH = 60;
const ROOM_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL
                ? process.env.FRONTEND_URL
                : process.env.NODE_ENV === "production"
                ? (() => { throw new Error("FRONTEND_URL must be set in production for Socket.IO"); })()
                : true,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("Connected: ", socket.id);

        socket.on("join-call", (path) => {
            const roomId = typeof path === "string" ? path.trim() : "";
            if (!ROOM_ID_REGEX.test(roomId)) {
                socket.emit("room-full");
                return;
            }
            if (connections[roomId] !== undefined && connections[roomId].length >= MAX_PARTICIPANTS_PER_ROOM) {
                socket.emit("room-full");
                return;
            }

            if (connections[roomId] === undefined) {
                connections[roomId] = [];
            }
            connections[roomId].push(socket.id);
            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[roomId].length; a++) {
                io.to(connections[roomId][a]).emit("user-joined", socket.id, connections[roomId]);
            }

            if (messages[roomId] !== undefined) {
                for (let a = 0; a < messages[roomId].length; a++) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[roomId][a].data,
                        messages[roomId][a].sender,
                        messages[roomId][a].socketId
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const safeMessage = typeof data === "string" ? data.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH) : "";
            const safeSender = typeof sender === "string" ? sender.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) : "Guest";
            if (!safeMessage) {
                return;
            }
            let key;
            for (const [k, v] of Object.entries(connections)) {
                if (v.includes(socket.id)) {
                    key = k;
                    break;
                }
            }

            if (key !== undefined) {
                if (messages[key] === undefined) {
                    messages[key] = [];
                }
                messages[key].push({ sender: safeSender, data: safeMessage, socketId: socket.id });
                if (messages[key].length > MAX_MESSAGES_PER_ROOM) {
                    messages[key] = messages[key].slice(-MAX_MESSAGES_PER_ROOM);
                }

                for (let a = 0; a < connections[key].length; a++) {
                    io.to(connections[key][a]).emit("chat-message", safeMessage, safeSender, socket.id);
                }
            }
        });

        socket.on("disconnect", () => {
            let key;
            for (const [k, v] of Object.entries(connections)) {
                if (v.includes(socket.id)) {
                    key = k;
                    break;
                }
            }

            if (key !== undefined) {
                for (let a = 0; a < connections[key].length; a++) {
                    io.to(connections[key][a]).emit("user-left", socket.id);
                }

                const index = connections[key].indexOf(socket.id);
                if (index !== -1) {
                    connections[key].splice(index, 1);
                }

                if (connections[key].length === 0) {
                    delete connections[key];
                    delete messages[key];
                }
            }

            delete timeOnline[socket.id];
        });
    });

    return io;
};
