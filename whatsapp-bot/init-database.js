const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, '..', 'database', 'catemu.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Inicializando tablas de base de datos...');

db.serialize(() => {
    // Crear tabla de conversaciones de WhatsApp
    db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            user_name TEXT,
            last_message TEXT,
            last_message_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            conversation_state TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creando tabla whatsapp_conversations:', err);
        else console.log('✅ Tabla whatsapp_conversations creada');
    });

    // Crear tabla de reportes de WhatsApp
    db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT UNIQUE NOT NULL,
            phone_number TEXT NOT NULL,
            user_name TEXT,
            category TEXT,
            description TEXT,
            location TEXT,
            priority TEXT,
            department TEXT,
            status TEXT DEFAULT 'pendiente',
            image_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creando tabla whatsapp_reports:', err);
        else console.log('✅ Tabla whatsapp_reports creada');
    });

    // Crear tabla de sesiones de WhatsApp
    db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            session_data TEXT,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creando tabla whatsapp_sessions:', err);
        else console.log('✅ Tabla whatsapp_sessions creada');
    });

    // Crear índices para mejor rendimiento
    db.run(`CREATE INDEX IF NOT EXISTS idx_phone_number ON whatsapp_conversations(phone_number)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_report_phone ON whatsapp_reports(phone_number)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_report_status ON whatsapp_reports(status)`);
    
    console.log('✅ Base de datos inicializada correctamente');
});

// Cerrar la base de datos
setTimeout(() => {
    db.close((err) => {
        if (err) console.error('Error cerrando base de datos:', err);
        else console.log('📊 Base de datos cerrada');
    });
}, 2000);