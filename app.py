from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import eventlet

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, async_mode='eventlet')

# Store game state
games = {}

class Game:
    def __init__(self):
        self.board = [[0 for _ in range(8)] for _ in range(8)]
        self.current_player = 1
        self.players = [None, None]
        self.turn_timer = 30

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# Socket.io events
@socketio.on('connect')
def handle_connect():
    join_room(request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    leave_room(request.sid)
    game = games.get(request.sid)
    if game:
        if request.sid == game.players[0]:
            leave_room(game.players[1])
        else:
            leave_room(game.players[0])
        del games[request.sid]

@socketio.on('create_game')
def create_game():
    game = Game()
    player_id = random.randint(0, 1)
    game.players[player_id] = request.sid
    games[request.sid] = game
    emit('game_created', {'player_id': player_id}, room=request.sid)
    
@socketio.on('join_game')
def join_game(data):
    game = games.get(data['game_id'])
    if game and not game.players[1]:
        game.players[1] = request.sid
        emit('game_joined', {'player_id': 1}, room=request.sid)
        start_game(data['game_id'])
    else:
        emit('game_full', room=request.sid)

@socketio.on('move')
def handle_move(data):
    game = games.get(request.sid)
    if game and game.current_player == int(data['player_id']):
        # Handle player move and update game state
        x, y = data['x'], data['y']
        game.board[x][y] = 1  # Assuming 1 represents the rook's position
        emit('move_made', {'board': game.board, 'rook_position': {'x': x, 'y': y}}, room=request.sid)
        toggle_player_turn(request.sid)

def toggle_player_turn(game_id):
    game = games[game_id]
    game.current_player = 1 if game.current_player == 0 else 0

def start_game(game_id):
    emit('game_started', {'game_id': game_id}, room=game_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)
