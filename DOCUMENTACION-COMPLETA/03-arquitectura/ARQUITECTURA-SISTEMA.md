# 🏗️ ARQUITECTURA DEL SISTEMA - CATEMU CONECTA

## 📐 DISEÑO GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN                    │
├───────────────┬────────────────┬──────────────┬─────────────┤
│   Web App     │   Dashboard    │  WhatsApp    │  QR Codes   │
│   (React)     │   (React)      │    Bot       │  (Static)   │
└───────┬───────┴────────┬───────┴──────┬───────┴──────┬──────┘
        │                │              │              │
        └────────────────┴──────────────┴──────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                         API GATEWAY                          │
│                    Express.js + Socket.io                    │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Servicios  │     │  Procesamiento   │     │ Integraciones│
│   de Negocio │     │       IA         │     │   Externas   │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ • Reportes   │     │ • Categorización │     │ • WhatsApp   │
│ • Usuarios   │     │ • Priorización   │     │ • Email      │
│ • Gamificación│    │ • Análisis       │     │ • SMS        │
│ • Encuestas  │     │ • Predicción     │     │ • n8n        │
└──────────────┘     └──────────────────┘     └──────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                           │
│                         SQLite                               │
├───────────────────────────────────────────────────────────────┤
│ • reports        • user_points      • bot_messages           │
│ • surveys        • point_activities • bot_config             │
│ • questions      • bot_analytics    • bot_templates          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENTES PRINCIPALES

### 1. Frontend - Web App (Puerto 3000)
**Tecnologías**: React, PWA, Service Workers
**Funciones**:
- Formulario de reportes ciudadanos
- Sistema de encuestas
- Visualización de puntos/gamificación
- Modo offline con sync

**Archivos clave**:
```
web-app/
├── src/components/
│   ├── Report.js       # Formulario de reportes
│   ├── Survey.js       # Sistema de encuestas
│   └── PWAInstaller.js # Instalación PWA
└── public/
    └── service-worker.js # Offline y notificaciones
```

### 2. Frontend - Dashboard (Puerto 3002)
**Tecnologías**: React, Socket.io-client, Chart.js
**Funciones**:
- Visualización de métricas en tiempo real
- Gestión de reportes
- Control del bot de WhatsApp
- Exportación de datos

**Archivos clave**:
```
dashboard/
├── src/components/
│   ├── Dashboard.js    # Panel principal
│   ├── BotManager.js   # Control del bot
│   └── Analytics.js    # Métricas y gráficos
```

### 3. Backend API (Puerto 3001)
**Tecnologías**: Node.js, Express, Socket.io
**Funciones**:
- API RESTful
- WebSocket para tiempo real
- Procesamiento de reportes
- Integración con IA

**Endpoints principales**:
```
POST   /api/reports          # Crear reporte
GET    /api/reports          # Listar reportes
PATCH  /api/reports/:id      # Actualizar estado
GET    /api/analytics        # Métricas
POST   /api/bot/webhook      # Webhook WhatsApp
GET    /api/export/excel     # Exportar Excel
GET    /api/export/pdf/:id   # Exportar PDF
```

### 4. Bot de WhatsApp
**Tecnologías**: Baileys, Node.js
**Funciones**:
- Recepción de mensajes
- Procesamiento con IA
- Respuestas automáticas
- Creación de reportes

**Flujo**:
```
Usuario → WhatsApp → Bot → IA → API → Dashboard
                            ↓
                     Respuesta automática
```

### 5. Base de Datos
**Tecnología**: SQLite
**Esquema principal**:

```sql
-- Reportes ciudadanos
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  type TEXT,
  category TEXT,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT,
  created_at DATETIME,
  resolved_at DATETIME
);

-- Gamificación
CREATE TABLE user_points (
  id INTEGER PRIMARY KEY,
  user_identifier TEXT UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT DEFAULT '[]'
);

-- Mensajes del bot
CREATE TABLE bot_messages (
  id INTEGER PRIMARY KEY,
  chat_id TEXT,
  message_type TEXT,
  message_content TEXT,
  direction TEXT,
  processed BOOLEAN DEFAULT 0
);
```

---

## 🔄 FLUJOS DE DATOS

### Flujo 1: Reporte Web
```
1. Usuario llena formulario
2. PWA envía a API (con retry offline)
3. API valida y sanitiza
4. Guarda en BD
5. Procesa con IA (categorización)
6. Emite evento WebSocket
7. Dashboard recibe notificación
8. Actualiza métricas en tiempo real
```

### Flujo 2: Reporte WhatsApp
```
1. Usuario envía mensaje
2. Bot recibe y loguea
3. IA analiza intención
4. Si es reporte → crea en API
5. Responde al usuario
6. Notifica dashboard
```

### Flujo 3: Gestión Municipal
```
1. Funcionario abre dashboard
2. Ve reportes en tiempo real
3. Asigna departamento
4. Cambia estado
5. Sistema notifica cambios
6. Genera reportes/exporta
```

---

## 🔐 SEGURIDAD

### Implementaciones actuales:
- **Helmet.js**: Headers de seguridad
- **CORS**: Control de origen
- **Rate Limiting**: 100 req/min por IP
- **Validación**: Schemas y sanitización
- **XSS Protection**: Limpieza de inputs
- **SQL Injection**: Prepared statements

### Middleware de validación:
```javascript
// Validación de reportes
validateReport()
// Sanitización global
sanitizeBody()
// Rate limiting
rateLimit(100, 60000)
// Validación chilena
validateChileanPhone()
validateRUT()
```

---

## 🚀 ESCALABILIDAD

### Estrategias implementadas:
1. **Arquitectura modular**: Microservicios independientes
2. **Cache**: Respuestas frecuentes
3. **Async processing**: Colas para IA
4. **Database indexing**: Queries optimizadas
5. **CDN ready**: Assets estáticos

### Preparado para:
- Docker/Kubernetes
- Load balancers
- PostgreSQL migration
- Redis cache
- Message queues (RabbitMQ)

---

## 🔌 INTEGRACIONES

### Actuales:
- WhatsApp (Baileys)
- n8n (workflows)
- Email (nodemailer ready)
- SMS (Twilio ready)

### Futuras:
- Telegram
- Facebook Messenger
- Twitter/X
- Sistemas municipales (SAP, Oracle)
- ChileAtiende

---

## 📊 MONITOREO

### Métricas tracked:
- Reportes por tipo/hora/zona
- Tiempo de resolución
- Satisfacción ciudadana
- Uso del bot
- Performance API

### Herramientas recomendadas:
- PM2 para procesos
- Grafana para visualización
- Prometheus para métricas
- Sentry para errores

---

## 🎯 DECISIONES DE DISEÑO

### ¿Por qué SQLite?
- Simple para MVP
- Cero configuración
- Portable
- Suficiente para 50k reportes/año

### ¿Por qué React?
- Ecosistema maduro
- Comunidad grande
- PWA support nativo
- Reutilización de código

### ¿Por qué Node.js?
- JavaScript unificado
- Async nativo
- Gran ecosistema npm
- WebSockets integrado

### ¿Por qué Baileys?
- No requiere WhatsApp Business API
- Gratuito
- Código abierto
- Multi-device support

---

## 📦 DEPENDENCIAS CRÍTICAS

```json
{
  "backend": {
    "express": "4.18.2",
    "socket.io": "4.8.1",
    "sqlite3": "5.1.6",
    "helmet": "7.1.0",
    "cors": "2.8.5"
  },
  "frontend": {
    "react": "18.2.0",
    "socket.io-client": "4.8.1",
    "axios": "1.6.0"
  },
  "bot": {
    "@whiskeysockets/baileys": "6.5.0",
    "qrcode-terminal": "0.12.0"
  }
}
```

---

## 🔄 CICLO DE DESARROLLO

1. **Local Development**: SQLite + Node
2. **Testing**: Jest + Supertest
3. **Staging**: Docker Compose
4. **Production**: Kubernetes + PostgreSQL
5. **Monitoring**: PM2 + Grafana

---

*Arquitectura diseñada para escalar de 1 a 345 municipios* 🚀