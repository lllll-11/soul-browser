# 🚀 Guía: Desplegar en Render + Netlify

## Estructura Final

```
soul-browser/
├── index.html           (Frontend - va a Netlify)
├── config.js           (Configuración URL servidor)
├── server.js           (Backend - va a Render)
├── package.json        (Dependencias)
├── Procfile            (Instrucción para Render)
├── .gitignore
└── README.md
```

---

## 📋 PASO 1: Preparar para GitHub

### En tu terminal:

```powershell
cd "c:\Users\agwit\OneDrive\Escritorio\juego online"

# Inicializar repositorio git
git init
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Soul Browser - Multiplayer Game"
```

### Crear repositorio en GitHub:

1. Ve a https://github.com/new
2. Nombre: `soul-browser`
3. Descripción: `Infinite Roguelike Multiplayer Game`
4. **NO** inicialices con README (ya tenemos archivos)
5. Clic en "Create repository"

### Conectar y subir a GitHub:

```powershell
git branch -M main
git remote add origin https://github.com/TU_USUARIO/soul-browser.git
git push -u origin main
```

---

## 🔧 PASO 2: Desplegar Backend en Render

### En Render.com:

1. Abre https://render.com
2. **Sign Up** con GitHub (usa tu cuenta GitHub)
3. Dashboard → "New +" → "Web Service"
4. **Connect Repository**: Busca `soul-browser` y conecta
5. Rellena así:
   - **Name**: `soul-browser-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Free Plan** ✓
6. Clic en "Create Web Service"

### ⏳ Espera 2-3 minutos

Render dirá: `Service is live` ✅

**Copia tu URL de Render:**
```
https://soul-browser-backend.onrender.com
```

---

## 🎨 PASO 3: Actualizar config.js

En tu editor, abre `config.js` y actualiza:

```javascript
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // ⬇️ CAMBIA ESTO A TU URL DE RENDER
    SERVER_URL = 'https://tu-nombre-soul-browser-backend.onrender.com';
}
```

### Commit y Push:

```powershell
git add config.js
git commit -m "Update Render server URL"
git push
```

---

## 🌐 PASO 4: Desplegar Frontend en Netlify

### En Netlify.com:

1. Abre https://app.netlify.com
2. **Sign Up** con GitHub
3. "Add new site" → "Import an existing project"
4. Conecta tu cuenta GitHub
5. Selecciona repositorio `soul-browser`
6. **Deploy Settings**:
   - **Base directory**: (dejar vacío)
   - **Build command**: (dejar vacío)
   - **Publish directory**: (dejar vacío - toma root)
7. Clic en "Deploy site"

### ⏳ Espera 1 minuto

Netlify te da una URL gratuita como:
```
https://soul-browser-12345.netlify.app
```

---

## 🎮 ¡LISTO! Ahora:

1. **Tu amigo abre:**
   ```
   https://soul-browser-12345.netlify.app
   ```

2. **Presiona**: "MULTIJUGADOR EN LÍNEA"

3. **Ingresa su nombre y conecta**

4. **¡Ambos se ven en tiempo real!** 🎯

---

## ✅ Verificar que funciona:

**Prueba local primero:**
```powershell
npm start
# Abre http://localhost:3000
# Abre en 2 pestañas: MULTIJUGADOR
```

**Problemas?**
- Abre Developer Tools (F12)
- Vai a la pestaña Console
- Deberías ver: `🎮 Conectando a: https://...`

---

## 📤 Si cambias algo después:

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

Render y Netlify se actualizan **automáticamente** 🔄

---

## 🔗 URLs Finales:

| Componente | URL |
|-----------|-----|
| **Frontend** | `https://soul-browser-12345.netlify.app` |
| **Backend** | `https://soul-browser-backend.onrender.com` |

**Comparte la URL de Netlify con tus amigos** ✅

---

¿Necesitas ayuda en algún paso?
