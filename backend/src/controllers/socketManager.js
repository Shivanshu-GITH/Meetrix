import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || true,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("Connected: ", socket.id);

        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit("chat-message", messages[path][a].data, messages[path][a].sender, messages[path][a].socketId);
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
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
                messages[key].push({ sender, data, socketId: socket.id });

                for (let a = 0; a < connections[key].length; a++) {
                    io.to(connections[key][a]).emit("chat-message", data, sender, socket.id);
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

                let index = connections[key].indexOf(socket.id);
                connections[key].splice(index, 1);

                if (connections[key].length === 0) {
                    delete connections[key];
                }
            }

            delete timeOnline[socket.id];
        });
    });

    return io;
};
