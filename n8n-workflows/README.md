# Workflows de n8n para CatemuConecta

## Configuración

1. **Instalar n8n localmente:**
```bash
npm install -g n8n
```

2. **Iniciar n8n:**
```bash
n8n start
```

3. **Acceder a n8n:**
- Abrir navegador en: http://localhost:5678
- Crear cuenta local si es primera vez

## Importar Workflows

1. En n8n, ir a "Workflows" > "Import from File"
2. Seleccionar el archivo JSON del workflow
3. Configurar las credenciales necesarias

## Credenciales Requeridas

### Claude API
1. Ir a Settings > Credentials
2. Crear nueva credencial tipo "Header Auth"
3. Configurar:
   - Name: `x-api-key`
   - Value: `Tu API Key de Claude`

### Email (opcional)
1. Configurar SMTP para envío de alertas
2. Puede usar Gmail, SendGrid, etc.

## Workflows Disponibles

### 1. Process New Report (`workflow-new-report.json`)
- **Trigger:** Webhook POST a `/webhook/new-report`
- **Función:** 
  - Recibe nuevo reporte
  - Categoriza con Claude AI
  - Determina prioridad
  - Envía alerta si es alta prioridad
- **Datos requeridos:**
  ```json
  {
    "report_id": "uuid",
    "description": "texto del problema",
    "location": {"lat": 0, "lng": 0},
    "timestamp": "ISO date"
  }
  ```

### 2. Process Survey Response (por implementar)
- Analiza respuestas de encuestas
- Genera insights automáticos
- Actualiza métricas

## Testing

### Test del Webhook localmente:
```bash
curl -X POST http://localhost:5678/webhook/new-report \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "test-123",
    "description": "Hay un bache grande en la calle principal frente al supermercado",
    "location": {"lat": -32.7805, "lng": -70.9643},
    "timestamp": "2025-08-12T10:00:00Z"
  }'
```

## Integración con Backend

El backend en `backend/server.js` ya está configurado para enviar datos a estos webhooks cuando:
- Se crea un nuevo reporte
- Se envía una respuesta de encuesta
- Se actualiza el estado de un reporte

Asegúrate de que la variable de entorno `N8N_WEBHOOK_URL` esté configurada en el archivo `.env` del backend:
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

## Notas Importantes

- Los workflows usan Claude Haiku por ser más económico
- Para producción, configurar autenticación en los webhooks
- Considerar rate limiting para evitar abuso
- Los webhooks devuelven respuesta inmediata (no esperan procesamiento completo)