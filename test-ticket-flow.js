#!/usr/bin/env node

/**
 * Test del flujo completo con tickets
 */

const MessageHandler = require('./whatsapp-bot/handlers/messageHandler-fixed');

const handler = new MessageHandler();

// Colores
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

console.log(`${colors.cyan}
╔══════════════════════════════════════════════╗
║     🎫 TEST DE FLUJO CON TICKETS             ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

async function simulateConversation() {
    const userId = '56912345678@s.whatsapp.net';
    const userName = 'Juan Pérez';
    
    console.log(`${colors.magenta}\n━━━━━ ESCENARIO 1: Reporte con ubicación ━━━━━${colors.reset}`);
    
    // Test 1: Reporte directo con ubicación
    let response = await handler.handleMessage({
        from: userId,
        body: 'Hay un bache enorme en Av. O\'Higgins 234',
        senderName: userName
    });
    
    console.log(`${colors.blue}👤 Usuario:${colors.reset} "Hay un bache enorme en Av. O'Higgins 234"`);
    console.log(`${colors.green}🤖 Bot:${colors.reset}\n${response}\n`);
    
    console.log(`${colors.magenta}\n━━━━━ ESCENARIO 2: Reporte sin ubicación ━━━━━${colors.reset}`);
    
    // Reset estado para nuevo test
    handler.userStates.clear();
    
    // Test 2: Reporte sin ubicación
    response = await handler.handleMessage({
        from: userId,
        body: 'El semáforo no funciona',
        senderName: userName
    });
    
    console.log(`${colors.blue}👤 Usuario:${colors.reset} "El semáforo no funciona"`);
    console.log(`${colors.green}🤖 Bot:${colors.reset}\n${response}\n`);
    
    // Usuario da ubicación
    response = await handler.handleMessage({
        from: userId,
        body: 'Está en el cruce de San Martín con Comercio',
        senderName: userName
    });
    
    console.log(`${colors.blue}👤 Usuario:${colors.reset} "Está en el cruce de San Martín con Comercio"`);
    console.log(`${colors.green}🤖 Bot:${colors.reset}\n${response}\n`);
    
    console.log(`${colors.magenta}\n━━━━━ ESCENARIO 3: Usuario cancela ━━━━━${colors.reset}`);
    
    // Reset para nuevo test
    handler.userStates.clear();
    
    // Inicia reporte
    response = await handler.handleMessage({
        from: userId,
        body: 'Quiero reportar basura',
        senderName: userName
    });
    
    console.log(`${colors.blue}👤 Usuario:${colors.reset} "Quiero reportar basura"`);
    console.log(`${colors.green}🤖 Bot:${colors.reset}\n${response}\n`);
    
    // Cancela
    response = await handler.handleMessage({
        from: userId,
        body: 'cancelar',
        senderName: userName
    });
    
    console.log(`${colors.blue}👤 Usuario:${colors.reset} "cancelar"`);
    console.log(`${colors.green}🤖 Bot:${colors.reset}\n${response}\n`);
    
    console.log(`${colors.magenta}\n━━━━━ ESCENARIO 4: Reporte urgente ━━━━━${colors.reset}`);
    
    // Reset
    handler.userStates.clear();
    
    response = await handler.handleMessage({
        from: userId,
        body: 'URGENTE! Fuga de agua en calle Principal 456',
        senderName: userName
    });
    
    console.log(`${colors.blue}👤 Usuario:${colors.reset} "URGENTE! Fuga de agua en calle Principal 456"`);
    console.log(`${colors.green}🤖 Bot:${colors.reset}\n${response}\n`);
    
    console.log(`${colors.cyan}\n✅ Tests completados${colors.reset}\n`);
}

// Ejecutar simulación
simulateConversation().catch(console.error);