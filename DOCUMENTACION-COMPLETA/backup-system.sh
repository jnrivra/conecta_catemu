#!/bin/bash

# 💾 SCRIPT DE BACKUP AUTOMÁTICO - CATEMU CONECTA
# Crea un backup completo del sistema con timestamp

echo "
╔══════════════════════════════════════════════╗
║        💾 BACKUP CATEMU CONECTA              ║
╚══════════════════════════════════════════════╝
"

# Configuración
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/backup_${TIMESTAMP}"
PROJECT_DIR="."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}📦 $1${NC}"
}

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

# 1. Backup de base de datos
print_info "Respaldando base de datos..."
if [ -f "database/catemu.db" ]; then
    cp -r database "$BACKUP_DIR/"
    print_status "Base de datos respaldada"
elif [ -f "backend/database/catemu.db" ]; then
    mkdir -p "$BACKUP_DIR/database"
    cp backend/database/catemu.db "$BACKUP_DIR/database/"
    print_status "Base de datos respaldada"
fi

# 2. Backup de configuración
print_info "Respaldando configuración..."
cp .env "$BACKUP_DIR/.env" 2>/dev/null || echo "No .env found"
cp .env.example "$BACKUP_DIR/.env.example" 2>/dev/null
cp package.json "$BACKUP_DIR/package.json" 2>/dev/null
print_status "Configuración respaldada"

# 3. Backup de código (sin node_modules)
print_info "Respaldando código fuente..."
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='build' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='backups' \
    backend "$BACKUP_DIR/" 2>/dev/null

rsync -av --progress \
    --exclude='node_modules' \
    --exclude='build' \
    web-app "$BACKUP_DIR/" 2>/dev/null

rsync -av --progress \
    --exclude='node_modules' \
    --exclude='build' \
    dashboard "$BACKUP_DIR/" 2>/dev/null

rsync -av --progress \
    --exclude='node_modules' \
    --exclude='sessions' \
    whatsapp-bot "$BACKUP_DIR/" 2>/dev/null

print_status "Código respaldado"

# 4. Backup de documentación
print_info "Respaldando documentación..."
cp -r DOCUMENTACION-COMPLETA "$BACKUP_DIR/" 2>/dev/null
cp *.md "$BACKUP_DIR/" 2>/dev/null
print_status "Documentación respaldada"

# 5. Backup de scripts importantes
print_info "Respaldando scripts..."
cp *.sh "$BACKUP_DIR/" 2>/dev/null
cp *.js "$BACKUP_DIR/" 2>/dev/null
print_status "Scripts respaldados"

# 6. Backup de uploads/media
print_info "Respaldando archivos subidos..."
if [ -d "backend/uploads" ]; then
    cp -r backend/uploads "$BACKUP_DIR/"
    print_status "Archivos subidos respaldados"
fi

# 7. Crear archivo de información
cat > "$BACKUP_DIR/BACKUP_INFO.txt" << EOF
CATEMU CONECTA - INFORMACIÓN DE BACKUP
======================================
Fecha: $(date)
Timestamp: ${TIMESTAMP}
Usuario: $(whoami)
Sistema: $(uname -a)
Node Version: $(node -v)
NPM Version: $(npm -v)

Contenido:
- Base de datos SQLite
- Código fuente (sin node_modules)
- Configuración (.env)
- Documentación completa
- Scripts de utilidad
- Archivos subidos

Para restaurar:
1. Extraer contenido en carpeta nueva
2. Ejecutar: ./install-all.sh
3. Copiar .env del backup
4. Copiar database/ del backup
5. Ejecutar: ./start-complete.sh
EOF

# 8. Comprimir backup
print_info "Comprimiendo backup..."
tar -czf "backups/catemu_backup_${TIMESTAMP}.tar.gz" -C backups "backup_${TIMESTAMP}"
print_status "Backup comprimido: backups/catemu_backup_${TIMESTAMP}.tar.gz"

# 9. Calcular tamaño
SIZE=$(du -sh "backups/catemu_backup_${TIMESTAMP}.tar.gz" | cut -f1)

# 10. Limpiar directorio temporal
rm -rf "$BACKUP_DIR"

# 11. Opcional: Copiar a USB si está montado
if [ -d "/Volumes/BACKUP" ] || [ -d "/media/backup" ] || [ -d "/mnt/backup" ]; then
    print_info "USB detectado, copiando backup..."
    cp "backups/catemu_backup_${TIMESTAMP}.tar.gz" /Volumes/BACKUP/ 2>/dev/null || \
    cp "backups/catemu_backup_${TIMESTAMP}.tar.gz" /media/backup/ 2>/dev/null || \
    cp "backups/catemu_backup_${TIMESTAMP}.tar.gz" /mnt/backup/ 2>/dev/null
    print_status "Backup copiado a USB"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        ✅ BACKUP COMPLETADO                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📦 Archivo: backups/catemu_backup_${TIMESTAMP}.tar.gz"
echo "📏 Tamaño: ${SIZE}"
echo ""
echo "💡 Para restaurar:"
echo "   tar -xzf backups/catemu_backup_${TIMESTAMP}.tar.gz"
echo ""
echo "🔐 Guarda este backup en un lugar seguro!"