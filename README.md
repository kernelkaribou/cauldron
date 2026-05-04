# 🧪 Cauldron

A self-hosted hobbyist toolkit for tracking crafting projects, recipes, techniques, and supplies. Built with Express, React, and SQLite — designed to run anywhere Docker does.

## Features

- **Recipes** — Document your project patterns with spells (techniques), ingredients, photos, and time logs
- **Spells** — A personal knowledge base of techniques, tips, and how-tos (Markdown supported)
- **Brews** — Track active projects from start to finish with status progression
- **Ingredients** — Manage your supplies with stock tracking and cost summaries
- **Curiosities** — Save interesting links, videos, and references for later
- **Tags & Crafts** — Organize everything by craft type and custom tags
- **Photos** — Attach progress photos with automatic thumbnail generation
- **Journal** — Write markdown journal entries on any project
- **Tasks** — Track to-do items per recipe or brew
- **Activity Logs** — Log time spent on projects
- **Global Search** — Find anything instantly with ⌘K
- **Multi-user** — Optional auth proxy support for SSO, or built-in JWT auth
- **Dark theme** — A beautiful dark UI designed for focus

## Quick Start

```bash
docker run -d \
  --name cauldron \
  -p 8090:8090 \
  -v cauldron_data:/data \
  ghcr.io/OWNER/cauldron:latest
```

Then open `http://localhost:8090` and create your admin account.

## Docker Compose

```yaml
services:
  cauldron:
    image: ghcr.io/OWNER/cauldron:latest
    ports:
      - "8090:8090"
    volumes:
      - cauldron_data:/data
    environment:
      - NODE_ENV=production
      # Optional: set a fixed JWT secret (auto-generated if omitted)
      # - JWT_SECRET=your-secret-here
      # Optional: trust proxy auth header (e.g., Authelia/Authentik)
      # - AUTH_PROXY_HEADER=Remote-User
    restart: unless-stopped

volumes:
  cauldron_data:
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8090` | HTTP port |
| `DATA_DIR` | `/data` | Persistent data directory (SQLite DB, uploads, JWT secret) |
| `JWT_SECRET` | auto-generated | Secret for signing auth tokens |
| `AUTH_PROXY_HEADER` | — | Trust this header for auth proxy (e.g., `Remote-User`) |
| `NODE_ENV` | `production` | Set to `production` for secure cookies |

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Container               │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │          Express Server              │   │
│  │   • Serves SPA (React build)        │   │
│  │   • REST API (/api/*)               │   │
│  │   • SQLite (WAL mode)               │   │
│  │   • JWT auth + cookie sessions      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  /data/                                     │
│    ├── cauldron.db    (SQLite database)     │
│    ├── uploads/       (photos)             │
│    └── jwt_secret     (auto-generated key) │
└─────────────────────────────────────────────┘
```

### Tech Stack

- **Backend**: Node.js 22, Express, TypeScript, better-sqlite3, Zod
- **Frontend**: React 19, Vite, TypeScript, TanStack Query, Tailwind v4, Zustand
- **Auth**: bcrypt password hashing, JWT (httpOnly cookies), optional proxy header
- **Storage**: SQLite with WAL mode, sharp for image thumbnails
- **Container**: Multi-stage Dockerfile, tini for PID 1, non-root user

## Development

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local dev without Docker)

### Dev with Docker (recommended)

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:5173 (Vite HMR)
- Backend: http://localhost:8090 (Express)

### Local Development

```bash
# Server
cd server && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT stored in httpOnly, SameSite=Strict cookies (Secure in production)
- Rate limiting on auth endpoints (5 requests/minute)
- Owner-scoped data access (users can only see their own data)
- SQLite busy_timeout prevents lock contention
- Non-root container user in production
- Optional auth proxy header for SSO integration

## License

MIT
