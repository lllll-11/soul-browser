# 🎮 Soul Browser - Guía de Juego Multijugador

## Configuración Rápida

### 1. Iniciar el Servidor
El servidor ya está ejecutándose en `http://localhost:3000`

Si necesitas reiniciarlo, usa:
```bash
npm start
```

### 2. Acceder al Juego
- Abre tu navegador en: **http://localhost:3000**
- Presiona el botón **"MULTIJUGADOR EN LÍNEA"**
- Ingresa tu nombre de jugador
- Presiona **"CONECTAR"**

## Características Multijugador

✅ **Jugadores en Tiempo Real**
- Ver a otros jugadores conectados en la misma sala
- Sus posiciones se sincronizan en vivo
- Nombres mostrados arriba de cada jugador

✅ **Estadísticas Compartidas**
- HP, escudo y energía de otros jugadores
- Enemigos y balas sincronizados
- Niveles compartidos

✅ **Sistema de Salas**
- Automáticamente se agrupan en la sala "main-lobby"
- Máx. de jugadores ilimitado

## Controles

- **WASD** - Movimiento
- **Click Izquierdo** - Disparar
- **Click Derecho / Espacio** - Dash
- **Q** - Cambiar arma
- **E** - Interactuar

## Información Técnica

### Servidor
- **Node.js** Express + Socket.IO
- **Puerto**: 3000
- **Archivo**: `server.js`
- **Dependencias**: express, socket.io, cors

### Cliente
- Juego totalmente en el navegador (HTML5 Canvas)
- Socket.IO client integrado
- Sincronización cada 3 frames
- Latencia típica: 30-100ms

## Eventos Socket.IO

El servidor maneja:
- `join-game` - Unirse a una sala
- `player-move` - Sincronizar posición
- `player-shoot` - Disparos
- `player-update` - Estado (HP, energía, etc)
- `level-change` - Cambio de nivel
- `game-over` - Fin del juego

## Despliegue en Netlify + Railway/Render

Para hacer el juego completamente online:

1. **Frontend (Netlify)**
   - Sube `index.html` a Netlify
   - Configura URL del servidor

2. **Backend (Railway/Render)**
   - Sube `server.js` y `package.json`
   - Railway/Render ejecutan `npm start`
   - Conseguirás una URL pública del servidor

3. **Modifica `server-url` en el HTML**
   - Cambiar de `http://localhost:3000` a tu URL pública

## Troubleshooting

**"No se pudo conectar al servidor"**
- Asegúrate que `npm start` está ejecutándose
- Verifica que el puerto 3000 está disponible
- En firewalls/routers, abre el puerto 3000

**Los jugadores no se ven**
- Recarga la página
- Verifica la consola del navegador (F12)
- Reinicia el servidor

**Lag excesivo**
- Reduce la tasa de actualización en `gameLoop`
- Usa un servidor más cercano geográficamente

---

¡Bienvenido a Soul Browser Multijugador! 🚀
