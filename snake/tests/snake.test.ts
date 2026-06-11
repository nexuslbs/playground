import { describe, it, expect } from 'vitest';
import { SnakeGame, Direction, GameStatus } from '../src/game';

describe('SnakeGame', () => {
  const COLS = 30;
  const ROWS = 20;

  it('starts in idle status', () => {
    const game = new SnakeGame(COLS, ROWS);
    expect(game.status).toBe(GameStatus.Idle);
    expect(game.score).toBe(0);
    expect(game.snake).toHaveLength(0);
  });

  it('initializes snake on start', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    expect(game.status).toBe(GameStatus.Playing);
    expect(game.score).toBe(0);
    expect(game.snake.length).toBeGreaterThanOrEqual(3);
    // Snake should be in the center area
    const midX = Math.floor(COLS / 2);
    expect(game.snake[0].x).toBe(midX);
  });

  it('moves right by default', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    const headX = game.snake[0].x;
    game.tick();
    expect(game.snake[0].x).toBe(headX + 1);
    expect(game.snake[0].y).toBe(game.snake[1].y);
  });

  it('changes direction', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    game.changeDirection(Direction.Down);
    game.tick();
    const headY = game.snake[0].y;
    expect(game.snake[0].y).toBeGreaterThan(game.snake[1]?.y ?? headY - 1);
  });

  it('prevents 180-degree turn', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    // Moving right, try to go left (180°)
    game.changeDirection(Direction.Left);
    game.tick();
    // Should still be moving right
    expect(game.direction).toBe(Direction.Right);
  });

  it('grows when eating food', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    const initialLength = game.snake.length;
    // Place food directly in front of the snake's head
    const head = game.snake[0];
    game.food = { x: head.x + 1, y: head.y };
    game.tick();
    expect(game.snake.length).toBe(initialLength + 1);
    expect(game.score).toBe(10);
  });

  it('detects wall collision (top)', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    // Move snake head to top row
    while (game.snake[0].y > 0) {
      game.changeDirection(Direction.Up);
      game.tick();
    }
    // One more tick should hit the wall
    game.tick();
    expect(game.status).toBe(GameStatus.GameOver);
  });

  it('detects wall collision (right)', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    // Move snake head to rightmost column
    while (game.snake[0].x < COLS - 1) {
      game.tick();
    }
    // One more tick should hit the wall
    game.tick();
    expect(game.status).toBe(GameStatus.GameOver);
  });

  it('detects self collision', () => {
    // Create a snake that can loop into itself
    const game = new SnakeGame(10, 10);
    game.snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ];
    game.direction = Direction.Up;
    game.nextDirection = Direction.Up;
    game.food = { x: 9, y: 9 };
    game.status = GameStatus.Playing;

    // Turn left then up to hit own body
    game.changeDirection(Direction.Left);
    game.tick(); // now at (4, 4) → collision with tail segment
    expect(game.status).toBe(GameStatus.GameOver);
  });

  it('accumulates score and spawns new food after eating', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    const initialFood = { ...game.food };

    // Place food ahead
    const head = game.snake[0];
    game.food = { x: head.x + 1, y: head.y };
    game.tick();

    expect(game.score).toBe(10);
    // Food should have moved (new spawn)
    expect(game.food.x).not.toBe(initialFood.x);
    expect(game.score).toBe(10);
  });

  it('can be reset to idle', () => {
    const game = new SnakeGame(COLS, ROWS);
    game.start();
    game.tick();
    game.reset();
    expect(game.status).toBe(GameStatus.Idle);
    expect(game.snake).toHaveLength(0);
    expect(game.score).toBe(0);
  });
});
