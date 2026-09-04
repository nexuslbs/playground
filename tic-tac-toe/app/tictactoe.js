"use strict";

/*
 * Pure tic-tac-toe logic - no DOM dependencies.
 * Works in the browser (global `TTT`) and in Node (module.exports).
 */
var TTT = (function () {
  var EMPTY = "";

  function createBoard() {
    return [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
  }

  function winner(board) {
    var lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (var i = 0; i < lines.length; i++) {
      var a = lines[i][0], b = lines[i][1], c = lines[i][2];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], line: lines[i] };
      }
    }
    return null;
  }

  function isFull(board) {
    for (var i = 0; i < board.length; i++) {
      if (board[i] === EMPTY) return false;
    }
    return true;
  }

  function available(board) {
    var out = [];
    for (var i = 0; i < board.length; i++) {
      if (board[i] === EMPTY) out.push(i);
    }
    return out;
  }

  function state(board) {
    var w = winner(board);
    if (w) return { over: true, result: w.player, line: w.line };
    if (isFull(board)) return { over: true, result: "draw", line: null };
    return { over: false, result: null, line: null };
  }

  function bestMove(board, me) {
    var opp = me === "X" ? "O" : "X";

    // minimax with alpha-beta pruning; score is from `me`'s perspective.
    function minimax(b, player, alpha, beta) {
      var w = winner(b);
      if (w) return w.player === me ? 10 : -10;
      if (isFull(b)) return 0;

      var moves = available(b);
      var best;
      if (player === me) {
        best = -Infinity;
        for (var i = 0; i < moves.length; i++) {
          b[moves[i]] = player;
          var v = minimax(b, opp, alpha, beta);
          b[moves[i]] = EMPTY;
          if (v > best) best = v;
          if (v > alpha) alpha = v;
          if (beta <= alpha) break;
        }
      } else {
        best = Infinity;
        for (var j = 0; j < moves.length; j++) {
          b[moves[j]] = player;
          var v2 = minimax(b, me, alpha, beta);
          b[moves[j]] = EMPTY;
          if (v2 < best) best = v2;
          if (v2 < beta) beta = v2;
          if (beta <= alpha) break;
        }
      }
      return best;
    }

    var spots = available(board);
    if (spots.length === 0) return -1;

    // Prefer center, then corners, then edges (identical minimax result,
    // but prettier openings and less computation).
    var prefs = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    var bestVal = -Infinity;
    var pick = spots[0];
    for (var k = 0; k < prefs.length; k++) {
      var m = prefs[k];
      if (board[m] !== EMPTY) continue;
      board[m] = me;
      var val = minimax(board, opp, -Infinity, Infinity);
      board[m] = EMPTY;
      if (val > bestVal) {
        bestVal = val;
        pick = m;
      }
    }
    return pick;
  }

  function randomMove(board) {
    var spots = available(board);
    if (spots.length === 0) return -1;
    return spots[Math.floor(Math.random() * spots.length)];
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      createBoard: createBoard,
      winner: winner,
      isFull: isFull,
      available: available,
      state: state,
      bestMove: bestMove,
      randomMove: randomMove,
      EMPTY: EMPTY
    };
  }

  return {
    createBoard: createBoard,
    winner: winner,
    isFull: isFull,
    available: available,
    state: state,
    bestMove: bestMove,
    randomMove: randomMove,
    EMPTY: EMPTY
  };
})();
