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
