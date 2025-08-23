const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class BotSocketService {
  constructor(io) {
    this.io = io;
    this.db = new sqlite3.Database(path.join(__dirname, '../../database/catemu.db'));
    this.setupSocketHandlers();
    this.startMonitoring();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Cliente conectado al monitor del bot:', socket.id);
      
      // Unirse a sala del bot
      socket.on('join-bot-monitor', () => {
        socket.join('bot-monitor');
        console.log('Cliente unido a sala bot-monitor');
        
        // Enviar estado inicial
        this.sendBotStatus(socket);
      });
      
      // Solicitar estado actualizado
      socket.on('request-bot-status', () => {
        this.sendBotStatus(socket);
      });
      
      // Solicitar métricas actualizadas
      socket.on('request-bot-metrics', () => {
        this.sendBotMetrics(socket);
      });
      
      // Manejar comandos del bot
      socket.on('bot-command', async (command, data) => {
        await this.handleBotCommand(socket, command, data);
      });
      
      socket.on('disconnect', () => {
        console.log('❌ Cliente desconectado del monitor del bot:', socket.id);
      });
    });
  }

  startMonitoring() {
    // Monitorear estado del bot cada 10 segundos
    setInterval(() => {
      this.broadcastBotStatus();
    }, 10000);
    
    // Actualizar métricas cada 30 segundos
    setInterval(() => {
      this.broadcastBotMetrics();
    }, 30000);
  }

  async sendBotStatus(socket) {
    const { exec } = require('child_process');
    
    exec('pgrep -f "node.*whatsapp-bot/index.js"', (error, stdout) => {
      const isRunning = !error && stdout.trim() !== '';
      
      // Obtener última sesión
      this.db.get(
        'SELECT * FROM bot_sessions ORDER BY last_activity DESC LIMIT 1',
        (err, session) => {
          // Obtener estadísticas del día
          const today = new Date().toISOString().split('T')[0];
          this.db.get(
            `SELECT 
              COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as messages_received,
              COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as messages_sent,
              COUNT(DISTINCT sender_number) as unique_users
            FROM bot_messages 
            WHERE DATE(created_at) = ?`,
            [today],
            (err, stats) => {
              const status = {
                isRunning,
                session: session || { status: 'disconnected' },
                stats: stats || { messages_received: 0, messages_sent: 0, unique_users: 0 },
                timestamp: new Date().toISOString()
              };
              
              socket.emit('bot-status-update', status);
            }
          );
        }
      );
    });
  }

  broadcastBotStatus() {
    const { exec } = require('child_process');
    
    exec('pgrep -f "node.*whatsapp-bot/index.js"', (error, stdout) => {
      const isRunning = !error && stdout.trim() !== '';
      
      this.db.get(
        'SELECT * FROM bot_sessions ORDER BY last_activity DESC LIMIT 1',
        (err, session) => {
          const today = new Date().toISOString().split('T')[0];
          this.db.get(
            `SELECT 
              COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as messages_received,
              COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as messages_sent,
              COUNT(DISTINCT sender_number) as unique_users
            FROM bot_messages 
            WHERE DATE(created_at) = ?`,
            [today],
            (err, stats) => {
              const status = {
                isRunning,
                session: session || { status: 'disconnected' },
                stats: stats || { messages_received: 0, messages_sent: 0, unique_users: 0 },
                timestamp: new Date().toISOString()
              };
              
              this.io.to('bot-monitor').emit('bot-status-update', status);
            }
          );
        }
      );
    });
  }

  async sendBotMetrics(socket) {
    // Obtener métricas de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    this.db.all(
      `SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as messages_received,
        COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as messages_sent,
        COUNT(DISTINCT sender_number) as unique_users
      FROM bot_messages
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      [sevenDaysAgo.toISOString().split('T')[0]],
      (err, metrics) => {
        if (!err) {
          socket.emit('bot-metrics-update', {
            daily: metrics || [],
            timestamp: new Date().toISOString()
          });
        }
      }
    );
  }

  broadcastBotMetrics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    this.db.all(
      `SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as messages_received,
        COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as messages_sent,
        COUNT(DISTINCT sender_number) as unique_users
      FROM bot_messages
      WHERE DATE(created_at) >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      [sevenDaysAgo.toISOString().split('T')[0]],
      (err, metrics) => {
        if (!err) {
          this.io.to('bot-monitor').emit('bot-metrics-update', {
            daily: metrics || [],
            timestamp: new Date().toISOString()
          });
        }
      }
    );
  }

  async handleBotCommand(socket, command, data) {
    const { exec } = require('child_process');
    
    switch (command) {
      case 'restart':
        // Reiniciar bot
        exec('pkill -f "node.*whatsapp-bot/index.js"', (error) => {
          setTimeout(() => {
            exec('cd ../whatsapp-bot && node index.js > bot.log 2>&1 &', (error) => {
              if (error) {
                socket.emit('bot-command-response', {
                  command: 'restart',
                  success: false,
                  error: error.message
                });
              } else {
                socket.emit('bot-command-response', {
                  command: 'restart',
                  success: true,
                  message: 'Bot reiniciado exitosamente'
                });
                
                // Notificar a todos los clientes
                this.io.to('bot-monitor').emit('bot-event', {
                  type: 'restart',
                  message: 'Bot reiniciado',
                  timestamp: new Date().toISOString()
                });
              }
            });
          }, 2000);
        });
        break;
        
      case 'stop':
        // Detener bot
        exec('pkill -f "node.*whatsapp-bot/index.js"', (error) => {
          if (!error) {
            socket.emit('bot-command-response', {
              command: 'stop',
              success: true,
              message: 'Bot detenido'
            });
            
            this.io.to('bot-monitor').emit('bot-event', {
              type: 'stop',
              message: 'Bot detenido',
              timestamp: new Date().toISOString()
            });
          }
        });
        break;
        
      case 'start':
        // Iniciar bot
        exec('cd ../whatsapp-bot && node index.js > bot.log 2>&1 &', (error) => {
          if (!error) {
            socket.emit('bot-command-response', {
              command: 'start',
              success: true,
              message: 'Bot iniciado'
            });
            
            this.io.to('bot-monitor').emit('bot-event', {
              type: 'start',
              message: 'Bot iniciado',
              timestamp: new Date().toISOString()
            });
          }
        });
        break;
    }
  }

  // Método para registrar nuevo mensaje
  registerMessage(messageData) {
    const {
      chat_id,
      sender_number,
      sender_name,
      message_type,
      message_content,
      direction,
      user_state
    } = messageData;
    
    this.db.run(
      `INSERT INTO bot_messages 
       (chat_id, sender_number, sender_name, message_type, message_content, direction, user_state, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'received')`,
      [chat_id, sender_number, sender_name, message_type, message_content, direction, user_state],
      (err) => {
        if (!err) {
          // Notificar a clientes conectados sobre nuevo mensaje
          this.io.to('bot-monitor').emit('new-message', {
            ...messageData,
            timestamp: new Date().toISOString()
          });
          
          // Actualizar estadísticas
          this.broadcastBotStatus();
        }
      }
    );
  }

  // Método para actualizar sesión del bot
  updateBotSession(sessionData) {
    const { session_id, status, phone_number, qr_code } = sessionData;
    
    // Verificar si existe sesión activa
    this.db.get(
      'SELECT * FROM bot_sessions WHERE session_id = ?',
      [session_id],
      (err, existing) => {
        if (existing) {
          // Actualizar sesión existente
          this.db.run(
            `UPDATE bot_sessions 
             SET status = ?, phone_number = ?, qr_code = ?, last_activity = CURRENT_TIMESTAMP
             WHERE session_id = ?`,
            [status, phone_number, qr_code, session_id]
          );
        } else {
          // Crear nueva sesión
          this.db.run(
            `INSERT INTO bot_sessions (session_id, status, phone_number, qr_code, started_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [session_id, status, phone_number, qr_code]
          );
        }
        
        // Notificar cambio de estado
        this.io.to('bot-monitor').emit('session-update', {
          session_id,
          status,
          phone_number,
          has_qr: !!qr_code,
          timestamp: new Date().toISOString()
        });
      }
    );
  }

  // Método para registrar evento del bot
  logBotEvent(eventType, details) {
    const today = new Date().toISOString().split('T')[0];
    
    this.db.run(
      `INSERT INTO bot_analytics (date, metric_type, metric_value, details)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(date, metric_type) 
       DO UPDATE SET metric_value = metric_value + 1`,
      [today, eventType, JSON.stringify(details)],
      (err) => {
        if (!err) {
          // Notificar evento
          this.io.to('bot-monitor').emit('bot-event', {
            type: eventType,
            details,
            timestamp: new Date().toISOString()
          });
        }
      }
    );
  }
}

module.exports = BotSocketService;