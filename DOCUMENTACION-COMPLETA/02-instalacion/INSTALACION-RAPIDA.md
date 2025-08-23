# ⚡ INSTALACIÓN RÁPIDA - 5 MINUTOS

## 📋 Pre-requisitos
- Node.js 18+ 
- Git
- 4GB RAM mínimo
- Puerto 3000, 3001, 3002 libres

---

## 🚀 INSTALACIÓN EXPRESS

### 1️⃣ Clonar y Entrar
```bash
git clone https://github.com/catemu-conecta/catemu-conecta.git
cd catemu-conecta
```

### 2️⃣ Script de Instalación Automática
```bash
chmod +x install-all.sh
./install-all.sh
```

### 3️⃣ Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tu API key de Anthropic (opcional)
```

### 4️⃣ Inicializar Base de Datos
```bash
cd backend
node init-gamification-tables.js
node seed-demo-data.js
cd ..
```

### 5️⃣ Iniciar Todo
```bash
chmod +x start-catemu-complete.sh
./start-catemu-complete.sh
```

---

## ✅ VERIFICACIÓN

Abrir en el navegador:
- http://localhost:3000 - Web App ✓
- http://localhost:3001/api/health - API ✓  
- http://localhost:3002 - Dashboard ✓

---

## 🎮 DEMO AUTOMÁTICA

Para ver el sistema en acción:
```bash
node demo-automatica.js
```

---

## 🔧 COMANDOS ÚTILES

### Iniciar servicios individuales:
```bash
# Backend API
cd backend && npm start

# Web App
cd web-app && npm start

# Dashboard
cd dashboard && npm start

# Bot WhatsApp (requiere QR)
cd whatsapp-bot && npm start
```

### Detener todo:
```bash
pkill -f "node"
```

### Limpiar y reiniciar:
```bash
rm -rf node_modules
rm -rf */node_modules
./install-all.sh
```

---

## 🚨 SOLUCIÓN RÁPIDA DE PROBLEMAS

### Error: Puerto en uso
```bash
# Matar procesos en puertos
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9  
lsof -ti:3002 | xargs kill -9
```

### Error: Permisos
```bash
chmod +x *.sh
chmod 755 backend/database
```

### Error: Módulos no encontrados
```bash
cd [carpeta]
npm install
```

### Error: Base de datos
```bash
cd backend
rm -f database/catemu.db
node init-gamification-tables.js
node seed-demo-data.js
```

---

## 📱 CONFIGURACIÓN WHATSAPP (Opcional)

1. Iniciar bot:
```bash
cd whatsapp-bot
npm start
```

2. Escanear QR con WhatsApp

3. Verificar conexión:
```bash
curl http://localhost:3001/api/bot/status
```

---

## 🎯 LISTO!

Sistema completo funcionando en:
- 📱 Web: http://localhost:3000
- 📊 Dashboard: http://localhost:3002
- 🔧 API: http://localhost:3001
- 📡 WebSocket: ws://localhost:3001

**Tiempo total: < 5 minutos** ⚡