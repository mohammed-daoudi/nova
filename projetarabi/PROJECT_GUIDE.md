# SocialApp - Full-Stack Social Media Platform

Welcome to **SocialApp**, a comprehensive social media application built with a modern React frontend and a fast Node.js backend. This project provides a full-featured social experience including real-time messaging, content sharing, and social networking.

---

## 🚀 The Core Idea

SocialApp is designed to be a lightweight but powerful platform where users can:
- **Share & Discover**: Post text and images to a global feed.
- **Interact**: Engage with content through likes and comments.
- **Connect**: Build a network by sending and receiving friend requests.
- **Communicate**: Chat with friends in real-time through a dedicated messaging system.
- **Personalize**: Manage a custom profile with a bio and avatar.

---

## 🏗️ Architecture

The project follows a decoupled **Client-Server** architecture:

1.  **Frontend (`/socialapp`)**: A Single Page Application (SPA) built with React and Vite. It communicates with the backend via a REST API and WebSockets.
2.  **Backend (`/socialapp-backend`)**: An Express.js server that handles business logic, authentication, and database interactions.
3.  **Database**: A MySQL relational database stores all persistent data (users, posts, messages, etc.).
4.  **Real-time Layer**: WebSockets (`ws`) are used to provide instantaneous message delivery.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (modular design)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via `mysql2`)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Handling**: Multer (for image uploads)
- **Real-time**: WebSockets (`ws` library)

---

## 📦 Dependencies to Install

### 1. Frontend Setup
Navigate to the `socialapp` directory and install the required packages:
```bash 
cd socialapp
npm install
```

### 2. Backend Setup
Navigate to the `socialapp-backend` directory and install the required packages:
```bash
cd socialapp-backend
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables
Create a `.env` file in the `socialapp-backend` directory with the following variables:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=socialapp
JWT_SECRET=your_super_secret_key
```

### Database Initialization
The backend automatically initializes the database tables on startup using the logic in `src/db/database.js`. Ensure your MySQL server is running before starting the backend.

---

## 📈 Feature Roadmap

### ✅ Completed Features
- **Authentication**: JWT-based login, registration, and "me" endpoint.
- **Profiles**: View and update user information, bio, and avatars.
- **Posts**: Create posts with images, view feed, like posts, and add comments.
- **Friends**: Send/receive requests, accept requests, list friends, and remove friends.
- **Messaging**: Fetch conversations, viewing threads, and sending messages.
- **Real-time**: WebSocket integration for instant messaging.
- **Search**: Search for users by username or name.

### ⏳ Pending / Future Improvements
- [ ] **Password Recovery**: Support for "Forgot Password" via email.
- [ ] **Notifications**: Real-time alerts for likes, comments, and friend requests.
- [ ] **Post Editing**: Ability to edit existing posts.
- [ ] **Media Optimization**: Image compression and CDN integration.
- [ ] **Testing**: Unit tests for backend logic and E2E tests for the frontend.
- [ ] **Deployment**: Dockerization and production CI/CD pipelines.

---

## 🖱️ Getting Started

1.  **Start the Backend**:
    ```bash
    cd socialapp-backend
    npm run dev
    ```
2.  **Start the Frontend**:
    ```bash
    cd socialapp
    npm run dev
    ```
3.  Open your browser and navigate to `http://localhost:5173`.

---

*Last Updated: April 2026*
