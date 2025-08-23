# 📱 CONFIGURACIÓN RÁPIDA DE WHATSAPP BOT

## 🚀 SETUP EN 2 MINUTOS

### Opción 1: Script Automático (Recomendado)
```bash
# Ejecutar desde la carpeta principal del proyecto
./setup-new-whatsapp.sh
```

Te pedirá:
1. Ingresar el número de teléfono (ej: 56912345678)
2. Confirmará si quieres iniciar el bot
3. Mostrará el QR para escanear

### Opción 2: Manual Rápido

#### 1. Limpiar sesión anterior
```bash
rm -rf whatsapp-bot/sessions
mkdir -p whatsapp-bot/sessions
```

#### 2. Configurar número en .env
```bash
# Editar .env y agregar/modificar:
BOT_PHONE_NUMBER=56912345678
```

#### 3. Iniciar bot con QR nuevo
```bash
cd whatsapp-bot
node index-enhanced.js --new-session
```

---

## 📸 ESCANEAR CÓDIGO QR

### En tu teléfono:
1. Abre **WhatsApp**
2. Ve a **Configuración** (⚙️)
3. Toca **Dispositivos vinculados**
4. Toca **Vincular dispositivo**
5. Escanea el QR de la terminal

### ⏱️ Importante:
- El QR expira en **60 segundos**
- Si expira, el bot generará uno nuevo automáticamente
- Espera hasta ver: **"✅ BOT CONECTADO EXITOSAMENTE"**

---

## 🧪 PROBAR EL BOT

### Test rápido:
1. Envía **"Hola"** al número del bot desde otro teléfono
2. Deberías recibir respuesta automática
3. Prueba: **"Quiero reportar un problema"**

### Comandos de prueba:
- `Hola` - Saludo inicial
- `Ayuda` - Menú de opciones
- `Reportar` - Iniciar reporte
- `Puntos` - Ver puntos (gamificación)

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### QR no aparece
```bash
# Forzar nueva sesión
cd whatsapp-bot
node index-enhanced.js --new-session
```

### Error de conexión
```bash
# Limpiar todo y reintentar
rm -rf whatsapp-bot/sessions
rm -rf whatsapp-bot/sessions_backup*
./setup-new-whatsapp.sh
```

### Bot no responde
1. Verificar que el backend esté corriendo:
```bash
curl http://localhost:3001/api/health
```

2. Verificar logs del bot:
```bash
# Los mensajes aparecen en la terminal del bot
```

---

## 💾 BACKUP DE SESIÓN

### Guardar sesión actual (para no re-escanear):
```bash
cp -r whatsapp-bot/sessions whatsapp-bot/sessions_backup
```

### Restaurar sesión:
```bash
cp -r whatsapp-bot/sessions_backup/* whatsapp-bot/sessions/
```

---

## 🎯 PARA EL HACKATHON

### Setup rápido el día del evento:

1. **Si ya tienes sesión guardada:**
```bash
cd whatsapp-bot
node index.js
# No necesitas QR, se conecta automático
```

2. **Si necesitas nuevo QR:**
```bash
./setup-new-whatsapp.sh
# Seguir instrucciones
```

3. **Comando todo-en-uno:**
```bash
# Inicia backend + bot + dashboard
./start-complete.sh && cd whatsapp-bot && node index.js
```

---

## 📱 NÚMEROS DE PRUEBA

Para la demo puedes usar:
- Tu número personal
- Número de un amigo/colega
- Número prepago temporal

**Importante**: El número del bot NO puede enviarse mensajes a sí mismo.

---

## ✅ CHECKLIST PRE-DEMO

- [ ] Bot conectado y en línea
- [ ] Número de prueba listo (diferente al del bot)
- [ ] Backend corriendo (puerto 3001)
- [ ] Dashboard abierto para ver reportes
- [ ] Mensaje de prueba enviado y respondido

---

## 🚨 COMANDOS DE EMERGENCIA

```bash
# Matar todo y reiniciar
pkill -f node
./start-complete.sh

# Solo reiniciar bot
cd whatsapp-bot
pkill -f "node.*whatsapp"
node index-enhanced.js

# Ver si el bot está corriendo
ps aux | grep whatsapp
```

---

*¡Listo! Tu WhatsApp Bot está configurado* 🎉