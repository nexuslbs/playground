# Minesweeper

A classic Minesweeper game built with TypeScript + Vite, following the same
structure and conventions as the `snake` example in this repo.

## Features

- Three difficulties: Beginner (9×9, 10 mines), Intermediate (16×16, 40 mines),
  Expert (30×16, 99 mines)
- First-click protection: mines are placed only after your first click and never
  under it (or its neighbors)
- Flood-fill reveal for empty regions
- Right-click to flag, mine counter, and a running timer
- Win/lose detection with all mines revealed on a loss

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm test           # run unit tests (vitest)
npm run build      # type-check + production build to dist/
```

## Project structure

```
minesweeper-setup/
├── index.html          # entry HTML
├── src/
│   ├── game.ts         # pure, DOM-free game logic (fully unit-tested)
│   ├── index.ts        # canvas rendering and input handling
│   └── style.css
├── tests/
│   └── minesweeper.test.ts
├── public/favicon.svg
├── Dockerfile          # serves the built app via nginx on port 12345
└── Dockerfile.builder  # multi-stage build: node → nginx
```

## Docker

```bash
docker build -f Dockerfile.builder -t minesweeper-builder .
docker run --rm -v "$PWD/dist:/out" minesweeper-builder sh -c "cp -r /app/dist /out"
docker build -t minesweeper .
docker run -p 12345:12345 minesweeper
```

Then open http://localhost:12345.
