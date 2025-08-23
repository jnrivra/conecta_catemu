#!/usr/bin/env node

/**
 * WhatsApp Bot Enhanced - Con mejor manejo de sesiones
 * CatemuConecta - Hackathon Version
 */

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Importar handlers y servicios
const MessageHandler = require('./handlers/messageHandler');
const AnthropicService = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('YOUR-KEY') 
    ? require('./services/anthropic')
    : require('./services/anthropic-mock');
const DatabaseService = require('./services/database');
const BackendAPI = require('./services/api');
const SecurityConfig = require('./config/security');
const MessageLogger = require('./services/message-logger');

// Configuración de logger
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Verificar si se debe forzar nueva sesión
const FORCE_NEW_SESSION = process.env.FORCE_NEW_SESSION === 'true' || process.argv.includes('--new-session');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.messageHandler = new MessageHandler();
        this.anthropicService = new AnthropicService();
        this.databaseService = new DatabaseService();
        this.backendAPI = new BackendAPI();
        this.messageLogger = new MessageLogger();
        this.isConnected = false;
        this.sessionId = `session-${Date.now()}`;
        this.phoneNumber = process.env.BOT_PHONE_NUMBER || 'No configurado';
        this.qrCount = 0;
    }

    async clearSession() {
        console.log(chalk.yellow('🗑️  Limpiando sesión anterior...'));
        const sessionPath = './sessions/auth_info';
        
        if (fs.existsSync(sessionPath)) {
            // Hacer backup antes de borrar
            const backupPath = `./sessions_backup_${Date.now()}`;
            fs.renameSync('./sessions', backupPath);
            console.log(chalk.green(`✅ Sesión anterior respaldada en: ${backupPath}`));
        }
        
        // Crear nueva carpeta de sesión
        fs.mkdirSync('./sessions/auth_info', { recursive: true });
        console.log(chalk.green('✅ Carpeta de sesión limpia creada'));
    }

    async start() {
        console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════╗
║       🤖 CATEMU CONECTA - WHATSAPP BOT       ║
╚══════════════════════════════════════════════╝
        `));

        console.log(chalk.yellow(`📱 Número configurado: ${this.phoneNumber}`));
        console.log(chalk.yellow(`🔧 Modo: ${process.env.NODE_ENV || 'development'}\n`));

        // Limpiar sesión si se solicita
        if (FORCE_NEW_SESSION) {
            await this.clearSession();
        }

        const { state, saveCreds } = await useMultiFileAuthState('./sessions/auth_info');
        
        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: false, // Lo manejaremos manualmente
            logger,
            browser: ['CatemuConecta Bot', 'Chrome', '120.0.0'],
            defaultQueryTimeoutMs: undefined,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            fireInitQueries: false,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            getMessage: async (key) => {
                return {
                    conversation: 'Mensaje no disponible'
                };
            }
        });

        // Manejar actualización de credenciales
        this.sock.ev.on('creds.update', saveCreds);

        // Manejar eventos de conexión
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Manejar código QR
            if (qr) {
                this.qrCount++;
                console.clear();
                console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════╗
║           📱 ESCANEA EL CÓDIGO QR            ║
╚══════════════════════════════════════════════╝
                `));
                
                console.log(chalk.yellow(`
Instrucciones:
1. Abre WhatsApp en tu teléfono
2. Ve a Configuración > Dispositivos vinculados
3. Toca "Vincular dispositivo"
4. Escanea este código QR:
                `));

                // Mostrar QR en terminal
                qrcode.generate(qr, { small: true });
                
                console.log(chalk.yellow(`
⏱️  El código expira en ${60 - (this.qrCount * 20)} segundos...
                `));

                // También guardar QR como texto por si necesitas compartirlo
                fs.writeFileSync('./sessions/last-qr.txt', qr);
                console.log(chalk.gray(`💾 QR guardado en: ./sessions/last-qr.txt`));
            }

            // Conexión exitosa
            if (connection === 'open') {
                this.isConnected = true;
                this.qrCount = 0;
                
                console.clear();
                console.log(chalk.green.bold(`
╔══════════════════════════════════════════════╗
║         ✅ BOT CONECTADO EXITOSAMENTE        ║
╚══════════════════════════════════════════════╝
                `));

                const botInfo = this.sock.user;
                console.log(chalk.green(`
📱 Número: ${botInfo?.id.split(':')[0] || 'Desconocido'}
🤖 Nombre: ${botInfo?.name || process.env.BOT_NAME}
🟢 Estado: En línea
📅 Sesión: ${this.sessionId}
                `));

                // Notificar al backend
                await this.backendAPI.updateBotStatus({
                    isConnected: true,
                    phone: botInfo?.id.split(':')[0],
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                }).catch(console.error);

                console.log(chalk.cyan('\n💬 Esperando mensajes...'));
                console.log(chalk.gray('Envía "Hola" al bot para probar\n'));
            }

            // Conexión cerrada
            if (connection === 'close') {
                this.isConnected = false;
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

                if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                    console.log(chalk.red('❌ Sesión cerrada. Necesitas escanear el QR nuevamente.'));
                    await this.clearSession();
                } else if (shouldReconnect) {
                    console.log(chalk.yellow('🔄 Reconectando...'));
                    await delay(5000);
                    await this.start();
                } else {
                    console.log(chalk.red('❌ Error de conexión no recuperable'));
                    process.exit(1);
                }
            }

            // Conectando
            if (connection === 'connecting') {
                console.log(chalk.yellow('🔄 Conectando al servidor de WhatsApp...'));
            }
        });

        // Manejar mensajes
        this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                // Ignorar mensajes propios
                if (msg.key.fromMe) continue;

                // Procesar mensaje
                await this.handleMessage(msg);
            }
        });

        // Manejar errores
        this.sock.ev.on('error', (error) => {
            console.error(chalk.red('❌ Error del bot:'), error);
        });

        // Información del sistema
        console.log(chalk.gray(`
Sistema:
- Base de datos: ${this.databaseService.isConnected() ? '✅' : '❌'}
- API Backend: ${process.env.REACT_APP_API_URL || 'http://localhost:3001'}
- IA: ${process.env.ANTHROPIC_API_KEY ? 'Claude' : 'Mock (Demo)'}
        `));
    }

    async handleMessage(msg) {
        try {
            const messageContent = msg.message?.conversation || 
                                 msg.message?.extendedTextMessage?.text || 
                                 '';
            
            if (!messageContent) return;

            const sender = msg.key.remoteJid;
            const senderNumber = sender.split('@')[0];
            
            console.log(chalk.blue(`\n📨 Mensaje recibido de ${senderNumber}:`));
            console.log(chalk.white(`   "${messageContent}"`));

            // Loguear mensaje
            await this.messageLogger.logMessage({
                chat_id: sender,
                sender_number: senderNumber,
                message_type: 'text',
                message_content: messageContent,
                direction: 'incoming'
            });

            // Procesar con el handler
            const response = await this.messageHandler.handleMessage({
                from: sender,
                body: messageContent,
                senderName: msg.pushName || 'Ciudadano'
            });

            if (response) {
                // Enviar respuesta
                await this.sock.sendMessage(sender, { text: response });
                
                console.log(chalk.green(`✅ Respuesta enviada:`));
                console.log(chalk.white(`   "${response.substring(0, 100)}..."`));

                // Loguear respuesta
                await this.messageLogger.logMessage({
                    chat_id: sender,
                    sender_number: 'bot',
                    message_type: 'text',
                    message_content: response,
                    direction: 'outgoing'
                });
            }
        } catch (error) {
            console.error(chalk.red('❌ Error procesando mensaje:'), error);
        }
    }

    async stop() {
        console.log(chalk.yellow('\n👋 Deteniendo bot...'));
        
        if (this.sock) {
            await this.sock.logout();
        }
        
        await this.databaseService.close();
        
        console.log(chalk.green('✅ Bot detenido correctamente'));
        process.exit(0);
    }
}

// Iniciar bot
const bot = new WhatsAppBot();

// Manejar señales de terminación
process.on('SIGINT', async () => {
    await bot.stop();
});

process.on('SIGTERM', async () => {
    await bot.stop();
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Error no capturado:'), error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Promesa rechazada:'), reason);
});

// Iniciar
bot.start().catch((error) => {
    console.error(chalk.red('❌ Error fatal:'), error);
    process.exit(1);
});