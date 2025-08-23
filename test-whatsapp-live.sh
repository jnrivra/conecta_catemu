#!/bin/bash

# 🎯 TEST RÁPIDO DEL BOT DE WHATSAPP

echo "
╔══════════════════════════════════════════════╗
║      📱 TEST EN VIVO - WHATSAPP BOT          ║
╚══════════════════════════════════════════════╝
"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📱 Número del bot configurado: 56920464349${NC}"
echo ""

echo -e "${YELLOW}📋 INSTRUCCIONES DE PRUEBA:${NC}"
echo ""
echo "1. Abre WhatsApp en tu teléfono"
echo "2. Busca el contacto: +569 2046 4349"
echo "3. Envía uno de estos mensajes:"
echo ""
echo -e "${GREEN}   'Hola'${NC} - Para recibir saludo"
echo -e "${GREEN}   'Ayuda'${NC} - Para ver menú de opciones"
echo -e "${GREEN}   'Reportar'${NC} - Para iniciar un reporte"
echo -e "${GREEN}   'Puntos'${NC} - Para ver tus puntos"
echo ""
echo -e "${BLUE}4. Verás las respuestas aquí en la terminal${NC}"
echo ""

echo -e "${YELLOW}⏳ Esperando mensajes... (Ctrl+C para salir)${NC}"
echo ""

# Mostrar logs del bot en tiempo real
tail -f /dev/null