export interface Point {
  x: number;
  y: number;
}

export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

export enum GameStatus {
  Idle = 'IDLE',
  Playing = 'PLAYING',
  GameOver = 'GAME_OVER',
}

export const GRID_SIZE = 20;
export const TICK_MS = 150;

export class SnakeGame {
  gridCols: number;
  gridRows: number;
  snake: Point[];
  food: Point;
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;

  constructor(cols: number, rows: number) {
    this.gridCols = cols;
    this.gridRows = rows;
    this.snake = [];
    this.food = { x: 0, y: 0 };
    this.direction = Direction.Right;
    this.nextDirection = Direction.Right;
    this.status = GameStatus.Idle;
    this.score = 0;
  }

  start(): void {
    const midX = Math.floor(this.gridCols / 2);
    const midY = Math.floor(this.gridRows / 2);
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    this.direction = Direction.Right;
    this.nextDirection = Direction.Right;
    this.score = 0;
    this.status = GameStatus.Playing;
    this.spawnFood();
  }

  reset(): void {
    this.status = GameStatus.Idle;
    this.snake = [];
    this.score = 0;
  }

  changeDirection(dir: Direction): void {
    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      [Direction.Up]: Direction.Down,
      [Direction.Down]: Direction.Up,
      [Direction.Left]: Direction.Right,
      [Direction.Right]: Direction.Left,
    };
    if (opposites[dir] !== this.direction) {
      this.nextDirection = dir;
    }
  }

  tick(): boolean {
    if (this.status !== GameStatus.Playing) return false;

    this.direction = this.nextDirection;

    const head = this.snake[0];
    const newHead: Point = { ...head };

    switch (this.direction) {
      case Direction.Up:    newHead.y -= 1; break;
      case Direction.Down:  newHead.y += 1; break;
      case Direction.Left:  newHead.x -= 1; break;
      case Direction.Right: newHead.x += 1; break;
    }

    // Wall collision
    if (
      newHead.x < 0 || newHead.x >= this.gridCols ||
      newHead.y < 0 || newHead.y >= this.gridRows
    ) {
      this.status = GameStatus.GameOver;
      return false;
    }

    // Self collision (skip the tail since it will move)
    const body = this.snake.slice(0, -1);
    if (body.some(p => p.x === newHead.x && p.y === newHead.y)) {
      this.status = GameStatus.GameOver;
      return false;
    }

    this.snake.unshift(newHead);

    // Check food
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.spawnFood();
      // Don't remove tail — snake grows
    } else {
      this.snake.pop();
    }

    return true;
  }

  private spawnFood(): void {
    const occupied = new Set(this.snake.map(p => `${p.x},${p.y}`));
    const free: Point[] = [];
    for (let x = 0; x < this.gridCols; x++) {
      for (let y = 0; y < this.gridRows; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }
    if (free.length === 0) return; // snake fills the entire grid — you win!
    this.food = free[Math.floor(Math.random() * free.length)];
  }
}
