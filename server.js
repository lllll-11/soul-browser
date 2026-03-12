const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir archivos estáticos (el index.html)
app.use(express.static(path.join(__dirname)));
app.use(cors());

// Variables globales del servidor
const games = {}; // Salas de juego { roomCode: { players: {}, level, state } }
const players = {}; // Conexiones de jugadores activos

const PORT = process.env.PORT || 3000;

// ==========================================
// SOCKET.IO EVENT HANDLERS
// ==========================================

io.on('connection', (socket) => {
    console.log(`[CONEXIÓN] Nuevo jugador conectado: ${socket.id}`);

    // Evento: Crear o unirse a sala
    socket.on('join-game', (data) => {
        const { roomCode, playerName } = data;
        
        // Crear sala si no existe
        if (!games[roomCode]) {
            games[roomCode] = {
                players: {},
                level: 1,
                state: 'MENU',
                enemies: [],
                bullets: [],
                frame: 0,
                seed: Math.random()
            };
        }

        // Registrar jugador
        const game = games[roomCode];
        game.players[socket.id] = {
            id: socket.id,
            name: playerName,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            shield: 50,
            maxShield: 50,
            energy: 200,
            maxEnergy: 200,
            angle: 0,
            weapon: 'PISTOL',
            coins: 0,
            kills: 0,
            alive: true,
            angle: 0
        };

        players[socket.id] = { roomCode, playerName };
        
        // Unir socket a la sala
        socket.join(roomCode);

        // Notificar al cliente
        socket.emit('game-joined', {
            roomCode,
            playerId: socket.id,
            gameState: game
        });

        // Notificar a otros jugadores
        socket.to(roomCode).emit('player-joined', {
            playerId: socket.id,
            playerName,
            playerData: game.players[socket.id]
        });

        console.log(`[SALA ${roomCode}] ${playerName} se unió. Total: ${Object.keys(game.players).length}`);
    });

    // Evento: Actualizar posición del jugador
    socket.on('player-move', (data) => {
        const { roomCode, x, y, vx, vy, angle } = data;
        
        if (games[roomCode] && games[roomCode].players[socket.id]) {
            const player = games[roomCode].players[socket.id];
            player.x = x;
            player.y = y;
            player.vx = vx;
            player.vy = vy;
            player.angle = angle;

            // Broadcast a otros jugadores en la sala
            socket.to(roomCode).emit('player-moved', {
                playerId: socket.id,
                x, y, vx, vy, angle
            });
        }
    });

    // Evento: Disparo del jugador
    socket.on('player-shoot', (data) => {
        const { roomCode } = data;
        
        if (games[roomCode]) {
            // Broadcast el disparo a los otros jugadores
            socket.to(roomCode).emit('bullet-fired', {
                playerId: socket.id,
                x: data.x,
                y: data.y,
                angle: data.angle,
                vx: data.vx,
                vy: data.vy,
                dmg: data.dmg,
                color: data.color,
                speed: data.speed
            });
        }
    });

    // Evento: Estado de jugador (HP, shield, etc)
    socket.on('player-update', (data) => {
        const { roomCode, hp, shield, energy, weapon, coins, kills } = data;
        
        if (games[roomCode] && games[roomCode].players[socket.id]) {
            const player = games[roomCode].players[socket.id];
            if (hp !== undefined) player.hp = hp;
            if (shield !== undefined) player.shield = shield;
            if (energy !== undefined) player.energy = energy;
            if (weapon) player.weapon = weapon;
            if (coins !== undefined) player.coins = coins;
            if (kills !== undefined) player.kills = kills;

            // Notificar a otros jugadores
            socket.to(roomCode).emit('player-state-changed', {
                playerId: socket.id,
                hp, shield, energy, weapon, coins, kills
            });
        }
    });

    // Evento: Entrar a warmup
    socket.on('enter-warmup', (data) => {
        const { roomCode } = data;
        
        if (games[roomCode]) {
            games[roomCode].state = 'WARMUP';
            
            // Notificar a todos en la sala
            io.to(roomCode).emit('warmup-started', {
                roomCode,
                warmupMode: true
            });
            
            console.log(`[SALA ${roomCode}] ¡Warmup iniciado! ${Object.keys(games[roomCode].players).length} jugadores`);
        }
    });

    // Evento: Iniciar partida
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        
        if (games[roomCode]) {
            games[roomCode].state = 'PLAYING';
            games[roomCode].seed = Math.random();
            games[roomCode].level = games[roomCode].level || 1;
            
            // Notificar a todos en la sala
            io.to(roomCode).emit('game-started', {
                roomCode,
                seed: games[roomCode].seed,
                level: games[roomCode].level
            });
            
            console.log(`[SALA ${roomCode}] ¡Partida iniciada! ${Object.keys(games[roomCode].players).length} jugadores en nivel ${games[roomCode].level}`);
        }
    });

    // Evento: Cambio de nivel
    socket.on('level-change', (data) => {
        const { roomCode, level } = data;
        
        if (games[roomCode]) {
            games[roomCode].level = level;
            games[roomCode].state = 'PLAYING';
            games[roomCode].seed = Math.random(); // Nueva semilla para generación
            
            io.to(roomCode).emit('level-changed', {
                level,
                seed: games[roomCode].seed
            });
            
            console.log(`[SALA ${roomCode}] Nivel cambió a ${level}`);
        }
    });

    // Evento: Fin del juego
    socket.on('game-over', (data) => {
        const { roomCode, level, kills } = data;
        
        if (games[roomCode]) {
            const player = games[roomCode].players[socket.id];
            if (player) {
                player.alive = false;
                player.finalLevel = level;
                player.finalKills = kills;
            }

            io.to(roomCode).emit('player-died', {
                playerId: socket.id,
                playerName: player.name,
                level,
                kills
            });
        }
    });

    // Evento: Chat
    socket.on('chat-message', (data) => {
        const { roomCode, message } = data;
        
        if (games[roomCode] && players[socket.id]) {
            io.to(roomCode).emit('chat-message', {
                playerId: socket.id,
                playerName: players[socket.id].playerName,
                message,
                timestamp: new Date()
            });
        }
    });

    // Evento: Desconexión
    socket.on('disconnect', () => {
        const playerData = players[socket.id];
        
        if (playerData) {
            const { roomCode } = playerData;
            
            if (games[roomCode]) {
                delete games[roomCode].players[socket.id];
                
                // Si no quedan jugadores, eliminar sala
                if (Object.keys(games[roomCode].players).length === 0) {
                    delete games[roomCode];
                    console.log(`[SALA ${roomCode}] Eliminada (sin jugadores)`);
                } else {
                    // Notificar a otros jugadores
                    io.to(roomCode).emit('player-left', {
                        playerId: socket.id,
                        playerName: playerData.playerName
                    });
                    console.log(`[SALA ${roomCode}] ${playerData.playerName} desconectado`);
                }
            }
        }
        
        delete players[socket.id];
        console.log(`[DESCONEXIÓN] Jugador removido: ${socket.id}`);
    });

    // Evento: Ping para medir latencia
    socket.on('ping', (callback) => {
        callback();
    });
});

// ==========================================
// RUTAS HTTP
// ==========================================

app.get('/api/stats', (req, res) => {
    const stats = {
        totalRooms: Object.keys(games).length,
        totalPlayers: Object.keys(players).length,
        rooms: Object.entries(games).map(([code, game]) => ({
            code,
            players: Object.keys(game.players).length,
            level: game.level
        }))
    };
    res.json(stats);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// SERVER START
// ==========================================

server.listen(PORT, () => {
    console.log(`🎮 Servidor Socket.IO escuchando en http://localhost:${PORT}`);
    console.log(`📍 Abierto en navegador: http://localhost:${PORT}`);
});

// Limpieza periódica de salas vacías
setInterval(() => {
    for (const [code, game] of Object.entries(games)) {
        if (Object.keys(game.players).length === 0) {
            delete games[code];
        }
    }
}, 60000);
