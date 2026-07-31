import { describe, expect, it } from 'vitest';
import {
  checkWin,
  computeAdjacent,
  countFlags,
  countRevealed,
  createBoard,
  inBounds,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
} from '../src/game';

describe('createBoard', () => {
  it('creates a board with the correct dimensions and clean cells', () => {
    const board = createBoard(9, 9, 10);
    expect(board.rows).toBe(9);
    expect(board.cols).toBe(9);
    expect(board.mines).toBe(10);
    expect(board.cells).toHaveLength(9);
    expect(board.cells[0]).toHaveLength(9);
    expect(board.cells.flat().every((c) => !c.mine && !c.revealed && !c.flagged && c.adjacent === 0)).toBe(true);
  });

  it('rejects invalid dimensions and mine counts', () => {
    expect(() => createBoard(0, 5, 1)).toThrow('positive dimensions');
    expect(() => createBoard(5, 5, -1)).toThrow('Invalid mine count');
    expect(() => createBoard(5, 5, 25)).toThrow('Invalid mine count');
  });
});

describe('placeMines', () => {
  it('places exactly the configured number of mines', () => {
    const board = createBoard(9, 9, 10);
    placeMines(board, 4, 4);
    expect(board.cells.flat().filter((c) => c.mine)).toHaveLength(10);
  });

  it('keeps the first-clicked cell and its neighbors mine-free', () => {
    for (let i = 0; i < 20; i++) {
      const board = createBoard(9, 9, 10);
      placeMines(board, 4, 4);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = 4 + dr;
          const c = 4 + dc;
          if (inBounds(board, r, c)) {
            expect(board.cells[r][c].mine).toBe(false);
          }
        }
      }
    }
  });

  it('computes adjacent counts that match the real neighborhood', () => {
    const board = createBoard(9, 9, 10);
    placeMines(board, 0, 0);
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (board.cells[r][c].mine) continue;
        let expected = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(board, nr, nc) && board.cells[nr][nc].mine) expected++;
          }
        }
        expect(board.cells[r][c].adjacent).toBe(expected);
      }
    }
  });
});

describe('computeAdjacent', () => {
  it('recomputes counts after manual mine placement', () => {
    const board = createBoard(3, 3, 1);
    board.cells[0][0].mine = true;
    computeAdjacent(board);
    expect(board.cells[0][1].adjacent).toBe(1);
    expect(board.cells[1][1].adjacent).toBe(1);
    expect(board.cells[2][2].adjacent).toBe(0);
  });
});

describe('revealCell', () => {
  it('flood-fills empty regions', () => {
    const board = createBoard(5, 5, 0);
    placeMines(board, 0, 0);
    expect(revealCell(board, 2, 2)).toBe('ok');
    expect(countRevealed(board)).toBe(25);
    expect(checkWin(board)).toBe(true);
  });

  it('returns "mine" and reveals the mine on a hit', () => {
    const board = createBoard(3, 3, 1);
    board.cells[0][0].mine = true;
    computeAdjacent(board);
    expect(revealCell(board, 0, 0)).toBe('mine');
    expect(board.cells[0][0].revealed).toBe(true);
  });

  it('does not reveal flagged cells', () => {
    const board = createBoard(5, 5, 0);
    toggleFlag(board, 2, 2);
    expect(revealCell(board, 2, 2)).toBe('blocked');
    expect(board.cells[2][2].revealed).toBe(false);
  });

  it('is a no-op on out-of-bounds coordinates', () => {
    const board = createBoard(5, 5, 0);
    expect(revealCell(board, -1, 0)).toBe('blocked');
    expect(revealCell(board, 0, 99)).toBe('blocked');
  });
});

describe('toggleFlag and countFlags', () => {
  it('toggles flags on hidden cells only', () => {
    const board = createBoard(5, 5, 0);
    expect(toggleFlag(board, 1, 1)).toBe(true);
    expect(countFlags(board)).toBe(1);
    expect(board.cells[1][1].flagged).toBe(true);
    expect(toggleFlag(board, 1, 1)).toBe(false);
    expect(countFlags(board)).toBe(0);

    revealCell(board, 2, 2);
    expect(toggleFlag(board, 2, 2)).toBe(false);
    expect(board.cells[2][2].flagged).toBe(false);
  });
});

describe('win and loss helpers', () => {
  it('checkWin requires every non-mine cell to be revealed', () => {
    const board = createBoard(3, 3, 1);
    board.cells[0][0].mine = true;
    computeAdjacent(board);
    expect(checkWin(board)).toBe(false);
    revealCell(board, 0, 1);
    expect(checkWin(board)).toBe(false);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!board.cells[r][c].mine) revealCell(board, r, c);
      }
    }
    expect(checkWin(board)).toBe(true);
  });

  it('revealAllMines reveals every mine', () => {
    const board = createBoard(5, 5, 3);
    placeMines(board, 0, 0);
    revealAllMines(board);
    const mines = board.cells.flat().filter((c) => c.mine);
    expect(mines).toHaveLength(3);
    expect(mines.every((c) => c.revealed)).toBe(true);
  });
});
