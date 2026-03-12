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
const SERVER_VERSION = '2.0.1'; // Para verificar deploy en Render

// ==========================================
// SOCKET.IO EVENT HANDLERS
// ==========================================

io.on('connection', (socket) => {
    console.log(`[CONEXIÓN] Nuevo jugador conectado: ${socket.id}`);

    // Evento: Crear o unirse a sala
    socket.on('join-game', (data) => {
        const { roomCode, playerName } = data;
        console.log(`[JOIN-GAME] ${playerName} intenta unirse a ${roomCode}`);
        
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
            console.log(`[JOIN-GAME] Sala creada: ${roomCode}`);
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
        console.log(`[JOIN-GAME] Socket unido a sala ${roomCode}`);

        // Notificar al cliente con los jugadores existentes
        const playerList = Object.keys(game.players);
        console.log(`[JOIN-GAME] Enviando game-joined a ${playerName}. Sala tiene ${playerList.length} jugadores`);
        
        socket.emit('game-joined', {
            roomCode,
            playerId: socket.id,
            gameState: game,
            existingPlayers: game.players
        });

        // Notificar a TODOS (incluyendo el que se acaba de unir) quiénes están en la sala
        const updatedPlayers = Object.entries(game.players).map(([id, p]) => ({
            id: p.id,
            name: p.name
        }));
        
        console.log(`[JOIN-GAME] Emitiendo players-list a TODOS en ${roomCode}`);
        const playersPayload = {
            roomCode,
            players: updatedPlayers,
            totalPlayers: playerList.length
        };
        io.to(roomCode).emit('players-list-updated', playersPayload);
        // Redundancia: emitir directo a cada socket por si io.to() falla
        for (const pid of Object.keys(game.players)) {
            io.to(pid).emit('players-list-updated', playersPayload);
        }

        // Syncronizar estado completo con TODOS
        for (const [playerId, playerData] of Object.entries(game.players)) {
            // Emitir a cada jugador en la sala info de todos los otros
            io.to(roomCode).emit('sync-players', {
                players: Object.entries(game.players)
                    .filter(([id]) => id !== playerId) // Los otros
                    .map(([id, p]) => ({ id, name: p.name }))
            });
        }
        
        console.log(`[SALA ${roomCode}] ${playerName} unido. Total: ${playerList.length}. Jugadores: ${playerList.join(', ')}`);
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
        console.log(`[WARMUP] Recibido enter-warmup de ${socket.id} para sala ${roomCode}`);
        
        if (games[roomCode]) {
            const playerCount = Object.keys(games[roomCode].players).length;
            console.log(`[WARMUP] Sala tiene ${playerCount} jugadores:`, Object.keys(games[roomCode].players));
            
            games[roomCode].state = 'WARMUP';
            
            // Notificar a TODOS en la sala (incluyendo quien presionó)
            console.log(`[WARMUP] Emitiendo warmup-started a ${playerCount} jugadores`);
            const warmupPayload = {
                roomCode,
                warmupMode: true,
                totalPlayers: playerCount
            };
            io.to(roomCode).emit('warmup-started', warmupPayload);
            // Redundancia: emitir directo a cada socket
            for (const pid of Object.keys(games[roomCode].players)) {
                io.to(pid).emit('warmup-started', warmupPayload);
            }
            console.log(`[WARMUP] ✅ Emitido`);
            
            console.log(`[SALA ${roomCode}] Warmup iniciado con ${playerCount} jugadores`);
        } else {
            console.log(`[ERROR] Sala ${roomCode} no existe`);
        }
    });

    // Evento: Iniciar partida
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        console.log(`[START-GAME] Recibido desde ${socket.id} para sala: ${roomCode}`);
        
        if (!games[roomCode]) {
            console.log(`[ERROR] Sala ${roomCode} no existe`);
            socket.emit('error', { message: 'Sala no encontrada' });
            return;
        }
        
        if (!games[roomCode].players[socket.id]) {
            console.log(`[ERROR] Jugador ${socket.id} no está en la sala ${roomCode}`);
            socket.emit('error', { message: 'No eres parte de esta sala' });
            return;
        }
        
        games[roomCode].state = 'PLAYING';
        games[roomCode].seed = Math.random();
        games[roomCode].level = games[roomCode].level || 1;
        
        console.log(`[SALA ${roomCode}] Emitiendo game-started a ${Object.keys(games[roomCode].players).length} jugadores`);
        
        // Notificar a todos en la sala
        const startPayload = {
            roomCode,
            seed: games[roomCode].seed,
            level: games[roomCode].level
        };
        io.to(roomCode).emit('game-started', startPayload);
        // Redundancia: emitir directo a cada socket
        for (const pid of Object.keys(games[roomCode].players)) {
            io.to(pid).emit('game-started', startPayload);
        }
        
        console.log(`[SALA ${roomCode}] ¡Partida iniciada! ${Object.keys(games[roomCode].players).length} jugadores en nivel ${games[roomCode].level}`);
    });

    // Evento: Cambio de nivel
    socket.on('level-change', (data) => {
        const { roomCode, level } = data;
        
        if (games[roomCode]) {
            games[roomCode].level = level;
            games[roomCode].state = 'PLAYING';
            games[roomCode].seed = Math.random(); // Nueva semilla para generación
            
            // Revivir a todos los jugadores muertos
            for (const [pid, p] of Object.entries(games[roomCode].players)) {
                p.alive = true;
                p.hp = p.maxHp;
                p.shield = p.maxShield;
            }
            
            io.to(roomCode).emit('level-changed', {
                level,
                seed: games[roomCode].seed
            });
            
            console.log(`[SALA ${roomCode}] Nivel cambió a ${level} - todos revividos`);
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

app.get('/api/version', (req, res) => {
    res.json({ version: SERVER_VERSION, timestamp: new Date().toISOString() });
});

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
