require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

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

            console.log('Conexión cerrada, reconectando:', shouldReconnect);

            if (shouldReconnect) {
                await delay(5000);
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado exitosamente!');
            console.log('📱 Envía cualquier mensaje para probar\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // MANEJO SIMPLE DE MENSAJES
    sock.ev.on('messages.upsert', async (m) => {
        console.log('📨 Evento messages.upsert recibido');
        
        if (m.type !== 'notify') return;
        
        for (const msg of m.messages) {
            // Ignorar mensajes de status
            if (msg.key.remoteJid === 'status@broadcast') continue;
            
            // Obtener información del mensaje
            const chatId = msg.key.remoteJid;
            const messageText = msg.message?.conversation || 
                              msg.message?.extendedTextMessage?.text || 
                              '';
            
            if (!messageText) continue;
            
            console.log(`💬 Mensaje recibido de ${chatId}: "${messageText}"`);
            
            // RESPONDER SIEMPRE
            try {
                const menuText = `👋 ¡Hola! Bot de prueba funcionando.

Recibí tu mensaje: "${messageText}"

MENÚ DE CATEMU CONECTA:
1️⃣ Reportar problema
2️⃣ Consultar estado
3️⃣ Encuestas
4️⃣ Información

Sistema funcionando correctamente ✅`;

                await sock.sendMessage(chatId, { text: menuText });
                console.log('✅ Respuesta enviada');
                
            } catch (error) {
                console.error('❌ Error enviando mensaje:', error);
            }
        }
    });
}

console.log('🚀 Iniciando bot de prueba...');
startBot().catch(console.error);