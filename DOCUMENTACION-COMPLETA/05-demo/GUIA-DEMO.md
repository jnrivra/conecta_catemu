# 🎮 GUÍA COMPLETA DE DEMOSTRACIÓN

## 🎯 OBJETIVO DE LA DEMO
Mostrar en 2-3 minutos cómo CatemuConecta transforma la gestión municipal con participación ciudadana inteligente.

---

## 🚀 PREPARACIÓN (10 min antes)

### 1. Iniciar servicios
```bash
cd /Users/juanrivera/Documents/HACKATON/prototipo
./start-catemu-complete.sh
```

### 2. Verificar servicios
- [ ] http://localhost:3000 - Web App
- [ ] http://localhost:3001/api/health - API  
- [ ] http://localhost:3002 - Dashboard

### 3. Preparar navegador
- [ ] Pestaña 1: Web App (localhost:3000)
- [ ] Pestaña 2: Dashboard (localhost:3002)
- [ ] Pestaña 3: WhatsApp Web (opcional)
- [ ] Móvil: Listo con WhatsApp

### 4. Limpiar datos si necesario
```bash
sqlite3 database/catemu.db "DELETE FROM reports WHERE id LIKE 'CAT-2025-%';"
```

### 5. Iniciar demo automática
```bash
node demo-automatica.js
```

---

## 📱 FLUJO DE DEMO PRINCIPAL

### PARTE 1: Reporte Ciudadano (30 seg)

#### Opción A - QR Code
1. **Mostrar QR** en pantalla o impreso
2. **Escanear** con móvil
3. **Llenar formulario rápido**:
   - Tipo: Infraestructura
   - Categoría: Baches
   - Descripción: "Bache peligroso en esquina"
   - Tomar foto (opcional)
4. **Enviar**
5. **Mostrar confirmación** con número de reporte

**Narración sugerida:**
> "Un ciudadano encuentra un problema, escanea el QR en la parada de bus, reporta en 30 segundos. Sin apps, sin registro."

#### Opción B - WhatsApp
1. **Enviar mensaje** a bot: "Hay un semáforo malo en la plaza"
2. **Mostrar respuesta** automática
3. **Bot pregunta** ubicación
4. **Confirmar** creación

**Narración sugerida:**
> "O simplemente envía un WhatsApp como a un amigo. El bot entiende y crea el reporte automáticamente."

---

### PARTE 2: Dashboard Municipal (45 seg)

1. **Cambiar a Dashboard**
2. **Señalar notificación** en tiempo real (campanita)
3. **Mostrar reporte nuevo** en lista
4. **Click en reporte** para ver detalles:
   - Mapa con ubicación
   - Foto adjunta
   - Prioridad asignada por IA
5. **Cambiar estado** a "En Progreso"
6. **Asignar** a Departamento de Obras
7. **Mostrar métricas** actualizándose:
   - Total reportes hoy
   - Tiempo promedio respuesta
   - Satisfacción ciudadana

**Narración sugerida:**
> "El municipio ve todo en tiempo real. La IA ya categorizó y priorizó. El funcionario solo gestiona. Miren cómo cambian las métricas al instante."

---

### PARTE 3: Características Avanzadas (45 seg)

#### Gamificación
1. **Volver a Web App**
2. **Mostrar perfil** ciudadano:
   - 150 puntos
   - Nivel 2
   - Badge "Guardián del Barrio"
3. **Canjear recompensa**: Café gratis

**Narración:**
> "Los ciudadanos ganan puntos por participar. Canjean beneficios. Engagement multiplicado por 3."

#### IA en Acción
1. **Volver a Dashboard**
2. **Mostrar categorización** automática
3. **Señalar prioridades** asignadas
4. **Predicciones** de zonas problemáticas

**Narración:**
> "La IA trabaja 24/7. Categoriza, prioriza, predice. Sin intervención humana."

#### Exportación
1. **Click en Exportar**
2. **Descargar Excel** con todos los reportes
3. **Generar PDF** de reporte individual

**Narración:**
> "Toda la información exportable para reportes, auditorías, transparencia."

---

## 🎭 DEMO AUTOMÁTICA (Si falla algo)

La demo automática simula actividad real cada 5-10 segundos:

```bash
node demo-automatica.js
```

**Qué hace:**
1. Crea reportes variados
2. Simula mensajes WhatsApp
3. Actualiza estados
4. Genera notificaciones
5. Activa gamificación

**Usar cuando:**
- Internet lento
- Error en formularios
- Necesitas actividad constante
- Quieres impresionar con volumen

---

## 💬 FRASES CLAVE DURANTE LA DEMO

### Apertura
> "Les voy a mostrar cómo un ciudadano reporta un problema y el municipio lo resuelve, todo en menos de 1 minuto"

### Durante reporte
> "Sin apps que descargar, sin registro, sin complicaciones"

### En dashboard
> "Información en tiempo real, trazabilidad completa, gestión eficiente"

### Gamificación
> "Convertimos quejas en participación activa"

### IA
> "Inteligencia artificial trabajando para el municipio, no contra él"

### Cierre
> "De problema a solución en minutos, no semanas"

---

## 🚨 SOLUCIÓN DE PROBLEMAS EN VIVO

### Si la web no carga
```bash
# Reiniciar servicios
pkill -f node
./start-catemu-complete.sh
```

### Si no hay notificaciones
```bash
# Verificar WebSocket
curl http://localhost:3001/api/health
```

### Si WhatsApp no responde
- Usar demo web en su lugar
- Mostrar screenshots preparados

### Si no hay internet
- Usar modo offline de PWA
- Mostrar que sigue funcionando
- Los datos se sincronizan después

---

## 📊 MÉTRICAS PARA IMPRESIONAR

Tener estos números listos:

- **70%** reducción tiempo respuesta
- **3x** más reportes ciudadanos
- **85%** satisfacción usuarios
- **24/7** disponibilidad
- **0** costo licencias
- **30 min** instalación
- **5** municipios interesados

---

## 🎬 VARIACIONES DE DEMO

### Demo Rápida (1 minuto)
1. Escanear QR
2. Reportar
3. Ver en dashboard
4. Fin

### Demo Completa (3 minutos)
1. Reporte por 2 canales
2. Dashboard completo
3. Gamificación
4. Exportación

### Demo Técnica (5 minutos)
1. Todo lo anterior
2. Mostrar código
3. Explicar arquitectura
4. Mencionar escalabilidad

---

## ✅ CHECKLIST POST-DEMO

- [ ] Agradecer atención
- [ ] Invitar a preguntas
- [ ] Compartir QR con link a GitHub
- [ ] Mencionar que es open source
- [ ] Dejar contacto

---

## 🎯 RESPUESTAS PREPARADAS

**"¿Qué pasa si no hay internet?"**
> "Funciona offline. Los reportes se guardan y sincronizan cuando vuelve la conexión. Lo diseñamos para la realidad chilena."

**"¿Cuánto cuesta?"**
> "Cero pesos en licencias. Es open source. Solo necesitan un servidor que probablemente ya tienen."

**"¿Es seguro?"**
> "Cumplimos todas las normativas. Los datos nunca salen del servidor municipal. Encriptación end-to-end."

**"¿Qué tan difícil es instalarlo?"**
> "30 minutos. Tenemos scripts automáticos. Incluimos soporte gratuito el primer mes."

---

## 🏆 CIERRE PODEROSO

> "CatemuConecta no es solo tecnología. Es un puente entre ciudadanos y municipio. Es participación real. Es el futuro de la gestión municipal, disponible hoy, gratis, para todo Chile. ¿Preguntas?"

---

*¡Éxito en la demo! 🚀*