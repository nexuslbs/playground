import { SnakeGame, Direction, GameStatus, TICK_MS } from './game';

const CELL_PX = 20;
const COLS = 30;
const ROWS = 20;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreSpan = document.getElementById('scoreValue')!;
const startMsg = document.getElementById('startMsg')!;
const startBtn = document.getElementById('startBtn')!;

canvas.width = COLS * CELL_PX;
canvas.height = ROWS * CELL_PX;

const game = new SnakeGame(COLS, ROWS);
let intervalId: number | null = null;

function draw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines (subtle)
  ctx.strokeStyle = '#1e2d50';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_PX, 0);
    ctx.lineTo(x * CELL_PX, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_PX);
    ctx.lineTo(canvas.width, y * CELL_PX);
    ctx.stroke();
  }

  // Draw food
  ctx.fillStyle = '#ff4757';
  ctx.shadowColor = '#ff4757';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const fx = game.food.x * CELL_PX + CELL_PX / 2;
  const fy = game.food.y * CELL_PX + CELL_PX / 2;
  ctx.arc(fx, fy, CELL_PX / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw snake
  game.snake.forEach((seg, i) => {
    const isHead = i === 0;
    ctx.fillStyle = isHead ? '#00d4aa' : '#00a88a';
    ctx.shadowColor = isHead ? '#00d4aa' : '#00a88a';
    ctx.shadowBlur = isHead ? 6 : 2;
    const pad = 1;
    ctx.fillRect(
      seg.x * CELL_PX + pad,
      seg.y * CELL_PX + pad,
      CELL_PX - pad * 2,
      CELL_PX - pad * 2
    );
  });
  ctx.shadowBlur = 0;

  // Overlay on game over
  if (game.status === GameStatus.GameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#a0a0c0';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText(`Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Press Space or click Start', canvas.width / 2, canvas.height / 2 + 60);
  }

  updateUI();
}

function updateUI(): void {
  scoreSpan.textContent = String(game.score);
  startMsg.textContent =
    game.status === GameStatus.Idle ? 'Press Space or click Start to play' :
    game.status === GameStatus.GameOver ? 'Press Space or click Start to restart' :
    'Use arrow keys to move';
}

function gameLoop(): void {
  game.tick();
  draw();
}

function startGame(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  game.start();
  startBtn.textContent = 'Restart';
  intervalId = window.setInterval(gameLoop, TICK_MS);
  draw();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (game.status === GameStatus.Playing) {
    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); game.changeDirection(Direction.Up); break;
      case 'ArrowDown':  e.preventDefault(); game.changeDirection(Direction.Down); break;
      case 'ArrowLeft':  e.preventDefault(); game.changeDirection(Direction.Left); break;
      case 'ArrowRight': e.preventDefault(); game.changeDirection(Direction.Right); break;
    }
  }
  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    if (game.status === GameStatus.Idle || game.status === GameStatus.GameOver) {
      startGame();
    }
  }
});

// Button control
startBtn.addEventListener('click', () => {
  if (game.status === GameStatus.Idle || game.status === GameStatus.GameOver) {
    startGame();
  }
});

// Touch / swipe support
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});
canvas.addEventListener('touchend', (e) => {
  if (game.status !== GameStatus.Playing && game.status !== GameStatus.Idle && game.status !== GameStatus.GameOver) return;
  if (game.status === GameStatus.Idle || game.status === GameStatus.GameOver) {
    startGame();
    return;
  }
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    game.changeDirection(dx > 0 ? Direction.Right : Direction.Left);
  } else {
    game.changeDirection(dy > 0 ? Direction.Down : Direction.Up);
  }
});

// Initial draw
draw();
