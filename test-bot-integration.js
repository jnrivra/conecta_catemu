#!/usr/bin/env node

const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

class BotIntegrationTester {
  constructor() {
    this.socket = null;
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 INICIANDO PRUEBAS DE INTEGRACIÓN DEL BOT\n');
    console.log('=' .repeat(50));
    
    // Conectar WebSocket
    await this.testWebSocketConnection();
    
    // Probar endpoints
    await this.testBotStatus();
    await this.testBotConfig();
    await this.testBotTemplates();
    await this.testMessageLogging();
    await this.testAnalytics();
    
    // Mostrar resultados
    this.showResults();
    
    // Cerrar conexión
    if (this.socket) {
      this.socket.close();
    }
  }

  async testWebSocketConnection() {
    console.log('\n📡 Probando conexión WebSocket...');
    
    return new Promise((resolve) => {
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('✅ Conectado a WebSocket');
        this.socket.emit('join-bot-monitor');
        
        this.testResults.push({
          test: 'WebSocket Connection',
          status: 'PASS',
          details: 'Conexión establecida'
        });
        
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Error conectando a WebSocket:', error.message);
        this.testResults.push({
          test: 'WebSocket Connection',
          status: 'FAIL',
          details: error.message
        });
        resolve();
      });
      
      // Timeout de 5 segundos
      setTimeout(() => {
        if (!this.socket.connected) {
          console.error('❌ Timeout conectando a WebSocket');
          this.testResults.push({
            test: 'WebSocket Connection',
            status: 'FAIL',
            details: 'Timeout'
          });
          resolve();
        }
      }, 5000);
    });
  }

  async testBotStatus() {
    console.log('\n🤖 Probando endpoint de estado del bot...');
    
    try {
      const response = await axios.get(`${API_URL}/bot/status`);
      
      if (response.data && 'isRunning' in response.data) {
        console.log('✅ Estado del bot obtenido');
        console.log(`   - Bot activo: ${response.data.isRunning ? 'Sí' : 'No'}`);
        console.log(`   - Sesión: ${response.data.session?.status || 'desconectado'}`);
        console.log(`   - Mensajes recibidos hoy: ${response.data.stats?.messages_received || 0}`);
        console.log(`   - Mensajes enviados hoy: ${response.data.stats?.messages_sent || 0}`);
        
        this.testResults.push({
          test: 'Bot Status API',
          status: 'PASS',
          details: `Bot ${response.data.isRunning ? 'activo' : 'inactivo'}`
        });
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (error) {
      console.error('❌ Error obteniendo estado del bot:', error.message);
      this.testResults.push({
        test: 'Bot Status API',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testBotConfig() {
    console.log('\n⚙️ Probando configuración del bot...');
    
    try {
      const response = await axios.get(`${API_URL}/bot/config`);
      
      if (response.data && typeof response.data === 'object') {
        const configKeys = Object.keys(response.data);
        console.log(`✅ Configuración obtenida (${configKeys.length} parámetros)`);
        console.log(`   - Nombre del bot: ${response.data.bot_name?.value || 'No configurado'}`);
        console.log(`   - IA habilitada: ${response.data.ai_enabled?.value || 'false'}`);
        console.log(`   - Respuestas automáticas: ${response.data.auto_response_enabled?.value || 'false'}`);
        
        this.testResults.push({
          test: 'Bot Config API',
          status: 'PASS',
          details: `${configKeys.length} configuraciones disponibles`
        });
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (error) {
      console.error('❌ Error obteniendo configuración:', error.message);
      this.testResults.push({
        test: 'Bot Config API',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testBotTemplates() {
    console.log('\n📝 Probando plantillas de respuestas...');
    
    try {
      const response = await axios.get(`${API_URL}/bot/templates`);
      
      if (Array.isArray(response.data)) {
        console.log(`✅ Plantillas obtenidas (${response.data.length} plantillas)`);
        response.data.forEach(template => {
          console.log(`   - ${template.name}: ${template.active ? 'Activa' : 'Inactiva'}`);
        });
        
        this.testResults.push({
          test: 'Bot Templates API',
          status: 'PASS',
          details: `${response.data.length} plantillas disponibles`
        });
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (error) {
      console.error('❌ Error obteniendo plantillas:', error.message);
      this.testResults.push({
        test: 'Bot Templates API',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testMessageLogging() {
    console.log('\n💬 Probando registro de mensajes...');
    
    try {
      // Simular un mensaje entrante
      const testMessage = {
        chat_id: 'test-chat-' + Date.now(),
        sender_number: '56912345678',
        sender_name: 'Usuario Test',
        message_type: 'text',
        message_content: 'Mensaje de prueba automática',
        direction: 'incoming'
      };
      
      // Enviar al webhook
      const response = await axios.post(`${API_URL}/bot/webhook/message`, testMessage);
      
      if (response.data && response.data.received) {
        console.log('✅ Mensaje registrado exitosamente');
        
        // Verificar que llegó por WebSocket
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('⚠️ No se recibió notificación por WebSocket');
            this.testResults.push({
              test: 'Message Logging',
              status: 'PARTIAL',
              details: 'Mensaje guardado pero sin notificación WebSocket'
            });
            resolve();
          }, 2000);
          
          this.socket.once('new-message', (message) => {
            clearTimeout(timeout);
            console.log('✅ Notificación recibida por WebSocket');
            this.testResults.push({
              test: 'Message Logging',
              status: 'PASS',
              details: 'Mensaje guardado y notificado'
            });
            resolve();
          });
        });
      } else {
        throw new Error('Respuesta inválida del webhook');
      }
    } catch (error) {
      console.error('❌ Error registrando mensaje:', error.message);
      this.testResults.push({
        test: 'Message Logging',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testAnalytics() {
    console.log('\n📊 Probando analytics del bot...');
    
    try {
      const response = await axios.get(`${API_URL}/bot/analytics`);
      
      if (response.data && response.data.totals) {
        console.log('✅ Analytics obtenidos');
        console.log(`   - Total recibidos: ${response.data.totals.total_received || 0}`);
        console.log(`   - Total enviados: ${response.data.totals.total_sent || 0}`);
        console.log(`   - Usuarios únicos: ${response.data.totals.unique_users || 0}`);
        console.log(`   - Días con datos: ${response.data.daily?.length || 0}`);
        
        this.testResults.push({
          test: 'Bot Analytics API',
          status: 'PASS',
          details: `${response.data.daily?.length || 0} días de datos`
        });
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (error) {
      console.error('❌ Error obteniendo analytics:', error.message);
      this.testResults.push({
        test: 'Bot Analytics API',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  showResults() {
    console.log('\n' + '=' .repeat(50));
    console.log('📋 RESUMEN DE PRUEBAS');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const partial = this.testResults.filter(r => r.status === 'PARTIAL').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });
    
    console.log('\n' + '-' .repeat(50));
    console.log(`Total: ${this.testResults.length} pruebas`);
    console.log(`✅ Exitosas: ${passed}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`⚠️ Parciales: ${partial}`);
    
    const successRate = (passed / this.testResults.length * 100).toFixed(1);
    console.log(`\n📊 Tasa de éxito: ${successRate}%`);
    
    if (failed === 0) {
      console.log('\n🎉 ¡Todas las pruebas principales pasaron exitosamente!');
    } else {
      console.log('\n⚠️ Algunas pruebas fallaron. Revisa los detalles arriba.');
    }
  }
}

// Ejecutar pruebas
async function main() {
  const tester = new BotIntegrationTester();
  
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PRUEBA DE INTEGRACIÓN - CATEMU CONECTA    ║');
  console.log('║           Sistema de Gestión del Bot         ║');
  console.log('╚══════════════════════════════════════════════╝');
  
  // Verificar que el backend esté corriendo
  try {
    await axios.get(`${API_URL}/health`);
  } catch (error) {
    console.error('\n❌ ERROR: El backend no está respondiendo en', API_URL);
    console.error('   Asegúrate de que el servidor esté corriendo en el puerto 3001');
    process.exit(1);
  }
  
  await tester.runTests();
  
  console.log('\n✨ Pruebas completadas\n');
  process.exit(0);
}

// Manejo de errores
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Error no manejado:', error);
  process.exit(1);
});

// Ejecutar
main().catch(console.error);