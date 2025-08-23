#!/bin/bash

# 📱 CONFIGURACIÓN DE NUEVO NÚMERO WHATSAPP - CATEMU CONECTA

echo "
╔══════════════════════════════════════════════╗
║    📱 CONFIGURAR NUEVO WHATSAPP BOT          ║
╚══════════════════════════════════════════════╝
"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. SOLICITAR NUEVO NÚMERO
echo ""
print_info "Ingresa el nuevo número de WhatsApp"
echo -e "${YELLOW}Formato: código país + número (sin + ni espacios)${NC}"
echo -e "${YELLOW}Ejemplo Chile: 56912345678${NC}"
echo ""
read -p "Número WhatsApp: " PHONE_NUMBER

# Validar formato básico
if [[ ! "$PHONE_NUMBER" =~ ^[0-9]{10,15}$ ]]; then
    print_error "Formato de número inválido"
    exit 1
fi

print_status "Número configurado: $PHONE_NUMBER"

# 2. HACER BACKUP DE SESIÓN ANTERIOR (por si acaso)
if [ -d "whatsapp-bot/sessions/auth_info" ]; then
    print_info "Respaldando sesión anterior..."
    BACKUP_DIR="whatsapp-bot/sessions_backup_$(date +%Y%m%d_%H%M%S)"
    mv whatsapp-bot/sessions "$BACKUP_DIR"
    print_status "Sesión anterior respaldada en: $BACKUP_DIR"
else
    print_info "No hay sesión anterior"
fi

# 3. CREAR NUEVA CARPETA DE SESIÓN
print_info "Creando nueva carpeta de sesión..."
mkdir -p whatsapp-bot/sessions
print_status "Carpeta de sesión creada"

# 4. ACTUALIZAR .env
print_info "Actualizando configuración..."

# Verificar si existe .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_status "Archivo .env creado desde template"
fi

# Actualizar número en .env
if grep -q "BOT_PHONE_NUMBER=" .env; then
    # Si existe, actualizar
    sed -i.bak "s/BOT_PHONE_NUMBER=.*/BOT_PHONE_NUMBER=$PHONE_NUMBER/" .env
else
    # Si no existe, agregar
    echo "BOT_PHONE_NUMBER=$PHONE_NUMBER" >> .env
fi

print_status "Configuración actualizada"

# 5. CREAR SCRIPT DE INICIO DEL BOT
cat > start-whatsapp-bot.js << 'EOF'
#!/usr/bin/env node

/**
 * Inicializador de WhatsApp Bot con nuevo QR
 */

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.green.bold(`
╔══════════════════════════════════════════════╗
║       🤖 INICIANDO WHATSAPP BOT              ║
╚══════════════════════════════════════════════╝
`));

console.log(chalk.yellow('📱 Preparando para generar código QR...'));
console.log(chalk.yellow('📸 Ten tu WhatsApp listo para escanear\n'));

// Cambiar al directorio del bot
process.chdir(path.join(__dirname, 'whatsapp-bot'));

// Iniciar el bot
const bot = spawn('node', ['index.js'], {
    stdio: 'inherit',
    env: { ...process.env, FORCE_NEW_SESSION: 'true' }
});

bot.on('error', (error) => {
    console.error(chalk.red('❌ Error iniciando bot:'), error);
});

bot.on('exit', (code) => {
    if (code !== 0) {
        console.log(chalk.red(`❌ Bot terminó con código: ${code}`));
    }
});

// Manejar Ctrl+C
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Deteniendo bot...'));
    bot.kill();
    process.exit();
});
EOF

chmod +x start-whatsapp-bot.js
print_status "Script de inicio creado"

# 6. MODIFICAR EL ARCHIVO DEL BOT PARA FORZAR NUEVO QR
print_info "Configurando bot para generar nuevo QR..."

# Crear archivo de configuración temporal
cat > whatsapp-bot/force-new-session.js << 'EOF'
// Archivo temporal para forzar nueva sesión
module.exports = {
    forceNewSession: true,
    phoneNumber: process.env.BOT_PHONE_NUMBER
};
EOF

# 7. INSTRUCCIONES FINALES
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         ✅ CONFIGURACIÓN COMPLETA            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Número configurado: $PHONE_NUMBER${NC}"
echo ""
echo -e "${YELLOW}📱 PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Asegúrate de tener WhatsApp abierto en tu teléfono"
echo "2. Ve a: Configuración > Dispositivos vinculados"
echo "3. Ejecuta el bot con uno de estos comandos:"
echo ""
echo -e "${GREEN}   node start-whatsapp-bot.js${NC}"
echo -e "   ${BLUE}o${NC}"
echo -e "${GREEN}   cd whatsapp-bot && npm start${NC}"
echo ""
echo "4. Escanea el código QR que aparecerá"
echo "5. Espera a que diga 'Bot conectado'"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "- El QR expira en 60 segundos"
echo "- Si falla, ejecuta de nuevo"
echo "- El bot guardará la sesión para futuros inicios"
echo ""
echo -e "${BLUE}💡 Para probar el bot:${NC}"
echo "1. Envía 'Hola' al número del bot"
echo "2. El bot debería responder automáticamente"
echo ""

# 8. PREGUNTAR SI INICIAR AHORA
echo ""
read -p "¿Quieres iniciar el bot ahora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Iniciando WhatsApp Bot..."
    echo ""
    echo -e "${YELLOW}🔄 GENERANDO CÓDIGO QR...${NC}"
    echo ""
    node start-whatsapp-bot.js
else
    print_info "Puedes iniciar el bot más tarde con:"
    echo "   node start-whatsapp-bot.js"
fi