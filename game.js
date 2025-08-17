const newGameButton = document.getElementById('newGame');
const restartButton = document.getElementById('restartGame');
const difficultySlider = document.getElementById('difficulty');
const difficultyValue = document.getElementById('difficultyValue');
const winMessage = document.getElementById('winMessage');
const solveGameButton = document.getElementById('solveGame');

const rows = 4; // Number of rows in the game
const cols = 4; // Number of columns in the game
const totalTiles = rows * cols; // Total number of tiles in the game
let difficulty = difficultySlider.value; // Get initial difficulty from the slider

let isWin = false;
let interval;
let movesCount = 0;
let initialBoard = [];
let currentBoard = [];
const solutionMoves = [];

// Listeners
const tiles = document.querySelectorAll('.tile');
tiles.forEach((tile, index) => tile.addEventListener('click', () => tryMove(currentBoard, index)));

newGameButton.addEventListener('click', newGame);
restartButton.addEventListener('click', restartGame);
solveGameButton.addEventListener('click', solve);

// Update difficulty value display when slider changes
difficultySlider.addEventListener('input', (e) => {
    difficulty = e.target.value;
    difficultyValue.textContent = difficulty;
});

// Initialize the game on load
newGame();

function newGame({ isRestart = false } = {}) {
    difficultySlider.disabled = true; // Disable difficulty slider on new game
    isWin = false;
    movesCount = 0;
    document.getElementById('moves').textContent = 'Moves: 0';
    document.getElementById('timer').textContent = '00:00';
    clearInterval(interval);

    if (!isRestart) {
        currentBoard = generateNewBoard();
        initialBoard = currentBoard.map((row) => [...row]);
    } else {
        currentBoard = initialBoard.map((row) => [...row]);
    }
    winMessage.textContent = `Solvable in max ${solutionMoves.length} moves`;
    renderBoard(currentBoard);
}

function restartGame() {
    newGame({ isRestart: true });
}

function startTimer() {
    let timer = 0;
    const timerElement = document.getElementById('timer');
    interval = setInterval(() => {
        timer++;
        const minutes = Math.floor(timer / 60)
            .toString()
            .padStart(2, '0');
        const seconds = (timer % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function generateNewBoard() {
    let zeroRow = 3;
    let zeroCol = 3;

    // Initialize the board with numbers 1 to 15 and a zero tile
    const board = Array.from({ length: rows }, () => []);
    let val = 1;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (row === zeroRow && col === zeroCol) {
                board[row][col] = 0;
            } else {
                board[row][col] = val++;
            }
        }
    }

    solutionMoves.length = 0; // Clear previous solution moves
    previousZeroRow = zeroRow;
    previousZeroCol = zeroCol;

    // Shuffle the board so that it's guaranteed to be solvable
    for (let i = 0; i < difficulty; i++) {
        const neighbours = neighbourTitleRowCol(zeroRow, zeroCol).filter(
            // Filter out the previous zero tile position to avoid immediate backtracking
            ([row, col]) => !(row === previousZeroRow && col === previousZeroCol)
        );
        const randomIndex = Math.floor(Math.random() * neighbours.length);
        const randomNeighbour = neighbours[randomIndex];

        // Make a move
        board[zeroRow][zeroCol] = board[randomNeighbour[0]][randomNeighbour[1]];
        board[randomNeighbour[0]][randomNeighbour[1]] = 0;
        // Store the move in solutionMoves
        solutionMoves.unshift([zeroRow, zeroCol]);
        // Update zero tile position
        [previousZeroRow, previousZeroCol] = [zeroRow, zeroCol];
        [zeroRow, zeroCol] = randomNeighbour;
    }

    return board;
}

function neighbourTitleRowCol(tileRow, tileCol) {
    const neighbours = [];
    for (let i of [-1, 0, 1]) {
        for (let j of [-1, 0, 1]) {
            if (
                (i !== 0 && j !== 0) ||
                (i === 0 && j === 0) ||
                tileRow + i < 0 ||
                tileRow + i > rows - 1 ||
                tileCol + j < 0 ||
                tileCol + j > cols - 1
            )
                continue;

            neighbours.push([tileRow + i, tileCol + j]);
        }
    }

    return neighbours;
}

function zeroTilePosition(board, tileRow, tileCol) {
    const neighbours = neighbourTitleRowCol(tileRow, tileCol);

    for (const [row, col] of neighbours) {
        if (board[row][col] === 0) {
            return [row, col]; // Return the position of the empty tile
        }
    }
    return null;
}

function tryMove(board, tile) {
    if (isWin) return;

    const tileRow = Math.floor(tile / cols);
    const tileCol = tile % cols;

    const zeroPosition = zeroTilePosition(board, tileRow, tileCol);

    if (!zeroPosition) return;

    if (movesCount === 0) startTimer(); // Start timer on first move

    // make move
    board[zeroPosition[0]][zeroPosition[1]] = board[tileRow][tileCol];
    board[tileRow][tileCol] = 0;

    renderBoard(board);
    movesCount++;
    document.getElementById('moves').textContent = `Moves: ${movesCount}`;

    if (checkWin(currentBoard)) {
        isWin = true;
        clearInterval(interval);
        winMessage.textContent = 'Congratulations! You Won!';
        difficultySlider.disabled = false; // Enable difficulty slider on new game
    }
}

function checkWin(board) {
    let expectedValue = 1;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // The last tile should be the empty one for a win
            if (row === rows - 1 && col === cols - 1) {
                return board[row][col] === 0;
            }
            if (board[row][col] !== expectedValue) return false;
            expectedValue++;
        }
    }
    return true;
}

function renderBoard(board) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tileIndex = row * cols + col;
            tiles[tileIndex].textContent = board[row][col] || '';
            tiles[tileIndex].classList.toggle('empty', board[row][col] === 0);
        }
    }
}

async function solve() {
    restartGame();

    document.body.classList.add('disable-user-interaction');

    for (let i = 0; i < solutionMoves.length; i++) {
        await sleep(500); // Wait for 0.5 second before each move
        tryMove(currentBoard, solutionMoves[i][0] * cols + solutionMoves[i][1]);
    }

    document.body.classList.remove('disable-user-interaction');
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
