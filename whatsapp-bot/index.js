require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

// Importar handlers y servicios
const MessageHandler = require('./handlers/messageHandler-fixed');
// Detectar si hay API key real o usar mock
const AnthropicService = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('YOUR-KEY') 
    ? require('./services/anthropic')
    : require('./services/anthropic-mock');
const DatabaseService = require('./services/database');
const BackendAPI = require('./services/api');
const SecurityConfig = require('./config/security');
const MessageLogger = require('./services/message-logger');

// Configuración de logger
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

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
    }

    async start() {
        const { state, saveCreds } = await useMultiFileAuthState('./sessions/auth_info');
        
        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger,
            browser: ['CatemuConecta Bot', 'Chrome', '120.0.0'],
            defaultQueryTimeoutMs: undefined,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            fireInitQueries: false,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true
        });

        // Manejar actualización de conexión
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n🔄 ESCANEA EL CÓDIGO QR CON WHATSAPP:\n');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
                    : true;

                console.log('❌ Conexión cerrada debido a:', lastDisconnect?.error, ', reconectando:', shouldReconnect);

                if (shouldReconnect) {
                    await delay(5000);
                    this.start();
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                console.log('✅ Bot de WhatsApp conectado exitosamente!');
                console.log('📱 Nombre del bot:', process.env.BOT_NAME);
                console.log('🤖 IA activa con modelo:', process.env.AI_MODEL);
                console.log('🌐 Backend API:', process.env.BACKEND_API_URL);
                
                // Registrar sesión activa
                try {
                    await this.messageLogger.logBotSession({
                        session_id: this.sessionId,
                        status: 'connected',
                        phone_number: this.sock.user?.id
                    });
                } catch (error) {
                    console.error('Error registrando sesión:', error);
                }
                
                // Mostrar estado de seguridad
                if (SecurityConfig.SAFE_MODE) {
                    console.log('🔒 MODO SEGURO ACTIVO - Solo enviará mensajes a números de prueba');
                    console.log('📋 Números de prueba:', SecurityConfig.TEST_NUMBERS.join(', ') || 'Ninguno configurado');
                } else {
                    console.log('⚠️  MODO PRODUCCIÓN - Enviará mensajes reales');
                    if (SecurityConfig.WHITELIST.length > 0) {
                        console.log('📋 Whitelist activa con', SecurityConfig.WHITELIST.length, 'números');
                    }
                }
                
                console.log('\n⏳ Esperando mensajes...\n');
                
                // Enviar mensaje a administradores (con validación de seguridad)
                if (!SecurityConfig.SAFE_MODE) {
                    this.notifyAdmins('🚀 Bot CatemuConecta iniciado y listo para recibir reportes ciudadanos!');
                }
            }
        });

        // Guardar credenciales
        this.sock.ev.on('creds.update', saveCreds);

        // Manejar mensajes entrantes
        this.sock.ev.on('messages.upsert', async (m) => {
            try {
                // IMPORTANTE: Solo procesar mensajes nuevos, no históricos
                if (m.type !== 'notify') return;
                
                console.log('📨 Mensaje recibido:', m.type);
                const msg = m.messages[0];
                if (!msg.message) return;
                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;
                
                // Ignorar mensajes antiguos (más de 1 minuto)
                const messageTimestamp = msg.messageTimestamp;
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime - messageTimestamp > 60) {
                    console.log('⏭️ Ignorando mensaje antiguo');
                    return;
                }
                
                // No ignorar mensajes propios durante testing
                // if (msg.key.fromMe && !msg.key.participant) return;

                await this.handleMessage(msg);
            } catch (error) {
                console.error('Error procesando mensaje:', error);
            }
        });

        // Manejar actualizaciones de mensajes (reacciones, ediciones)
        this.sock.ev.on('messages.update', async (messages) => {
            for (const msg of messages) {
                if (msg.update?.pollUpdates) {
                    // Manejar respuestas a encuestas
                    await this.handlePollResponse(msg);
                }
            }
        });

        // Manejar eventos de grupos
        this.sock.ev.on('group-participants.update', async (update) => {
            if (update.action === 'add' && update.participants.includes(this.sock.user.id.split(':')[0] + '@s.whatsapp.net')) {
                await this.sock.sendMessage(update.id, {
                    text: `👋 ¡Hola! Soy ${process.env.BOT_NAME}, el asistente virtual de la Municipalidad de Catemu.\n\n` +
                          `Estoy aquí para ayudar con:\n` +
                          `📍 Reportes de problemas urbanos\n` +
                          `📊 Encuestas municipales\n` +
                          `❓ Consultas sobre servicios\n\n` +
                          `Escribe *hola* para comenzar o *ayuda* para ver todos los comandos.`
                });
            }
        });
    }

    async handleMessage(msg) {
        const chatId = msg.key.remoteJid;
        const message = msg.message;
        const messageText = message.conversation || 
                          message.extendedTextMessage?.text || 
                          message.imageMessage?.caption ||
                          message.videoMessage?.caption || '';
        
        const senderNumber = msg.key.participant || msg.key.remoteJid;
        const senderName = msg.pushName || 'Usuario';

        console.log(`📨 Mensaje de ${senderName} (${senderNumber}): ${messageText.substring(0, 50)}...`);
        
        // Registrar mensaje entrante
        try {
            await this.messageLogger.logIncomingMessage(msg);
            await this.messageLogger.updateAnalytics('messages_received');
        } catch (error) {
            console.error('Error registrando mensaje:', error);
        }

        // Respuesta simple para testing
        if (messageText.toLowerCase().includes('hola')) {
            const responseText = `👋 *¡Hola ${senderName}!*\n\n` +
                `Soy el asistente virtual de la\n` +
                `*MUNICIPALIDAD DE CATEMU* 🏛️\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `📌 *¿QUÉ DESEA HACER HOY?*\n\n` +
                `*Escriba solo el NÚMERO:*\n\n` +
                `1️⃣ *Reportar un problema*\n` +
                `   _Baches, basura, luces apagadas_\n\n` +
                `2️⃣ *Ver mis reportes anteriores*\n` +
                `   _Consultar estado de sus reportes_\n\n` +
                `3️⃣ *Responder encuesta rápida*\n` +
                `   _3 preguntas, 30 segundos_\n\n` +
                `4️⃣ *Información de la Municipalidad*\n` +
                `   _Horarios, teléfonos, direcciones_\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `✏️ *ESCRIBA 1, 2, 3 o 4*\n\n` +
                `💡 _Ejemplo: Si quiere reportar un_\n` +
                `_problema, escriba solo el número 1_`;
            
            await this.sock.sendMessage(chatId, {
                text: responseText
            });
            
            // Registrar mensaje saliente
            try {
                await this.messageLogger.logOutgoingMessage(chatId, responseText);
                await this.messageLogger.updateAnalytics('messages_sent');
            } catch (error) {
                console.error('Error registrando respuesta:', error);
            }
            
            return;
        }

        try {
            console.log('🔄 Procesando mensaje con handler mejorado...');
            console.log('  From:', senderNumber);
            console.log('  Body:', messageText);
            console.log('  Name:', senderName);
            
            // Procesar mensaje con el handler mejorado
            const response = await this.messageHandler.handleMessage({
                from: senderNumber,
                body: messageText,
                senderName: senderName
            });
            
            console.log('✅ Respuesta generada:', response ? response.substring(0, 100) + '...' : 'Sin respuesta');
            
            // Enviar respuesta si hay una
            if (response) {
                await this.sock.sendMessage(chatId, {
                    text: response
                });
                
                // Registrar mensaje saliente
                try {
                    await this.messageLogger.logOutgoingMessage(chatId, response);
                    await this.messageLogger.updateAnalytics('messages_sent');
                } catch (error) {
                    console.error('Error registrando respuesta:', error);
                }
            }

            // Marcar mensaje como leído
            await this.sock.readMessages([msg.key]);
            
        } catch (error) {
            console.error('❌ Error detallado en handleMessage:', error);
            console.error('Stack trace:', error.stack);
            await this.sock.sendMessage(chatId, {
                text: '❌ Ocurrió un error procesando tu mensaje. Por favor, intenta nuevamente.',
                quoted: msg
            });
        }
    }

    async handlePollResponse(msg) {
        // Implementar manejo de respuestas a encuestas tipo poll
        console.log('📊 Respuesta a encuesta recibida:', msg);
    }

    async notifyAdmins(message) {
        // VALIDACIÓN DE SEGURIDAD - Solo enviar a números configurados
        const adminNumbers = process.env.ADMIN_NUMBERS?.split(',') || [];
        const validatedNumbers = adminNumbers.filter(num => {
            // Validar formato de número chileno (569XXXXXXXX)
            const cleanNum = num.trim();
            const isValid = /^569\d{8}$/.test(cleanNum);
            if (!isValid) {
                console.warn(`⚠️ Número de admin inválido ignorado: ${cleanNum}`);
            }
            return isValid;
        });
        
        console.log(`📧 Enviando notificación a ${validatedNumbers.length} admins válidos`);
        
        for (const number of validatedNumbers) {
            try {
                // Solo enviar si el bot está conectado
                if (this.isConnected) {
                    await this.sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
                    console.log(`✅ Notificación enviada a admin: ${number}`);
                }
            } catch (error) {
                console.error(`❌ Error notificando admin ${number}:`, error);
            }
        }
    }

    async stop() {
        this.isConnected = false;
        store?.writeToFile('./sessions/baileys_store.json');
        await this.sock?.end();
        console.log('Bot detenido correctamente');
    }
}

// Iniciar bot
const bot = new WhatsAppBot();

// Manejar señales de terminación
process.on('SIGINT', async () => {
    console.log('\n⏹️ Deteniendo bot...');
    await bot.stop();
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
    if (err.message.includes('Connection Closed') || err.message.includes('ECONNRESET')) {
        console.log('Reconectando en 5 segundos...');
        setTimeout(() => bot.start(), 5000);
    }
});

// Iniciar
console.log('🚀 Iniciando CatemuConecta WhatsApp Bot...');
bot.start().catch(console.error);