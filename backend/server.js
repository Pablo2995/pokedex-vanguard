require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const pokemonRoutes = require('./routes/pokemon');

// NUEVO: Socket.io para Multijugador
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;

// Rate Limiting (Protección)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/pokemon', limiter);
app.use('/pokemon', pokemonRoutes);

// 🚀 LÓGICA DE MULTIJUGADOR VANGUARD (SOCKETS)
let waitingPlayer = null;
let activeGames = {};

io.on('connection', (socket) => {
    console.log(`📡 Entrenador conectado: ${socket.id}`);

    // Unirse a la Cola de Batalla
    socket.on('join_queue', (trainerData) => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // EMPAREJAMIENTO (Matchmaking)
            const gameId = `game_${waitingPlayer.id}_${socket.id}`;
            const player1 = waitingPlayer;
            const player2 = { id: socket.id, ...trainerData };

            activeGames[gameId] = { player1, player2, turn: player1.id };

            socket.join(gameId);
            player1.socket.join(gameId);

            io.to(gameId).emit('match_found', {
                gameId,
                opponent: player2,
                yourTurn: false
            });
            player1.socket.emit('match_found', {
                gameId,
                opponent: player2,
                yourTurn: true
            });

            waitingPlayer = null;
            console.log(`⚔️ Partida iniciada: ${gameId}`);
        } else {
            waitingPlayer = { id: socket.id, socket, ...trainerData };
            socket.emit('waiting_for_opponent');
            console.log(`⏳ Entrenador esperando en cola: ${socket.id}`);
        }
    });

    // Acción de Ataque en tiempo real
    socket.on('send_attack', ({ gameId, damage, moveName }) => {
        const game = activeGames[gameId];
        if (game) {
            socket.to(gameId).emit('receive_attack', { damage, moveName });
            console.log(`💥 Ataque enviado en ${gameId}: ${moveName} (${damage} HP)`);
        }
    });

    socket.on('disconnect', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
        console.log(`📡 Entrenador desconectado: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR VANGUARD ONLINE en http://localhost:${PORT}`);
    console.log(`🔮 Multijugador Sockets: ACTIVADO`);
});
