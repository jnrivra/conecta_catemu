# 🎯 Guía de Demostración - CatemuConecta

## Preparación (5 minutos antes)

### 1. Iniciar todos los servicios
```bash
cd /Users/juanrivera/Documents/HACKATON/prototipo

# Opción A: Script automático
./start-all.sh

# Opción B: Manual (4 terminales)
# Terminal 1
cd backend && npm start

# Terminal 2  
cd web-app && npm start

# Terminal 3
cd dashboard && PORT=3002 npm start

# Terminal 4 (opcional)
n8n start
```

### 2. Generar QR Codes
```bash
cd qr-generator
npm run generate
open qr-codes/index.html
```

### 3. Verificar URLs
- ✅ http://localhost:3000 - Web App
- ✅ http://localhost:3002 - Dashboard
- ✅ http://localhost:3001/api/health - API
- ✅ http://localhost:5678 - n8n (opcional)

## 📱 Demo Flujo Ciudadano (3 minutos)

### Escenario 1: Reportar un Bache

1. **Mostrar QR Code**
   - Abrir `qr-codes/index.html`
   - "Imaginen estos QR pegados en paraderos, plazas, edificio municipal"

2. **Escanear o abrir http://localhost:3000**
   - Mostrar página principal
   - "Interfaz simple, 2 opciones claras"

3. **Click en "Reportar Problema"**
   - Seleccionar categoría: **Baches y Pavimento**
   - Siguiente

4. **Describir el problema**
   - Escribir: "Bache peligroso de 50cm en calle principal frente al supermercado. Varios autos han tenido problemas."
   - Opcional: Simular tomar foto
   - Siguiente

5. **Marcar ubicación**
   - Click en el mapa
   - "El ciudadano marca exactamente dónde está"
   - Siguiente

6. **Datos de contacto**
   - Nombre: "María González"
   - Teléfono: "912345678"
   - Enviar

7. **Mostrar confirmación**
   - "Número de referencia para seguimiento"
   - "Tiempo estimado de respuesta"

### Escenario 2: Responder Encuesta (1 minuto)

1. **Volver al inicio**
2. **Click en "Encuestas Activas"**
3. **Responder rápidamente:**
   - Calificación: 4
   - Servicios usados: Seleccionar 2-3
   - Principal problema: Pavimento
   - Siguiente hasta completar
4. **Mostrar confirmación**

## 🖥️ Demo Dashboard Municipal (3 minutos)

### 1. Abrir Dashboard
http://localhost:3002

### 2. Vista General (Tab Resumen)
- **Señalar métricas en tiempo real**
  - "245 reportes resueltos este mes"
  - "15 pendientes que requieren atención"
  
- **Gráficos**
  - "Vemos que Baches es la categoría #1"
  - "Tendencia de últimos 7 días"

### 3. Gestión de Reportes (Tab Reportes)
- **Mostrar tabla de reportes**
- **Filtrar por categoría "Baches"**
- **Cambiar estado de uno a "En proceso"**
  - "El supervisor asigna al equipo de Obras"
  
### 4. Mapa Interactivo (Tab Mapa)
- **Mostrar concentración de problemas**
- **Click en un marcador**
  - "Vemos exactamente dónde está cada problema"
  - "Podemos planificar rutas de trabajo"

## 🤖 Demo IA y Automatización (2 minutos)

### 1. Explicar el flujo
"Cuando llega un reporte, automáticamente:"
1. La IA lo categoriza
2. Determina la prioridad
3. Lo asigna al departamento correcto
4. Si es urgente, envía alerta

### 2. Mostrar n8n (si está corriendo)
- Abrir http://localhost:5678
- Mostrar workflow visual
- "Sin intervención humana para clasificación"

### 3. Crear reporte de prueba urgente
```bash
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "incidencia",
    "description": "Semáforo no funciona en cruce peligroso con escuela",
    "category": "seguridad",
    "location": "{\"lat\": -32.7805, \"lng\": -70.9643}",
    "contact_info": "{\"name\": \"Urgente Test\"}"
  }'
```
- "La IA detecta que es seguridad + escuela = alta prioridad"
- "Se enviaría alerta inmediata al encargado"

## 💡 Puntos Clave para el Pitch (1 minuto)

### Problema que resolvemos
✅ "Solo 2% de participación en cabildos actuales"
✅ "No hay canal digital para reportes"
✅ "Procesamiento manual lento y propenso a errores"

### Nuestra solución
✅ **Accesible**: QR codes, web responsive, múltiples canales
✅ **Inteligente**: IA categoriza y prioriza automáticamente  
✅ **Eficiente**: Dashboard en tiempo real, alertas automáticas
✅ **Escalable**: Open source para 346 comunas de Chile

### Impacto esperado
✅ "De 2% a 20% de participación en 12 meses"
✅ "Reducción 50% tiempo de respuesta"
✅ "100% trazabilidad de reportes"

### Diferenciadores
✅ **100% Local**: Datos en servidor municipal
✅ **Sin vendor lock-in**: Open source
✅ **Costo mínimo**: Solo hosting básico
✅ **Fácil adopción**: Interfaz intuitiva

## 🎬 Cierre Impactante

"Imaginen Catemu donde:"
- 🏘️ "Cada vecino es un sensor urbano"
- 📱 "Reportar es tan fácil como enviar un WhatsApp"  
- 🤖 "La IA trabaja 24/7 categorizando y priorizando"
- 📊 "El municipio ve todo en tiempo real"
- 🇨🇱 "Y este modelo se replica en todo Chile"

"**CatemuConecta: Transformando quejas en soluciones**"

## ⚠️ Troubleshooting Rápido

### Si algo falla:

**Backend no responde:**
```bash
cd backend
npm start
```

**Web no carga:**
```bash
cd web-app  
npm start
```

**Dashboard vacío:**
- Verificar que backend esté corriendo
- Crear datos de prueba:
```bash
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{"type":"test","description":"Test","category":"otros","location":"{}","contact_info":"{}"}'
```

## 📝 Notas para el Presentador

- **Mantener ritmo ágil** - Total 10 minutos máximo
- **Enfocarse en el impacto** más que en técnica
- **Tener backup** - Screenshots por si falla algo
- **Involucrar al jurado** - "¿Han experimentado este problema?"
- **Sonreír y proyectar confianza** 😊

---
¡Éxito en la presentación! 🚀