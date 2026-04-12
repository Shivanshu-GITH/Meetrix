import "dotenv/config";
import mongoose from "mongoose";

/** Redact user:password in URI for logs (never print credentials). */
function redactMongoUri(uri) {
    return uri.replace(/\/\/[^@/]+@/, "//***:***@");
}

function hintForError(err) {
    const msg = String(err?.message || err);
    if (/whitelist|not allowed|IP|network|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
        return "Atlas: Network Access → add your current IP (or 0.0.0.0/0 for dev only). Also try another network/VPN if corporate DNS blocks SRV.";
    }
    if (/authentication failed|bad auth|Invalid namespace/i.test(msg)) {
        return "Check DB username/password. If the password has @ # : / ? use URL-encoding (e.g. @ → %40).";
    }
    if (/Server selection timed out|ReplicaSetNoPrimary/i.test(msg)) {
        return "Cluster unreachable: wrong cluster host, firewall, or Atlas paused tier. Confirm MONGO_URI matches Atlas → Connect → Drivers.";
    }
    return "Compare MONGO_URI with Atlas “Connect your application” string; ensure JWT_SECRET is set in .env.";
}

const uri = process.env.MONGO_URI;

async function test() {
    if (!uri || !uri.trim()) {
        console.error("Missing MONGO_URI. Copy backend/.env.example to backend/.env and set MONGO_URI.");
        process.exit(1);
    }

    const trimmed = uri.trim();
    console.log("Testing MongoDB (redacted):", redactMongoUri(trimmed));

    try {
        await mongoose.connect(trimmed, {
            serverSelectionTimeoutMS: 20000,
            connectTimeoutMS: 20000,
        });
        const h = mongoose.connection.host;
        const name = mongoose.connection.name;
        console.log("OK — connected. Host:", h, "| Database:", name);
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err.message || err);
        console.error("Hint:", hintForError(err));
        process.exit(1);
    } finally {
        await mongoose.disconnect().catch(() => {});
    }
}

test();
