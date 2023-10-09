const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
const socket = io(); // Initialize Socket.io connection

let gameStarted = false;
let currentPlayer = 0;
let gameBoard = [];
let rook;

function preload() {
    this.load.image('chessboard', '/static/assets/chessboard.png');
    this.load.image('rook', '/static/assets/rook.jpeg');
}

function create() {
    // Create game elements (chessboard, rook)
    this.add.image(400, 300, 'chessboard');

    rook = this.add.image(100, 500, 'rook');

    rook.setScale(0.5);
    // Set up input handling for player moves
    this.input.on('pointerdown', handlePlayerMove);

    socket.on('game_created', (data) => {
        // Handle game creation
        currentPlayer = data.player_id;
    });

    socket.on('game_joined', (data) => {
        // Handle joining a game
        currentPlayer = data.player_id;
    });

    socket.on('game_full', () => {
        // Handle game being full
        alert('Game is full. Try again later.');
    });

    socket.on('game_started', (data) => {
        // Handle game start
        gameStarted = true;
        currentPlayer = 0; // Assuming player 0 always starts
    });

    socket.on('move_made', (data) => {
        // Handle opponent's move and update the game state
        gameBoard = data.board;
        updateRookPosition(data.rook_position);
    });
}

function update() {
    if (gameStarted) {
        // Check for win conditions and update the game display
        if (currentPlayer === 0) {
            // Enable player's move
            rook.setAlpha(1);
        } else {
            // Disable player's move while opponent plays
            rook.setAlpha(0.5);
        }
    }
}

function handlePlayerMove(pointer) {
    if (gameStarted && currentPlayer === 0) {
        // Handle the player's move and send it to the server
        const x = Math.floor(pointer.x / 100); // Assuming 100 pixels per cell
        const y = Math.floor(pointer.y / 100);
        const moveData = {
            player_id: currentPlayer,
            x: x,
            y: y
        };
        socket.emit('move', moveData);
    }
}

function updateRookPosition(position) {
    // Update the rook's position on the client side
    rook.x = position.x * 100; // Assuming 100 pixels per cell
    rook.y = position.y * 100;
}
