#!/usr/bin/env node

/**
 * Script para simular un mensaje de WhatsApp al backend
 * Útil para probar sin enviar mensajes reales
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/bot/webhook/message';

const testMessage = {
  chat_id: '56920464349@s.whatsapp.net',
  sender_number: '56920464349',
  sender_name: 'Usuario Demo',
  message_type: 'text',
  message_content: 'Hola, quiero reportar un bache en mi calle',
  direction: 'incoming',
  timestamp: new Date().toISOString()
};

console.log('📱 Enviando mensaje de prueba al bot...');
console.log('Mensaje:', testMessage.message_content);

axios.post(API_URL, testMessage)
  .then(response => {
    console.log('✅ Mensaje procesado exitosamente');
    console.log('Respuesta:', response.data);
  })
  .catch(error => {
    console.error('❌ Error:', error.response?.data || error.message);
  });