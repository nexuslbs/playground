import {
  Board,
  checkWin,
  countFlags,
  createBoard,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
} from './game';

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

const DIFFICULTIES: Record<string, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

const CELL_SIZE = 32;
const NUMBER_COLORS = [
  '#000000',
  '#1976d2', // 1
  '#2e7d32', // 2
  '#d32f2f', // 3
  '#0d2b8f', // 4
  '#880e4f', // 5
  '#00838f', // 6
  '#212121', // 7
  '#757575', // 8
];

let board: Board | null = null;
let minesPlaced = false;
let status: GameStatus = 'idle';
let timerId: number | null = null;
let seconds = 0;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const mineCountValue = document.getElementById('mineCountValue')!;
const timerValue = document.getElementById('timerValue')!;
const statusMsg = document.getElementById('statusMsg')!;
const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement;
const newGameBtn = document.getElementById('newGameBtn') as HTMLButtonElement;

function currentDifficulty(): DifficultyConfig {
  return DIFFICULTIES[difficultySelect.value] ?? DIFFICULTIES.beginner;
}

function startNewGame(): void {
  const config = currentDifficulty();
  board = createBoard(config.rows, config.cols, config.mines);
  minesPlaced = false;
  status = 'idle';
  seconds = 0;
  stopTimer();
  updateTimer();
  updateMineCounter();
  statusMsg.textContent = 'Left-click to reveal · Right-click to flag';
  resizeCanvas();
  draw();
}

function resizeCanvas(): void {
  if (!board) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = board.cols * CELL_SIZE * dpr;
  canvas.height = board.rows * CELL_SIZE * dpr;
  canvas.style.width = `${board.cols * CELL_SIZE}px`;
  canvas.style.height = `${board.rows * CELL_SIZE}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function cellFromEvent(e: MouseEvent): [number, number] | null {
  if (!board) return null;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) {
    return null;
  }
  return [row, col];
}

function draw(): void {
  if (!board || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#bdbdbd';
  ctx.fillRect(0, 0, board.cols * CELL_SIZE, board.rows * CELL_SIZE);

  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cell = board.cells[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      if (cell.revealed) {
        ctx.fillStyle = cell.mine ? '#f44336' : '#d8d8d8';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        if (cell.mine) {
          drawMine(x, y);
        } else if (cell.adjacent > 0) {
          ctx.fillStyle = NUMBER_COLORS[cell.adjacent] ?? '#000000';
          ctx.font = `bold ${Math.floor(CELL_SIZE * 0.58)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cell.adjacent), x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
        }
      } else {
        drawUnrevealed(x, y);
        if (cell.flagged) {
          drawFlag(x, y);
        }
      }
    }
  }
}

function drawUnrevealed(x: number, y: number): void {
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + CELL_SIZE);
  ctx.lineTo(x, y);
  ctx.lineTo(x + CELL_SIZE, y);
  ctx.stroke();
  ctx.strokeStyle = '#808080';
  ctx.beginPath();
  ctx.moveTo(x, y + CELL_SIZE);
  ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
  ctx.lineTo(x + CELL_SIZE, y);
  ctx.stroke();
}

function drawMine(x: number, y: number): void {
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;
  const r = CELL_SIZE * 0.28;
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r * 1.7, cy + Math.sin(angle) * r * 1.7);
    ctx.lineTo(cx + Math.cos(angle) * r * 0.85, cy + Math.sin(angle) * r * 0.85);
    ctx.stroke();
  }
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlag(x: number, y: number): void {
  const poleX = x + CELL_SIZE * 0.3;
  const baseY = y + CELL_SIZE * 0.82;
  ctx.strokeStyle = '#37474f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(poleX, baseY);
  ctx.lineTo(poleX, y + CELL_SIZE * 0.18);
  ctx.stroke();
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.moveTo(poleX, y + CELL_SIZE * 0.18);
  ctx.lineTo(poleX + CELL_SIZE * 0.45, y + CELL_SIZE * 0.3);
  ctx.lineTo(poleX, y + CELL_SIZE * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(poleX - CELL_SIZE * 0.14, baseY - CELL_SIZE * 0.04, CELL_SIZE * 0.28, CELL_SIZE * 0.08);
}

function startTimer(): void {
  if (timerId !== null) return;
  timerId = window.setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
}

function stopTimer(): void {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function updateTimer(): void {
  timerValue.textContent = String(seconds);
}

function updateMineCounter(): void {
  if (!board) return;
  const remaining = board.mines - countFlags(board);
  mineCountValue.textContent = String(Math.max(remaining, 0));
}

canvas.addEventListener('mousedown', (e) => {
  if (!board) return;
  if (status === 'won' || status === 'lost') return;
  const pos = cellFromEvent(e);
  if (!pos) return;
  const [row, col] = pos;

  if (e.button === 2) {
    toggleFlag(board, row, col);
    updateMineCounter();
    draw();
    return;
  }
  if (e.button !== 0) return;

  const cell = board.cells[row][col];
  if (cell.flagged) return;

  if (!minesPlaced) {
    placeMines(board, row, col);
    minesPlaced = true;
    status = 'playing';
    startTimer();
  }

  const result = revealCell(board, row, col);
  if (result === 'mine') {
    revealAllMines(board);
    status = 'lost';
    stopTimer();
    statusMsg.textContent = '💥 Boom! You hit a mine.';
    draw();
    return;
  }
  if (checkWin(board)) {
    status = 'won';
    stopTimer();
    statusMsg.textContent = `🎉 You won in ${seconds}s!`;
    draw();
    return;
  }
  draw();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

difficultySelect.addEventListener('change', startNewGame);
newGameBtn.addEventListener('click', startNewGame);

startNewGame();
