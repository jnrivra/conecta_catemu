# 🏛️ CatemuConecta - Sistema de Participación Ciudadana con IA

<div align="center">
  
![CatemuConecta](https://img.shields.io/badge/Hackathon-IA%20y%20Municipalidades-blue)
![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-green)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Bot-25D366?logo=whatsapp)
![AI](https://img.shields.io/badge/AI-Powered-purple)

**🏆 Proyecto desarrollado para el Hackathon "Municipios a la VanguardIA 2025"**  
*Ministerio Secretaría General de Gobierno - Chile*

</div>

## 📋 Descripción

CatemuConecta es un sistema integral de participación ciudadana que utiliza Inteligencia Artificial para mejorar la comunicación entre los ciudadanos y la municipalidad de Catemu. El sistema permite reportar problemas urbanos, responder encuestas y obtener información municipal a través de WhatsApp.

## 🌟 Características Principales

### 📱 WhatsApp Bot Inteligente
- **Reportes ciudadanos**: Permite reportar baches, luminarias, basura, etc.
- **Encuestas dinámicas**: Sistema de encuestas con resultados en tiempo real
- **Información municipal**: Horarios, contactos y servicios disponibles 24/7
- **Procesamiento con IA**: Categorización automática de reportes

### 📊 Dashboard de Gestión
- **Visualización en tiempo real**: Estadísticas y métricas actualizadas
- **Gestión de reportes**: Sistema de tickets con priorización automática
- **Análisis de encuestas**: Resultados y gráficos dinámicos
- **Mapa de incidencias**: Geolocalización de problemas reportados

### 🌐 Portal Web Ciudadano
- **Progressive Web App**: Funciona sin conexión
- **Reportes con fotos**: Sistema de carga de imágenes
- **Seguimiento de tickets**: Estado en tiempo real de reportes
- **Responsive Design**: Adaptado para móviles y desktop

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- NPM o Yarn
- WhatsApp Business API o número personal
- SQLite3

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/jnrivra/conecta_catemu.git
cd conecta_catemu
```

2. **Instalar dependencias de todos los módulos**
```bash
# Backend
cd backend && npm install

# Dashboard
cd ../dashboard && npm install

# Web App
cd ../web-app && npm install

# WhatsApp Bot
cd ../whatsapp-bot && npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en `/whatsapp-bot`:
```env
# WhatsApp Bot
BOT_NAME=CatemuConecta
BACKEND_API_URL=http://localhost:3001
ANTHROPIC_API_KEY=tu-api-key-aqui

# Seguridad
SAFE_MODE=true
TEST_NUMBERS=56977965404

# Admin
ADMIN_NUMBERS=56912345678
```

4. **Iniciar todos los servicios**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Dashboard
cd dashboard && npm start

# Terminal 3 - Web App
cd web-app && npm start

# Terminal 4 - WhatsApp Bot
cd whatsapp-bot && npm start
```

## 📱 Uso del WhatsApp Bot

### Comandos Disponibles

1. **Iniciar**: Envía "hola" para ver el menú principal
2. **Opciones del menú**:
   - `1` - Reportar un problema
   - `2` - Ver estado de reportes
   - `3` - Responder encuesta
   - `4` - Información municipal

### Flujo de Reporte
1. Envía `1` o describe directamente el problema
2. Indica la ubicación exacta
3. Opcionalmente envía una foto
4. Recibe número de ticket para seguimiento

### Encuesta de Satisfacción (Hackathon)
La encuesta incluye 6 preguntas sobre la experiencia en el hackathon:
- Rol del participante
- Evaluación de organización
- Valoración de colaboración
- Aporte de IA en municipios
- Calificación del almuerzo
- Satisfacción general

## 🏗️ Arquitectura

```
conecta_catemu/
├── backend/              # API REST y lógica de negocio
│   ├── server.js        # Servidor Express principal
│   ├── database.js      # Configuración SQLite
│   └── surveys-data.js  # Datos de encuestas
│
├── dashboard/           # Panel de administración
│   ├── src/
│   │   ├── App.js      # Componente principal React
│   │   └── App.css     # Estilos del dashboard
│   └── public/
│
├── web-app/            # Portal ciudadano PWA
│   ├── src/
│   │   ├── App.js     # Aplicación React
│   │   └── index.js   # Punto de entrada
│   └── public/
│
├── whatsapp-bot/       # Bot de WhatsApp
│   ├── index.js        # Servidor del bot
│   ├── handlers/       # Manejadores de mensajes
│   │   ├── messageHandler-fixed.js
│   │   └── catemu-responses.js
│   └── services/       # Servicios externos
│       ├── api.js      # Cliente API backend
│       └── anthropic.js # Integración IA
│
├── database/           # Base de datos SQLite
│   └── catemu.db      # BD principal
│
└── docs/              # Documentación adicional
```

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js + Express**: Servidor API REST
- **SQLite3**: Base de datos ligera y portable
- **Multer**: Manejo de archivos e imágenes
- **Axios**: Cliente HTTP

### Frontend
- **React 18**: Interfaces de usuario reactivas
- **Chart.js**: Visualización de datos
- **Leaflet**: Mapas interactivos
- **PWA**: Progressive Web App capabilities

### WhatsApp Bot
- **Baileys**: Librería de WhatsApp Web
- **Claude AI**: Procesamiento de lenguaje natural
- **QR Terminal**: Autenticación por QR

### DevOps
- **Docker**: Containerización (opcional)
- **n8n**: Automatización de workflows
- **GitHub Actions**: CI/CD

## 📊 Base de Datos

### Esquema Principal

#### Tabla: reports
- `id`: UUID único del reporte
- `type`: Tipo de problema
- `description`: Descripción detallada
- `location`: Ubicación (JSON)
- `status`: Estado (pending/in_progress/resolved)
- `priority`: Prioridad (low/medium/high/urgent)
- `whatsapp_number`: Número del reportante

#### Tabla: survey_responses
- `id`: UUID de la respuesta
- `survey_id`: ID de la encuesta
- `respondent_info`: Información del encuestado (JSON)
- `created_at`: Fecha de respuesta

#### Tabla: survey_answers
- `response_id`: ID de la respuesta
- `question_id`: ID de la pregunta
- `answer`: Respuesta del usuario

## 🔒 Seguridad

### Medidas Implementadas
- **Modo Seguro**: Restricción a números de prueba
- **Validación de entrada**: Sanitización de datos
- **Rate Limiting**: Control de spam
- **Encriptación**: Datos sensibles protegidos
- **Logs de auditoría**: Registro de todas las acciones

### Configuración de Seguridad
```javascript
// config/security.js
module.exports = {
  SAFE_MODE: process.env.SAFE_MODE === 'true',
  TEST_NUMBERS: process.env.TEST_NUMBERS?.split(',') || [],
  RATE_LIMIT: 10, // mensajes por minuto
  SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutos
}
```

## 📈 Métricas y Analytics

El sistema recopila las siguientes métricas:
- **Reportes por categoría**: Distribución de tipos de problemas
- **Tiempo de resolución**: Promedio por departamento
- **Participación ciudadana**: Usuarios activos diarios/mensuales
- **Satisfacción**: NPS y ratings de encuestas
- **Cobertura geográfica**: Mapa de calor de reportes

## 🚦 Estados de Reportes

1. **📝 Pendiente**: Reporte recibido, esperando asignación
2. **🔄 En Proceso**: Asignado a departamento, en trabajo
3. **✅ Resuelto**: Problema solucionado
4. **❌ Rechazado**: No procedente o duplicado
5. **⏸️ En Espera**: Requiere recursos adicionales

## 👥 Equipo de Desarrollo

### Desarrolladores
- **Juan Rivera** - Líder Técnico & Arquitecto de Software
- **Equipo Catemu** - Product Owners & Testing

### Colaboradores Municipalidad de Catemu
- Katherina Erazo (DIDECO)
- Estefanía Collao (Administración y Finanzas)
- Diego Galaz (SECPLAC)
- Alejandro Silva Herrera (Informática)

## 📱 Demo en Vivo

### Accesos de Prueba

**WhatsApp Bot**: +569 2046 4349 (Número de demo)

**Dashboard Admin**: http://localhost:3002
- Usuario: admin@catemu.cl
- Contraseña: admin123

**Portal Ciudadano**: http://localhost:3000

## 🛠️ Desarrollo

### Estructura de Branches
- `main`: Producción estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas características
- `hotfix/*`: Correcciones urgentes

### Comandos Útiles

```bash
# Ejecutar tests
npm test

# Linter
npm run lint

# Build producción
npm run build

# Ver logs del bot
tail -f whatsapp-bot/logs/bot.log

# Backup base de datos
sqlite3 database/catemu.db ".backup backup.db"
```

### Agregar Nueva Encuesta

1. Editar `backend/surveys-data.js`:
```javascript
{
  id: 7,
  title: "Nueva Encuesta",
  questions: [
    {
      id: 1,
      type: "rating",
      question: "¿Pregunta?",
      options: ["1", "2", "3", "4", "5"]
    }
  ]
}
```

2. Reiniciar backend:
```bash
cd backend && npm restart
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un issue en GitHub con:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Ambiente (OS, Node version, etc.)

## 📞 Contacto y Soporte

- **Email**: informatica@municatemu.cl
- **WhatsApp Soporte**: +569 2046 4349
- **GitHub Issues**: [https://github.com/jnrivra/conecta_catemu/issues](https://github.com/jnrivra/conecta_catemu/issues)

## 🎯 Roadmap

### Fase 1 - MVP (Completado ✅)
- [x] WhatsApp Bot básico
- [x] Sistema de reportes
- [x] Dashboard administrativo
- [x] Encuestas dinámicas

### Fase 2 - Mejoras (En progreso 🚧)
- [ ] Integración con sistemas municipales
- [ ] Notificaciones push
- [ ] Analytics avanzado
- [ ] Multi-idioma

### Fase 3 - Escalamiento (Futuro 📅)
- [ ] Multi-municipalidad
- [ ] API pública
- [ ] Mobile apps nativas
- [ ] IA predictiva

## 🙏 Agradecimientos

- **Ministerio Secretaría General de Gobierno** por organizar el hackathon
- **Municipalidad de Catemu** por la confianza y colaboración
- **Comunidad Open Source** por las herramientas utilizadas
- **Anthropic** por Claude AI

---

<div align="center">
  
**Desarrollado con ❤️ para mejorar la calidad de vida de los ciudadanos de Catemu**

*Hackathon "Municipios a la VanguardIA" - Agosto 2025*

</div>