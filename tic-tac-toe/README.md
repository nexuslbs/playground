# Tic-Tac-Toe

A classic 3x3 tic-tac-toe game, served as a tiny web app.

## Features

- **2 Players** (hot-seat) and **vs Computer** modes
- **Minimax AI** (unbeatable, with alpha-beta pruning) or random-move AI
- Win/draw/loss scoreboard, winning-line highlight, new-game & reset controls
- Small footprint: static HTML/CSS/JS + a ~90-line Python HTTP server

## Layout

```
tic-tac-toe/
├── app/
│   ├── index.html      # page
│   ├── style.css       # styling
│   ├── tictactoe.js    # pure game logic (win check, minimax) - no DOM, also Node-runnable
│   ├── game.js         # DOM wiring / UI behaviour
│   └── server.py       # static server + GET /api/status
├── tests/
│   ├── logic.test.js   # node tests for the pure logic
│   └── selftest.py     # HTTP self-test against a running server
├── Dockerfile          # python:3.12-alpine, listens on 8080
└── README.md
```

## Run with Docker

```bash
docker build -t tic-tac-toe .
docker run -d -p 8080:8080 --name tic-tac-toe tic-tac-toe
# open http://localhost:8080
```

## Run without Docker

```bash
cd app && python3 server.py        # listens on 0.0.0.0:8080
```

## Test

```bash
node tests/logic.test.js           # pure logic unit tests (needs node)
python3 tests/selftest.py          # HTTP tests against a running server
```

## API

`GET /api/status` -> `{"app": "tic-tac-toe", "status": "ok", "version": "1.0.0"}`

## Notes for agents

This project intentionally has **no build step and no external runtime
dependencies** so it can be built and served anywhere (even on small hosts)
with plain `docker build` + `docker run`. The pure game logic in
`app/tictactoe.js` is dependency-free and runs both in the browser and in
Node, which makes it easy to unit test.
