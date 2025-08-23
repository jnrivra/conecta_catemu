# 📡 API REST - DOCUMENTACIÓN COMPLETA

## 🔗 Base URL
```
http://localhost:3001/api
```

---

## 🔐 Autenticación
Actualmente sin autenticación (MVP). 
Preparado para JWT en headers: `Authorization: Bearer {token}`

---

## 📋 ENDPOINTS

### 1. REPORTES

#### `POST /api/reports`
Crear nuevo reporte ciudadano

**Request Body:**
```json
{
  "type": "infrastructure|security|environment|services|other",
  "category": "Baches y Pavimento",
  "description": "Descripción detallada del problema",
  "location": {
    "lat": -32.7805,
    "lng": -70.9643,
    "address": "Calle Principal 123"
  },
  "priority": "low|medium|high|urgent",
  "contact_info": {
    "name": "Juan Pérez",
    "phone": "+56912345678",
    "email": "juan@email.com"
  },
  "source": "web|whatsapp|qr",
  "department": "obras|seguridad|aseo|otro",
  "image": "multipart/form-data (opcional)"
}
```

**Response (201):**
```json
{
  "id": "CAT-2025-1234",
  "message": "Reporte creado exitosamente",
  "status": "pending",
  "created_at": "2025-08-23T12:00:00Z"
}
```

---

#### `GET /api/reports`
Listar todos los reportes

**Query Parameters:**
- `status`: pending|in_progress|completed|rejected
- `type`: infrastructure|security|environment|services|other
- `priority`: low|medium|high|urgent
- `from`: fecha inicio (YYYY-MM-DD)
- `to`: fecha fin (YYYY-MM-DD)
- `limit`: número de resultados (default: 100)
- `offset`: paginación

**Response (200):**
```json
{
  "reports": [
    {
      "id": "CAT-2025-1234",
      "type": "infrastructure",
      "category": "Baches y Pavimento",
      "description": "Bache en calle principal",
      "status": "pending",
      "priority": "high",
      "location": {...},
      "created_at": "2025-08-23T12:00:00Z",
      "updated_at": "2025-08-23T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 100
}
```

---

#### `GET /api/reports/:id`
Obtener reporte específico

**Response (200):**
```json
{
  "id": "CAT-2025-1234",
  "type": "infrastructure",
  "category": "Baches y Pavimento",
  "description": "Descripción completa...",
  "status": "pending",
  "priority": "high",
  "location": {
    "lat": -32.7805,
    "lng": -70.9643,
    "address": "Calle Principal 123"
  },
  "contact_info": {...},
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2025-08-23T12:00:00Z",
      "user": "Sistema"
    }
  ],
  "attachments": ["image1.jpg"],
  "created_at": "2025-08-23T12:00:00Z"
}
```

---

#### `PATCH /api/reports/:id`
Actualizar estado del reporte

**Request Body:**
```json
{
  "status": "in_progress|completed|rejected",
  "notes": "Notas del funcionario",
  "department": "obras",
  "assigned_to": "Juan Funcionario"
}
```

**Response (200):**
```json
{
  "message": "Reporte actualizado",
  "status": "in_progress"
}
```

---

#### `DELETE /api/reports/:id`
Eliminar reporte (soft delete)

**Response (200):**
```json
{
  "message": "Reporte eliminado"
}
```

---

### 2. ANALYTICS

#### `GET /api/analytics`
Obtener métricas del sistema

**Query Parameters:**
- `period`: day|week|month|year
- `from`: fecha inicio
- `to`: fecha fin

**Response (200):**
```json
{
  "summary": {
    "total_reports": 1234,
    "pending": 45,
    "in_progress": 23,
    "completed": 1166,
    "avg_resolution_time": "48 hours"
  },
  "by_type": {
    "infrastructure": 456,
    "security": 234,
    "environment": 345,
    "services": 199
  },
  "by_priority": {
    "urgent": 12,
    "high": 45,
    "medium": 234,
    "low": 943
  },
  "trends": {
    "daily": [...]
  }
}
```

---

### 3. GAMIFICACIÓN

#### `GET /api/gamification/points/:userId`
Obtener puntos de usuario

**Response (200):**
```json
{
  "user_identifier": "+56912345678",
  "total_points": 350,
  "level": 3,
  "badges": ["first_report", "consistent_reporter"],
  "next_level_points": 500,
  "ranking": 12
}
```

---

#### `POST /api/gamification/redeem`
Canjear recompensa

**Request Body:**
```json
{
  "user_identifier": "+56912345678",
  "reward_id": "coffee_voucher",
  "points_to_spend": 100
}
```

**Response (200):**
```json
{
  "success": true,
  "reward": {
    "id": "coffee_voucher",
    "name": "Café gratis",
    "code": "CAFE2025"
  },
  "remaining_points": 250
}
```

---

### 4. BOT DE WHATSAPP

#### `GET /api/bot/status`
Estado del bot

**Response (200):**
```json
{
  "isRunning": true,
  "isConnected": true,
  "phone": "+56912345678",
  "uptime": "2 hours",
  "messages_processed": 145
}
```

---

#### `POST /api/bot/webhook/message`
Webhook para mensajes entrantes

**Request Body:**
```json
{
  "chat_id": "56912345678@s.whatsapp.net",
  "sender_number": "56912345678",
  "sender_name": "Juan Pérez",
  "message_type": "text|image|location",
  "message_content": "Hay un problema en mi calle",
  "direction": "incoming|outgoing",
  "timestamp": "2025-08-23T12:00:00Z"
}
```

**Response (200):**
```json
{
  "received": true,
  "processed": true,
  "action": "report_created",
  "report_id": "CAT-2025-1234"
}
```

---

#### `GET /api/bot/templates`
Obtener plantillas de respuesta

**Response (200):**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Saludo",
      "trigger_keywords": "hola,buenos días",
      "response_text": "¡Hola! Soy el asistente de Catemu...",
      "category": "greeting"
    }
  ]
}
```

---

### 5. EXPORTACIÓN

#### `GET /api/export/excel`
Exportar reportes a Excel

**Query Parameters:**
- Mismos que GET /api/reports

**Response (200):**
- Content-Type: application/vnd.openxmlformats
- Archivo Excel descargable

---

#### `GET /api/export/pdf/:id`
Exportar reporte individual a PDF

**Response (200):**
- Content-Type: application/pdf
- Archivo PDF del reporte

---

### 6. ENCUESTAS

#### `GET /api/surveys`
Listar encuestas disponibles

**Response (200):**
```json
{
  "surveys": [
    {
      "id": "satisfaccion-2025",
      "title": "Encuesta de Satisfacción",
      "description": "Ayúdanos a mejorar",
      "questions": [...],
      "points_reward": 50,
      "active": true
    }
  ]
}
```

---

#### `POST /api/surveys/:id/submit`
Enviar respuestas de encuesta

**Request Body:**
```json
{
  "user_identifier": "+56912345678",
  "responses": {
    "q1": "muy_satisfecho",
    "q2": "si",
    "q3": "Excelente servicio"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "points_earned": 50,
  "message": "Gracias por tu participación"
}
```

---

## 🔄 WEBSOCKET EVENTS

### Eventos del servidor → cliente:

#### `new-report`
```json
{
  "id": "CAT-2025-1234",
  "type": "infrastructure",
  "priority": "high",
  "location": {...}
}
```

#### `report-updated`
```json
{
  "id": "CAT-2025-1234",
  "status": "in_progress",
  "updated_by": "funcionario1"
}
```

#### `bot-status-update`
```json
{
  "isConnected": true,
  "messages_today": 45
}
```

### Eventos del cliente → servidor:

#### `join-admin`
Unirse a sala de administradores

#### `join-bot-monitor`
Suscribirse a eventos del bot

---

## 🔒 CÓDIGOS DE ERROR

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Duplicado |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

**Formato de error:**
```json
{
  "success": false,
  "error": "Descripción del error",
  "errors": ["Lista de errores de validación"],
  "code": "ERROR_CODE"
}
```

---

## 🚦 RATE LIMITING

- **Global**: 100 requests/minuto por IP
- **Reports**: 10 creaciones/hora por usuario
- **Bot messages**: 30 mensajes/minuto
- **Exports**: 5 exports/hora

---

## 📝 VALIDACIONES

### Teléfonos chilenos
- Formato: +56912345678
- Regex: `/^(\+?56)?9[0-9]{8}$/`

### RUT
- Formato: 12.345.678-9
- Con validación de dígito verificador

### Coordenadas Catemu
- Lat: -32.75 a -32.80
- Lng: -70.93 a -70.98

---

## 🔧 HEADERS REQUERIDOS

```http
Content-Type: application/json
Accept: application/json
X-API-Version: 1.0
X-Client-Version: 1.0.0
```

---

## 📊 EJEMPLOS CURL

### Crear reporte
```bash
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "infrastructure",
    "category": "Baches",
    "description": "Bache peligroso",
    "priority": "high",
    "location": {
      "lat": -32.7805,
      "lng": -70.9643
    }
  }'
```

### Obtener analytics
```bash
curl http://localhost:3001/api/analytics?period=week
```

### WebSocket connection
```javascript
const socket = io('http://localhost:3001');
socket.emit('join-admin');
socket.on('new-report', (data) => {
  console.log('Nuevo reporte:', data);
});
```

---

*API Version 1.0 - Catemu Conecta*