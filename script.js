import  {Chess}  from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

const game = new Chess();
const board = document.getElementById("chessboard");
const restartBtn = document.getElementById("restartBtn");
const undoBtn = document.getElementById("undoBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const socket = new WebSocket("ws://localhost:8080");
let from = null;

socket.addEventListener("message", (event) => {
  const move = JSON.parse(event.data);
  game.move(move);
  renderBoard();
  updateMoveHistory();
});



function isWhite(piece) {
  return "♙♖♘♗♕♔".includes(piece);
}

function isBlack(piece) {
  return "♟♜♞♝♛♚".includes(piece);
}

function getUnicode(piece) {
  const symbols = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
  };
  return symbols[piece.color === "w" ? piece.type.toUpperCase() : piece.type];
}

function renderBoard() {
  board.innerHTML = "";
  const boardState = game.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.row = row;
      square.dataset.col = col;

      if ((row + col) % 2 === 0) {
        square.classList.add("light");
      } else {
        square.classList.add("dark");
      }

      const piece = boardState[row][col];
      if (piece) {
        const symbol = getUnicode(piece);
        const pieceEl = document.createElement("div");

        pieceEl.textContent = symbol;
        pieceEl.setAttribute("draggable", true);
        pieceEl.classList.add("piece");
        pieceEl.dataset.from = toChessNotation(row, col);

        pieceEl.style.fontSize = "40px";
        pieceEl.style.textAlign = "center";
        pieceEl.style.lineHeight = "60px";

        // Drag logic
        pieceEl.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", pieceEl.dataset.from);
        });

        square.appendChild(pieceEl);
      }

      // Allow drop
      square.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      square.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/plain");
        const to = toChessNotation(row, col);
        const move = game.move({ from, to, promotion: "q" });

        if (move) {
          renderBoard();
          updateMoveHistory();

          if (game.in_checkmate()) {
            alert(`Checkmate! ${move.color === 'w' ? 'White' : 'Black'} wins!`);
          } else if (game.in_check()) {
            alert(`Check to ${game.turn() === 'w' ? 'White' : 'Black'}`);
          } else if (game.in_stalemate()) {
            alert("Stalemate! It's a draw.");
          } else if (game.in_draw()) {
            alert("Draw!");
          }
        }
      });

      board.appendChild(square);
    }
  }
}


function toChessNotation(row, col) {
  const files = "abcdefgh";
  return files[col] + (8 - row);
}
    
function highlightCheck() {
  document.querySelectorAll(".check").forEach(el => el.classList.remove("check"));

  if (game.in_check()) {
    const kingSquare = game.king_square = game.king_square || null;

    const kingPos = game.board().flatMap((row, r) => row.map((p, c) => ({p, r, c})))
      .find(sq => sq.p && sq.p.type === 'k' && sq.p.color === game.turn());

    if (kingPos) {
      const files = "abcdefgh";
      const selector = `[data-row='${kingPos.r}'][data-col='${kingPos.c}']`;
      const kingEl = document.querySelector(selector);
      if (kingEl) kingEl.classList.add("check");
    }
  }
}

function updateMoveHistory() {
  const history = game.history();
  const moveHistoryEl = document.getElementById("moveHistory");

  let formatted = "";
  for (let i = 0; i < history.length; i += 2) {
    const whiteMove = history[i];
    const blackMove = history[i + 1] || "";
    formatted += `${i / 2 + 1}. ${whiteMove} ${blackMove}\n`;
  }

  moveHistoryEl.textContent = formatted.trim();
}


board.addEventListener("click", (e) => {
  const target = e.target;
  if (!target.classList.contains("square")) return;

  const row = +target.dataset.row;
  const col = +target.dataset.col;
  const squareName = toChessNotation(row, col);

  if (from === null) {
    const piece = game.get(squareName);
    if (piece && piece.color === game.turn()) {
      from = squareName;
      target.classList.add("selected");
        }
    } else {
    const move = game.move({ from, to: squareName, promotion: "q" });
    if (move) {
    renderBoard();
    highlightCheck();
    updateMoveHistory();
    socket.send(JSON.stringify({ from, to, promotion: "q" }));

    if (game.in_checkmate()) {
        alert(`Checkmate! ${move.color === 'w' ? 'White' : 'Black'} wins!`);
    } else if (game.in_check()) {
        alert(`Check to ${game.turn() === 'w' ? 'White' : 'Black'}`);
    } else if (game.in_stalemate()) {
        alert("Stalemate! It's a draw.");
    } else if (game.in_draw()) {
        alert("Draw!");
    }
}

    from = null;
    document.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
  }
});

undoBtn.addEventListener("click", () => {
  game.undo();          
  renderBoard();   
  highlightCheck();  
  updateMoveHistory();  
});

restartBtn.addEventListener("click", () => {
  game.reset();          
  renderBoard();         
  updateMoveHistory();   
});

saveBtn.addEventListener("click", () => {
  const fen = game.fen();  // Get current game state as FEN string
  localStorage.setItem("savedChessGame", fen);
  alert("Game saved!");
});

loadBtn.addEventListener("click", () => {
  const fen = localStorage.getItem("savedChessGame");
  if (fen) {
    game.load(fen);
    renderBoard();
    updateMoveHistory();
    alert("Game loaded!");
  } else {
    alert("No saved game found.");
  }
});

renderBoard();
updateMoveHistory();