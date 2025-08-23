require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/auth_info');
    
    console.log('📱 Creando conexión con WhatsApp...');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        // Agregar logs detallados
        logger: {
            level: 'debug',
            log: (level, message) => {
                if (level === 'debug' && message.includes('recv')) {
                    console.log('📥 Recibiendo:', message.substring(0, 100));
                }
            }
        }
    });

    // Guardar socket globalmente para testing
    global.sock = sock;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n🔄 ESCANEA EL CÓDIGO QR CON WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('❌ Conexión cerrada, reconectando:', shouldReconnect);

            if (shouldReconnect) {
                await delay(5000);
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n✅ ¡BOT CONECTADO Y LISTO!');
            console.log('📱 WhatsApp Web activo');
            console.log('👤 Número del bot:', sock.user?.id);
            console.log('\n📨 Envía cualquier mensaje para probar...\n');
            console.log('='.'='.repeat(40));
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // TODOS los eventos de mensajes
    sock.ev.on('messages.upsert', async (m) => {
        console.log('\n🔔 EVENTO RECIBIDO:', m.type);
        console.log('📦 Cantidad de mensajes:', m.messages.length);
        
        for (const msg of m.messages) {
            console.log('---');
            console.log('🔑 Key:', JSON.stringify(msg.key));
            
            // Info del mensaje
            const chatId = msg.key.remoteJid;
            const isFromMe = msg.key.fromMe;
            const messageType = Object.keys(msg.message || {})[0];
            
            console.log('💬 Tipo de mensaje:', messageType);
            console.log('👤 De:', chatId);
            console.log('🤖 Es mío?:', isFromMe);
            
            // Ignorar mensajes propios y de status
            if (chatId === 'status@broadcast') {
                console.log('⏭️ Ignorando status broadcast');
                continue;
            }
            
            // Obtener texto del mensaje
            let messageText = '';
            if (msg.message) {
                messageText = msg.message.conversation || 
                             msg.message.extendedTextMessage?.text || 
                             msg.message.imageMessage?.caption ||
                             msg.message.videoMessage?.caption ||
                             '';
            }
            
            if (messageText) {
                console.log('📝 Texto:', messageText);
                
                // SIEMPRE responder (excepto a mensajes propios)
                if (!isFromMe) {
                    console.log('📤 Enviando respuesta...');
                    
                    try {
                        const response = `🤖 *BOT FUNCIONANDO*

✅ Mensaje recibido: "${messageText}"

*MENÚ CATEMU CONECTA:*
1️⃣ Reportar problema urbano
2️⃣ Consultar estado de reporte  
3️⃣ Responder encuesta
4️⃣ Información municipal

_Sistema con IA activado_`;

                        await sock.sendMessage(chatId, { text: response });
                        console.log('✅ RESPUESTA ENVIADA EXITOSAMENTE');
                        
                    } catch (error) {
                        console.error('❌ ERROR enviando:', error.message);
                    }
                }
            } else {
                console.log('⚠️ Mensaje sin texto');
            }
        }
        console.log('='.'='.repeat(40));
    });

    // Capturar TODOS los eventos
    sock.ev.on('messages.update', (messages) => {
        console.log('📝 Actualización de mensaje:', messages.length);
    });

    sock.ev.on('message-receipt.update', (receipts) => {
        console.log('✓ Recibo de mensaje:', receipts.length);
    });

    sock.ev.on('presence.update', (presence) => {
        console.log('👁️ Presencia actualizada');
    });
}

console.log('='.'='.repeat(40));
console.log('🚀 INICIANDO BOT DE PRUEBA CATEMU CONECTA');
console.log('='.'='.repeat(40));
startBot().catch(console.error);

// Función helper para enviar mensaje manual
global.sendTest = async (number, text) => {
    if (global.sock) {
        await global.sock.sendMessage(`${number}@s.whatsapp.net`, { text });
        console.log('Mensaje de prueba enviado');
    }
};