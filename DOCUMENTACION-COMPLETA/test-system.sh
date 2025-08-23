#!/bin/bash

# 🧪 TEST RÁPIDO DEL SISTEMA - CATEMU CONECTA
# Verifica que todos los componentes funcionen correctamente

echo "
╔══════════════════════════════════════════════╗
║      🧪 TEST RÁPIDO DEL SISTEMA              ║
╚══════════════════════════════════════════════╝
"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# Funciones de utilidad
print_test() {
    echo -e "${BLUE}🔍 Testing: $1${NC}"
}

test_pass() {
    echo -e "${GREEN}  ✅ $1${NC}"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}  ❌ $1${NC}"
    ((TESTS_FAILED++))
}

test_warn() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
}

# ============================================
# 1. VERIFICAR REQUISITOS
# ============================================
echo ""
print_test "Requisitos del Sistema"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    test_pass "Node.js instalado: $NODE_VERSION"
else
    test_fail "Node.js no instalado"
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    test_pass "npm instalado: $NPM_VERSION"
else
    test_fail "npm no instalado"
fi

# Git
if command -v git &> /dev/null; then
    test_pass "Git instalado"
else
    test_warn "Git no instalado (no crítico)"
fi

# SQLite
if command -v sqlite3 &> /dev/null; then
    test_pass "SQLite3 instalado"
else
    test_warn "SQLite3 CLI no instalado (no crítico)"
fi

# ============================================
# 2. VERIFICAR ESTRUCTURA DE ARCHIVOS
# ============================================
echo ""
print_test "Estructura de Archivos"

# Directorios principales
DIRS=("backend" "web-app" "dashboard" "whatsapp-bot")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        test_pass "Directorio $dir existe"
    else
        test_fail "Directorio $dir no encontrado"
    fi
done

# Archivos críticos
if [ -f "backend/server-enhanced.js" ] || [ -f "backend/server.js" ]; then
    test_pass "Servidor backend encontrado"
else
    test_fail "Servidor backend no encontrado"
fi

if [ -f ".env" ]; then
    test_pass "Archivo .env existe"
else
    test_warn "Archivo .env no existe (usar .env.example)"
fi

# ============================================
# 3. VERIFICAR DEPENDENCIAS
# ============================================
echo ""
print_test "Dependencias npm"

for dir in "${DIRS[@]}"; do
    if [ -d "$dir/node_modules" ]; then
        test_pass "$dir: dependencias instaladas"
    else
        test_fail "$dir: dependencias no instaladas (ejecutar ./install-all.sh)"
    fi
done

# ============================================
# 4. VERIFICAR BASE DE DATOS
# ============================================
echo ""
print_test "Base de Datos"

DB_PATH=""
if [ -f "database/catemu.db" ]; then
    DB_PATH="database/catemu.db"
elif [ -f "backend/database/catemu.db" ]; then
    DB_PATH="backend/database/catemu.db"
fi

if [ -n "$DB_PATH" ]; then
    test_pass "Base de datos encontrada: $DB_PATH"
    
    # Verificar tablas
    if command -v sqlite3 &> /dev/null; then
        TABLES=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null)
        if [[ $TABLES == *"reports"* ]]; then
            test_pass "Tabla 'reports' existe"
        else
            test_fail "Tabla 'reports' no encontrada"
        fi
        
        if [[ $TABLES == *"user_points"* ]]; then
            test_pass "Tabla 'user_points' existe"
        else
            test_warn "Tabla 'user_points' no encontrada (ejecutar init-gamification-tables.js)"
        fi
        
        # Contar registros
        REPORT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM reports;" 2>/dev/null)
        test_pass "Reportes en BD: $REPORT_COUNT"
    fi
else
    test_fail "Base de datos no encontrada"
fi

# ============================================
# 5. VERIFICAR SERVICIOS (si están corriendo)
# ============================================
echo ""
print_test "Servicios en Ejecución"

# Backend API
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    test_pass "Backend API respondiendo en puerto 3001"
    
    # Test endpoint específico
    RESPONSE=$(curl -s http://localhost:3001/api/reports 2>/dev/null)
    if [[ $RESPONSE == *"reports"* ]] || [[ $RESPONSE == *"[]"* ]]; then
        test_pass "Endpoint /api/reports funcional"
    else
        test_fail "Endpoint /api/reports no responde correctamente"
    fi
else
    test_warn "Backend API no está corriendo (ejecutar ./start-complete.sh)"
fi

# Web App
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    test_pass "Web App respondiendo en puerto 3000"
else
    test_warn "Web App no está corriendo"
fi

# Dashboard
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|301\|302"; then
    test_pass "Dashboard respondiendo en puerto 3002"
else
    test_warn "Dashboard no está corriendo"
fi

# WebSocket
if curl -s http://localhost:3001/socket.io/ 2>/dev/null | grep -q "socket.io"; then
    test_pass "WebSocket servidor activo"
else
    test_warn "WebSocket no verificado"
fi

# ============================================
# 6. TEST DE FUNCIONALIDAD
# ============================================
echo ""
print_test "Funcionalidad Básica"

# Crear reporte de prueba (si el backend está corriendo)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    TEST_REPORT=$(curl -s -X POST http://localhost:3001/api/reports \
        -H "Content-Type: application/json" \
        -d '{
            "type": "infrastructure",
            "category": "Test",
            "description": "Test automático del sistema",
            "priority": "low",
            "source": "test"
        }' 2>/dev/null)
    
    if [[ $TEST_REPORT == *"CAT-"* ]]; then
        test_pass "Creación de reportes funcional"
    else
        test_fail "No se pudo crear reporte de prueba"
    fi
fi

# Verificar archivos de configuración
if [ -f "backend/middleware/validation.js" ]; then
    test_pass "Middleware de validación presente"
else
    test_warn "Middleware de validación no encontrado"
fi

if [ -f "web-app/public/service-worker.js" ]; then
    test_pass "Service Worker (PWA) presente"
else
    test_warn "Service Worker no encontrado"
fi

# ============================================
# 7. VERIFICAR DOCUMENTACIÓN
# ============================================
echo ""
print_test "Documentación"

if [ -d "DOCUMENTACION-COMPLETA" ]; then
    test_pass "Carpeta de documentación existe"
    
    # Contar archivos de documentación
    DOC_COUNT=$(find DOCUMENTACION-COMPLETA -name "*.md" | wc -l)
    test_pass "Archivos de documentación: $DOC_COUNT"
else
    test_warn "Carpeta DOCUMENTACION-COMPLETA no encontrada"
fi

# ============================================
# 8. VERIFICAR SCRIPTS
# ============================================
echo ""
print_test "Scripts Ejecutables"

SCRIPTS=("install-all.sh" "start-complete.sh" "demo-automatica.js")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ] || [ -f "DOCUMENTACION-COMPLETA/$script" ]; then
        test_pass "Script $script encontrado"
    else
        test_warn "Script $script no encontrado"
    fi
done

# ============================================
# 9. VERIFICAR PERMISOS
# ============================================
echo ""
print_test "Permisos de Archivos"

if [ -w "." ]; then
    test_pass "Permisos de escritura en directorio actual"
else
    test_fail "Sin permisos de escritura"
fi

if [ -d "backend/uploads" ] && [ -w "backend/uploads" ]; then
    test_pass "Directorio uploads con permisos correctos"
else
    test_warn "Directorio uploads sin permisos o no existe"
fi

# ============================================
# 10. TEST DE RENDIMIENTO BÁSICO
# ============================================
echo ""
print_test "Rendimiento Básico"

# Memoria disponible
if command -v free &> /dev/null; then
    MEM_AVAILABLE=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
    if (( $(echo "$MEM_AVAILABLE > 1" | bc -l) )); then
        test_pass "Memoria disponible: ${MEM_AVAILABLE}GB"
    else
        test_warn "Memoria baja: ${MEM_AVAILABLE}GB"
    fi
fi

# Espacio en disco
DISK_AVAILABLE=$(df -h . | awk 'NR==2{print $4}')
test_pass "Espacio en disco disponible: $DISK_AVAILABLE"

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║           📊 RESUMEN DE TESTS                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Tests Pasados: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Fallidos: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡SISTEMA LISTO PARA EL HACKATHON!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecutar: ./start-complete.sh"
    echo "2. Abrir: http://localhost:3000"
    echo "3. Probar demo: node demo-automatica.js"
elif [ $TESTS_FAILED -le 3 ]; then
    echo -e "${YELLOW}⚠️  Sistema funcional con advertencias menores${NC}"
    echo ""
    echo "Recomendaciones:"
    echo "1. Revisar los tests fallidos"
    echo "2. Ejecutar: ./install-all.sh si faltan dependencias"
    echo "3. Continuar con precaución"
else
    echo -e "${RED}❌ Sistema requiere atención antes del hackathon${NC}"
    echo ""
    echo "Acciones requeridas:"
    echo "1. Ejecutar: ./install-all.sh"
    echo "2. Verificar archivo .env"
    echo "3. Revisar errores específicos arriba"
fi

echo ""
echo "💡 Para más detalles, revisar:"
echo "   DOCUMENTACION-COMPLETA/README.md"
echo ""

exit $TESTS_FAILED