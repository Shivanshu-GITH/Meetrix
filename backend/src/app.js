import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/users.routes.js';

if (!process.env.JWT_SECRET) {
    console.error("WARNING: JWT_SECRET is not set. Auth routes will return 500.");
}

const skipDb = process.env.SKIP_DB === 'true';

const app = express();
const server = createServer(app);
connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

const corsOrigin = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
    : process.env.NODE_ENV === "production"
    ? (() => { throw new Error("FRONTEND_URL must be set in production"); })()
    : true; // dev only

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

if (skipDb) {
    app.use("/api/v1/users", (req, res) => {
        res.status(503).json({
            message: "User API is disabled (SKIP_DB=true). Set MONGO_URI and remove SKIP_DB to enable auth and history.",
        });
    });
} else {
    app.use("/api/v1/users", userRoutes);
}

app.get("/api/health", (req, res) => {
    return res.json({ status: "OK", message: "Server is running" });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Global error handler (4-arg) — must stay after all routes and the 404 handler
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
        console.error(err.stack);
    }
    res.status(status).json({
        message: err.message || "Internal server error",
    });
});

const listenPort = () => Number(process.env.PORT) || Number(app.get("port")) || 8000;

/** Attach once so EADDRINUSE exits cleanly instead of an unhandled error. */
function startHttpServer(port) {
    server.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(
                `Port ${port} is already in use (EADDRINUSE). Another process is bound to it — often a previous backend instance.\n` +
                `Fix: stop that process, or set PORT=8001 in backend/.env and match VITE_SERVER_URL on the frontend.`
            );
            mongoose.disconnect().catch(() => {});
            process.exit(1);
            return;
        }
        console.error("HTTP server error:", err);
        mongoose.disconnect().catch(() => {});
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

const start = async () => {
    const port = listenPort();

    if (skipDb) {
        console.warn("SKIP_DB=true: starting without MongoDB. Realtime (Socket.IO) and /api/health are available.");
        startHttpServer(port);
        return;
    }

    try {
        const mongoUri = (process.env.MONGO_URI || "").trim();
        if (!mongoUri) {
            throw new Error("MONGO_URI is empty. Set it in backend/.env (see .env.example).");
        }

        const connectionInstance = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_MS) || 20000,
            connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 20000,
        });
        const dbName = connectionInstance.connection.name;
        console.log(`MongoDB connected: ${connectionInstance.connection.host} (db: ${dbName})`);
        if (dbName === "test") {
            console.warn(
                'MongoDB is using the default database "test". If you meant to use "meetrix", append it to MONGO_URI before the query string, e.g. ...mongodb.net/meetrix?retryWrites=true&w=majority'
            );
        }

        startHttpServer(port);
    } catch (error) {
        console.error("MongoDB connection error:", error.message || error);
        console.error(
            "Fix MONGO_URI / Atlas network access, or set SKIP_DB=true for socket-only mode (no login or history)."
        );
        process.exit(1);
    }
};

start();
