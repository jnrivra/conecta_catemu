#!/usr/bin/env node

/**
 * Test rápido de configuración de WhatsApp
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════╗
║     🧪 TEST DE CONFIGURACIÓN WHATSAPP        ║
╚══════════════════════════════════════════════╝
`);

let allGood = true;

// 1. Verificar .env
console.log('\n📋 Verificando configuración...');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('BOT_PHONE_NUMBER=')) {
        const phoneMatch = envContent.match(/BOT_PHONE_NUMBER=(\d+)/);
        if (phoneMatch) {
            console.log('✅ Número configurado:', phoneMatch[1]);
        } else {
            console.log('⚠️  Número no configurado en .env');
            allGood = false;
        }
    } else {
        console.log('⚠️  BOT_PHONE_NUMBER no encontrado en .env');
        allGood = false;
    }
} else {
    console.log('❌ Archivo .env no existe');
    allGood = false;
}

// 2. Verificar carpeta de sesiones
console.log('\n📁 Verificando sesiones...');
const sessionPath = 'whatsapp-bot/sessions';
if (fs.existsSync(sessionPath)) {
    const hasAuthInfo = fs.existsSync(path.join(sessionPath, 'auth_info'));
    if (hasAuthInfo) {
        const files = fs.readdirSync(path.join(sessionPath, 'auth_info'));
        if (files.length > 0) {
            console.log('✅ Sesión existente encontrada (' + files.length + ' archivos)');
            console.log('   ℹ️  No necesitarás escanear QR si la sesión es válida');
        } else {
            console.log('⚠️  Carpeta de sesión vacía - necesitarás QR');
        }
    } else {
        console.log('⚠️  No hay sesión guardada - necesitarás escanear QR');
    }
} else {
    console.log('⚠️  Carpeta de sesiones no existe - se creará al iniciar');
}

// 3. Verificar archivos del bot
console.log('\n📦 Verificando archivos del bot...');
const requiredFiles = [
    'whatsapp-bot/index.js',
    'whatsapp-bot/index-enhanced.js',
    'whatsapp-bot/package.json',
    'whatsapp-bot/handlers/messageHandler.js'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log('✅', path.basename(file));
    } else {
        console.log('❌', file, 'no encontrado');
        allGood = false;
    }
});

// 4. Verificar scripts
console.log('\n🔧 Scripts disponibles:');
if (fs.existsSync('setup-new-whatsapp.sh')) {
    console.log('✅ setup-new-whatsapp.sh (configuración guiada)');
} else {
    console.log('⚠️  setup-new-whatsapp.sh no encontrado');
}

if (fs.existsSync('start-whatsapp-bot.js')) {
    console.log('✅ start-whatsapp-bot.js (inicio rápido)');
}

// 5. Resumen
console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('✅ SISTEMA LISTO PARA CONFIGURAR WHATSAPP');
    console.log('\nPróximos pasos:');
    console.log('1. Ejecuta: ./setup-new-whatsapp.sh');
    console.log('2. Ingresa tu número de teléfono');
    console.log('3. Escanea el código QR');
    console.log('4. ¡Listo!');
} else {
    console.log('⚠️  HAY ALGUNOS PROBLEMAS A RESOLVER');
    console.log('\nRecomendaciones:');
    console.log('1. Crea el archivo .env desde .env.example');
    console.log('2. Ejecuta: ./setup-new-whatsapp.sh');
}

console.log('\n💡 Para más ayuda:');
console.log('   Ver: DOCUMENTACION-COMPLETA/whatsapp-quick-setup.md');
console.log('');