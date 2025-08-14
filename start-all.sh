#!/bin/bash

echo "🚀 Iniciando CatemuConecta..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Puerto $1 ya está en uso${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Puerto $1 disponible${NC}"
        return 0
    fi
}

# Check required ports
echo -e "\n${YELLOW}Verificando puertos...${NC}"
check_port 3000
PORT_3000=$?
check_port 3001
PORT_3001=$?
check_port 3002
PORT_3002=$?

if [ $PORT_3000 -ne 0 ] || [ $PORT_3001 -ne 0 ] || [ $PORT_3002 -ne 0 ]; then
    echo -e "\n${RED}Por favor, libera los puertos necesarios antes de continuar.${NC}"
    exit 1
fi

# Install dependencies if needed
echo -e "\n${YELLOW}Verificando dependencias...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo "Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "web-app/node_modules" ]; then
    echo "Instalando dependencias de la web app..."
    cd web-app && npm install && cd ..
fi

if [ ! -d "dashboard/node_modules" ]; then
    echo "Instalando dependencias del dashboard..."
    cd dashboard && npm install && cd ..
fi

# Start services
echo -e "\n${YELLOW}Iniciando servicios...${NC}"

# Start backend
echo -e "${GREEN}Starting Backend API on port 3001...${NC}"
(cd backend && npm start) &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start web app
echo -e "${GREEN}Starting Web App on port 3000...${NC}"
(cd web-app && PORT=3000 npm start) &
WEBAPP_PID=$!

# Start dashboard
echo -e "${GREEN}Starting Dashboard on port 3002...${NC}"
(cd dashboard && PORT=3002 npm start) &
DASHBOARD_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servicios...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $WEBAPP_PID 2>/dev/null
    kill $DASHBOARD_PID 2>/dev/null
    echo -e "${GREEN}Servicios detenidos.${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Success message
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✨ CatemuConecta está corriendo!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📱 Web App (Ciudadanos): http://localhost:3000"
echo "🖥️  Dashboard (Municipal): http://localhost:3002"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Keep script running
while true; do
    sleep 1
done