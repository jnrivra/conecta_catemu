#!/bin/bash

echo "========================================="
echo "🔒 INICIANDO BOT EN MODO SEGURO"
echo "========================================="
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. El bot está en MODO SEGURO (no enviará mensajes reales)"
echo "2. Debes escanear el código QR con WhatsApp Web"
echo "3. Para agregar tu número de prueba, edita el archivo .env"
echo "   y agrega tu número en TEST_NUMBERS=569XXXXXXXX"
echo ""
echo "4. Para cambiar a modo producción:"
echo "   - Edita .env y cambia SAFE_MODE=false"
echo "   - Configura los números de admin correctos"
echo ""
echo "========================================="
echo ""

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Asegurarse de que el modo seguro esté activo
export SAFE_MODE=true

# Iniciar el bot
echo "🚀 Iniciando bot..."
node index.js