#!/usr/bin/env node

/**
 * Script para probar las respuestas del bot mejorado
 */

const MessageHandler = require('./whatsapp-bot/handlers/messageHandler-enhanced');

const handler = new MessageHandler();

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╔══════════════════════════════════════════════╗
║     🧪 TEST DE RESPUESTAS DEL BOT            ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

async function testMessage(message, description) {
    console.log(`\n${colors.yellow}📱 Probando: ${description}${colors.reset}`);
    console.log(`${colors.blue}Usuario dice: "${message}"${colors.reset}`);
    
    const response = await handler.handleMessage({
        from: '56912345678@s.whatsapp.net',
        body: message,
        senderName: 'Usuario Test'
    });
    
    console.log(`${colors.green}Bot responde:${colors.reset}`);
    console.log(response.replace(/\*/g, ''));
    console.log('-'.repeat(50));
}

async function runTests() {
    // Test de saludos
    await testMessage('Hola', 'Saludo inicial');
    
    // Test de ayuda
    await testMessage('ayuda', 'Menú de ayuda');
    
    // Test de reporte directo
    await testMessage('Hay un bache enorme en calle O\'Higgins 234', 'Reporte directo de bache');
    
    // Test de basura
    await testMessage('El contenedor de basura está desbordado en la plaza', 'Problema de basura');
    
    // Test de urgencia
    await testMessage('URGENTE! Semáforo dañado en cruce peligroso', 'Reporte urgente');
    
    // Test de puntos
    await testMessage('Cuántos puntos tengo?', 'Consulta de puntos');
    
    // Test de horarios
    await testMessage('Horarios de atención', 'Información municipal');
    
    // Test de estado
    await testMessage('Ver mis reportes', 'Estado de reportes');
    
    // Test genérico
    await testMessage('necesito ayuda con algo', 'Mensaje genérico');
    
    console.log(`\n${colors.cyan}✅ Tests completados${colors.reset}\n`);
}

// Ejecutar tests
runTests().catch(console.error);