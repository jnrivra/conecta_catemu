#!/bin/bash

# 🚀 INICIADOR COMPLETO - CATEMU CONECTA
# Inicia todos los servicios del sistema

echo "
╔══════════════════════════════════════════════╗
║      🚀 INICIANDO CATEMU CONECTA             ║
╚══════════════════════════════════════════════╝
"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar dependencias
check_dependencies() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado"
        exit 1
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        print_warning "Dependencias no instaladas. Ejecutando instalador..."
        ./install-all.sh
        if [ $? -ne 0 ]; then
            print_error "Error en la instalación"
            exit 1
        fi
    fi
}

# Matar procesos existentes
cleanup_ports() {
    print_info "Limpiando puertos..."
    
    # Matar procesos en puertos específicos
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    lsof -ti:5678 | xargs kill -9 2>/dev/null
    
    # Matar procesos node anteriores
    pkill -f "node.*catemu" 2>/dev/null
    
    sleep 2
    print_status "Puertos liberados"
}

# Iniciar servicio con logging
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    local log_file="logs/${name}.log"
    
    mkdir -p logs
    
    print_info "Iniciando $name..."
    
    cd "$dir"
    nohup $cmd > "../$log_file" 2>&1 &
    local pid=$!
    cd - > /dev/null
    
    # Esperar a que el servicio esté listo
    sleep 3
    
    # Verificar si el proceso sigue vivo
    if ps -p $pid > /dev/null; then
        # Verificar si el puerto está escuchando
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
            print_status "$name iniciado (PID: $pid, Puerto: $port)"
            echo "$pid" > "logs/${name}.pid"
            return 0
        else
            print_warning "$name proceso iniciado pero puerto $port no está escuchando"
            return 1
        fi
    else
        print_error "$name falló al iniciar. Ver logs/$name.log"
        return 1
    fi
}

# Verificar servicios
verify_services() {
    echo ""
    print_info "Verificando servicios..."
    
    local all_ok=true
    
    # Verificar API
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_status "API Backend: http://localhost:3001 ✓"
    else
        print_error "API Backend no responde"
        all_ok=false
    fi
    
    # Verificar Web App
    if curl -s http://localhost:3000 > /dev/null; then
        print_status "Web App: http://localhost:3000 ✓"
    else
        print_error "Web App no responde"
        all_ok=false
    fi
    
    # Verificar Dashboard
    if curl -s http://localhost:3002 > /dev/null; then
        print_status "Dashboard: http://localhost:3002 ✓"
    else
        print_error "Dashboard no responde"
        all_ok=false
    fi
    
    if [ "$all_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# Mostrar logs en tiempo real
show_logs() {
    print_info "Mostrando logs (Ctrl+C para salir)..."
    tail -f logs/*.log
}

# Detener todos los servicios
stop_all() {
    print_info "Deteniendo servicios..."
    
    # Leer PIDs guardados
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            kill $pid 2>/dev/null
            rm "$pidfile"
        fi
    done
    
    # Limpiar puertos por si acaso
    cleanup_ports
    
    print_status "Servicios detenidos"
}

# Manejador de señales
trap 'echo ""; print_warning "Interrupción detectada. Deteniendo servicios..."; stop_all; exit 0' INT TERM

# Main
main() {
    # Verificar dependencias
    check_dependencies
    
    # Limpiar puertos
    cleanup_ports
    
    # Iniciar servicios
    echo ""
    print_info "Iniciando servicios..."
    echo ""
    
    # Backend API
    if ! start_service "backend" "backend" "node server-enhanced.js" 3001; then
        print_error "Error crítico: No se pudo iniciar el backend"
        stop_all
        exit 1
    fi
    
    # Web App
    if ! start_service "webapp" "web-app" "npm start" 3000; then
        print_warning "Web App no se pudo iniciar"
    fi
    
    # Dashboard
    if ! start_service "dashboard" "dashboard" "npm start" 3002; then
        print_warning "Dashboard no se pudo iniciar"
    fi
    
    # Esperar a que todos los servicios estén listos
    sleep 5
    
    # Verificar servicios
    echo ""
    if verify_services; then
        echo ""
        echo "╔══════════════════════════════════════════════╗"
        echo "║     ✅ SISTEMA INICIADO CORRECTAMENTE        ║"
        echo "╚══════════════════════════════════════════════╝"
        echo ""
        echo "📱 URLs del Sistema:"
        echo "   Web App:   http://localhost:3000"
        echo "   Dashboard: http://localhost:3002"
        echo "   API:       http://localhost:3001"
        echo ""
        echo "🎮 Para demo automática (en otra terminal):"
        echo "   node demo-automatica.js"
        echo ""
        echo "📝 Logs guardados en: ./logs/"
        echo ""
        echo "⛔ Para detener: Ctrl+C o ejecuta ./stop-all.sh"
        echo ""
        print_info "Sistema corriendo. Presiona Ctrl+C para detener."
        echo ""
        
        # Opción de mostrar logs
        read -p "¿Mostrar logs en tiempo real? (s/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            show_logs
        else
            print_info "Sistema corriendo en background. Logs en ./logs/"
            print_info "Presiona Ctrl+C para detener todos los servicios."
            
            # Mantener el script corriendo
            while true; do
                sleep 1
            done
        fi
    else
        print_error "Algunos servicios no están funcionando correctamente"
        print_info "Revisa los logs en ./logs/ para más detalles"
        
        read -p "¿Deseas ver los logs? (s/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            tail -n 50 logs/*.log
        fi
        
        read -p "¿Continuar de todos modos? (s/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            stop_all
            exit 1
        fi
    fi
}

# Ejecutar
main