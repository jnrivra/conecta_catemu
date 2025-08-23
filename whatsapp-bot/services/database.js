const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
    constructor() {
        const dbPath = path.join(__dirname, '..', '..', 'database', 'catemu.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error conectando a la base de datos:', err);
            } else {
                console.log('✅ Conectado a la base de datos SQLite');
                this.initTables();
            }
        });
    }

    initTables() {
        // Crear tabla para sesiones de WhatsApp si no existe
        this.db.run(`
            CREATE TABLE IF NOT EXISTS whatsapp_sessions (
                phone_number TEXT PRIMARY KEY,
                user_name TEXT,
                last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_reports INTEGER DEFAULT 0,
                total_surveys INTEGER DEFAULT 0,
                preferences TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla para conversaciones
        this.db.run(`
            CREATE TABLE IF NOT EXISTS whatsapp_conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                message_type TEXT,
                message_content TEXT,
                direction TEXT CHECK(direction IN ('in', 'out')),
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (phone_number) REFERENCES whatsapp_sessions(phone_number)
            )
        `);

        // Crear tabla para reportes de WhatsApp
        this.db.run(`
            CREATE TABLE IF NOT EXISTS whatsapp_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT UNIQUE,
                phone_number TEXT,
                category TEXT,
                priority TEXT,
                description TEXT,
                location TEXT,
                image_path TEXT,
                status TEXT DEFAULT 'pending',
                ai_analysis TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Índices para mejorar performance
        this.db.run('CREATE INDEX IF NOT EXISTS idx_wa_phone ON whatsapp_sessions(phone_number)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_wa_conv_phone ON whatsapp_conversations(phone_number)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_wa_reports_phone ON whatsapp_reports(phone_number)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_wa_reports_status ON whatsapp_reports(status)');
    }

    // Gestión de sesiones de usuario
    async getOrCreateSession(phoneNumber, userName = null) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM whatsapp_sessions WHERE phone_number = ?',
                [phoneNumber],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        // Actualizar última interacción
                        this.db.run(
                            'UPDATE whatsapp_sessions SET last_interaction = CURRENT_TIMESTAMP WHERE phone_number = ?',
                            [phoneNumber]
                        );
                        resolve(row);
                    } else {
                        // Crear nueva sesión
                        this.db.run(
                            'INSERT INTO whatsapp_sessions (phone_number, user_name) VALUES (?, ?)',
                            [phoneNumber, userName],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({
                                        phone_number: phoneNumber,
                                        user_name: userName,
                                        total_reports: 0,
                                        total_surveys: 0
                                    });
                                }
                            }
                        );
                    }
                }
            );
        });
    }

    // Guardar mensaje de conversación
    async saveConversation(phoneNumber, messageType, content, direction = 'in') {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO whatsapp_conversations 
                (phone_number, message_type, message_content, direction, status) 
                VALUES (?, ?, ?, ?, ?)`,
                [phoneNumber, messageType, content, direction, 'processed'],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // Guardar reporte de WhatsApp
    async saveWhatsAppReport(reportData) {
        return new Promise((resolve, reject) => {
            const reportId = `WAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            this.db.run(
                `INSERT INTO whatsapp_reports 
                (report_id, phone_number, category, priority, description, location, image_path, status, ai_analysis) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    reportId,
                    reportData.phone_number,
                    reportData.category,
                    reportData.priority,
                    reportData.description,
                    JSON.stringify(reportData.location || {}),
                    reportData.image_path,
                    'pending',
                    JSON.stringify(reportData.ai_analysis || {})
                ],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        // Incrementar contador de reportes del usuario
                        this.db.run(
                            'UPDATE whatsapp_sessions SET total_reports = total_reports + 1 WHERE phone_number = ?',
                            [reportData.phone_number]
                        );
                        resolve(reportId);
                    }
                }.bind(this)
            );
        });
    }

    // Obtener reportes de un usuario
    async getUserReports(phoneNumber, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM whatsapp_reports 
                WHERE phone_number = ? 
                ORDER BY created_at DESC 
                LIMIT ?`,
                [phoneNumber, limit],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    // Obtener estadísticas de un usuario
    async getUserStats(phoneNumber) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT 
                    ws.*,
                    COUNT(DISTINCT wr.id) as total_reports_actual,
                    COUNT(DISTINCT CASE WHEN wr.status = 'completed' THEN wr.id END) as completed_reports,
                    COUNT(DISTINCT CASE WHEN wr.status = 'pending' THEN wr.id END) as pending_reports
                FROM whatsapp_sessions ws
                LEFT JOIN whatsapp_reports wr ON ws.phone_number = wr.phone_number
                WHERE ws.phone_number = ?
                GROUP BY ws.phone_number`,
                [phoneNumber],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    // Obtener conversación reciente
    async getRecentConversation(phoneNumber, limit = 20) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM whatsapp_conversations 
                WHERE phone_number = ? 
                ORDER BY created_at DESC 
                LIMIT ?`,
                [phoneNumber, limit],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    // Actualizar preferencias del usuario
    async updateUserPreferences(phoneNumber, preferences) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE whatsapp_sessions SET preferences = ? WHERE phone_number = ?',
                [JSON.stringify(preferences), phoneNumber],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    // Obtener estadísticas generales de WhatsApp
    async getWhatsAppStats() {
        return new Promise((resolve, reject) => {
            const queries = {
                totalUsers: 'SELECT COUNT(*) as count FROM whatsapp_sessions',
                activeToday: `SELECT COUNT(*) as count FROM whatsapp_sessions 
                             WHERE date(last_interaction) = date('now')`,
                totalReports: 'SELECT COUNT(*) as count FROM whatsapp_reports',
                pendingReports: "SELECT COUNT(*) as count FROM whatsapp_reports WHERE status = 'pending'",
                completedReports: "SELECT COUNT(*) as count FROM whatsapp_reports WHERE status = 'completed'",
                reportsByCategory: `SELECT category, COUNT(*) as count 
                                   FROM whatsapp_reports 
                                   GROUP BY category`,
                topReporters: `SELECT ws.phone_number, ws.user_name, COUNT(wr.id) as report_count
                              FROM whatsapp_sessions ws
                              LEFT JOIN whatsapp_reports wr ON ws.phone_number = wr.phone_number
                              GROUP BY ws.phone_number
                              ORDER BY report_count DESC
                              LIMIT 10`
            };

            const stats = {};
            const promises = [];

            for (const [key, query] of Object.entries(queries)) {
                promises.push(
                    new Promise((res, rej) => {
                        const method = key.includes('ByCategory') || key.includes('topReporters') ? 'all' : 'get';
                        this.db[method](query, (err, result) => {
                            if (err) {
                                rej(err);
                            } else {
                                stats[key] = method === 'get' ? result?.count || 0 : result;
                                res();
                            }
                        });
                    })
                );
            }

            Promise.all(promises)
                .then(() => resolve(stats))
                .catch(reject);
        });
    }

    // Marcar reporte como completado
    async markReportCompleted(reportId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE whatsapp_reports 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
                WHERE report_id = ?`,
                [reportId],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    // Buscar reportes por texto
    async searchReports(searchTerm) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM whatsapp_reports 
                WHERE description LIKE ? OR category LIKE ? OR report_id LIKE ?
                ORDER BY created_at DESC
                LIMIT 20`,
                [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    // Cerrar conexión
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error cerrando la base de datos:', err);
            } else {
                console.log('Base de datos cerrada correctamente');
            }
        });
    }
}

module.exports = DatabaseService;