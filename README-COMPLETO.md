# 🚀 CatemuConecta - Sistema Completo con WhatsApp Bot + IA

## 🎯 Descripción General

**CatemuConecta** es un sistema integral de participación ciudadana que incluye:
- 🤖 **Bot de WhatsApp** con IA (Anthropic Claude)
- 🌐 **Portal Web Ciudadano** para reportes
- 📊 **Dashboard Municipal** con métricas en tiempo real
- 🔔 **Notificaciones en tiempo real** (Socket.IO)
- 📄 **Exportación de reportes** (PDF/Excel)
- 🧠 **Análisis inteligente** con IA

## ⚡ Inicio Rápido (3 minutos)

### Opción 1: Script Todo-en-Uno
```bash
# Iniciar TODO el sistema con un comando
./start-catemu-complete.sh
```

### Opción 2: Iniciar componentes individualmente
```bash
# Terminal 1 - Backend
cd backend
node server-enhanced.js

# Terminal 2 - Web App
cd web-app
npm start

# Terminal 3 - Dashboard
cd dashboard
PORT=3002 npm start

# Terminal 4 - WhatsApp Bot
cd whatsapp-bot
node index.js
```

## 🔧 Configuración

### 1. Configurar WhatsApp Bot

Edita `whatsapp-bot/.env`:
```env
# IMPORTANTE: Reemplaza con tu API key de Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-TU-KEY-AQUI

# Números de administradores (separados por coma)
ADMIN_NUMBERS=56912345678,56987654321
```

### 2. Obtener API Key de Anthropic

1. Ve a https://console.anthropic.com
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys"
4. Crea una nueva key
5. Cópiala en el archivo `.env`

### 3. Configurar Backend (opcional)

Edita `backend/.env`:
```env
PORT=3001
DATABASE_PATH=../database/catemu.db
N8N_WEBHOOK_URL=http://localhost:5678/webhook/report-created
```

## 📱 Flujo del Bot de WhatsApp

### Conectar WhatsApp
1. Inicia el bot: `cd whatsapp-bot && node index.js`
2. Escanea el código QR con WhatsApp
3. ¡Listo! El bot está activo

### Comandos del Bot
- **Menú principal**: Envía "Hola" o "Menu"
- **Reportar problema**: Opción 1 o escribe "reportar"
- **Consultar estado**: `/estado CAT-2025-0847`
- **Ver estadísticas**: `/stats`
- **Ayuda**: `/ayuda`

### Flujo de Reporte por WhatsApp

```
Usuario: Hola
Bot: 👋 ¡Hola! Soy el asistente de CatemuConecta
     1️⃣ Reportar un problema
     2️⃣ Consultar estado
     3️⃣ Encuestas
     4️⃣ Información

Usuario: 1
Bot: Describe el problema...

Usuario: Hay un bache grande en calle principal
Bot: 🤖 Análisis automático:
     Categoría: Baches ✓
     Prioridad: Alta
     ¿Es correcto?

Usuario: Sí
Bot: 📍 Comparte la ubicación...

Usuario: [Envía ubicación]
Bot: ¿Deseas enviar una foto?

Usuario: [Envía foto]
Bot: ✅ Reporte registrado!
     ID: CAT-2025-0847
     Tiempo estimado: 48-72 horas
```

## 🎨 Características del Sistema

### Bot de WhatsApp con IA
- ✅ Conversación natural con Claude AI
- ✅ Categorización automática de reportes
- ✅ Análisis de imágenes
- ✅ Detección de urgencia
- ✅ Respuestas contextuales
- ✅ Manejo de ubicaciones
- ✅ Notificaciones automáticas

### Dashboard Municipal Mejorado
- ✅ Notificaciones en tiempo real
- ✅ Widget de conversaciones WhatsApp
- ✅ Exportación a PDF/Excel
- ✅ Métricas de WhatsApp
- ✅ Alertas de reportes urgentes
- ✅ Análisis de sentimiento

### Portal Ciudadano
- ✅ Reportes con geolocalización
- ✅ Upload de imágenes
- ✅ Encuestas municipales
- ✅ Seguimiento de reportes
- ✅ Modo anónimo

## 📊 Nuevos Endpoints API

### WhatsApp
```bash
GET /api/whatsapp/conversations    # Conversaciones
GET /api/whatsapp/sessions         # Sesiones activas
GET /api/stats/whatsapp           # Estadísticas WhatsApp
```

### Exportación
```bash
GET /api/export/pdf?from_date=2025-01-01    # Exportar a PDF
GET /api/export/excel?category=baches       # Exportar a Excel
```

### Notificaciones
```bash
POST /api/notifications    # Enviar notificación
```

## 🔄 Arquitectura del Sistema

```
┌─────────────────────────────────────────────┐
│            CIUDADANOS                       │
├─────────────┬───────────┬──────────────────┤
│  WhatsApp   │  Web App  │    QR Codes      │
└──────┬──────┴─────┬─────┴──────────────────┘
       │            │
       ▼            ▼
┌─────────────────────────────────────────────┐
│         BACKEND API (Socket.IO)             │
│  • Procesamiento de reportes                │
│  • Integración con IA                       │
│  • Notificaciones en tiempo real            │
└─────────────┬───────────────────────────────┘
              │
       ┌──────┴──────┬─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ SQLite   │  │Anthropic │  │Dashboard │
│    DB    │  │  Claude  │  │Municipal │
└──────────┘  └──────────┘  └──────────┘
```

## 🧪 Testing del Sistema

### Test 1: Reporte por WhatsApp
```bash
# Envía mensaje al bot
"Hola, hay un semáforo dañado en la esquina de la escuela"

# El bot debe:
1. Categorizar como "seguridad" o "tránsito"
2. Marcar como prioridad "alta" (por la escuela)
3. Solicitar ubicación
4. Generar número de reporte
```

### Test 2: Notificación en Tiempo Real
```bash
# Crear reporte urgente
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "incidencia",
    "category": "seguridad",
    "description": "Problema urgente de prueba",
    "priority": "urgente",
    "location": "{}",
    "contact_info": "{}"
  }'

# Verificar en dashboard que aparece alerta
```

### Test 3: Exportación
```bash
# Exportar reportes a PDF
curl http://localhost:3001/api/export/pdf > reportes.pdf

# Exportar a Excel
curl http://localhost:3001/api/export/excel > reportes.xlsx
```

## 🚀 Demo para la Hackaton

### Preparación (5 min antes)
1. Ejecutar `./start-catemu-complete.sh`
2. Conectar WhatsApp (escanear QR)
3. Abrir dashboard en navegador
4. Preparar teléfono con WhatsApp

### Guión de Demo (10 min)

**1. Introducción (1 min)**
- Problema: Solo 2% participación ciudadana
- Solución: Sistema multicanal con IA

**2. Demo WhatsApp (3 min)**
- Enviar mensaje "Hola"
- Reportar un bache con foto
- Mostrar categorización automática
- Recibir confirmación

**3. Dashboard Municipal (3 min)**
- Ver reporte en tiempo real
- Mostrar alertas urgentes
- Exportar reportes a Excel
- Widget de WhatsApp

**4. Portal Ciudadano (2 min)**
- Crear reporte web
- Ver mapa interactivo
- Responder encuesta

**5. Cierre (1 min)**
- 100% local y open source
- Escalable a 346 comunas
- Sin vendor lock-in

## 📈 Métricas de Éxito

### KPIs del Sistema
- 🎯 **Participación**: De 2% a 20% en 12 meses
- ⏱️ **Tiempo respuesta**: -50% con IA
- 📊 **Reportes procesados**: 500+/mes
- 😊 **Satisfacción**: 85%+

### Métricas WhatsApp
- 📱 Usuarios únicos/día
- 💬 Mensajes procesados
- 🤖 Precisión categorización (>90%)
- ⚡ Tiempo respuesta bot (<2 seg)

## 🛠️ Solución de Problemas

### Bot no se conecta
```bash
# Limpiar sesión
rm -rf whatsapp-bot/sessions/*
# Reiniciar bot
cd whatsapp-bot && node index.js
```

### Error de API Key
```bash
# Verificar .env
cat whatsapp-bot/.env | grep ANTHROPIC
# Debe mostrar tu key, no "YOUR-KEY-HERE"
```

### Puerto en uso
```bash
# Ver qué usa el puerto
lsof -i:3001
# Matar proceso
kill -9 [PID]
```

## 🏆 Ventajas Competitivas

1. **IA Local**: Procesamiento inteligente sin depender de cloud
2. **WhatsApp Nativo**: Canal que todos usan
3. **Open Source**: Sin costos de licencia
4. **Tiempo Real**: Notificaciones instantáneas
5. **Exportación**: Reportes profesionales
6. **Escalable**: Arquitectura para crecer

## 📞 Soporte

- **Durante hackaton**: Juan Rivera
- **GitHub Issues**: [Reportar problemas]
- **Documentación**: README.md, DEMO.md
- **Email**: jnrivera@uc.cl

## 🎉 ¡Listo para Ganar!

```
 ██████╗ █████╗ ████████╗███████╗███╗   ███╗██╗   ██╗
██╔════╝██╔══██╗╚══██╔══╝██╔════╝████╗ ████║██║   ██║
██║     ███████║   ██║   █████╗  ██╔████╔██║██║   ██║
██║     ██╔══██║   ██║   ██╔══╝  ██║╚██╔╝██║██║   ██║
╚██████╗██║  ██║   ██║   ███████╗██║ ╚═╝ ██║╚██████╔╝
 ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝     ╚═╝ ╚═════╝ 
    ██████╗ ██████╗ ███╗   ██╗███████╗ ██████╗████████╗ █████╗ 
   ██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗
   ██║     ██║   ██║██╔██╗ ██║█████╗  ██║        ██║   ███████║
   ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║        ██║   ██╔══██║
   ╚██████╗╚██████╔╝██║ ╚████║███████╗╚██████╗   ██║   ██║  ██║
    ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝
```

---
*Desarrollado con ❤️ para la Hackaton "Municipios a la VanguardIA" - Agosto 2025*