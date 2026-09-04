"use strict";

/* Node-based unit tests for the pure tic-tac-toe logic (app/tictactoe.js).
 * Run: node tests/logic.test.js   (no dependencies) */
const TTT = require("../app/tictactoe.js");

let failures = 0;
function check(cond, msg) {
  console.log((cond ? "PASS" : "FAIL") + ": " + msg);
  if (!cond) failures += 1;
}

// --- winner / state detection ---
let b = TTT.createBoard();
b[0] = "X"; b[1] = "X"; b[2] = "X";
check(!!TTT.winner(b) && TTT.winner(b).player === "X", "row win detected for X");

b = TTT.createBoard();
b[0] = "O"; b[4] = "O"; b[8] = "O";
check(!!TTT.winner(b) && TTT.winner(b).line.join(",") === "0,4,8", "diagonal win detected for O");

b = ["X", "O", "X", "O", "X", "X", "O", "X", "O"];
check(TTT.isFull(b), "full board detected");
check(TTT.state(b).over && TTT.state(b).result === "draw", "full board is a draw");

// --- minimax: take the immediate win ---
b = TTT.createBoard();
b[0] = "X"; b[1] = "X"; b[4] = "O";
check(TTT.bestMove(b, "X") === 2, "X takes the winning move at index 2");

// --- minimax: block the opponent's win ---
b = TTT.createBoard();
b[0] = "X"; b[1] = "X"; b[4] = "O";
check(TTT.bestMove(b, "O") === 2, "O blocks X's winning move at index 2");

b = TTT.createBoard();
b[0] = "X"; b[3] = "O"; b[4] = "O";
check(TTT.bestMove(b, "X") === 5, "X blocks O's row (3,4 -> 5)");

// --- minimax: center opening on empty board ---
check(TTT.bestMove(TTT.createBoard(), "X") === 4, "X opens in the center");

// --- AI cannot lose from a winning/blocking standpoint (X never loses vs O minimax after X center) ---
function playAiGame() {
  const brd = TTT.createBoard();
  // simulate: human X opens center, then minimax O, alternating X at random available
  brd[4] = "X";
  let turn = "O";
  let guard = 0;
  while (!TTT.state(brd).over && guard < 9) {
    guard += 1;
    const mv = turn === "O" ? TTT.bestMove(brd, "O") : TTT.randomMove(brd);
    if (mv < 0) break;
    brd[mv] = turn;
    turn = turn === "X" ? "O" : "X";
  }
  return TTT.state(brd).result; // 'O' win or draw; X must never win
}
let xWins = 0;
for (let i = 0; i < 200; i++) {
  if (playAiGame() === "X") xWins += 1;
}
check(xWins === 0, "minimax O never loses in 200 random-X games (xWins=" + xWins + ")");

// --- randomMove only picks empty cells ---
b = TTT.createBoard();
b[0] = "X"; b[4] = "O";
const mv = TTT.randomMove(b);
check(mv !== 0 && mv !== 4 && mv >= 0 && mv < 9, "randomMove avoids occupied cells (got " + mv + ")");
check(TTT.randomMove(["X", "O", "X", "O", "X", "O", "X", "O", "X"]) === -1, "randomMove on full board returns -1");

process.exit(failures === 0 ? 0 : 1);
