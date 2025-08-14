# 🏛️ CatemuConecta - Sistema de Participación Ciudadana con IA

<div align="center">
  <img src="https://img.shields.io/badge/Estado-MVP%20Funcional-green" alt="Estado">
  <img src="https://img.shields.io/badge/Licencia-MIT-blue" alt="Licencia">
  <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node">
  <img src="https://img.shields.io/badge/React-18.2-61dafb" alt="React">
  <img src="https://img.shields.io/badge/SQLite-3-003B57" alt="SQLite">
</div>

## 📋 Descripción

CatemuConecta es un sistema open source de participación ciudadana desarrollado para la **Hackaton "Municipios a la VanguardIA"**. Permite a los ciudadanos reportar problemas urbanos y responder encuestas municipales de manera fácil e intuitiva, mientras que proporciona a las municipalidades herramientas de gestión y análisis en tiempo real.

### 🎯 Características Principales

- **📱 Portal Ciudadano**: Interfaz web responsive para reportes y encuestas
- **📊 Dashboard Municipal**: Panel de control para gestión y análisis
- **📍 Geolocalización**: Ubicación precisa de reportes con mapas interactivos
- **📸 Soporte Multimedia**: Upload de imágenes para documentar reportes
- **🤖 IA Local**: Procesamiento inteligente y categorización automática (próximamente)
- **📈 Métricas en Tiempo Real**: Estadísticas y análisis de datos
- **🔐 Privacidad**: Opción de reportes anónimos

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Git

### Instalación en 3 Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/jnrivra/catconecta.git
cd catconecta

# 2. Dar permisos de ejecución al script
chmod +x start-all.sh

# 3. Iniciar la aplicación (instala dependencias automáticamente)
./start-all.sh
```

La aplicación estará disponible en:
- 🌐 **Portal Ciudadano**: http://localhost:3000
- 📊 **Dashboard Municipal**: http://localhost:3002
- 🔧 **API Backend**: http://localhost:3001

## 📁 Estructura del Proyecto

```
catconecta/
├── backend/              # API REST y lógica de negocio
│   ├── server.js        # Servidor Express principal
│   ├── database.js      # Configuración SQLite
│   └── surveys-data.js  # Datos de encuestas
├── web-app/             # Portal ciudadano (React)
│   └── src/
│       └── components/  # Componentes React
├── dashboard/           # Panel municipal (React)
│   └── src/
│       └── components/  # Componentes del dashboard
├── database/            # Base de datos SQLite
│   └── catemu.db       # Archivo de base de datos
├── n8n-workflows/       # Flujos de automatización
└── start-all.sh        # Script de inicio
```

## 🛠️ Configuración Detallada

### Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Puerto del servidor (opcional, default: 3001)
PORT=3001

# Base de datos (opcional, default: ../database/catemu.db)
DATABASE_PATH=../database/catemu.db

# Configuración de upload (opcional)
MAX_FILE_SIZE=10485760  # 10MB en bytes
UPLOAD_DIR=./uploads

# n8n webhook (opcional)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/report-created

# API Key para IA (opcional - para futura implementación)
CLAUDE_API_KEY=tu_api_key_aqui
```

### Configuración de Puertos

Por defecto:
- Web App: 3000
- Backend: 3001
- Dashboard: 3002

Para cambiar puertos, modifica `start-all.sh` o usa variables de entorno:

```bash
# Para cambiar puerto de la web app
cd web-app && PORT=3005 npm start

# Para cambiar puerto del dashboard
cd dashboard && PORT=3006 npm start

# Para cambiar puerto del backend
cd backend && PORT=3007 npm start
```

## 💻 Guía de Desarrollo

### Estructura de la Base de Datos

```sql
-- Tabla de reportes ciudadanos
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,              -- JSON con lat/lng
    image_path TEXT,            -- Ruta de imagen subida
    contact_info TEXT,          -- JSON con datos de contacto
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'media',
    assigned_to TEXT,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de respuestas de encuestas
CREATE TABLE survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    responses TEXT NOT NULL,     -- JSON con respuestas
    location TEXT,              -- JSON con lat/lng
    respondent_info TEXT,       -- JSON con metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created ON reports(created_at);
```

### API Endpoints Completos

#### 📝 Reportes
```javascript
// Listar todos los reportes con filtros
GET /api/reports?status=pending&category=baches&limit=50

// Crear nuevo reporte
POST /api/reports
Body (multipart/form-data):
{
  "type": "incidencia",
  "category": "baches",
  "description": "Descripción del problema",
  "location": {"lat": -32.7805, "lng": -70.9643},
  "image": File,
  "contact_info": {
    "name": "Juan Pérez",
    "phone": "+56912345678",
    "email": "juan@email.com"
  }
}

// Obtener reporte específico
GET /api/reports/:id

// Actualizar estado de reporte
PATCH /api/reports/:id
Body:
{
  "status": "in_progress",
  "resolution_notes": "Equipo asignado"
}
```

#### 📊 Encuestas
```javascript
// Listar encuestas activas
GET /api/surveys

// Obtener encuesta completa con preguntas
GET /api/surveys/:id

// Enviar respuestas de encuesta
POST /api/surveys/:id/responses
Body:
{
  "responses": [
    {"question_id": "q1", "answer": "Excelente"},
    {"question_id": "q2", "answer": "Opción 1,Opción 3"}
  ],
  "location": {"lat": -32.7805, "lng": -70.9643}
}
```

#### 📈 Estadísticas
```javascript
// Obtener estadísticas generales
GET /api/stats
Response:
{
  "totalReports": 245,
  "pendingReports": 23,
  "completedToday": 5,
  "avgResolutionTime": "72 horas",
  "reportsByCategory": {...},
  "recentReports": [...]
}

// Estado del servidor
GET /api/health
```

### Agregar Nuevas Encuestas

Edita `backend/surveys-data.js`:

```javascript
const surveys = [
  {
    id: 6,
    title: "Evaluación de Transporte Público",
    category: "transporte",
    priority: "alta",
    estimated_time: "5 min",
    question_count: 5,
    description: "Ayúdanos a mejorar el transporte",
    questions: [
      {
        id: "q1",
        type: "rating",  // Tipos: rating, single, multiple, text
        question: "¿Cómo evalúa la frecuencia de buses?",
        options: ["Excelente", "Buena", "Regular", "Mala"],
        required: false
      },
      {
        id: "q2",
        type: "multiple",
        question: "¿Qué problemas ha experimentado?",
        options: [
          "Retrasos frecuentes",
          "Buses llenos",
          "Mal estado de vehículos",
          "Falta de paradas"
        ],
        required: false
      },
      {
        id: "q3",
        type: "text",
        question: "Sugerencias adicionales",
        placeholder: "Escriba sus sugerencias aquí...",
        required: false
      }
    ]
  }
];
```

## 🎨 Personalización para tu Municipio

### 1. Cambiar Nombre y Logo

```javascript
// web-app/src/components/Home.js
// Línea 19-22: Cambiar nombre
<div>
  <h1>MiMuniConecta</h1>  {/* Cambiar aquí */}
  <p>Tu voz importa</p>
</div>

// Línea 11-18: Cambiar logo
<img 
  src="/logo-mi-municipio.png"  // Colocar logo en web-app/public/
  alt="Mi Municipio" 
  className="h-12 w-auto mr-3"
/>
```

### 2. Cambiar Colores y Estilos

```css
/* web-app/src/App.css y dashboard/src/App.css */
:root {
  --primary: #667eea;        /* Color principal */
  --primary-dark: #5a67d8;   /* Color principal oscuro */
  --primary-light: #818cf8;  /* Color principal claro */
  --secondary: #48bb78;      /* Color secundario */
  --success: #48bb78;        /* Verde éxito */
  --warning: #f6ad55;        /* Naranja advertencia */
  --danger: #fc8181;         /* Rojo peligro */
  --info: #4299e1;          /* Azul información */
}
```

### 3. Personalizar Categorías de Reportes

```javascript
// web-app/src/components/Report.js
// Línea 52-63: Modificar categorías
const categories = [
  { id: 'alumbrado', name: 'Alumbrado Público', icon: '💡' },
  { id: 'baches', name: 'Baches y Pavimento', icon: '🚧' },
  { id: 'basura', name: 'Basura y Limpieza', icon: '🗑️' },
  { id: 'transito', name: 'Tránsito y Señalética', icon: '🚦' }, // Nueva
  // Agregar o modificar según necesidad
];
```

## 📱 Generación de Códigos QR

Para crear QR codes para espacios públicos:

```bash
cd qr-generator

# Instalar dependencias (si no lo has hecho)
npm install

# Generar QRs
node generate.js

# Los códigos QR se generarán en qr-generator/qr-codes/
# Abrir qr-codes/index.html para ver todos los QR generados
```

Personalizar URLs en `qr-generator/generate.js`:

```javascript
const qrCodes = [
  {
    name: 'Plaza Principal',
    url: 'https://midominio.cl/report?location=plaza',
    category: 'report'
  },
  {
    name: 'Municipalidad',
    url: 'https://midominio.cl/surveys',
    category: 'survey'
  }
];
```

## 🚢 Despliegue en Producción

### Opción 1: Servidor Local Municipal (Recomendado)

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Crear archivo de configuración
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'catconecta-backend',
      script: 'backend/server.js',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'catconecta-webapp',
      script: 'npm',
      args: 'start',
      cwd: './web-app',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'catconecta-dashboard',
      script: 'npm',
      args: 'start',
      cwd: './dashboard',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# 3. Iniciar con PM2
pm2 start ecosystem.config.js

# 4. Guardar configuración para inicio automático
pm2 save
pm2 startup

# 5. Ver logs
pm2 logs

# 6. Monitorear
pm2 monit
```

### Opción 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar todos los archivos
COPY . .

# Instalar dependencias
RUN cd backend && npm install
RUN cd web-app && npm install
RUN cd dashboard && npm install

# Exponer puertos
EXPOSE 3000 3001 3002

# Iniciar aplicación
CMD ["./start-all.sh"]
```

```bash
# Construir y ejecutar
docker build -t catconecta .
docker run -p 3000:3000 -p 3001:3001 -p 3002:3002 catconecta
```

### Opción 3: Servidor Cloud

Compatible con:
- **Heroku**: Usar buildpacks de Node.js
- **DigitalOcean App Platform**: Despliegue directo desde GitHub
- **AWS EC2**: Usar PM2 o Docker
- **Google Cloud Run**: Containerizar con Docker
- **Azure App Service**: Soporte nativo para Node.js

### Configuración de Dominio y SSL

```nginx
# Configuración Nginx ejemplo
server {
    listen 80;
    server_name catconecta.municatemu.cl;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name catconecta.municatemu.cl;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Portal ciudadano
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
    }
    
    # Dashboard municipal
    location /dashboard {
        proxy_pass http://localhost:3002;
    }
}
```

## 📊 Dashboard Municipal - Guía de Uso

### Acceso al Dashboard

Por defecto sin autenticación (desarrollo). 

Para producción, implementar autenticación básica:

```javascript
// backend/server.js - Agregar después de línea 20
const basicAuth = require('express-basic-auth');

// Solo para rutas del dashboard
app.use('/api/admin/*', basicAuth({
  users: { 
    'admin': 'catemu2025',  // Cambiar credenciales
    'municipio': 'secreto123'
  },
  challenge: true,
  unauthorizedResponse: 'Acceso no autorizado'
}));
```

### Funcionalidades del Dashboard

1. **Vista General**
   - Total de reportes
   - Reportes pendientes
   - Completados hoy
   - Tiempo promedio de resolución

2. **Gestión de Reportes**
   - Filtrar por estado: Pendiente, En proceso, Completado
   - Filtrar por categoría
   - Ver detalles completos
   - Cambiar estado con un clic
   - Ver ubicación en mapa

3. **Mapa Interactivo**
   - Todos los reportes geolocalizados
   - Colores según estado
   - Click para ver detalles

4. **Exportación de Datos**
   ```javascript
   // Agregar botón de exportación
   const exportToCSV = () => {
     // Implementación en dashboard/src/App.js
   };
   ```

## 🔧 Solución de Problemas Comunes

### Puerto en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Matar proceso por PID
kill -9 <PID>

# O matar todos los procesos node
killall node
```

### Error de permisos en base de datos

```bash
# Dar permisos correctos
chmod 644 database/catemu.db
chmod 755 database/

# Si persiste, recrear base de datos
rm database/catemu.db
cd backend && node database.js
```

### Dependencias faltantes o errores de módulos

```bash
# Limpiar y reinstalar todo
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf web-app/node_modules web-app/package-lock.json
rm -rf dashboard/node_modules dashboard/package-lock.json

# Reinstalar
cd backend && npm install && cd ..
cd web-app && npm install && cd ..
cd dashboard && npm install && cd ..
```

### La aplicación no carga en el navegador

```bash
# Verificar que los servicios estén corriendo
curl http://localhost:3001/api/health
curl http://localhost:3000
curl http://localhost:3002

# Ver logs del backend
cd backend && npm start

# Si hay error de CORS, verificar server.js línea 17-19
```

## 📈 Monitoreo y Métricas

### Integración con n8n (Automatización)

1. **Instalar n8n**
   ```bash
   npm install -g n8n
   n8n start
   ```

2. **Importar workflow**
   ```bash
   # Acceder a http://localhost:5678
   # Importar archivo desde n8n-workflows/workflow-new-report.json
   ```

3. **Configurar webhook en backend**
   ```javascript
   // backend/.env
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/report-created
   ```

### Métricas Clave a Monitorear

- **Participación Ciudadana**
  - Usuarios únicos mensuales
  - Reportes por habitante
  - Encuestas completadas

- **Eficiencia Municipal**
  - Tiempo promedio de resolución
  - Reportes resueltos vs pendientes
  - Categorías más reportadas

- **Calidad del Servicio**
  - Satisfacción ciudadana (via encuestas)
  - Reportes recurrentes en misma ubicación
  - Tiempo de primera respuesta

## 🤝 Contribuir al Proyecto

### Cómo Contribuir

1. **Fork el proyecto**
2. **Crear rama para tu feature**
   ```bash
   git checkout -b feature/MiNuevaCaracteristica
   ```
3. **Commit tus cambios**
   ```bash
   git commit -m 'Agregar nueva característica X'
   ```
4. **Push a la rama**
   ```bash
   git push origin feature/MiNuevaCaracteristica
   ```
5. **Abrir Pull Request**

### Guías de Contribución

- Seguir estándares de código existentes
- Agregar tests cuando sea posible
- Actualizar documentación
- Describir claramente los cambios en PR

### Ideas para Contribuir

- [ ] Autenticación de usuarios
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con WhatsApp
- [ ] Dashboard analytics avanzado
- [ ] Exportación a Excel
- [ ] Modo offline
- [ ] Soporte multiidioma

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **Municipalidad de Catemu** - Por la confianza y apoyo
- **Hackaton "Municipios a la VanguardIA"** - Por la oportunidad
- **Anthropic Claude** - Por la asistencia en desarrollo
- **Comunidad Open Source** - Por las herramientas utilizadas

## 📞 Soporte y Contacto

### Para Desarrolladores Municipales

- 📧 Email: jnrivera@uc.cl
- 💬 GitHub Issues: [Reportar problemas aquí](https://github.com/jnrivra/catconecta/issues)
- 📚 Wiki: [Documentación extendida](https://github.com/jnrivra/catconecta/wiki)

### Recursos Adicionales

- [Video Demo](https://youtube.com/watch?v=demo) (próximamente)
- [Presentación del Proyecto](./presentacion-flujo-usuario.html)
- [Manual de Usuario](./docs/manual-usuario.pdf) (próximamente)

---

<div align="center">
  <p><strong>Desarrollado con ❤️ para mejorar la calidad de vida en las comunas de Chile</strong></p>
  <p>Hackaton "Municipios a la VanguardIA" - Agosto 2025</p>
  <p>
    <a href="https://github.com/jnrivra/catconecta">GitHub</a> •
    <a href="https://catconecta.cl">Demo Live</a> •
    <a href="mailto:jnrivera@uc.cl">Contacto</a>
  </p>
</div>
