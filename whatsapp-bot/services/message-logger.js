const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

class MessageLogger {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '../../database/catemu.db'));
    this.backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
  }

  // Registrar mensaje en la base de datos
  async logMessage(messageData) {
    const {
      chat_id,
      sender_number,
      sender_name,
      message_type = 'text',
      message_content,
      message_media_url = null,
      direction, // 'incoming' o 'outgoing'
      user_state = null,
      status = 'received'
    } = messageData;

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO bot_messages 
         (chat_id, sender_number, sender_name, message_type, message_content, 
          message_media_url, direction, user_state, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          chat_id,
          sender_number,
          sender_name,
          message_type,
          message_content,
          message_media_url,
          direction,
          user_state ? JSON.stringify(user_state) : null,
          status
        ],
        function(err) {
          if (err) {
            console.error('Error guardando mensaje:', err);
            reject(err);
          } else {
            console.log(`✅ Mensaje guardado con ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // Registrar mensaje entrante
  async logIncomingMessage(msg) {
    const chatId = msg.key.remoteJid;
    const message = msg.message;
    const senderNumber = msg.key.participant || msg.key.remoteJid;
    const senderName = msg.pushName || 'Usuario';
    
    let messageType = 'text';
    let messageContent = '';
    let mediaUrl = null;

    if (message.conversation) {
      messageContent = message.conversation;
    } else if (message.extendedTextMessage) {
      messageContent = message.extendedTextMessage.text;
    } else if (message.imageMessage) {
      messageType = 'image';
      messageContent = message.imageMessage.caption || 'Imagen';
    } else if (message.videoMessage) {
      messageType = 'video';
      messageContent = message.videoMessage.caption || 'Video';
    } else if (message.documentMessage) {
      messageType = 'document';
      messageContent = message.documentMessage.fileName || 'Documento';
    } else if (message.audioMessage) {
      messageType = 'audio';
      messageContent = 'Audio';
    } else if (message.locationMessage) {
      messageType = 'location';
      messageContent = `Ubicación: ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}`;
    }

    const messageData = {
      chat_id: chatId,
      sender_number: senderNumber,
      sender_name: senderName,
      message_type: messageType,
      message_content: messageContent,
      message_media_url: mediaUrl,
      direction: 'incoming',
      status: 'received'
    };

    await this.logMessage(messageData);
    
    // Notificar al backend via HTTP para actualización en tiempo real
    try {
      await axios.post(`${this.backendUrl}/api/bot/webhook/message`, messageData);
    } catch (error) {
      console.error('Error notificando al backend:', error.message);
    }
  }

  // Registrar mensaje saliente
  async logOutgoingMessage(chatId, messageContent, messageType = 'text') {
    const messageData = {
      chat_id: chatId,
      sender_number: 'bot',
      sender_name: 'CatemuConecta Bot',
      message_type: messageType,
      message_content: messageContent,
      direction: 'outgoing',
      status: 'sent'
    };

    await this.logMessage(messageData);
    
    // Notificar al backend
    try {
      await axios.post(`${this.backendUrl}/api/bot/webhook/message`, messageData);
    } catch (error) {
      console.error('Error notificando al backend:', error.message);
    }
  }

  // Actualizar estado de usuario en la conversación
  async updateUserState(senderNumber, state) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE bot_messages 
         SET user_state = ? 
         WHERE sender_number = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [JSON.stringify(state), senderNumber],
        (err) => {
          if (err) {
            console.error('Error actualizando estado de usuario:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Obtener historial de conversación
  async getConversationHistory(chatId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM bot_messages 
         WHERE chat_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [chatId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Actualizar analytics
  async updateAnalytics(metricType, value = 1) {
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO bot_analytics (date, metric_type, metric_value)
         VALUES (?, ?, ?)
         ON CONFLICT(date, metric_type) 
         DO UPDATE SET metric_value = metric_value + ?`,
        [today, metricType, value, value],
        (err) => {
          if (err) {
            console.error('Error actualizando analytics:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Registrar sesión del bot
  async logBotSession(sessionData) {
    const { session_id, status, phone_number = null, qr_code = null } = sessionData;
    
    return new Promise((resolve, reject) => {
      // Verificar si existe la sesión
      this.db.get(
        'SELECT * FROM bot_sessions WHERE session_id = ?',
        [session_id],
        (err, existing) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (existing) {
            // Actualizar sesión existente
            this.db.run(
              `UPDATE bot_sessions 
               SET status = ?, phone_number = ?, qr_code = ?, last_activity = CURRENT_TIMESTAMP
               WHERE session_id = ?`,
              [status, phone_number, qr_code, session_id],
              (err) => {
                if (err) reject(err);
                else resolve('updated');
              }
            );
          } else {
            // Crear nueva sesión
            this.db.run(
              `INSERT INTO bot_sessions (session_id, status, phone_number, qr_code, started_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [session_id, status, phone_number, qr_code],
              (err) => {
                if (err) reject(err);
                else resolve('created');
              }
            );
          }
        }
      );
    });
  }

  // Cerrar conexión a la base de datos
  close() {
    this.db.close();
  }
}

module.exports = MessageLogger;