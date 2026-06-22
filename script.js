
/* =====================================
   DOM ELEMENTS
===================================== */

const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const boardElement = document.getElementById("sudoku-board");

const easyBtn = document.getElementById("easy-btn");
const advancedBtn = document.getElementById("advanced-btn");

const difficultyText = document.getElementById("difficulty-text");

const newGameBtn = document.getElementById("new-game-btn");

const winModal = document.getElementById("win-modal");
const playAgainBtn = document.getElementById("play-again-btn");

const sounds = {
    click: new Audio("https://actions.google.com/sounds/v1/ui/click.ogg"),
    error: new Audio("https://actions.google.com/sounds/v1/ui/beep_short.ogg"),
    win: new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg")
};

const themeBtn = document.getElementById("theme-toggle");

themeBtn.addEventListener("click", () => {

    isDark = !isDark;

    document.body.classList.toggle("dark");

    themeBtn.textContent = isDark ? "☀️" : "🌙";
});
/* =====================================
   GAME STATE
===================================== */

let solutionBoard = [];
let puzzleBoard = [];

let currentDifficulty = "easy";

let lockedCells = 0;
let selectedCell = null;
let timer = 0;
let timerInterval = null;

let bestTime = localStorage.getItem("bestTime") || null;

let isDark = false;
/* =====================================
   DIFFICULTY EVENTS
===================================== */

easyBtn.addEventListener("click", () => {
    currentDifficulty = "easy";
    startGame();
});

advancedBtn.addEventListener("click", () => {
    currentDifficulty = "advanced";
    startGame();
});

newGameBtn.addEventListener("click", () => {
    startGame();
});

playAgainBtn.addEventListener("click", () => {
    winModal.classList.add("hidden");
    startGame();
});

/* =====================================
   START GAME
===================================== */

function startGame() {

    startScreen.classList.add("hidden");

    gameContainer.classList.remove("hidden");

    difficultyText.textContent =
        currentDifficulty === "easy"
            ? "Easy"
            : "Advanced";

    generateSudoku();
    startTimer();
}

/* =====================================
   CREATE EMPTY BOARD
===================================== */

function createEmptyBoard() {

    return Array(9)
        .fill()
        .map(() => Array(9).fill(0));
}

/* =====================================
   SHUFFLE ARRAY
===================================== */

function shuffle(array) {

    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [arr[i], arr[j]] =
            [arr[j], arr[i]];
    }

    return arr;
}

/* =====================================
   CHECK VALID NUMBER
===================================== */

function isValid(board, row, col, num) {

    for (let x = 0; x < 9; x++) {

        if (board[row][x] === num)
            return false;

        if (board[x][col] === num)
            return false;
    }

    const startRow =
        Math.floor(row / 3) * 3;

    const startCol =
        Math.floor(col / 3) * 3;

    for (
        let r = startRow;
        r < startRow + 3;
        r++
    ) {

        for (
            let c = startCol;
            c < startCol + 3;
            c++
        ) {

            if (board[r][c] === num)
                return false;
        }
    }

    return true;
}

/* =====================================
   SOLVE BOARD
===================================== */

function solveBoard(board) {

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            if (board[row][col] === 0) {

                const numbers =
                    shuffle([
                        1,2,3,4,5,
                        6,7,8,9
                    ]);

                for (let num of numbers) {

                    if (
                        isValid(
                            board,
                            row,
                            col,
                            num
                        )
                    ) {

                        board[row][col] = num;

                        if (
                            solveBoard(board)
                        ) {
                            return true;
                        }

                        board[row][col] = 0;
                    }
                }

                return false;
            }
        }
    }

    return true;
}

/* =====================================
   COPY BOARD
===================================== */

function copyBoard(board) {

    return board.map(row => [...row]);
}

/* =====================================
   GENERATE FULL SOLUTION
===================================== */

function generateSolution() {

    const board =
        createEmptyBoard();

    solveBoard(board);

    return board;
}

/* =====================================
   REMOVE CELLS FOR PUZZLE
===================================== */

function createPuzzle(solution) {

    const puzzle =
        copyBoard(solution);

    let removeCount;

    if (
        currentDifficulty === "easy"
    ) {
        removeCount = 40;
    }
    else {
        removeCount = 55;
    }

    while (removeCount > 0) {

        const row =
            Math.floor(
                Math.random() * 9
            );

        const col =
            Math.floor(
                Math.random() * 9
            );

        if (puzzle[row][col] !== 0) {

            puzzle[row][col] = 0;

            removeCount--;
        }
    }

    return puzzle;
}

/* =====================================
   GENERATE SUDOKU
===================================== */

function generateSudoku() {

    lockedCells = 0;

    solutionBoard =
        generateSolution();

    puzzleBoard =
        createPuzzle(solutionBoard);

    renderBoard();
}


/* =====================================
   RENDER BOARD
===================================== */

function renderBoard() {

    boardElement.innerHTML = "";

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            const value =
                puzzleBoard[row][col];

            const cell =
                document.createElement("div");

            cell.classList.add("cell");

            /* 3x3 borders */

            if (
                col === 2 ||
                col === 5
            ) {
                cell.classList.add(
                    "right-border"
                );
            }

            if (
                row === 2 ||
                row === 5
            ) {
                cell.classList.add(
                    "bottom-border"
                );
            }

            /* PREFILLED CELL */

            if (value !== 0) {

                cell.textContent = value;

                cell.classList.add(
                    "fixed"
                );

                lockedCells++;
            }

            /* EMPTY CELL */

            else {

                const input =
                    document.createElement(
                        "input"
                    );

                input.type = "text";

                input.maxLength = 1;

                input.dataset.row = row;
                input.dataset.col = col;

                /* Allow only 1-9 */

                input.addEventListener(
                    "input",
                    handleInput
                );
                input.addEventListener("focus", () => {

    selectedCell = input;

    clearHighlights();

    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);

    highlightRelatedCells(row, col);

    input.parentElement.classList.add("active-cell");
});

                /* Keyboard cleanup */

                input.addEventListener(
                    "keydown",
                    allowDigitsOnly
                );

                cell.appendChild(input);
            }

            boardElement.appendChild(cell);
        }
    }
}

/* =====================================
   ALLOW ONLY 1-9
===================================== */

function allowDigitsOnly(event) {

    const allowed = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab"
    ];

    if (
        allowed.includes(event.key)
    ) {
        return;
    }

    if (
        !/^[1-9]$/.test(event.key)
    ) {
        event.preventDefault();
    }
}

/* =====================================
   HANDLE USER INPUT
===================================== */

function handleInput(event) {

    sounds.click.play();

    const input =
        event.target;

    const value =
        parseInt(input.value);

    const row =
        Number(input.dataset.row);

    const col =
        Number(input.dataset.col);

    const parentCell =
        input.parentElement;

    if (
        isNaN(value)
    ) {
        return;
    }

    validateMove(
        row,
        col,
        value,
        input,
        parentCell
    );
}

/* =====================================
   VALIDATE MOVE
===================================== */

function validateMove(
    row,
    col,
    value,
    input,
    parentCell
) {

    const correctValue =
        solutionBoard[row][col];

    /* CORRECT */

    if (
        value === correctValue
    ) {

        parentCell.classList.remove(
            "wrong"
        );

        parentCell.classList.add(
            "correct"
        );

        freezeCell(
            parentCell,
            value
        );

        lockedCells++;

        checkWin();
    }

    /* WRONG */

    else {
        sounds.error.play();
        parentCell.classList.remove(
            "shake"
        );

        void parentCell.offsetWidth;

        parentCell.classList.add(
            "wrong"
        );

        parentCell.classList.add(
            "shake"
        );

        setTimeout(() => {

            parentCell.classList.remove(
                "wrong"
            );

        }, 600);

        setTimeout(() => {
        input.value = "";
        }, 250);

    }
}

/* =====================================
   FREEZE CORRECT CELL
===================================== */

function freezeCell(
    cell,
    value
) {

    cell.innerHTML = "";

    cell.textContent = value;
    cell.classList.add("pop-animate");

    cell.classList.add(
        "fixed"
    );

    cell.classList.add(
        "correct"
    );
    cell.classList.add("glow");

    setTimeout(() => {
        cell.classList.remove("glow");
    }, 500);
}
/* =====================================
   CHECK WIN CONDITION
===================================== */

function checkWin() {

    const totalCells =
        81;

    if (
        lockedCells === totalCells
    ) {
        setTimeout(() => {
            showWin();
        }, 300);
    }
}

/* =====================================
   SHOW WIN MODAL
===================================== */

function showWin() {
    sounds.win.play();
    winModal.classList.remove(
        "hidden"
    );
    launchConfetti();
    clearInterval(timerInterval);

    if (!bestTime || timer < bestTime) {
    bestTime = timer;
    localStorage.setItem("bestTime", bestTime);
    }

    alert(`Completed in ${timer}s`);
}

/* =====================================
   RESET GAME STATE
===================================== */

function resetGameState() {

    solutionBoard = [];
    puzzleBoard = [];
    lockedCells = 0;
}

/* =====================================
   NEW GAME CLEANUP
===================================== */

function restartGame() {

    resetGameState();

    boardElement.innerHTML = "";

    generateSudoku();
}

/* =====================================
   NEW GAME EVENT FIX
===================================== */

newGameBtn.addEventListener(
    "click",
    () => {

        restartGame();
    }
);

/* =====================================
   INITIAL LOAD (optional safety)
===================================== */

window.addEventListener(
    "load",
    () => {

        // keeps app stable if refreshed mid-state
        if (
            gameContainer.classList.contains(
                "hidden"
            )
        ) {
            return;
        }

        generateSudoku();
    }
);
function clearHighlights() {

    document.querySelectorAll(".cell")
        .forEach(cell => {
            cell.classList.remove(
                "highlight-row",
                "highlight-col",
                "highlight-box",
                "active-cell"
            );
        });
}
function highlightRelatedCells(row, col) {

    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {

        const input = cell.querySelector("input");

        let r = input?.dataset.row;
        let c = input?.dataset.col;

        if (r == row) {
            cell.classList.add("highlight-row");
        }

        if (c == col) {
            cell.classList.add("highlight-col");
        }

        // 3x3 box highlight
        if (input) {

            const rr = Number(r);
            const cc = Number(c);

            if (
                Math.floor(rr / 3) === Math.floor(row / 3) &&
                Math.floor(cc / 3) === Math.floor(col / 3)
            ) {
                cell.classList.add("highlight-box");
            }
        }
    });
}
function launchConfetti() {

    const duration = 1500;
    const end = Date.now() + duration;

    (function frame() {

        const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

        for (let i = 0; i < 6; i++) {

            const confetti = document.createElement("div");

            confetti.className = "confetti";

            confetti.style.left =
                Math.random() * 100 + "vw";

            confetti.style.background =
                colors[Math.floor(Math.random() * colors.length)];

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 2000);
        }

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }

    })();
}
function startTimer() {

    clearInterval(timerInterval);

    timer = 0;

    timerInterval = setInterval(() => {

        timer++;

        console.log("Time:", timer);

    }, 1000);
}
document.addEventListener("keydown", (e) => {

    if (!selectedCell) return;

    let row = Number(selectedCell.dataset.row);
    let col = Number(selectedCell.dataset.col);

    if (e.key === "ArrowRight") col++;
    if (e.key === "ArrowLeft") col--;
    if (e.key === "ArrowUp") row--;
    if (e.key === "ArrowDown") row++;

    const next = document.querySelector(
        `input[data-row="${row}"][data-col="${col}"]`
    );

    if (next) {
        next.focus();
    }
});
