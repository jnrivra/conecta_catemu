#!/usr/bin/env node

/**
 * Test directo del handler sin WhatsApp
 */

const MessageHandler = require('./handlers/messageHandler-fixed');

const handler = new MessageHandler();

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╔══════════════════════════════════════════════╗
║     🧪 TEST DIRECTO DEL HANDLER              ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

async function testHandler() {
    const userId = '56912345678@s.whatsapp.net';
    const userName = 'Usuario Test';
    
    console.log(`${colors.yellow}━━━━━ TEST 1: Reporte simple ━━━━━${colors.reset}\n`);
    
    try {
        const response1 = await handler.handleMessage({
            from: userId,
            body: 'Hay un bache en la calle',
            senderName: userName
        });
        
        console.log(`${colors.blue}👤 Usuario:${colors.reset} "Hay un bache en la calle"`);
        console.log(`${colors.green}🤖 Bot responde:${colors.reset}\n${response1}\n`);
        
        // Si pidió ubicación, enviarla
        if (response1.includes('UBICACIÓN NECESARIA')) {
            console.log(`${colors.yellow}━━━━━ TEST 2: Enviando ubicación ━━━━━${colors.reset}\n`);
            
            const response2 = await handler.handleMessage({
                from: userId,
                body: 'Av. O\'Higgins 123',
                senderName: userName
            });
            
            console.log(`${colors.blue}👤 Usuario:${colors.reset} "Av. O'Higgins 123"`);
            console.log(`${colors.green}🤖 Bot responde:${colors.reset}\n${response2}\n`);
        }
        
    } catch (error) {
        console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
        console.error('Stack:', error.stack);
    }
    
    // Limpiar estado para próxima prueba
    handler.userStates.clear();
    
    console.log(`${colors.yellow}━━━━━ TEST 3: Reporte con ubicación incluida ━━━━━${colors.reset}\n`);
    
    try {
        const response3 = await handler.handleMessage({
            from: userId,
            body: 'Hay basura acumulada en Plaza de Armas',
            senderName: userName
        });
        
        console.log(`${colors.blue}👤 Usuario:${colors.reset} "Hay basura acumulada en Plaza de Armas"`);
        console.log(`${colors.green}🤖 Bot responde:${colors.reset}\n${response3}\n`);
        
    } catch (error) {
        console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    }
    
    console.log(`${colors.cyan}✅ Tests completados${colors.reset}\n`);
}

// Ejecutar tests
testHandler().catch(error => {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
});