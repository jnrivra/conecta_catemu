const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos existente
const db = new sqlite3.Database(path.join(__dirname, '../database/catemu.db'), (err) => {
  if (err) {
    console.error('Error abriendo base de datos:', err);
    process.exit(1);
  } else {
    console.log('✅ Conectado a SQLite database');
    extendDatabase();
  }
});

// Extender esquema de base de datos para gestión del bot
function extendDatabase() {
  console.log('📦 Extendiendo base de datos para gestión del bot...');
  
  db.serialize(() => {
    // Tabla de configuración del bot
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        type TEXT DEFAULT 'text',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando bot_config:', err);
      else console.log('✅ Tabla bot_config creada');
    });

    // Tabla de mensajes/conversaciones del bot
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        sender_number TEXT NOT NULL,
        sender_name TEXT,
        message_type TEXT DEFAULT 'text',
        message_content TEXT,
        message_media_url TEXT,
        direction TEXT CHECK(direction IN ('incoming', 'outgoing')),
        status TEXT DEFAULT 'received',
        user_state TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando bot_messages:', err);
      else console.log('✅ Tabla bot_messages creada');
    });

    // Tabla de plantillas de respuestas
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        trigger_keywords TEXT,
        response_text TEXT NOT NULL,
        response_type TEXT DEFAULT 'text',
        media_url TEXT,
        buttons TEXT,
        category TEXT,
        active INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando bot_templates:', err);
      else console.log('✅ Tabla bot_templates creada');
    });

    // Tabla de sesiones del bot
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'disconnected',
        phone_number TEXT,
        qr_code TEXT,
        started_at DATETIME,
        ended_at DATETIME,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando bot_sessions:', err);
      else console.log('✅ Tabla bot_sessions creada');
    });

    // Tabla de analytics del bot
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        metric_type TEXT NOT NULL,
        metric_value INTEGER DEFAULT 0,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, metric_type)
      )
    `, (err) => {
      if (err) console.error('Error creando bot_analytics:', err);
      else console.log('✅ Tabla bot_analytics creada');
    });

    // Tabla de respuestas automáticas por horario
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_time TIME,
        end_time TIME,
        days_of_week TEXT,
        message TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando bot_schedules:', err);
      else console.log('✅ Tabla bot_schedules creada');
    });

    // Insertar configuraciones iniciales
    insertInitialConfig();
  });
}

function insertInitialConfig() {
  console.log('📝 Insertando configuraciones iniciales...');
  
  const configs = [
    ['welcome_message', '👋 ¡Hola! Soy el asistente virtual de la Municipalidad de Catemu. ¿En qué puedo ayudarte?', 'Mensaje de bienvenida', 'text'],
    ['offline_message', '🕐 Nuestro horario de atención es de Lunes a Viernes de 8:30 a 17:30. Tu mensaje será respondido en horario hábil.', 'Mensaje fuera de horario', 'text'],
    ['bot_name', 'CatemuConecta', 'Nombre del bot', 'text'],
    ['max_wait_time', '1800', 'Tiempo máximo de espera en segundos', 'number'],
    ['auto_response_enabled', 'true', 'Respuestas automáticas activadas', 'boolean'],
    ['admin_numbers', '', 'Números de administradores (separados por coma)', 'text'],
    ['business_hours_start', '08:30', 'Hora de inicio atención', 'time'],
    ['business_hours_end', '17:30', 'Hora de fin atención', 'time'],
    ['business_days', 'mon,tue,wed,thu,fri', 'Días laborables', 'text'],
    ['ai_enabled', 'true', 'Procesamiento con IA activado', 'boolean']
  ];

  configs.forEach(config => {
    db.run(
      'INSERT OR IGNORE INTO bot_config (key, value, description, type) VALUES (?, ?, ?, ?)',
      config,
      (err) => {
        if (err) console.error(`Error insertando config ${config[0]}:`, err);
      }
    );
  });

  // Insertar plantillas de ejemplo
  const templates = [
    [
      'saludo_general',
      'hola,buenos dias,buenas tardes',
      '👋 ¡Hola! Bienvenido a CatemuConecta\n\n¿Cómo puedo ayudarte hoy?\n\n1️⃣ Reportar un problema\n2️⃣ Consultar estado de reporte\n3️⃣ Información municipal\n4️⃣ Hablar con un agente',
      'text',
      null,
      null,
      'greetings',
      1
    ],
    [
      'reporte_recibido',
      null,
      '✅ Tu reporte ha sido recibido exitosamente.\n\nNúmero de seguimiento: {report_id}\n\nPuedes consultar el estado escribiendo "estado {report_id}"',
      'text',
      null,
      null,
      'reports',
      1
    ],
    [
      'ayuda',
      'ayuda,help,menu',
      '📋 *MENÚ DE AYUDA*\n\nComandos disponibles:\n• *reporte* - Reportar un problema\n• *estado* - Consultar estado\n• *encuesta* - Responder encuesta\n• *info* - Información municipal\n• *contacto* - Datos de contacto',
      'text',
      null,
      null,
      'help',
      1
    ]
  ];

  templates.forEach(template => {
    db.run(
      'INSERT OR IGNORE INTO bot_templates (name, trigger_keywords, response_text, response_type, media_url, buttons, category, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      template,
      (err) => {
        if (err) console.error(`Error insertando template ${template[0]}:`, err);
      }
    );
  });

  // Insertar horarios de ejemplo
  const schedules = [
    [
      'Fuera de horario laboral',
      '17:31',
      '08:29',
      'mon,tue,wed,thu,fri',
      '🕐 Gracias por contactarnos. Nuestro horario de atención es de Lunes a Viernes de 8:30 a 17:30.\n\nTu mensaje será atendido en el próximo día hábil.',
      1
    ],
    [
      'Fin de semana',
      '00:00',
      '23:59',
      'sat,sun',
      '📅 Estamos fuera de oficina durante el fin de semana.\n\nTu mensaje será atendido el próximo día hábil. Para emergencias, contacta al 800-xxx-xxx',
      1
    ]
  ];

  schedules.forEach(schedule => {
    db.run(
      'INSERT OR IGNORE INTO bot_schedules (name, start_time, end_time, days_of_week, message, active) VALUES (?, ?, ?, ?, ?, ?)',
      schedule,
      (err) => {
        if (err) console.error(`Error insertando schedule ${schedule[0]}:`, err);
      }
    );
  });

  console.log('✅ Configuraciones iniciales insertadas');
  
  // Cerrar la conexión después de un breve delay
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error cerrando base de datos:', err);
      } else {
        console.log('✅ Base de datos extendida exitosamente');
        console.log('📊 Tablas creadas:');
        console.log('   • bot_config - Configuraciones del bot');
        console.log('   • bot_messages - Historial de conversaciones');
        console.log('   • bot_templates - Plantillas de respuestas');
        console.log('   • bot_sessions - Sesiones del bot');
        console.log('   • bot_analytics - Métricas de uso');
        console.log('   • bot_schedules - Horarios y respuestas automáticas');
      }
    });
  }, 1000);
}

// Manejo de errores
process.on('SIGINT', () => {
  console.log('\n⏹️ Cerrando conexión a base de datos...');
  db.close();
  process.exit(0);
});