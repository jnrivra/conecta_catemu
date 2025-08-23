#!/usr/bin/env node

/**
 * Script de Demo Automática para CatemuConecta
 * Simula actividad en tiempo real para la presentación
 */

const axios = require('axios');
const io = require('socket.io-client');
const chalk = require('chalk');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Reportes de demo para crear automáticamente
const DEMO_SCENARIOS = [
  {
    delay: 5000,
    action: 'create_report',
    data: {
      type: 'infrastructure',
      category: 'Baches y Pavimento',
      description: '🚨 DEMO EN VIVO: Bache peligroso detectado por ciudadano',
      location: JSON.stringify({ 
        lat: -32.7805 + Math.random() * 0.01, 
        lng: -70.9643 + Math.random() * 0.01,
        address: 'Calle Demo ' + Math.floor(Math.random() * 100)
      }),
      priority: 'high',
      contact_info: JSON.stringify({ 
        name: 'Demo Ciudadano', 
        phone: '56900000000' 
      }),
      source: 'whatsapp'
    },
    message: '🚗 Nuevo reporte de bache recibido por WhatsApp'
  },
  {
    delay: 8000,
    action: 'bot_message',
    data: {
      chat_id: '56900000000@s.whatsapp.net',
      sender_number: '56900000000',
      sender_name: 'Demo Ciudadano',
      message_type: 'text',
      message_content: 'Hola, hay un problema con el alumbrado público',
      direction: 'incoming'
    },
    message: '💬 Mensaje de WhatsApp recibido'
  },
  {
    delay: 10000,
    action: 'create_report',
    data: {
      type: 'environment',
      category: 'Basura y Limpieza',
      description: '🗑️ DEMO: Contenedor desbordado reportado',
      location: JSON.stringify({ 
        lat: -32.7810 + Math.random() * 0.01, 
        lng: -70.9650 + Math.random() * 0.01,
        address: 'Plaza Demo'
      }),
      priority: 'medium',
      contact_info: JSON.stringify({ 
        name: 'Vecino Preocupado', 
        email: 'demo@catemu.cl' 
      }),
      source: 'web'
    },
    message: '🌍 Reporte ambiental creado desde portal web'
  },
  {
    delay: 15000,
    action: 'update_status',
    reportIndex: 0,
    newStatus: 'in_progress',
    message: '⚡ Departamento de Obras asignado al primer reporte'
  },
  {
    delay: 20000,
    action: 'create_urgent',
    data: {
      type: 'security',
      category: 'Seguridad',
      description: '🚨 URGENTE DEMO: Semáforo no funciona en cruce principal',
      location: JSON.stringify({ 
        lat: -32.7800, 
        lng: -70.9640,
        address: 'Av. Principal con Comercio'
      }),
      priority: 'urgent',
      contact_info: JSON.stringify({ 
        name: 'Conductor Alarmado', 
        phone: '56911111111' 
      }),
      source: 'whatsapp'
    },
    message: '🚨 ¡ALERTA! Reporte URGENTE recibido'
  },
  {
    delay: 25000,
    action: 'gamification',
    data: {
      user: '56900000000',
      points: 50,
      badge: 'first_report'
    },
    message: '🎮 Usuario ganó 50 puntos y desbloqueó badge'
  },
  {
    delay: 30000,
    action: 'update_status',
    reportIndex: 0,
    newStatus: 'completed',
    message: '✅ Primer reporte resuelto exitosamente'
  }
];

class DemoAutomatica {
  constructor() {
    this.socket = null;
    this.createdReports = [];
    this.isRunning = false;
  }

  async start() {
    console.log(chalk.cyan.bold('\n🎬 INICIANDO DEMO AUTOMÁTICA DE CATEMU CONECTA\n'));
    console.log(chalk.yellow('La demo creará reportes y simulará actividad cada pocos segundos.'));
    console.log(chalk.yellow('Abre el dashboard en http://localhost:3002 para ver la magia!\n'));
    console.log(chalk.gray('Presiona Ctrl+C para detener\n'));

    // Conectar WebSocket
    this.connectSocket();

    // Verificar que el backend esté corriendo
    try {
      await axios.get(`${API_URL}/health`);
      console.log(chalk.green('✅ Backend conectado\n'));
    } catch (error) {
      console.error(chalk.red('❌ Error: El backend no está corriendo en el puerto 3001'));
      process.exit(1);
    }

    this.isRunning = true;
    await this.runScenarios();
  }

  connectSocket() {
    this.socket = io(SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log(chalk.green('🔌 WebSocket conectado'));
      this.socket.emit('join-admin');
    });

    this.socket.on('new-report', (report) => {
      console.log(chalk.magenta(`   📨 Notificación en tiempo real: Nuevo reporte #${report.id}`));
    });
  }

  async runScenarios() {
    for (const scenario of DEMO_SCENARIOS) {
      if (!this.isRunning) break;

      await this.wait(scenario.delay);
      console.log(chalk.cyan(`\n⏱️ [${new Date().toLocaleTimeString()}]`));
      
      try {
        switch (scenario.action) {
          case 'create_report':
            await this.createReport(scenario.data, scenario.message);
            break;
            
          case 'create_urgent':
            await this.createUrgentReport(scenario.data, scenario.message);
            break;
            
          case 'bot_message':
            await this.sendBotMessage(scenario.data, scenario.message);
            break;
            
          case 'update_status':
            await this.updateReportStatus(scenario.reportIndex, scenario.newStatus, scenario.message);
            break;
            
          case 'gamification':
            await this.triggerGamification(scenario.data, scenario.message);
            break;
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error en escenario: ${error.message}`));
      }
    }

    console.log(chalk.green.bold('\n\n🎉 DEMO COMPLETADA EXITOSAMENTE!\n'));
    console.log(chalk.yellow('Resumen de actividad:'));
    console.log(chalk.white(`  • ${this.createdReports.length} reportes creados`));
    console.log(chalk.white(`  • Notificaciones en tiempo real enviadas`));
    console.log(chalk.white(`  • Estados actualizados`));
    console.log(chalk.white(`  • Gamificación activada\n`));

    // Ciclo continuo opcional
    console.log(chalk.cyan('🔄 Reiniciando ciclo de demo en 10 segundos...'));
    console.log(chalk.gray('(Presiona Ctrl+C para detener)\n'));
    
    await this.wait(10000);
    
    if (this.isRunning) {
      await this.runScenarios(); // Repetir
    }
  }

  async createReport(data, message) {
    console.log(chalk.yellow(message));
    
    const response = await axios.post(`${API_URL}/reports`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data && response.data.id) {
      this.createdReports.push(response.data);
      console.log(chalk.green(`   ✅ Reporte creado: #${response.data.id}`));
      console.log(chalk.gray(`   📍 Ubicación: ${JSON.parse(data.location).address}`));
      console.log(chalk.gray(`   📊 Prioridad: ${data.priority.toUpperCase()}`));
    }
  }

  async createUrgentReport(data, message) {
    console.log(chalk.red.bold(message));
    
    const response = await axios.post(`${API_URL}/reports`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data && response.data.id) {
      this.createdReports.push(response.data);
      console.log(chalk.red(`   🚨 URGENTE #${response.data.id}`));
      console.log(chalk.yellow(`   ⚡ Notificación enviada al departamento`));
      
      // Simular alerta visual
      for (let i = 0; i < 3; i++) {
        await this.wait(200);
        process.stdout.write(chalk.bgRed('   ⚠️  ALERTA  ⚠️  '));
        await this.wait(200);
        process.stdout.write('\r                    \r');
      }
    }
  }

  async sendBotMessage(data, message) {
    console.log(chalk.blue(message));
    
    await axios.post(`${API_URL}/bot/webhook/message`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(chalk.gray(`   📱 De: ${data.sender_name}`));
    console.log(chalk.gray(`   💬 "${data.message_content}"`));
    
    // Simular respuesta del bot
    await this.wait(2000);
    console.log(chalk.green(`   🤖 Bot: "Gracias por tu reporte. Lo procesaré de inmediato."`));
  }

  async updateReportStatus(reportIndex, newStatus, message) {
    if (this.createdReports[reportIndex]) {
      const report = this.createdReports[reportIndex];
      
      console.log(chalk.blue(message));
      
      await axios.patch(`${API_URL}/reports/${report.id}`, 
        { status: newStatus },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const statusEmoji = {
        'pending': '⏳',
        'in_progress': '🔧',
        'completed': '✅',
        'rejected': '❌'
      };
      
      console.log(chalk.gray(`   ${statusEmoji[newStatus]} Reporte #${report.id} → ${newStatus.toUpperCase()}`));
    }
  }

  async triggerGamification(data, message) {
    console.log(chalk.magenta(message));
    console.log(chalk.gray(`   🏆 Usuario: ${data.user}`));
    console.log(chalk.gray(`   ⭐ +${data.points} puntos`));
    console.log(chalk.gray(`   🎖️ Badge desbloqueado: ${data.badge}`));
    
    // Animación de celebración
    const celebration = ['🎉', '🎊', '🏆', '⭐', '🎯'];
    process.stdout.write('   ');
    for (const emoji of celebration) {
      process.stdout.write(emoji + ' ');
      await this.wait(200);
    }
    console.log('');
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Iniciar demo
const demo = new DemoAutomatica();

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log(chalk.red('\n\n⏹️ Deteniendo demo...'));
  demo.stop();
  process.exit(0);
});

// Verificar dependencias
(async () => {
  try {
    require('chalk');
    require('axios');
    require('socket.io-client');
  } catch (error) {
    console.log('📦 Instalando dependencias necesarias...');
    require('child_process').execSync('npm install chalk axios socket.io-client', { stdio: 'inherit' });
  }
  
  // Iniciar demo
  demo.start().catch(console.error);
})();