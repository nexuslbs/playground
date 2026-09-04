"use strict";

/* DOM wiring for the tic-tac-toe game (logic lives in tictactoe.js). */
(function () {
  var boardEl = document.getElementById("board");
  var statusEl = document.getElementById("status");
  var modeSel = document.getElementById("mode");
  var diffSel = document.getElementById("difficulty");
  var newBtn = document.getElementById("new-game");
  var resetScoreBtn = document.getElementById("reset-scores");
  var scoreX = document.getElementById("score-x");
  var scoreO = document.getElementById("score-o");
  var scoreDraw = document.getElementById("score-draw");

  var HUMAN = "X"; // human always plays X in AI mode
  var AI = "O";

  var board, current, over, aiBusy, scores;

  function resetScores() {
    scores = { X: 0, O: 0, draw: 0 };
    renderScores();
  }

  function renderScores() {
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
    scoreDraw.textContent = scores.draw;
  }

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = "status" + (cls ? " " + cls : "");
  }

  function cellEl(i) {
    return boardEl.children[i];
  }

  function renderBoard() {
    for (var i = 0; i < 9; i++) {
      var el = cellEl(i);
      el.textContent = board[i];
      el.className = "cell" + (board[i] ? " taken " + board[i].toLowerCase() : "");
    }
  }

  function isAiMode() {
    return modeSel.value === "ai";
  }

  function isAiTurn() {
    return isAiMode() && current === AI;
  }

  function ai() {
    if (diffSel.value === "random") return TTT.randomMove(board);
    return TTT.bestMove(board, AI);
  }

  function finish(result, line) {
    over = true;
    if (result === "draw") {
      scores.draw += 1;
      setStatus("It's a draw!", "draw");
    } else {
      scores[result] += 1;
      setStatus(result + " wins!", result === "X" ? "win-x" : "win-o");
    }
    if (line) {
      for (var i = 0; i < line.length; i++) {
        cellEl(line[i]).classList.add("win");
      }
    }
    renderScores();
  }

  function afterMove() {
    var st = TTT.state(board);
    if (st.over) {
      finish(st.result, st.line);
      return;
    }
    current = current === "X" ? "O" : "X";
    if (isAiTurn()) {
      setStatus("O (computer) is thinking…", "thinking");
      aiBusy = true;
      setTimeout(function () {
        doAiMove();
      }, 350);
    } else {
      setStatus(current + "'s turn" + (isAiMode() ? " (you)" : ""), current === "X" ? "turn-x" : "turn-o");
    }
  }

  function doAiMove() {
    var move = ai();
    aiBusy = false;
    if (move < 0) {
      // board full without a finish (should not happen, but be safe)
      finish("draw", null);
      return;
    }
    board[move] = AI;
    renderBoard();
    afterMove();
  }

  function handleCell(i) {
    if (over || aiBusy) return;
    if (board[i] !== TTT.EMPTY) return;
    if (isAiMode() && current !== HUMAN) return; // only the human clicks in AI mode
    board[i] = current;
    renderBoard();
    afterMove();
  }

  function newGame() {
    board = TTT.createBoard();
    current = HUMAN;
    over = false;
    aiBusy = false;
    renderBoard();
    if (isAiMode()) {
      setStatus("X's turn (you) - click a cell", "turn-x");
    } else {
      setStatus("X's turn", "turn-x");
    }
  }

  function buildBoard() {
    for (var i = 0; i < 9; i++) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "cell";
      el.setAttribute("data-index", String(i));
      el.setAttribute("aria-label", "cell " + i);
      el.addEventListener("click", (function (idx) {
        return function () { handleCell(idx); };
      })(i));
      boardEl.appendChild(el);
    }
  }

  buildBoard();
  resetScores();
  newGame();

  newBtn.addEventListener("click", newGame);
  resetScoreBtn.addEventListener("click", resetScores);
  modeSel.addEventListener("change", newGame);
  diffSel.addEventListener("change", function () {
    if (!aiBusy) newGame();
  });
})();
