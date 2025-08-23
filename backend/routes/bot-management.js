const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const { validateBotMessage, sanitizeBody } = require('../middleware/validation');

// Conectar a la base de datos
const db = new sqlite3.Database(path.join(__dirname, '../../database/catemu.db'));

// Middleware para logging
router.use((req, res, next) => {
  console.log(`📱 Bot API: ${req.method} ${req.path}`);
  next();
});

// GET /api/bot/status - Estado del bot
router.get('/status', async (req, res) => {
  try {
    // Verificar si el proceso del bot está corriendo
    exec('pgrep -f "node.*whatsapp-bot/index.js"', (error, stdout) => {
      const isRunning = !error && stdout.trim() !== '';
      
      // Obtener última sesión de la base de datos
      db.get(
        'SELECT * FROM bot_sessions ORDER BY last_activity DESC LIMIT 1',
        (err, session) => {
          if (err) {
            console.error('Error obteniendo sesión:', err);
            return res.status(500).json({ error: 'Error obteniendo estado del bot' });
          }
          
          // Obtener estadísticas del día
          const today = new Date().toISOString().split('T')[0];
          db.get(
            `SELECT 
              COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as messages_received,
              COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as messages_sent,
              COUNT(DISTINCT sender_number) as unique_users
            FROM bot_messages 
            WHERE DATE(created_at) = ?`,
            [today],
            (err, stats) => {
              res.json({
                isRunning,
                session: session || { status: 'disconnected' },
                stats: stats || { messages_received: 0, messages_sent: 0, unique_users: 0 },
                lastCheck: new Date().toISOString()
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error en /bot/status:', error);
    res.status(500).json({ error: 'Error obteniendo estado del bot' });
  }
});

// GET /api/bot/config - Obtener configuración
router.get('/config', (req, res) => {
  db.all(
    'SELECT key, value, description, type FROM bot_config ORDER BY key',
    (err, configs) => {
      if (err) {
        console.error('Error obteniendo configuración:', err);
        return res.status(500).json({ error: 'Error obteniendo configuración' });
      }
      
      // Convertir array a objeto
      const configObj = {};
      configs.forEach(config => {
        configObj[config.key] = {
          value: config.value,
          description: config.description,
          type: config.type
        };
      });
      
      res.json(configObj);
    }
  );
});

// PUT /api/bot/config - Actualizar configuración
router.put('/config', (req, res) => {
  const updates = req.body;
  const errors = [];
  let completed = 0;
  
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(400).json({ error: 'No hay configuraciones para actualizar' });
  }
  
  keys.forEach(key => {
    db.run(
      'UPDATE bot_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
      [updates[key], key],
      (err) => {
        if (err) errors.push({ key, error: err.message });
        completed++;
        
        if (completed === keys.length) {
          if (errors.length > 0) {
            res.status(207).json({ 
              message: 'Algunas configuraciones no se actualizaron',
              errors 
            });
          } else {
            res.json({ 
              message: 'Configuraciones actualizadas exitosamente',
              updated: keys 
            });
          }
        }
      }
    );
  });
});

// GET /api/bot/messages - Historial de conversaciones
router.get('/messages', (req, res) => {
  const { limit = 100, offset = 0, chat_id, date } = req.query;
  
  let query = 'SELECT * FROM bot_messages WHERE 1=1';
  const params = [];
  
  if (chat_id) {
    query += ' AND chat_id = ?';
    params.push(chat_id);
  }
  
  if (date) {
    query += ' AND DATE(created_at) = ?';
    params.push(date);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, messages) => {
    if (err) {
      console.error('Error obteniendo mensajes:', err);
      return res.status(500).json({ error: 'Error obteniendo mensajes' });
    }
    
    // Obtener total de mensajes
    let countQuery = 'SELECT COUNT(*) as total FROM bot_messages WHERE 1=1';
    const countParams = [];
    
    if (chat_id) {
      countQuery += ' AND chat_id = ?';
      countParams.push(chat_id);
    }
    
    if (date) {
      countQuery += ' AND DATE(created_at) = ?';
      countParams.push(date);
    }
    
    db.get(countQuery, countParams, (err, result) => {
      res.json({
        messages,
        total: result ? result.total : 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// GET /api/bot/templates - Obtener plantillas
router.get('/templates', (req, res) => {
  const { active } = req.query;
  
  let query = 'SELECT * FROM bot_templates';
  const params = [];
  
  if (active !== undefined) {
    query += ' WHERE active = ?';
    params.push(active === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY category, name';
  
  db.all(query, params, (err, templates) => {
    if (err) {
      console.error('Error obteniendo plantillas:', err);
      return res.status(500).json({ error: 'Error obteniendo plantillas' });
    }
    res.json(templates);
  });
});

// POST /api/bot/templates - Crear nueva plantilla
router.post('/templates', (req, res) => {
  const { name, trigger_keywords, response_text, response_type, category, active } = req.body;
  
  if (!name || !response_text) {
    return res.status(400).json({ error: 'Nombre y texto de respuesta son requeridos' });
  }
  
  db.run(
    `INSERT INTO bot_templates (name, trigger_keywords, response_text, response_type, category, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, trigger_keywords, response_text, response_type || 'text', category, active !== false ? 1 : 0],
    function(err) {
      if (err) {
        console.error('Error creando plantilla:', err);
        return res.status(500).json({ error: 'Error creando plantilla' });
      }
      res.json({ 
        id: this.lastID,
        message: 'Plantilla creada exitosamente' 
      });
    }
  );
});

// PUT /api/bot/templates/:id - Actualizar plantilla
router.put('/templates/:id', (req, res) => {
  const { id } = req.params;
  const { name, trigger_keywords, response_text, response_type, category, active } = req.body;
  
  db.run(
    `UPDATE bot_templates 
     SET name = ?, trigger_keywords = ?, response_text = ?, response_type = ?, 
         category = ?, active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, trigger_keywords, response_text, response_type, category, active ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Error actualizando plantilla:', err);
        return res.status(500).json({ error: 'Error actualizando plantilla' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Plantilla no encontrada' });
      }
      
      res.json({ message: 'Plantilla actualizada exitosamente' });
    }
  );
});

// DELETE /api/bot/templates/:id - Eliminar plantilla
router.delete('/templates/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM bot_templates WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error eliminando plantilla:', err);
      return res.status(500).json({ error: 'Error eliminando plantilla' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    
    res.json({ message: 'Plantilla eliminada exitosamente' });
  });
});

// POST /api/bot/restart - Reiniciar bot
router.post('/restart', async (req, res) => {
  try {
    // Detener bot actual
    exec('pkill -f "node.*whatsapp-bot/index.js"', (error) => {
      if (!error) {
        console.log('Bot detenido');
      }
      
      // Esperar un momento y reiniciar
      setTimeout(() => {
        exec('cd ../whatsapp-bot && node index.js > bot.log 2>&1 &', (error) => {
          if (error) {
            console.error('Error reiniciando bot:', error);
            return res.status(500).json({ error: 'Error reiniciando bot' });
          }
          
          res.json({ message: 'Bot reiniciado exitosamente' });
        });
      }, 2000);
    });
  } catch (error) {
    console.error('Error en /bot/restart:', error);
    res.status(500).json({ error: 'Error reiniciando bot' });
  }
});

// GET /api/bot/analytics - Obtener métricas
router.get('/analytics', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      DATE(created_at) as date,
      COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as messages_received,
      COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as messages_sent,
      COUNT(DISTINCT sender_number) as unique_users
    FROM bot_messages
    WHERE 1=1
  `;
  
  const params = [];
  
  if (start_date) {
    query += ' AND DATE(created_at) >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND DATE(created_at) <= ?';
    params.push(end_date);
  }
  
  query += ' GROUP BY DATE(created_at) ORDER BY date DESC';
  
  db.all(query, params, (err, analytics) => {
    if (err) {
      console.error('Error obteniendo analytics:', err);
      return res.status(500).json({ error: 'Error obteniendo analytics' });
    }
    
    // Calcular totales
    const totals = analytics.reduce((acc, day) => ({
      total_received: acc.total_received + day.messages_received,
      total_sent: acc.total_sent + day.messages_sent,
      unique_users: Math.max(acc.unique_users, day.unique_users)
    }), { total_received: 0, total_sent: 0, unique_users: 0 });
    
    res.json({
      daily: analytics,
      totals,
      period: {
        start: start_date || analytics[analytics.length - 1]?.date,
        end: end_date || analytics[0]?.date
      }
    });
  });
});

// GET /api/bot/schedules - Obtener horarios
router.get('/schedules', (req, res) => {
  db.all(
    'SELECT * FROM bot_schedules ORDER BY name',
    (err, schedules) => {
      if (err) {
        console.error('Error obteniendo horarios:', err);
        return res.status(500).json({ error: 'Error obteniendo horarios' });
      }
      res.json(schedules);
    }
  );
});

// POST /api/bot/schedules - Crear nuevo horario
router.post('/schedules', (req, res) => {
  const { name, start_time, end_time, days_of_week, message, active } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({ error: 'Nombre y mensaje son requeridos' });
  }
  
  db.run(
    `INSERT INTO bot_schedules (name, start_time, end_time, days_of_week, message, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, start_time, end_time, days_of_week, message, active !== false ? 1 : 0],
    function(err) {
      if (err) {
        console.error('Error creando horario:', err);
        return res.status(500).json({ error: 'Error creando horario' });
      }
      res.json({ 
        id: this.lastID,
        message: 'Horario creado exitosamente' 
      });
    }
  );
});

// PUT /api/bot/schedules/:id - Actualizar horario
router.put('/schedules/:id', (req, res) => {
  const { id } = req.params;
  const { name, start_time, end_time, days_of_week, message, active } = req.body;
  
  db.run(
    `UPDATE bot_schedules 
     SET name = ?, start_time = ?, end_time = ?, days_of_week = ?, message = ?, active = ?
     WHERE id = ?`,
    [name, start_time, end_time, days_of_week, message, active ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Error actualizando horario:', err);
        return res.status(500).json({ error: 'Error actualizando horario' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Horario no encontrado' });
      }
      
      res.json({ message: 'Horario actualizado exitosamente' });
    }
  );
});

// DELETE /api/bot/schedules/:id - Eliminar horario
router.delete('/schedules/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM bot_schedules WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error eliminando horario:', err);
      return res.status(500).json({ error: 'Error eliminando horario' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    res.json({ message: 'Horario eliminado exitosamente' });
  });
});

// POST /api/bot/webhook/message - Recibir notificación de nuevo mensaje
router.post('/webhook/message', (req, res) => {
  const messageData = req.body;
  
  // Emitir evento a través de WebSockets (si está configurado)
  if (req.app.locals.botSocketService) {
    req.app.locals.botSocketService.registerMessage(messageData);
  }
  
  res.json({ received: true });
});

// POST /api/bot/webhook/session - Recibir actualización de sesión
router.post('/webhook/session', (req, res) => {
  const sessionData = req.body;
  
  // Emitir evento a través de WebSockets
  if (req.app.locals.botSocketService) {
    req.app.locals.botSocketService.updateBotSession(sessionData);
  }
  
  res.json({ received: true });
});

// GET /api/bot/qr - Obtener código QR actual
router.get('/qr', async (req, res) => {
  try {
    // Buscar el archivo QR más reciente en la sesión
    const qrPath = path.join(__dirname, '../../whatsapp-bot/sessions/qr-code.png');
    
    // Verificar si existe el archivo
    try {
      await fs.access(qrPath);
      const qrData = await fs.readFile(qrPath, 'base64');
      res.json({ 
        qr: `data:image/png;base64,${qrData}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // No hay QR disponible
      res.json({ 
        qr: null,
        message: 'No hay código QR disponible. El bot podría estar ya conectado.'
      });
    }
  } catch (error) {
    console.error('Error obteniendo QR:', error);
    res.status(500).json({ error: 'Error obteniendo código QR' });
  }
});

module.exports = router;