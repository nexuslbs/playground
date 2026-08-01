# 🎬 MovieDB

An IMDB-like movie database web app — **Go REST API + React (Vite) + PostgreSQL**, orchestrated with Docker Compose.

## Stack

| Service  | Tech                          | Port  |
|----------|-------------------------------|-------|
| `db`     | PostgreSQL 16                 | 5432 (internal) |
| `backend`| Go 1.22 REST API              | 8080  |
| `frontend`| React 18 + Vite 5            | 5173  |

## Run

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

## API

| Method | Path                  | Description                                   |
|--------|-----------------------|-----------------------------------------------|
| GET    | `/`                   | Service info + endpoint list + row counts     |
| POST   | `/register`           | Create account (DEV: auto-confirmed)          |
| POST   | `/login`              | Log in, returns user + dev token              |
| POST   | `/reset-password`     | Set new password (DEV: no reset email)        |
| GET    | `/movies?search=term` | List movies (optional search on title/genre/description) |
| GET    | `/movies/{id}`        | Movie detail                                  |

Body format for auth endpoints: `{"email": "...", "password": "..."}` / `{"email": "...", "new_password": "..."}`.

## Data

On first startup the backend creates `users` and `movies` tables and seeds **200 movies**
(title, year, genre, rating, description). Passwords are hashed with bcrypt.
