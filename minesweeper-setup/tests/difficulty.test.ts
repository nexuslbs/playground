import { describe, expect, it } from 'vitest';
import {
  Board,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_IDS,
  Difficulty,
  DifficultyId,
  createGame,
  getDifficulty,
  placeMines,
} from '../src/game';

const EXPECTED_PRESETS: Record<DifficultyId, Difficulty> = {
  beginner: { id: 'beginner', name: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { id: 'intermediate', name: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { id: 'expert', name: 'Expert', rows: 30, cols: 16, mines: 99 },
};

describe('difficulty presets', () => {
  it.each(DIFFICULTY_IDS)(
    'defines the %s preset with the correct dimensions and mine count',
    (id) => {
      const preset = DIFFICULTIES[id];
      const expected = EXPECTED_PRESETS[id];
      expect(preset).toBeDefined();
      expect(preset.id).toBe(id);
      expect(preset.rows).toBe(expected.rows);
      expect(preset.cols).toBe(expected.cols);
      expect(preset.mines).toBe(expected.mines);
      // A preset is only valid if the mines fit inside the grid.
      expect(preset.mines).toBeLessThan(preset.rows * preset.cols);
    },
  );

  it('exposes all difficulty ids in display order', () => {
    expect(DIFFICULTY_IDS).toEqual(['beginner', 'intermediate', 'expert']);
    for (const id of DIFFICULTY_IDS) {
      expect(DIFFICULTIES[id]).toBeDefined();
    }
  });

  it('uses beginner as the default difficulty', () => {
    expect(DEFAULT_DIFFICULTY).toBe('beginner');
  });
});

describe('getDifficulty', () => {
  it.each(DIFFICULTY_IDS)('resolves the %s id to its preset', (id) => {
    expect(getDifficulty(id)).toEqual(DIFFICULTIES[id]);
  });

  it('falls back to the default preset for unknown ids', () => {
    expect(getDifficulty('nightmare')).toEqual(DIFFICULTIES[DEFAULT_DIFFICULTY]);
    expect(getDifficulty('')).toEqual(DIFFICULTIES.beginner);
  });
});

describe('createGame', () => {
  it('creates a beginner board when no difficulty is given', () => {
    const board: Board = createGame();
    expect(board.rows).toBe(9);
    expect(board.cols).toBe(9);
    expect(board.mines).toBe(10);
    expect(board.cells).toHaveLength(9);
  });

  it.each(DIFFICULTY_IDS)('applies the %s preset when given an id', (id) => {
    const board: Board = createGame(id);
    const preset = DIFFICULTIES[id];
    expect(board.rows).toBe(preset.rows);
    expect(board.cols).toBe(preset.cols);
    expect(board.mines).toBe(preset.mines);
    expect(board.cells).toHaveLength(preset.rows);
    for (const row of board.cells) {
      expect(row).toHaveLength(preset.cols);
    }
  });

  it('applies a preset object directly', () => {
    const board: Board = createGame(DIFFICULTIES.expert);
    expect(board.rows).toBe(30);
    expect(board.cols).toBe(16);
    expect(board.mines).toBe(99);
  });

  it.each(DIFFICULTY_IDS)('a %s board can receive its full configured mine count', (id) => {
    const board: Board = createGame(id);
    placeMines(board, 0, 0);
    let mined = 0;
    for (const row of board.cells) {
      for (const cell of row) {
        if (cell.mine) mined++;
      }
    }
    expect(mined).toBe(board.mines);
  });
});
