/**
 * Pure Minesweeper game logic — no DOM dependencies, fully unit-testable.
 */

export interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export interface Board {
  rows: number;
  cols: number;
  mines: number;
  cells: Cell[][];
}

export type RevealResult = 'ok' | 'mine' | 'blocked';

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function createBoard(rows: number, cols: number, mines: number): Board {
  if (rows <= 0 || cols <= 0) {
    throw new Error('Board must have positive dimensions');
  }
  if (mines < 0 || mines >= rows * cols) {
    throw new Error(`Invalid mine count ${mines} for a ${rows}x${cols} board`);
  }
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ mine: false, revealed: false, flagged: false, adjacent: 0 });
    }
    cells.push(row);
  }
  return { rows, cols, mines, cells };
}

export function inBounds(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.rows && col >= 0 && col < board.cols;
}

function neighbors(board: Board, row: number, col: number): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  for (const [dr, dc] of DIRS) {
    const nr = row + dr;
    const nc = col + dc;
    if (inBounds(board, nr, nc)) {
      result.push([nr, nc]);
    }
  }
  return result;
}

/** Recompute the adjacent-mine count for every non-mine cell. */
export function computeAdjacent(board: Board): void {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c].mine) continue;
      board.cells[r][c].adjacent = neighbors(board, r, c).filter(
        ([nr, nc]) => board.cells[nr][nc].mine,
      ).length;
    }
  }
}

/**
 * Place mines randomly, guaranteeing the first-clicked cell and its
 * neighbors stay mine-free (standard first-click protection).
 */
export function placeMines(board: Board, safeRow: number, safeCol: number): void {
  if (!inBounds(board, safeRow, safeCol)) {
    throw new Error('Safe cell is out of bounds');
  }
  const safe = new Set<string>([`${safeRow},${safeCol}`]);
  for (const [nr, nc] of neighbors(board, safeRow, safeCol)) {
    safe.add(`${nr},${nc}`);
  }
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (!safe.has(`${r},${c}`)) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length < board.mines) {
    throw new Error('Not enough room to place mines around the first click');
  }
  // Partial Fisher–Yates shuffle, take the first `mines` candidates.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (let i = 0; i < board.mines; i++) {
    const [r, c] = candidates[i];
    board.cells[r][c].mine = true;
  }
  computeAdjacent(board);
}

/** Reveal a cell; empty cells flood-fill. Returns 'mine' if a mine was hit. */
export function revealCell(board: Board, row: number, col: number): RevealResult {
  if (!inBounds(board, row, col)) {
    return 'blocked';
  }
  const cell = board.cells[row][col];
  if (cell.revealed || cell.flagged) {
    return 'blocked';
  }
  if (cell.mine) {
    cell.revealed = true;
    return 'mine';
  }
  revealFlood(board, row, col);
  return 'ok';
}

function revealFlood(board: Board, row: number, col: number): void {
  const cell = board.cells[row][col];
  if (cell.revealed || cell.flagged || cell.mine) {
    return;
  }
  cell.revealed = true;
  if (cell.adjacent > 0) {
    return;
  }
  for (const [nr, nc] of neighbors(board, row, col)) {
    revealFlood(board, nr, nc);
  }
}

/** Toggle a flag on a hidden cell. Returns true if the cell is now flagged. */
export function toggleFlag(board: Board, row: number, col: number): boolean {
  if (!inBounds(board, row, col)) {
    return false;
  }
  const cell = board.cells[row][col];
  if (cell.revealed) {
    return false;
  }
  cell.flagged = !cell.flagged;
  return cell.flagged;
}

export function countFlags(board: Board): number {
  let count = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c].flagged) count++;
    }
  }
  return count;
}

export function countRevealed(board: Board): number {
  let count = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c].revealed) count++;
    }
  }
  return count;
}

/** The game is won when every non-mine cell has been revealed. */
export function checkWin(board: Board): boolean {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cell = board.cells[r][c];
      if (!cell.mine && !cell.revealed) {
        return false;
      }
    }
  }
  return true;
}

/** Reveal every mine on the board (used on loss). */
export function revealAllMines(board: Board): void {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c].mine) {
        board.cells[r][c].revealed = true;
      }
    }
  }
}


// ---------------------------------------------------------------------------
// Difficulty modes
// ---------------------------------------------------------------------------

export type DifficultyId = 'beginner' | 'intermediate' | 'expert';

/** A difficulty preset: board dimensions and mine count. */
export interface Difficulty {
  id: DifficultyId;
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

/** Built-in difficulty presets exposed through the game API. */
export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  beginner: { id: 'beginner', name: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { id: 'intermediate', name: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { id: 'expert', name: 'Expert', rows: 30, cols: 16, mines: 99 },
};

/** Difficulty ids in display order. */
export const DIFFICULTY_IDS: DifficultyId[] = ['beginner', 'intermediate', 'expert'];

/** The difficulty used when none is specified. */
export const DEFAULT_DIFFICULTY: DifficultyId = 'beginner';

/** Look up a difficulty preset by id, falling back to the default for unknown ids. */
export function getDifficulty(id: string): Difficulty {
  return DIFFICULTIES[id as DifficultyId] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
}

/** Create a new game board from a difficulty preset (id or object). */
export function createGame(difficulty: DifficultyId | Difficulty = DEFAULT_DIFFICULTY): Board {
  const preset = typeof difficulty === 'string' ? getDifficulty(difficulty) : difficulty;
  return createBoard(preset.rows, preset.cols, preset.mines);
}
