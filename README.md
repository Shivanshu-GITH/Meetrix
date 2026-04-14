# Meetrix — Real-Time Video Conferencing Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?logo=typescript)](https://www.typescriptlang.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black?logo=socket.io)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-green?logo=mongodb)](https://www.mongodb.com)

Meetrix is a production-ready, full-stack video conferencing web application built on the **MERN stack** (MongoDB, Express, React, Node.js). It enables real-time peer-to-peer audio/video communication via **WebRTC**, coordinated through a **Socket.IO** signaling server, with optional **Firebase** authentication alongside a native JWT-based auth system.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Feature Set](#2-feature-set)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Prerequisites](#5-prerequisites)
6. [Local Development Setup](#6-local-development-setup)
7. [Environment Variables](#7-environment-variables)
8. [API Reference](#8-api-reference)
9. [Socket.IO Event Protocol](#9-socketio-event-protocol)
10. [Authentication Flows](#10-authentication-flows)
11. [Security Architecture](#11-security-architecture)
12. [Deployment Guide](#12-deployment-guide)
13. [Configuration Reference](#13-configuration-reference)
14. [Troubleshooting](#14-troubleshooting)
15. [Contributing](#15-contributing)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                               │
│                                                                          │
│  React 19 + TypeScript + Vite                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Landing /   │  │  Auth Page   │  │  Home /      │  │  Meeting    │  │
│  │  Marketing   │  │  (JWT +      │  │  Dashboard   │  │  History    │  │
│  │  Page        │  │  Firebase)   │  │              │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                ↑                                         │
│                         AuthContext (React Context API)                  │
│                                ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    VideoMeet Component                           │    │
│  │  WebRTC (RTCPeerConnection)  ◄──►  Socket.IO Client             │    │
│  │  Local MediaStream (camera/mic/screen)                          │    │
│  │  Dynamic video tile grid for each remote participant            │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────┬────────────────────────┬───────────────────────┘
                          │ HTTP/REST (Axios)       │ WebSocket (Socket.IO)
                          ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SERVER (Node.js / Express)                          │
│                                                                          │
│  ┌───────────────┐   ┌──────────────────┐   ┌────────────────────────┐  │
│  │  REST API     │   │  Socket.IO       │   │  Security Middleware   │  │
│  │  /api/v1/     │   │  Signaling       │   │  Helmet, CORS,         │  │
│  │  users/*      │   │  Server          │   │  Rate Limiting, JWT    │  │
│  └───────────────┘   └──────────────────┘   └────────────────────────┘  │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐   ┌────────────────────────────────────────────────┐  │
│  │  Mongoose    │   │  In-Memory Room State                          │  │
│  │  ODM         │   │  connections{}  messages{}  timeOnline{}       │  │
│  └──────────────┘   └────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐      ┌─────────────────────┐
              │  MongoDB Atlas /      │      │  Firebase Auth      │
              │  Local MongoDB        │      │  (Google + Email)   │
              │  Users, Meetings      │      │                     │
              └───────────────────────┘      └─────────────────────┘
```

Meetrix follows a **decoupled monorepo** layout. The frontend is an independent Vite/React SPA; the backend is an Express + Socket.IO server. They communicate over two separate channels:

- **REST over HTTP** — for auth (register, login, logout) and meeting history.
- **WebSocket (Socket.IO)** — for real-time room management and WebRTC signaling.

WebRTC peer connections are established **directly between browsers** (P2P). The server acts only as a signaling relay — it never handles media traffic.

---

## 2. Feature Set

### Core Communication
- **HD peer-to-peer video and audio** via WebRTC `RTCPeerConnection`
- **Screen sharing** using `getDisplayMedia` (browser-native, no plugins)
- **In-call text chat** with message history replayed to late joiners (up to 100 messages per room)
- **Dynamic participant grid** — video tiles added/removed in real time as participants join or leave
- **Graceful media fallback** — if camera or mic permission is denied, a silent/black track placeholder is used so the call still connects

### Meeting Management
- **Instant meeting creation** — one click generates a cryptographically random 8-character alphanumeric code
- **Join by code** — enter any valid meeting code to join an existing room
- **Guest access** — join without creating an account (display name prompted in lobby)
- **Copy join link** — one-click clipboard copy of the full shareable meeting URL
- **Room capacity enforcement** — configurable cap (default 10, max 200) with graceful `room-full` notification

### Authentication
- **Native JWT auth** — register/login with username + bcrypt-hashed password, 7-day JWT tokens
- **Firebase email/password** — register, login, and password reset via Firebase Auth
- **Google OAuth** — one-click sign-in via Firebase Google provider (`signInWithPopup`)
- **Route guards** — `withAuth` HOC redirects unauthenticated users from protected pages
- **Meeting history** — logged-in users see timestamped records of meetings they attended (MongoDB for JWT users, localStorage for Firebase users)

### UI / UX
- **Material UI v9** component library with a custom Meetrix theme
- **Responsive design** — adapts from mobile to wide desktop layouts
- **Pre-join lobby** — camera/mic preview, toggle controls, and display name entry before entering the call
- **Control bar** — toggle camera, toggle mic, screen share, chat panel, end call
- **Unread message badge** on the chat button while the panel is closed

---

## 3. Technology Stack

### Frontend (`/frontend`)

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | 6 |
| Build Tool | Vite | 8 |
| Routing | React Router | v7 |
| UI Components | Material UI (MUI) | v9 |
| Styling | Emotion (CSS-in-JS) + CSS Modules | — |
| HTTP Client | Axios | 1.x |
| Realtime | Socket.IO Client | 4.x |
| Authentication | Firebase SDK | 12.x |
| Linting | ESLint + typescript-eslint | — |

### Backend (`/backend`)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥18 (ESM) |
| Framework | Express | 4.x |
| Realtime | Socket.IO | 4.x |
| Database ORM | Mongoose | 8.x |
| Authentication | jsonwebtoken + bcryptjs | — |
| Security | Helmet, express-rate-limit | — |
| Dev Server | Nodemon + cross-env | — |

### Infrastructure & Services

| Service | Purpose |
|---|---|
| MongoDB Atlas (or local) | Persistent user and meeting history storage |
| Firebase Auth | OAuth and email/password auth provider |
| Google STUN (`stun.l.google.com:19302`) | ICE candidate gathering for WebRTC NAT traversal |

---

## 4. Project Structure

```
Meetrix/
├── backend/
│   ├── .env.example                  # Annotated environment variable template
│   ├── .gitignore
│   ├── package.json                  # ESM, nodemon, node scripts
│   ├── test-db.js                    # Standalone MongoDB connectivity test
│   └── src/
│       ├── app.js                    # Express app, middleware chain, server bootstrap
│       ├── controllers/
│       │   ├── socketManager.js      # Socket.IO server — room logic, signaling, chat
│       │   └── user.controller.js    # register, login, logout, history CRUD
│       ├── middleware/
│       │   └── auth.middleware.js    # JWT Bearer token verification (verifyToken)
│       ├── models/
│       │   ├── user.model.js         # Mongoose User schema (name, username, password)
│       │   └── meeting.model.js      # Mongoose Meeting schema (user_id, meetingCode, date)
│       └── routes/
│           └── users.routes.js       # Auth rate-limited routes + protected history routes
│
└── frontend/
    ├── .env.example                  # Frontend environment variable template
    ├── .gitignore
    ├── index.html                    # Vite HTML entry point
    ├── vite.config.ts
    ├── tsconfig*.json
    ├── eslint.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.tsx                  # React app entry point
        ├── App.tsx                   # Root router and ThemeProvider
        ├── App.css                   # Global nav/landing styles
        ├── theme.ts                  # Custom MUI theme (meetrixTheme)
        ├── environment.ts            # Backend URL configuration (VITE_SERVER_URL)
        ├── firebase.ts               # Firebase app init + Auth + GoogleAuthProvider
        ├── assets/
        │   └── hero.png              # Landing page illustration
        ├── contexts/
        │   ├── AuthContextDefinition.ts   # Context type definitions
        │   └── AuthContext.tsx            # Auth state, all login/logout handlers
        ├── pages/
        │   ├── landing.tsx           # Public marketing page
        │   ├── authentication.tsx    # Login / Register / Google sign-in page
        │   ├── home.tsx              # Dashboard: create or join a meeting (auth-protected)
        │   ├── history.tsx           # Meeting history list (auth-protected)
        │   └── VideoMeet.tsx         # Core video call component (~700 lines)
        ├── styles/
        │   └── videoComponent.module.css  # Scoped styles for the meeting UI
        └── utils/
            └── withAuth.tsx          # HOC: redirects unauthenticated users to /auth
```

---

## 5. Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x LTS | Required for ESM (`"type": "module"`) |
| npm | 9.x | Bundled with Node 18+ |
| MongoDB | 6.x | Atlas free tier or local install |
| Git | Any recent | — |
| A modern browser | Chrome 90+ / Firefox 90+ / Edge 90+ | Required for WebRTC + `getDisplayMedia` |

**Optional — for Firebase auth features:**
- A Firebase project with Authentication enabled (Email/Password + Google providers)

---

## 6. Local Development Setup

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd Meetrix
```

### Step 2 — Backend setup

```bash
cd backend
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/meetrix
PORT=8000
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars
JWT_ISSUER=meetrix-api
JWT_AUDIENCE=meetrix-client
FRONTEND_URL=http://localhost:5173
```

> **Tip:** If you want to run the backend without MongoDB (Socket.IO only — no auth or history), add `SKIP_DB=true` to your `.env`. The `/api/v1/users` routes will return `503`; everything else stays functional.

Verify your database connection (optional):

```bash
npm run test:db
```

Start the backend in development mode:

```bash
npm run dev
```

The server will start on `http://localhost:8000`. You should see:

```
MongoDB connected: <host> (db: meetrix)
Server running at http://localhost:8000
```

### Step 3 — Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
VITE_SERVER_URL=http://localhost:8000

# Optional — only needed for Firebase auth features
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

> If you leave the `VITE_FIREBASE_*` variables blank in development, the bundled fallback Firebase project is used (suitable for local testing only). In production all six must be set.

Start the frontend:

```bash
npm run dev
```

The Vite dev server starts at `http://localhost:5173`.

### Step 4 — Open the app

Navigate to `http://localhost:5173` in your browser. You can:

- Register an account and log in, or
- Click **Join as Guest** on the landing page to enter a meeting without an account.

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | Yes* | — | MongoDB connection string. Local: `mongodb://127.0.0.1:27017/meetrix`. Atlas: `mongodb+srv://<user>:<pass>@<host>/meetrix?retryWrites=true&w=majority` |
| `PORT` | No | `8000` | HTTP server port |
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens. Use a random string of at least 32 characters in production. |
| `JWT_ISSUER` | No | `meetrix-api` | JWT `iss` claim. Must match between signing and verification. |
| `JWT_AUDIENCE` | No | `meetrix-client` | JWT `aud` claim. Must match between signing and verification. |
| `FRONTEND_URL` | Yes (prod) | — | Frontend origin for CORS and Socket.IO (e.g. `https://meetrix.example.com`). Unset in development allows any origin. |
| `SKIP_DB` | No | — | Set to `true` to start without MongoDB. Auth and history endpoints return 503. |
| `API_RATE_LIMIT` | No | `300` | Max requests per IP per 15-minute window for all routes. |
| `MAX_PARTICIPANTS` | No | `10` | Maximum peers allowed per meeting room (clamped to 1–200). |
| `MONGO_SERVER_SELECTION_MS` | No | `20000` | MongoDB server selection timeout in milliseconds. |
| `MONGO_CONNECT_TIMEOUT_MS` | No | `20000` | MongoDB initial connect timeout in milliseconds. |

*`MONGO_URI` is not required when `SKIP_DB=true`.

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_SERVER_URL` | No | `http://localhost:8000` | Backend base URL for both REST API calls and Socket.IO connection. |
| `VITE_FIREBASE_API_KEY` | Yes (prod) | Bundled fallback | Firebase project API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes (prod) | Bundled fallback | Firebase auth domain (e.g. `your-app.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | Yes (prod) | Bundled fallback | Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes (prod) | Bundled fallback | Firebase storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes (prod) | Bundled fallback | Firebase Cloud Messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Yes (prod) | Bundled fallback | Firebase app ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Bundled fallback | Firebase Analytics measurement ID. |

> **Security note:** Never commit `.env` or `.env.local` files to version control. Both are listed in the respective `.gitignore` files.

---

## 8. API Reference

**Base URL:** `http://localhost:8000/api/v1`

All endpoints return JSON. Error responses follow the shape:

```json
{ "message": "Human-readable error description" }
```

### Health Check

```
GET /api/health
```

Returns `200 OK` with `{ "status": "OK", "message": "Server is running" }`. No authentication required.

---

### Authentication

Auth endpoints are rate-limited to **10 requests per IP per 15 minutes** to mitigate brute-force attacks.

#### Register

```
POST /api/v1/users/register
```

**Request body:**

```json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "password": "securepassword123"
}
```

**Validation:**
- `name`: 2–60 characters, required
- `username`: 3–20 characters, alphanumeric + underscores only (`[a-zA-Z0-9_]`), stored lowercase
- `password`: 8–128 characters

**Responses:**

| Status | Meaning |
|---|---|
| `201 Created` | User registered successfully |
| `400 Bad Request` | Validation failure (message describes the field) |
| `409 Conflict` | Username already taken |
| `500 Internal Server Error` | Server error |

---

#### Login

```
POST /api/v1/users/login
```

**Request body:**

```json
{
  "username": "janedoe",
  "password": "securepassword123"
}
```

**Response `200 OK`:**

```json
{
  "token": "<JWT>",
  "username": "janedoe",
  "name": "Jane Doe"
}
```

The JWT is signed with HS256, expires in 7 days, and includes `iss`/`aud` claims.

| Status | Meaning |
|---|---|
| `200 OK` | Login successful, token returned |
| `400 Bad Request` | Missing fields |
| `401 Unauthorized` | Invalid credentials |

---

#### Logout

```
POST /api/v1/users/logout
```

**Headers:** `Authorization: Bearer <token>`

Returns `200 OK`. Because JWTs are stateless, the server simply signals success; the client is responsible for discarding the token. A server-side blocklist (e.g. Redis) would be required for true token invalidation and is noted as a future enhancement.

---

### Meeting History

Both endpoints require a valid JWT.

**Headers:** `Authorization: Bearer <token>`

#### Add to History

```
POST /api/v1/users/add_to_activity
```

**Request body:**

```json
{ "meeting_code": "abc12345" }
```

Meeting codes must match `/^[a-zA-Z0-9_-]{1,64}$/`. Returns `201 Created` on success.

#### Get History

```
GET /api/v1/users/get_all_activity
```

Returns an array of meeting objects:

```json
[
  {
    "_id": "...",
    "user_id": "janedoe",
    "meetingCode": "abc12345",
    "date": "2025-04-14T10:30:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## 9. Socket.IO Event Protocol

The Socket.IO server manages room membership and acts as a relay for WebRTC signaling. Media never passes through the server.

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `join-call` | `roomId: string` | Join or create a room. Room ID must match `/^[a-zA-Z0-9_-]{1,64}$/`. Emits `room-full` back if the room is at capacity. |
| `signal` | `(toId: string, message: RTCSessionDescription \| RTCIceCandidate)` | Relay a WebRTC signal (offer, answer, or ICE candidate) to the peer identified by `toId`. |
| `chat-message` | `(data: string, sender: string)` | Send a chat message to all room participants. Messages are trimmed to 2000 characters; sender names to 60 characters. |

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `user-joined` | `(socketId: string, allSocketIds: string[])` | Emitted to **all** participants (including the new joiner) when someone joins. The joining client uses `allSocketIds` to initiate WebRTC offers to existing peers. |
| `user-left` | `socketId: string` | Emitted to remaining participants when someone disconnects. |
| `signal` | `(fromId: string, message: RTCSessionDescription \| RTCIceCandidate)` | Relayed WebRTC signal from `fromId`. |
| `chat-message` | `(data: string, sender: string, socketId: string)` | Broadcasted chat message from `socketId`. |
| `room-full` | — | Emitted to the joining client if the room has reached `MAX_PARTICIPANTS`. |

### Server-Side Room State

The signaling server maintains three in-memory maps:

```js
connections = {}   // roomId → socketId[]
messages    = {}   // roomId → { sender, data, socketId }[] (capped at 100)
timeOnline  = {}   // socketId → Date
```

> **Note:** These maps are process-scoped. In a multi-process or multi-instance deployment, a shared store (e.g. Redis with `socket.io-redis` adapter) is required for rooms to work correctly across instances.

---

## 10. Authentication Flows

Meetrix supports two parallel authentication systems. The `authProvider` key in `localStorage` tracks which one is active for the current session.

### Native JWT Flow

```
User fills register form
        │
        ▼
POST /api/v1/users/register  →  201 Created
        │
        ▼
POST /api/v1/users/login  →  { token, username, name }
        │
        ▼
Store in localStorage: token, username, name, authProvider="backend"
        │
        ▼
Axios interceptor auto-attaches Bearer token to subsequent requests
        │
        ▼
Meeting history synced via POST/GET /api/v1/users/*_activity
```

### Firebase Flow (Email/Password or Google)

```
User clicks "Sign in with Google" (or fills Firebase email/password form)
        │
        ▼
Firebase SDK authenticates → returns Firebase User credential
        │
        ▼
credential.user.getIdToken()  →  Firebase JWT
        │
        ▼
Store in localStorage: token=Firebase JWT, authProvider="firebase"
        │
        ▼
Meeting history stored in localStorage under key meetrix_history_<username>
(Firebase tokens are not verified server-side; history is client-local only)
```

### Route Protection

The `withAuth` HOC wraps protected pages (`/home`, `/history`). It reads `localStorage.getItem("token")` on render; if absent, it immediately redirects to `/auth`.

---

## 11. Security Architecture

### Backend Hardening

| Control | Implementation |
|---|---|
| **Secure HTTP headers** | `helmet()` applied globally — sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (HTTPS only), and others |
| **CORS** | Strict origin whitelist in production via `FRONTEND_URL`. Credentials enabled. Methods explicitly enumerated. |
| **Rate limiting** | Global: 300 req / 15 min per IP. Auth routes: 10 req / 15 min per IP. RFC 9429-compliant `RateLimit` response headers. |
| **JWT security** | Algorithm pinned to HS256. `iss` and `aud` claims validated on every verification. Token length checked (max 2048 bytes). |
| **Password storage** | bcrypt with cost factor 10. Passwords never logged or returned in responses. |
| **User enumeration prevention** | Login returns the same `"Invalid credentials"` message for unknown username or wrong password. |
| **Input validation** | Username regex, name length, password length, meeting code regex enforced at controller layer. All string inputs trimmed. |
| **Request body size** | `express.json` and `express.urlencoded` both capped at 40 KB. |
| **x-powered-by** | Disabled (`app.disable("x-powered-by")`) to avoid fingerprinting. |
| **Proxy trust** | `app.set("trust proxy", 1)` set for correct IP resolution behind load balancers/reverse proxies. |
| **Unhandled errors** | Global 4-argument Express error handler prevents stack trace leakage in production. |
| **Socket validation** | Room IDs validated with regex. Chat messages and display names length-capped. Room capacity enforced. |

### Frontend Considerations

- JWT stored in `localStorage` (accessible to JavaScript). For higher security requirements consider `httpOnly` cookie storage — requires backend changes to set `Set-Cookie`.
- Firebase credentials in `.env.local` are bundled into the client JS bundle at build time. These are designed to be public-facing but should still be restricted in the Firebase console (domain allowlist, auth provider limits).
- WebRTC uses Google's public STUN server. For deployments where peers are behind symmetric NATs, a TURN server will be required.

---

## 12. Deployment Guide

### Backend (e.g. Railway, Render, Fly.io, EC2)

1. Set all required environment variables on your hosting platform (never commit `.env`).
2. Ensure `NODE_ENV=production` is set — this enables production CORS enforcement and sanitizes error messages.
3. Set `FRONTEND_URL` to the exact origin of your deployed frontend (e.g. `https://meetrix.example.com`).
4. Start command: `npm start` (runs `node src/app.js`).
5. The server must be accessible over HTTPS for WebRTC and OAuth to work in production browsers.

```bash
# Build check (no separate build step needed for the backend)
cd backend && npm start
```

### Frontend (e.g. Vercel, Netlify, Cloudflare Pages)

1. Set all `VITE_*` environment variables in your hosting dashboard.
2. Build command: `npm run build` (outputs to `dist/`).
3. Publish directory: `dist`.
4. Configure your hosting provider to serve `index.html` for all routes (SPA fallback).

```bash
cd frontend
npm run build
# Preview the production build locally:
npm run preview
```

### Production Checklist

- [ ] `JWT_SECRET` is a long random string (≥ 32 chars, ideally 64+)
- [ ] `JWT_ISSUER` and `JWT_AUDIENCE` are set and consistent
- [ ] `FRONTEND_URL` is set to the exact deployed frontend origin
- [ ] `NODE_ENV=production` is set on the backend
- [ ] All `VITE_FIREBASE_*` variables are set on the frontend
- [ ] Both services deployed behind HTTPS
- [ ] MongoDB Atlas network access list includes the backend server's IP
- [ ] Firebase Authentication allowed domains include the frontend's production domain
- [ ] Firebase API key restricted to the production domain in the Firebase console

### TURN Server (for production P2P reliability)

The default ICE configuration uses only Google's public STUN server. Peers behind symmetric NATs (common in corporate/mobile networks) will fail to connect without a TURN relay. Add your TURN credentials to `VideoMeet.tsx`:

```ts
const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: "turn:<your-turn-server>:3478",
            username: "<username>",
            credential: "<credential>"
        }
    ]
};
```

Self-hosted options: [coturn](https://github.com/coturn/coturn). Managed options: Twilio TURN, Xirsys, Metered.

---

## 13. Configuration Reference

### Available npm Scripts

**Backend:**

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon src/app.js` | Development server with auto-reload |
| `npm run dev:socket` | `cross-env SKIP_DB=true nodemon src/app.js` | Socket-only dev mode (no MongoDB required) |
| `npm start` | `node src/app.js` | Production server |
| `npm run test:db` | `node test-db.js` | Standalone MongoDB connectivity test |

**Frontend:**

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Development server with HMR |
| `npm run build` | `vite build` | Production build to `dist/` |
| `npm run preview` | `vite preview` | Serve the production build locally |
| `npm run lint` | `eslint .` | Run ESLint across all source files |

---

## 14. Troubleshooting

### `EADDRINUSE` on port 8000

Another process is already bound to port 8000. Either kill it (`lsof -ti:8000 | xargs kill`) or change the backend port:

```env
# backend/.env
PORT=8001
```

And update the frontend to match:

```env
# frontend/.env.local
VITE_SERVER_URL=http://localhost:8001
```

### MongoDB connection error on startup

- Confirm `MONGO_URI` is correct and the password is URL-encoded if it contains special characters (`@` → `%40`, `#` → `%23`, etc.).
- For Atlas: ensure your current IP is in the **Network Access** allowlist.
- To bypass DB for local testing: `SKIP_DB=true npm run dev`.

### Database name shows as `"test"` instead of `"meetrix"`

The database name must be specified **in the URI itself**, before the query string:

```
mongodb+srv://user:pass@cluster.mongodb.net/meetrix?retryWrites=true&w=majority
                                             ^^^^^^^
```

### No video or audio in the call

- Check that you granted camera/mic permissions in the browser prompt.
- Ensure you're on `https://` in production (browsers block `getUserMedia` on non-secure origins).
- Check the browser console for WebRTC ICE errors — if you see only `failed` candidates, you need a TURN server.

### Participants can't connect across different networks

This is the STUN/TURN limitation described in [section 12](#turn-server-for-production-p2p-reliability). Add a TURN server to the ICE configuration.

### Firebase login doesn't redirect after sign-in

- Verify that `VITE_FIREBASE_*` variables are set correctly and the Firebase project has the Authentication providers enabled.
- Ensure the app's domain is in the **Authorized domains** list in Firebase Console → Authentication → Settings.

### `JWT_SECRET is not set` warning on startup

The backend will log this warning if `JWT_SECRET` is missing from `.env`. Auth endpoints will return `500`. Set a value in `backend/.env`.

---

## 15. Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and ensure linting passes: `cd frontend && npm run lint`
3. Test your changes locally with both backend and frontend running.
4. Commit with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/): `feat: add TURN server configuration UI`
5. Open a pull request with a clear description of the change and why it's needed.

### Areas for future contribution

- **TURN server UI** — allow users to configure ICE servers from the app settings
- **JWT blocklist** — Redis-backed logout for true server-side token invalidation
- **Multi-instance signaling** — `socket.io-redis` adapter to support horizontal scaling
- **STUN/TURN diagnostics** — display connection quality and ICE state in the call UI
- **End-to-end tests** — Playwright or Cypress test suite for auth and meeting flows
- **Noise suppression** — integrate Krisp or browser-native `noiseSuppression` constraints
- **Recording** — server-side or client-side meeting recording via `MediaRecorder`

---

*Built with ❤️ using WebRTC, Socket.IO, and the MERN stack.*

