#!/bin/bash

# ============================================
# CATEMU CONECTA - SISTEMA COMPLETO
# Bot WhatsApp + Backend + Web App + Dashboard
# ============================================

echo "╔══════════════════════════════════════════════╗"
echo "║     🚀 INICIANDO CATEMU CONECTA COMPLETO      ║"
echo "║                                               ║"
echo "║  Componentes:                                 ║"
echo "║  • Backend API (Puerto 3001)                 ║"
echo "║  • Web App Ciudadana (Puerto 3000)           ║"
echo "║  • Dashboard Municipal (Puerto 3002)         ║"
echo "║  • Bot de WhatsApp con IA                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Puerto $1 ya está en uso${NC}"
        echo "   Intenta detener el proceso con: lsof -ti:$1 | xargs kill -9"
        return 1
    fi
    return 0
}

# Función para instalar dependencias si no existen
install_deps() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependencias para $name...${NC}"
        cd "$dir" && npm install --silent
        cd - > /dev/null
    fi
}

# Crear directorios necesarios
echo -e "${BLUE}📁 Creando directorios necesarios...${NC}"
mkdir -p backend/uploads
mkdir -p backend/exports/pdf
mkdir -p backend/exports/excel
mkdir -p whatsapp-bot/temp
mkdir -p whatsapp-bot/sessions
mkdir -p database

# Verificar que existe la base de datos
if [ ! -f "database/catemu.db" ]; then
    echo -e "${YELLOW}🗄️ Creando base de datos...${NC}"
    cd backend && node database.js
    cd ..
fi

# Verificar puertos disponibles
echo -e "${BLUE}🔍 Verificando puertos...${NC}"
check_port 3000 || exit 1
check_port 3001 || exit 1
check_port 3002 || exit 1

# Instalar dependencias si es necesario
echo -e "${BLUE}📦 Verificando dependencias...${NC}"
install_deps "backend" "Backend"
install_deps "web-app" "Web App"
install_deps "dashboard" "Dashboard"
install_deps "whatsapp-bot" "WhatsApp Bot"

# Función para matar todos los procesos al salir
cleanup() {
    echo ""
    echo -e "${RED}⏹️ Deteniendo todos los servicios...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Capturar Ctrl+C
trap cleanup INT

# Iniciar Backend mejorado
echo -e "${GREEN}✅ Iniciando Backend API...${NC}"
cd backend
if [ -f "server-enhanced.js" ]; then
    node server-enhanced.js &
else
    node server.js &
fi
BACKEND_PID=$!
cd ..
sleep 3

# Verificar que el backend está corriendo
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${RED}❌ Error: El backend no se inició correctamente${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar Web App
echo -e "${GREEN}✅ Iniciando Web App Ciudadana...${NC}"
cd web-app
PORT=3000 npm start > /dev/null 2>&1 &
WEBAPP_PID=$!
cd ..

# Iniciar Dashboard
echo -e "${GREEN}✅ Iniciando Dashboard Municipal...${NC}"
cd dashboard
PORT=3002 npm start > /dev/null 2>&1 &
DASHBOARD_PID=$!
cd ..

# Verificar archivo .env del bot
if [ ! -f "whatsapp-bot/.env" ]; then
    echo -e "${YELLOW}⚠️ Archivo .env no encontrado en whatsapp-bot${NC}"
    echo "   Copiando plantilla..."
    cp whatsapp-bot/.env.example whatsapp-bot/.env 2>/dev/null || echo "   Por favor, configura whatsapp-bot/.env"
fi

# Preguntar si iniciar WhatsApp Bot
echo ""
echo -e "${YELLOW}🤖 ¿Deseas iniciar el Bot de WhatsApp? (s/n)${NC}"
read -r -n 1 response
echo ""

if [[ "$response" =~ ^[Ss]$ ]]; then
    # Verificar API key de Anthropic
    if grep -q "YOUR-KEY-HERE" whatsapp-bot/.env; then
        echo -e "${RED}⚠️ ADVERTENCIA: No has configurado la API key de Anthropic${NC}"
        echo "   El bot funcionará pero sin capacidades de IA"
        echo "   Edita whatsapp-bot/.env y agrega tu API key"
        echo ""
        echo "Presiona Enter para continuar sin IA..."
        read
    fi
    
    echo -e "${GREEN}✅ Iniciando Bot de WhatsApp...${NC}"
    cd whatsapp-bot
    node index.js &
    BOT_PID=$!
    cd ..
else
    echo -e "${YELLOW}ℹ️ Bot de WhatsApp omitido${NC}"
fi

# Esperar un momento para que todo se inicie
sleep 5

# Mostrar información de acceso
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           ✅ SISTEMA INICIADO CORRECTAMENTE              ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  🌐 Portal Ciudadano:                                   ║"
echo "║     http://localhost:3000                               ║"
echo "║                                                          ║"
echo "║  📊 Dashboard Municipal:                                 ║"
echo "║     http://localhost:3002                               ║"
echo "║                                                          ║"
echo "║  🔧 API Backend:                                        ║"
echo "║     http://localhost:3001/api/health                    ║"
echo "║                                                          ║"

if [[ "$response" =~ ^[Ss]$ ]]; then
    echo "║  🤖 WhatsApp Bot:                                       ║"
    echo "║     Escanea el código QR en la terminal del bot        ║"
    echo "║                                                          ║"
fi

echo "║  📚 Documentación:                                      ║"
echo "║     README.md y DEMO.md                                 ║"
echo "║                                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Comandos útiles:                                       ║"
echo "║  • Ver logs del backend: tail -f backend/logs.txt       ║"
echo "║  • Ver procesos: ps aux | grep node                     ║"
echo "║  • Detener todo: Presiona Ctrl+C                        ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🎉 ¡Listo para la demo de la hackaton!${NC}"
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Función para mostrar estadísticas cada 30 segundos
show_stats() {
    while true; do
        sleep 30
        if curl -s http://localhost:3001/api/stats > /dev/null 2>&1; then
            echo -e "${BLUE}📊 Estadísticas actuales:${NC}"
            curl -s http://localhost:3001/api/stats | grep -E "totalReports|pendingReports" | head -2
        fi
    done
}

# Iniciar monitor de estadísticas en background (opcional)
# show_stats &

# Mantener el script corriendo
wait