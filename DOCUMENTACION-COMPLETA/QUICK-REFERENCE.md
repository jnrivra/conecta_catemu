# 🎯 QUICK REFERENCE - CATEMU CONECTA

## 🚀 COMANDOS RÁPIDOS

```bash
# Instalación completa
./install-all.sh

# Iniciar todo
./start-complete.sh

# Demo automática
node demo-automatica.js

# Detener todo
pkill -f node
```

## 🌐 URLs

| Servicio | URL | Puerto |
|----------|-----|--------|
| Web App | http://localhost:3000 | 3000 |
| Dashboard | http://localhost:3002 | 3002 |
| API | http://localhost:3001 | 3001 |
| WebSocket | ws://localhost:3001 | 3001 |
| n8n | http://localhost:5678 | 5678 |

## 📱 NÚMEROS CLAVE

- **70%** reducción tiempo respuesta
- **3x** más participación
- **85%** satisfacción
- **0** costo licencias
- **30 min** instalación
- **345** municipios objetivo

## 🔧 SOLUCIÓN PROBLEMAS

### Puerto en uso
```bash
lsof -ti:3001 | xargs kill -9
```

### Reiniciar base datos
```bash
cd backend
rm -f database/catemu.db
node init-gamification-tables.js
node seed-demo-data.js
```

### Limpiar todo
```bash
rm -rf node_modules */node_modules
./install-all.sh
```

## 📊 API ENDPOINTS

```bash
# Crear reporte
POST /api/reports

# Listar reportes
GET /api/reports

# Analytics
GET /api/analytics

# Bot status
GET /api/bot/status

# Exportar Excel
GET /api/export/excel
```

## 🎮 DEMO FLOW

1. **QR/Web** → Reportar problema
2. **Dashboard** → Ver notificación
3. **WhatsApp** → Enviar mensaje
4. **Gamificación** → Mostrar puntos
5. **IA** → Categorización automática
6. **Métricas** → Impacto real

## 💬 FRASES CLAVE

> "De problema a solución en minutos, no semanas"

> "70% más rápido, 100% trazable"

> "Open source, gratuito, para todo Chile"

> "Convertimos quejas en participación"

> "La IA trabaja para el municipio"

## 🚨 EMERGENCIAS

**Si falla internet**: Usar hotspot celular
**Si falla demo**: Activar demo automática
**Si falla laptop**: USB con backup
**Si no hay tiempo**: Ir directo a métricas

## 👥 CONTACTOS

- **Juan Rivera**: [teléfono]
- **Catemu Municipal**: informatica@municatemu.cl
- **GitHub**: @catemu-conecta

## ✅ CHECKLIST RÁPIDO

Antes de presentar:
- [ ] Servicios corriendo
- [ ] Demo automática activa
- [ ] Pestañas abiertas
- [ ] Volumen ok
- [ ] Sonreír 😊

---

**¡ÉXITO! 🏆**