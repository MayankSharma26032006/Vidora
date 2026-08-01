<div align="center">

# 🎬 Vidora

**A full-stack video and content-sharing platform for creators.**

Upload and stream videos, share short-form posts, build playlists, and track channel growth — all inside a dark, premium-feeling interface.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)


</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Roadmap](#️-roadmap)
- [Contributing](#-contributing)
- [Author](#-author)

---

## 📖 Overview

**Vidora** is a full-stack MERN application built to explore how modern video platforms work end-to-end — from secure authentication and media pipelines to aggregation-driven analytics. It combines two content formats in one product: long-form **video hosting** and short-form **community posts**, so creators can engage their audience beyond just uploads.

This project was built as a hands-on deep dive into production-style backend architecture (JWT auth, RESTful API design, MongoDB aggregation pipelines) paired with a polished, componentized React frontend.

---

## ✨ Features

**Authentication & Accounts**
- Secure JWT-based authentication with access + refresh token rotation
- HTTP-only cookie sessions and bcrypt password hashing
- Editable profile, avatar, and cover image (Cloudinary-backed)

**Video Platform**
- Video upload with title, description, and thumbnail
- Video streaming and playback with a custom player
- Publish/unpublish toggle and video management for creators
- Watch history tracking

**Community & Engagement**
- Short-form text posts ("Posts") for lightweight audience engagement
- Likes on videos, comments, and posts
- Threaded comments on videos
- Channel subscriptions

**Organization & Discovery**
- Custom playlists — create, edit, add/remove videos
- Search across content
- Paginated, aggregation-driven content feeds

**Creator Dashboard**
- Real-time channel analytics: total views, subscribers, videos, and likes
- Per-video performance breakdown, computed via MongoDB aggregation pipelines

**Interface**
- Dark-themed, responsive UI designed for a premium feel
- Reusable component library (modals, toasts, tooltips, skeleton loaders, pagination)
- Smooth transitions via Framer Motion

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React.js (Vite), Tailwind CSS, React Router, Axios, Framer Motion, Sonner |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose, `mongoose-aggregate-paginate-v2` |
| **Auth & Security** | JWT (access + refresh tokens), bcrypt, HTTP-only cookies |
| **Media Storage** | Cloudinary, Multer |
| **Tooling** | ESLint, Prettier, Nodemon |

---

## 🏗️ Architecture
Vidora/
├── backend/
│ └── src/
│ ├── controllers/ # Business logic: user, video, comment, like,
│ │ # subscription, playlist, tweet, dashboard
│ ├── models/ # Mongoose schemas
│ ├── routes/ # Express route definitions
│ ├── middlewares/ # JWT auth guard, Multer file uploads
│ ├── utils/ # ApiError, ApiResponse, asyncHandler, Cloudinary helper
│ ├── db/ # MongoDB connection logic
│ ├── app.js # Express app & route registration
│ └── index.js # Entry point
│
└── frontend/
└── src/
├── pages/ # Home, Watch, Channel, Upload, Search,
│ # Playlists, Posts, Dashboard, Settings, etc.
├── components/ # UI primitives, cards, navbar, sidebar,
│ # video player, dashboard widgets, modals
├── context/ # Auth & Theme providers
├── services/ # Axios-based API service layer
├── hooks/ # useAuth, useTheme, useDebounce
├── routes/ # App route configuration
├── layouts/ # Auth / Dashboard / Main layouts
└── utils/ # Formatters, helpers, constants
**Design decisions worth noting:**
- All destructive/state-changing routes are protected by a `verifyJWT` middleware guard.
- File uploads flow through Multer → temp disk storage → Cloudinary, keeping the API stateless.
- Analytics (dashboard, likes-per-video, etc.) are computed with MongoDB aggregation pipelines rather than post-processing in application code, keeping heavy computation close to the data.

---

## 🔌 API Reference

Base URL: `/api/v1`

<details>
<summary><strong>Auth & Users</strong> — <code>/user</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register a new user (with avatar & cover image) | ❌ |
| POST | `/login` | Log in and receive access/refresh tokens | ❌ |
| POST | `/logout` | Log out and clear tokens | ✅ |
| POST | `/refresh-token` | Refresh the access token | ❌ |
| POST | `/change-password` | Change current password | ✅ |
| GET | `/current-user` | Get logged-in user's profile | ✅ |
| PATCH | `/update-account` | Update account details | ✅ |
| PATCH | `/update-avatar` | Update profile avatar | ✅ |
| PATCH | `/update-cover` | Update cover image | ✅ |
| GET | `/channel-profile/:username` | Get a channel's public profile | ❌ |
| GET | `/watch-history` | Get the user's watch history | ✅ |

</details>

<details>
<summary><strong>Videos</strong> — <code>/videos</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get all videos (paginated) | ❌ |
| POST | `/` | Upload/publish a new video | ✅ |
| GET | `/:videoId` | Get a video by ID | ❌ |
| PATCH | `/:videoId` | Toggle publish status | ✅ |
| DELETE | `/:videoId` | Delete a video | ✅ |
| PATCH | `/update/:videoId` | Update video details/thumbnail | ✅ |

</details>

<details>
<summary><strong>Comments</strong> — <code>/comments</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/:videoId` | Get comments for a video | ✅ |
| POST | `/:videoId` | Add a comment | ✅ |
| PATCH | `/c/:commentId` | Update a comment | ✅ |
| DELETE | `/c/:commentId` | Delete a comment | ✅ |

</details>

<details>
<summary><strong>Likes</strong> — <code>/likes</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/toggle/v/:videoId` | Like/unlike a video | ✅ |
| POST | `/toggle/c/:commentId` | Like/unlike a comment | ✅ |
| POST | `/toggle/t/:tweetId` | Like/unlike a post | ✅ |
| GET | `/videos` | Get all videos liked by the user | ✅ |

</details>

<details>
<summary><strong>Subscriptions</strong> — <code>/subscriptions</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/c/:channelId` | Subscribe/unsubscribe to a channel | ✅ |
| GET | `/c/:channelId` | Get a channel's subscriber list | ✅ |
| GET | `/u/:subscriberId` | Get channels a user is subscribed to | ✅ |

</details>

<details>
<summary><strong>Playlists</strong> — <code>/playlists</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create a playlist | ✅ |
| GET | `/user/:userId` | Get a user's playlists | ✅ |
| GET | `/:playlistId` | Get a playlist by ID | ✅ |
| PATCH | `/:playlistId` | Update a playlist | ✅ |
| DELETE | `/:playlistId` | Delete a playlist | ✅ |
| PATCH | `/add/:videoId/:playlistId` | Add a video to a playlist | ✅ |
| PATCH | `/remove/:videoId/:playlistId` | Remove a video from a playlist | ✅ |

</details>

<details>
<summary><strong>Posts (Tweets)</strong> — <code>/tweets</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create a post | ✅ |
| GET | `/user/:userId` | Get a user's posts | ✅ |
| PATCH | `/:tweetId` | Update a post | ✅ |
| DELETE | `/:tweetId` | Delete a post | ✅ |

</details>

<details>
<summary><strong>Dashboard</strong> — <code>/dashboard</code></summary>

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/stats` | Get channel stats (views, subscribers, likes, videos) | ✅ |
| GET | `/videos` | Get all videos for the logged-in channel with per-video stats | ✅ |

</details>

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com/) account for media storage

### 1. Clone the repository
```bash
git clone https://github.com/MayankSharma26032006/Vidora
cd Vidora
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend:
```bash
npm run dev
```
The API will run at `http://localhost:8000`.

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```
The app will run at `http://localhost:5173`.

---

## 🗺️ Roadmap

- [ ] Notifications system (real-time)
- [ ] Video quality/resolution selection
- [ ] Full-text search improvements
- [ ] Deployment (frontend + backend hosted with live demo link)
- [ ] Unit & integration test coverage

---

## 🤝 Contributing

This is currently a solo learning/portfolio project, but suggestions and issues are welcome — feel free to open an issue or fork the repo.

## 👤 Author
Mayank
[GitHub](https://github.com/MayankSharma26032006/Vidora) · [LinkedIn](http://www.linkedin.com/in/mayank-sharma-tech)