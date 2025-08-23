#!/bin/bash

# 🚀 INSTALADOR AUTOMÁTICO - CATEMU CONECTA
# Instala todas las dependencias del proyecto

echo "
╔══════════════════════════════════════════════╗
║     🚀 INSTALADOR CATEMU CONECTA             ║
╚══════════════════════════════════════════════╝
"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar Node.js
echo "🔍 Verificando requisitos..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js versión $NODE_VERSION detectada. Se recomienda v18+"
fi

print_status "Node.js $(node -v) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_status "npm $(npm -v) detectado"

# Directorio base
BASE_DIR=$(pwd)
print_status "Instalando en: $BASE_DIR"

# Array de directorios a instalar
DIRS=(
    "backend"
    "web-app"
    "dashboard"
    "whatsapp-bot"
)

# Instalar dependencias en cada directorio
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo ""
        echo "📦 Instalando dependencias en $dir..."
        cd "$BASE_DIR/$dir"
        
        # Limpiar cache si existe
        rm -rf node_modules package-lock.json 2>/dev/null
        
        # Instalar
        if npm install --legacy-peer-deps; then
            print_status "$dir instalado correctamente"
        else
            print_error "Error instalando $dir"
            exit 1
        fi
    else
        print_warning "Directorio $dir no encontrado, saltando..."
    fi
done

# Volver al directorio base
cd "$BASE_DIR"

# Instalar dependencias del root (para demos)
echo ""
echo "📦 Instalando utilidades de demo..."
npm install chalk@4 axios socket.io-client puppeteer --legacy-peer-deps

# Crear directorios necesarios
echo ""
echo "📁 Creando directorios necesarios..."
mkdir -p backend/uploads
mkdir -p backend/exports/pdf
mkdir -p backend/exports/excel
mkdir -p backend/database
mkdir -p whatsapp-bot/sessions
mkdir -p logs

print_status "Directorios creados"

# Inicializar base de datos
echo ""
echo "🗄️ Inicializando base de datos..."
cd "$BASE_DIR/backend"

# Crear tablas de gamificación
if node init-gamification-tables.js; then
    print_status "Tablas de gamificación creadas"
else
    print_error "Error creando tablas"
fi

# Cargar datos de demo
if node seed-demo-data.js; then
    print_status "Datos de demo cargados"
else
    print_warning "No se pudieron cargar datos de demo"
fi

cd "$BASE_DIR"

# Configurar permisos
echo ""
echo "🔐 Configurando permisos..."
chmod +x *.sh 2>/dev/null
chmod 755 backend/database 2>/dev/null

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creando archivo .env..."
    cat > .env << EOL
# Backend
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database/catemu.db

# WhatsApp Bot
BOT_NAME=CatemuConecta
ANTHROPIC_API_KEY=your-key-here

# n8n (opcional)
N8N_SECURE_COOKIE=false

# Frontend URLs
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
EOL
    print_status "Archivo .env creado (configurar API keys si necesario)"
else
    print_status "Archivo .env ya existe"
fi

# Verificación final
echo ""
echo "🔍 Verificando instalación..."

# Verificar que los node_modules existen
INSTALL_SUCCESS=true
for dir in "${DIRS[@]}"; do
    if [ -d "$dir/node_modules" ]; then
        print_status "$dir ✓"
    else
        print_error "$dir ✗"
        INSTALL_SUCCESS=false
    fi
done

# Verificar base de datos
if [ -f "backend/database/catemu.db" ] || [ -f "database/catemu.db" ]; then
    print_status "Base de datos ✓"
else
    print_warning "Base de datos no encontrada"
fi

echo ""
if [ "$INSTALL_SUCCESS" = true ]; then
    echo "╔══════════════════════════════════════════════╗"
    echo "║     ✅ INSTALACIÓN COMPLETADA                ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""
    echo "🚀 Para iniciar el sistema completo:"
    echo "   ./start-catemu-complete.sh"
    echo ""
    echo "📱 URLs del sistema:"
    echo "   Web App:   http://localhost:3000"
    echo "   Dashboard: http://localhost:3002"
    echo "   API:       http://localhost:3001"
    echo ""
    echo "🎮 Para demo automática:"
    echo "   node demo-automatica.js"
    echo ""
else
    print_error "Instalación incompleta. Revisa los errores arriba."
    exit 1
fi

echo "¡Listo para el hackathon! 🏆"