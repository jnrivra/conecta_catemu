# 🏠 DESPLIEGUE LOCAL - GUÍA COMPLETA

## 📋 Requisitos Mínimos

### Hardware
- **CPU**: 2 cores mínimo
- **RAM**: 4GB (8GB recomendado)
- **Disco**: 2GB libres
- **Red**: Conexión a internet

### Software
- **OS**: Linux, macOS o Windows 10+
- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **Git**: v2.0 o superior
- **SQLite3**: Incluido con Node

---

## 🚀 INSTALACIÓN PASO A PASO

### 1. Clonar Repositorio
```bash
git clone https://github.com/catemu-conecta/catemu-conecta.git
cd catemu-conecta
```

### 2. Instalación Automática
```bash
chmod +x install-all.sh
./install-all.sh
```

### 3. Configuración Manual (si automática falla)

#### Backend
```bash
cd backend
npm install
node init-gamification-tables.js
node seed-demo-data.js
cd ..
```

#### Web App
```bash
cd web-app
npm install
cd ..
```

#### Dashboard
```bash
cd dashboard
npm install
cd ..
```

#### WhatsApp Bot (opcional)
```bash
cd whatsapp-bot
npm install
cd ..
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno (.env)
```env
# Backend
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database/catemu.db

# WhatsApp Bot (opcional)
BOT_NAME=CatemuConecta
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Frontend URLs
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001

# n8n (opcional)
N8N_SECURE_COOKIE=false
N8N_PORT=5678
```

### Configuración de Puertos
Si necesitas cambiar puertos:

1. **Backend** (`backend/server-enhanced.js`):
```javascript
const PORT = process.env.PORT || 3001;
```

2. **Web App** (`web-app/package.json`):
```json
"scripts": {
  "start": "PORT=3000 react-scripts start"
}
```

3. **Dashboard** (`dashboard/package.json`):
```json
"scripts": {
  "start": "PORT=3002 react-scripts start"
}
```

---

## 🔧 INICIAR SERVICIOS

### Opción 1: Todo Automático
```bash
chmod +x start-complete.sh
./start-complete.sh
```

### Opción 2: Servicios Individuales

#### Terminal 1 - Backend
```bash
cd backend
npm start
# o para desarrollo:
npm run dev
```

#### Terminal 2 - Web App
```bash
cd web-app
npm start
```

#### Terminal 3 - Dashboard
```bash
cd dashboard
npm start
```

#### Terminal 4 - Bot WhatsApp (opcional)
```bash
cd whatsapp-bot
npm start
# Escanear QR con WhatsApp
```

---

## ✅ VERIFICACIÓN

### 1. Verificar Servicios
```bash
# API Health Check
curl http://localhost:3001/api/health

# Verificar puertos
lsof -i :3000  # Web App
lsof -i :3001  # Backend
lsof -i :3002  # Dashboard
```

### 2. Test Manual
1. Abrir http://localhost:3000
2. Crear un reporte de prueba
3. Verificar en http://localhost:3002
4. Confirmar notificación en tiempo real

### 3. Test Automático
```bash
node test-report-creation.js
```

---

## 🎮 DEMO Y PRUEBAS

### Demo Automática
```bash
node demo-automatica.js
```
Crea reportes y actividad cada 5-10 segundos.

### Cargar Datos de Prueba
```bash
cd backend
node seed-demo-data.js
```

### Limpiar Base de Datos
```bash
sqlite3 database/catemu.db
> DELETE FROM reports;
> DELETE FROM user_points;
> DELETE FROM bot_messages;
> .quit
```

---

## 🔍 MONITOREO

### Logs en Tiempo Real
```bash
# Backend
tail -f backend/logs/app.log

# Todos los servicios
tail -f logs/*.log
```

### Métricas del Sistema
```bash
# Uso de CPU y memoria
top -p $(pgrep -d',' node)

# Conexiones activas
netstat -an | grep -E ':(3000|3001|3002)'

# WebSocket connections
lsof -i :3001 | grep ESTABLISHED
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Puerto en Uso
```bash
# Error: EADDRINUSE
lsof -ti:3001 | xargs kill -9
```

### Módulos No Encontrados
```bash
rm -rf node_modules package-lock.json
npm install
```

### Base de Datos Bloqueada
```bash
# Error: SQLITE_BUSY
rm database/catemu.db-journal
# o reiniciar servicios
```

### WebSocket No Conecta
```bash
# Verificar CORS en backend
# server-enhanced.js debe tener:
cors({
  origin: ["http://localhost:3000", "http://localhost:3002"],
  credentials: true
})
```

### React App No Compila
```bash
# Limpiar cache
rm -rf node_modules/.cache
npm start
```

---

## 🔐 SEGURIDAD LOCAL

### Firewall (opcional)
```bash
# Permitir solo localhost
sudo ufw allow from 127.0.0.1 to any port 3000
sudo ufw allow from 127.0.0.1 to any port 3001
sudo ufw allow from 127.0.0.1 to any port 3002
```

### HTTPS Local (opcional)
```bash
# Generar certificado
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurar en backend
const https = require('https');
const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);
```

---

## 🔄 ACTUALIZACIÓN

### Actualizar Código
```bash
git pull origin main
npm install  # en cada carpeta
```

### Migrar Base de Datos
```bash
cd backend
node migrate-database.js  # si existe
```

### Reiniciar Servicios
```bash
./stop-all.sh
./start-complete.sh
```

---

## 💾 BACKUP

### Backup Manual
```bash
# Base de datos
cp database/catemu.db backups/catemu-$(date +%Y%m%d).db

# Configuración
cp .env backups/.env-$(date +%Y%m%d)

# Uploads
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
```

### Backup Automático
```bash
# Agregar a crontab
0 2 * * * /path/to/backup-catemu.sh
```

---

## 📊 PERFORMANCE

### Optimización Node.js
```bash
# Aumentar memoria
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Cluster mode
pm2 start backend/server.js -i max
```

### Optimización SQLite
```sql
-- Índices recomendados
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_type ON reports(type);
```

---

## 🚀 PM2 (Producción Local)

### Instalar PM2
```bash
npm install -g pm2
```

### Configuración
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'catemu-backend',
    script: 'backend/server-enhanced.js',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }, {
    name: 'catemu-webapp',
    script: 'serve',
    args: '-s web-app/build -l 3000',
    autorestart: true
  }, {
    name: 'catemu-dashboard',
    script: 'serve',
    args: '-s dashboard/build -l 3002',
    autorestart: true
  }]
};
```

### Iniciar con PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # auto-inicio
```

---

## 📱 ACCESO REMOTO (Red Local)

### Exponer en Red Local
```bash
# Obtener IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Acceder desde otros dispositivos:
# http://192.168.1.100:3000
```

### ngrok (Túnel Público)
```bash
# Instalar ngrok
npm install -g ngrok

# Exponer servicios
ngrok http 3000  # Web App
ngrok http 3001  # API
```

---

## 🎯 CHECKLIST FINAL

- [ ] Node.js 18+ instalado
- [ ] Dependencias instaladas
- [ ] Base de datos inicializada
- [ ] Servicios corriendo
- [ ] Web App accesible
- [ ] Dashboard accesible
- [ ] API respondiendo
- [ ] WebSocket conectado
- [ ] Demo automática funciona
- [ ] Logs sin errores

---

*¡Sistema listo para desarrollo y pruebas locales! 🚀*