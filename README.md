# ZoomMERN - Video Conferencing App

A full-stack MERN (MongoDB, Express, React, Node.js) video conferencing application inspired by Zoom. This app uses WebRTC for peer-to-peer communication and Socket.IO for real-time signaling.

## 🚀 Features

- **Real-time Video/Audio**: High-quality P2P communication using WebRTC.
- **Instant Meetings**: Create and join meetings with a unique 8-character code.
- **Guest Access**: Join meetings immediately without creating an account.
- **Secure Authentication**: User registration and login with JWT and bcrypt password hashing.
- **Meeting History**: Logged-in users can view a history of meetings they've attended.
- **In-call Chat**: Send real-time text messages to all participants in a meeting.
- **Screen Sharing**: Share your screen with other participants (browser supporting).
- **Responsive UI**: Fully responsive design built with Material UI.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Material UI, Socket.IO-client, Axios, React Router v6
- **Backend**: Node.js, Express, Socket.IO, Mongoose (MongoDB), JWT, Bcryptjs
- **Communication**: WebRTC (RTCPeerConnection)

## 📦 Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB Atlas account or local MongoDB instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Meetrix
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `/backend` folder:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=8000
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Verify `src/environment.js` points to your backend URL.

### Running the App

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | - |
| `PORT` | Backend server port | 8000 |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `FRONTEND_URL` | URL of the frontend app (for CORS) | http://localhost:5173 |

## 📸 Screenshots

*(Add your screenshots here)*

---
Developed with ❤️ by [Your Name]
