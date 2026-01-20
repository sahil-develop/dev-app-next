# 🎬 DevReels — Developer News Video Platform

> Instagram Reels, but for developers. Upload short videos about dev news, with admin moderation.

![DevReels Dark Theme](./public/devreels-preview.png)

## ✨ Features

- **Instagram-style Reels feed** — Fullscreen vertical scroll-snap with autoplay
- **JWT Authentication** — Secure login/register with HTTP-only cookies
- **Role-based access** — User & Admin roles
- **Video Upload System** — Drag-and-drop, live preview, progress bar (up to 100MB)
- **Admin Panel** — Approve/Reject/Delete with preview modal
- **Like & Comment** — Real-time optimistic updates
- **Tag System** — Tag videos, click-to-filter feed
- **View Tracking** — Count views per video
- **Infinite Scroll** — Load more as you scroll
- **Dark Mode** — Premium glassmorphism design

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Database | MongoDB + Mongoose |
| Auth | JWT (HTTP-only cookies) |
| Storage | Local file system (`/public/uploads`) |
| Styling | CSS Variables + Tailwind |

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`)

### 2. Install

```bash
npm install
```

### 3. Environment

Create `.env.local` (already created):
```env
MONGODB_URI=mongodb://localhost:27017/devreels
JWT_SECRET=your_super_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create Admin User

```bash
# Install ts-node if needed
npm install -g ts-node

# Run seeder
npx ts-node -e "$(cat scripts/seed-admin.ts)"
```

Or manually via MongoDB shell:
```js
db.users.insertOne({
  name: "Admin",
  email: "admin@devreels.com",
  // bcrypt hash of "admin123456"
  password: "$2b$12$...",
  role: "admin",
  createdAt: new Date()
})
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/         # register, login, logout, me
│   │   ├── videos/       # upload, feed, user, like, comment, view
│   │   └── admin/        # videos, approve, reject, delete, stats
│   ├── login/
│   ├── register/
│   ├── feed/             # Reels feed (main page)
│   ├── upload/           # Video upload
│   ├── dashboard/        # User's videos
│   └── admin/            # Admin panel
├── components/
│   ├── AuthProvider.tsx  # Auth context
│   ├── layout/
│   │   └── Navbar.tsx
│   └── video/
│       └── VideoCard.tsx # Reel card with all interactions
├── lib/
│   ├── mongodb.ts        # DB connection
│   └── auth.ts           # JWT utilities
└── models/
    ├── User.ts
    └── Video.ts
```

## 🔐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload video (multipart) |
| GET | `/api/videos/feed` | Approved videos feed |
| GET | `/api/videos/user` | Current user's videos |
| POST | `/api/videos/like` | Toggle like |
| POST | `/api/videos/comment` | Post comment |
| POST | `/api/videos/view` | Track view |

### Admin (admin role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/videos` | List all videos |
| PUT | `/api/admin/approve` | Approve video |
| PUT | `/api/admin/reject` | Reject video |
| DELETE | `/api/admin/delete` | Delete video |
| GET | `/api/admin/stats` | Platform stats |

## 👤 Default Admin

After seeding:
- **Email:** `admin@devreels.com`
- **Password:** `admin123456`

> ⚠️ Change these immediately in production!

## 📝 Notes

- Videos are stored in `/public/uploads/videos/` (local filesystem)
- Max upload size: **100MB** per video
- Videos require **admin approval** before appearing in the public feed
- JWT tokens expire in **7 days**

## 🔮 Future Enhancements

- [ ] FFmpeg video compression
- [ ] Real-time comments (WebSocket)
- [ ] Trending algorithm
- [ ] Push notifications
- [ ] Bookmark videos
- [ ] S3/Cloudflare R2 storage
