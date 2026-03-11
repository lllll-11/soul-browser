// Configuración del servidor según el entorno
let SERVER_URL = 'https://soul-browser-backend.onrender.com'; // Default para desarrollo local

// Si estamos en producción (Netlify), usar la URL de Render
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Cambiar esta URL a tu servidor de Render
    SERVER_URL = 'https://soul-browser-backend.onrender.com';
}

console.log('🎮 Conectando a:', SERVER_URL);
