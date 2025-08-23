const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const axios = require('axios');
const surveysData = require('./surveys-data');
const http = require('http');
const { Server } = require('socket.io');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
require('dotenv').config();

// Importar middleware de validación
const { 
  sanitizeBody, 
  validateReport, 
  validateBotMessage, 
  rateLimit, 
  errorHandler 
} = require('./middleware/validation');

// Importar rutas del bot
const botManagementRoutes = require('./routes/bot-management');
const BotSocketService = require('./services/bot-socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST", "PATCH"]
  }
});

const PORT = process.env.PORT || 3001;

// Inicializar servicio de WebSocket para el bot
const botSocketService = new BotSocketService(io);

// Hacer disponible el servicio para las rutas
app.locals.botSocketService = botSocketService;

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
  crossOriginEmbedderPolicy: false
}));

// Configuración CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3002", "http://localhost:5678"],
  credentials: true
}));

// Middleware general
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
app.use(rateLimit(100, 60000)); // 100 requests por minuto

// Sanitización global
app.use(sanitizeBody);

// Archivos estáticos
app.use(express.static('uploads'));
app.use('/exports', express.static('exports'));

// Socket.IO para notificaciones en tiempo real
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);
  
  // Unirse a sala de administradores
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin conectado a la sala');
  });
  
  // Unirse a sala de departamento específico
  socket.on('join-department', (department) => {
    socket.join(`department-${department}`);
    console.log(`Usuario conectado al departamento ${department}`);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Crear directorios si no existen
const dirs = ['uploads', 'exports', 'exports/pdf', 'exports/excel'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// === ENDPOINTS ORIGINALES ===

// Usar rutas de gestión del bot
app.use('/api/bot', botManagementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    features: {
      whatsapp: true,
      realtime: true,
      exports: true,
      ai: true
    }
  });
});

// Obtener encuestas activas
app.get('/api/surveys', (req, res) => {
  const activeSurveys = surveysData.filter(s => s.active).map(survey => ({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    category: survey.category,
    estimated_time: survey.estimated_time,
    priority: survey.priority,
    question_count: survey.questions.length
  }));
  res.json(activeSurveys);
});

// Obtener detalles completos de una encuesta
app.get('/api/surveys/:id', (req, res) => {
  const { id } = req.params;
  const survey = surveysData.find(s => s.id === parseInt(id));
  
  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }
  
  res.json(survey);
});

// Enviar respuesta de encuesta
app.post('/api/surveys/:id/responses', async (req, res) => {
  const { id } = req.params;
  const { responses, location, respondent_info } = req.body;
  const response_id = uuidv4();
  
  try {
    db.run(
      `INSERT INTO survey_responses (survey_id, responses, location, respondent_info, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [id, JSON.stringify(responses), JSON.stringify(location), JSON.stringify(respondent_info)],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al guardar respuesta', details: err.message });
        }
        
        // Notificar en tiempo real
        io.to('admin-room').emit('new-survey-response', {
          id: this.lastID,
          survey_id: id,
          timestamp: new Date().toISOString()
        });
        
        res.json({ 
          success: true, 
          response_id: response_id,
          id: this.lastID 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error procesando respuesta' });
  }
});

// Crear nuevo reporte (mejorado con notificaciones)
app.post('/api/reports', upload.single('image'), validateReport, async (req, res) => {
  const report_id = `CAT-2025-${Math.floor(Math.random() * 9000) + 1000}`;
  const { type, category, description, location, contact_info, priority, source, department, whatsapp_number } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    db.run(
      `INSERT INTO reports (type, category, description, location, image_path, contact_info, status, priority, source, department, whatsapp_number, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [type, category, description, location, image_path, contact_info, priority || 'media', source || 'web', department, whatsapp_number],
      async function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al crear reporte', details: err.message });
        }
        
        const newReport = {
          id: report_id,
          internal_id: this.lastID,
          type,
          category,
          description,
          location: JSON.parse(location || '{}'),
          image_path,
          contact_info: JSON.parse(contact_info || '{}'),
          status: 'pending',
          priority: priority || 'media',
          source: source || 'web',
          created_at: new Date().toISOString()
        };
        
        // Emitir notificación en tiempo real
        io.to('admin-room').emit('new-report', newReport);
        
        // Si es urgente, emitir alerta especial
        if (priority === 'urgente' || priority === 'alta') {
          io.to('admin-room').emit('urgent-report', {
            ...newReport,
            alert_type: 'urgent',
            message: `¡Reporte urgente en ${category}!`
          });
        }
        
        // Notificar al departamento correspondiente
        if (department) {
          io.to(`department-${department}`).emit('department-report', newReport);
        }
        
        // Si viene de WhatsApp, emitir evento especial
        if (source === 'whatsapp') {
          io.to('admin-room').emit('whatsapp-report', {
            ...newReport,
            whatsapp_number
          });
        }
        
        // Webhook a n8n si está configurado
        if (process.env.N8N_WEBHOOK_URL) {
          try {
            await axios.post(process.env.N8N_WEBHOOK_URL, newReport);
          } catch (webhookError) {
            console.error('Error enviando a n8n:', webhookError.message);
          }
        }
        
        res.json({ 
          success: true, 
          id: report_id,
          internal_id: this.lastID,
          message: 'Reporte creado exitosamente' 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error procesando reporte' });
  }
});

// Obtener reportes con filtros
app.get('/api/reports', (req, res) => {
  let query = 'SELECT * FROM reports WHERE 1=1';
  const params = [];
  
  if (req.query.status) {
    query += ' AND status = ?';
    params.push(req.query.status);
  }
  
  if (req.query.category) {
    query += ' AND category = ?';
    params.push(req.query.category);
  }
  
  if (req.query.priority) {
    query += ' AND priority IN (?)';
    params.push(req.query.priority);
  }
  
  if (req.query.whatsapp_number) {
    query += ' AND whatsapp_number = ?';
    params.push(req.query.whatsapp_number);
  }
  
  if (req.query.from_date) {
    query += ' AND created_at >= ?';
    params.push(req.query.from_date);
  }
  
  if (req.query.to_date) {
    query += ' AND created_at <= ?';
    params.push(req.query.to_date);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (req.query.limit) {
    query += ' LIMIT ?';
    params.push(parseInt(req.query.limit));
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo reportes' });
    }
    
    const reports = rows.map(row => ({
      ...row,
      location: JSON.parse(row.location || '{}'),
      contact_info: JSON.parse(row.contact_info || '{}')
    }));
    
    res.json(reports);
  });
});

// Obtener un reporte específico
app.get('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT * FROM reports WHERE id = ? OR id LIKE ?',
    [id, `%${id}%`],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo reporte' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }
      
      res.json({
        ...row,
        location: JSON.parse(row.location || '{}'),
        contact_info: JSON.parse(row.contact_info || '{}')
      });
    }
  );
});

// Actualizar estado de reporte (mejorado con notificaciones)
app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status, resolution_notes, assigned_to } = req.body;
  
  let updateQuery = 'UPDATE reports SET updated_at = datetime("now")';
  const params = [];
  
  if (status) {
    updateQuery += ', status = ?';
    params.push(status);
  }
  
  if (resolution_notes) {
    updateQuery += ', resolution_notes = ?';
    params.push(resolution_notes);
  }
  
  if (assigned_to) {
    updateQuery += ', assigned_to = ?';
    params.push(assigned_to);
  }
  
  updateQuery += ' WHERE id = ?';
  params.push(id);
  
  db.run(updateQuery, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error actualizando reporte' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Obtener el reporte actualizado para notificación
    db.get('SELECT * FROM reports WHERE id = ?', [id], (err, report) => {
      if (!err && report) {
        // Emitir actualización en tiempo real
        io.to('admin-room').emit('report-updated', {
          id: report.id,
          status: report.status,
          updated_at: report.updated_at,
          assigned_to: report.assigned_to
        });
        
        // Si se completó, emitir evento especial
        if (status === 'completed') {
          io.to('admin-room').emit('report-completed', {
            id: report.id,
            category: report.category,
            resolution_time: calculateResolutionTime(report.created_at, report.updated_at)
          });
        }
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Reporte actualizado',
      changes: this.changes 
    });
  });
});

// === NUEVOS ENDPOINTS ===

// Obtener estadísticas mejoradas
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  // Queries para estadísticas
  const queries = [
    {
      name: 'totalReports',
      query: 'SELECT COUNT(*) as count FROM reports'
    },
    {
      name: 'pendingReports',
      query: "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"
    },
    {
      name: 'inProgressReports',
      query: "SELECT COUNT(*) as count FROM reports WHERE status = 'in_progress'"
    },
    {
      name: 'completedToday',
      query: "SELECT COUNT(*) as count FROM reports WHERE status = 'completed' AND date(updated_at) = date('now')"
    },
    {
      name: 'reportsByCategory',
      query: 'SELECT category, COUNT(*) as count FROM reports GROUP BY category'
    },
    {
      name: 'reportsByPriority',
      query: 'SELECT priority, COUNT(*) as count FROM reports WHERE status != "completed" GROUP BY priority'
    },
    {
      name: 'reportsBySource',
      query: 'SELECT source, COUNT(*) as count FROM reports GROUP BY source'
    },
    {
      name: 'recentReports',
      query: "SELECT * FROM reports ORDER BY created_at DESC LIMIT 10"
    },
    {
      name: 'avgResolutionTime',
      query: `SELECT AVG(
        CAST((julianday(updated_at) - julianday(created_at)) * 24 AS INTEGER)
      ) as hours FROM reports WHERE status = 'completed'`
    },
    {
      name: 'whatsappReports',
      query: "SELECT COUNT(*) as count FROM reports WHERE source = 'whatsapp'"
    }
  ];
  
  let completed = 0;
  
  queries.forEach(({ name, query }) => {
    const method = name.includes('By') || name === 'recentReports' ? 'all' : 'get';
    
    db[method](query, (err, result) => {
      if (err) {
        console.error(`Error en query ${name}:`, err);
        stats[name] = method === 'all' ? [] : 0;
      } else {
        if (method === 'get') {
          stats[name] = result?.count || result?.hours || 0;
        } else {
          stats[name] = result;
        }
      }
      
      completed++;
      if (completed === queries.length) {
        // Formatear reportes recientes
        if (stats.recentReports) {
          stats.recentReports = stats.recentReports.map(r => ({
            ...r,
            location: JSON.parse(r.location || '{}'),
            contact_info: JSON.parse(r.contact_info || '{}')
          }));
        }
        
        // Calcular tendencias
        stats.trend = calculateTrend();
        
        res.json(stats);
      }
    });
  });
});

// Estadísticas de WhatsApp
app.get('/api/stats/whatsapp', (req, res) => {
  db.all(
    `SELECT 
      COUNT(*) as total_conversations,
      COUNT(DISTINCT phone_number) as unique_users,
      COUNT(CASE WHEN direction = 'in' THEN 1 END) as messages_received,
      COUNT(CASE WHEN direction = 'out' THEN 1 END) as messages_sent,
      COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today_messages
    FROM whatsapp_conversations`,
    [],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo estadísticas' });
      }
      
      db.all(
        `SELECT 
          ws.phone_number,
          ws.user_name,
          ws.total_reports,
          ws.last_interaction,
          COUNT(wc.id) as message_count
        FROM whatsapp_sessions ws
        LEFT JOIN whatsapp_conversations wc ON ws.phone_number = wc.phone_number
        GROUP BY ws.phone_number
        ORDER BY ws.last_interaction DESC
        LIMIT 10`,
        [],
        (err, topUsers) => {
          if (err) {
            topUsers = [];
          }
          
          res.json({
            ...stats[0],
            topUsers
          });
        }
      );
    }
  );
});

// Exportar reportes a PDF
app.get('/api/export/pdf', async (req, res) => {
  const { from_date, to_date, category, status } = req.query;
  
  let query = 'SELECT * FROM reports WHERE 1=1';
  const params = [];
  
  if (from_date) {
    query += ' AND created_at >= ?';
    params.push(from_date);
  }
  
  if (to_date) {
    query += ' AND created_at <= ?';
    params.push(to_date);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  db.all(query, params, (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo reportes' });
    }
    
    // Crear PDF
    const doc = new PDFDocument();
    const filename = `reportes_${Date.now()}.pdf`;
    const filepath = path.join('exports', 'pdf', filename);
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Encabezado
    doc.fontSize(20).text('REPORTE DE INCIDENCIAS - CATEMU CONECTA', { align: 'center' });
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-CL')}`, { align: 'center' });
    doc.moveDown();
    
    // Resumen
    doc.fontSize(14).text('RESUMEN EJECUTIVO');
    doc.fontSize(10);
    doc.text(`Total de reportes: ${reports.length}`);
    doc.text(`Período: ${from_date || 'Inicio'} - ${to_date || 'Actual'}`);
    doc.moveDown();
    
    // Estadísticas por categoría
    const byCategory = {};
    const byStatus = {};
    const byPriority = {};
    
    reports.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
    });
    
    doc.fontSize(12).text('Por Categoría:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      doc.fontSize(10).text(`  • ${cat}: ${count} reportes`);
    });
    doc.moveDown();
    
    doc.fontSize(12).text('Por Estado:');
    Object.entries(byStatus).forEach(([stat, count]) => {
      doc.fontSize(10).text(`  • ${stat}: ${count} reportes`);
    });
    doc.moveDown();
    
    doc.fontSize(12).text('Por Prioridad:');
    Object.entries(byPriority).forEach(([pri, count]) => {
      doc.fontSize(10).text(`  • ${pri}: ${count} reportes`);
    });
    
    // Nueva página para detalles
    doc.addPage();
    doc.fontSize(14).text('DETALLE DE REPORTES');
    doc.moveDown();
    
    // Listar reportes
    reports.forEach((report, index) => {
      if (index > 0 && index % 3 === 0) {
        doc.addPage();
      }
      
      doc.fontSize(11).text(`Reporte #${report.id || report.report_id}`, { underline: true });
      doc.fontSize(9);
      doc.text(`Categoría: ${report.category}`);
      doc.text(`Prioridad: ${report.priority}`);
      doc.text(`Estado: ${report.status}`);
      doc.text(`Fecha: ${new Date(report.created_at).toLocaleString('es-CL')}`);
      doc.text(`Descripción: ${report.description}`);
      
      const location = JSON.parse(report.location || '{}');
      if (location.address) {
        doc.text(`Ubicación: ${location.address}`);
      }
      
      if (report.resolution_notes) {
        doc.text(`Resolución: ${report.resolution_notes}`);
      }
      
      doc.moveDown();
    });
    
    // Pie de página
    doc.fontSize(8).text('CatemuConecta - Sistema de Participación Ciudadana', { align: 'center' });
    
    doc.end();
    
    // Enviar archivo cuando esté listo
    doc.on('finish', () => {
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error enviando PDF:', err);
        }
        // Limpiar archivo después de enviar
        setTimeout(() => {
          fs.unlink(filepath, () => {});
        }, 60000); // Eliminar después de 1 minuto
      });
    });
  });
});

// Exportar reportes a Excel
app.get('/api/export/excel', async (req, res) => {
  const { from_date, to_date, category, status } = req.query;
  
  let query = 'SELECT * FROM reports WHERE 1=1';
  const params = [];
  
  if (from_date) {
    query += ' AND created_at >= ?';
    params.push(from_date);
  }
  
  if (to_date) {
    query += ' AND created_at <= ?';
    params.push(to_date);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  db.all(query, params, async (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo reportes' });
    }
    
    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CatemuConecta';
    workbook.created = new Date();
    
    // Hoja de resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 30 },
      { header: 'Valor', key: 'value', width: 20 }
    ];
    
    // Calcular métricas
    const metrics = [
      { metric: 'Total de Reportes', value: reports.length },
      { metric: 'Reportes Pendientes', value: reports.filter(r => r.status === 'pending').length },
      { metric: 'Reportes en Proceso', value: reports.filter(r => r.status === 'in_progress').length },
      { metric: 'Reportes Completados', value: reports.filter(r => r.status === 'completed').length },
      { metric: 'Prioridad Alta/Urgente', value: reports.filter(r => r.priority === 'alta' || r.priority === 'urgente').length }
    ];
    
    summarySheet.addRows(metrics);
    
    // Hoja de detalles
    const detailSheet = workbook.addWorksheet('Reportes Detallados');
    detailSheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Fecha', key: 'created_at', width: 20 },
      { header: 'Categoría', key: 'category', width: 15 },
      { header: 'Prioridad', key: 'priority', width: 12 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Descripción', key: 'description', width: 50 },
      { header: 'Ubicación', key: 'location_text', width: 30 },
      { header: 'Contacto', key: 'contact_name', width: 20 },
      { header: 'Teléfono', key: 'contact_phone', width: 15 },
      { header: 'Fuente', key: 'source', width: 10 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Notas Resolución', key: 'resolution_notes', width: 40 },
      { header: 'Última Actualización', key: 'updated_at', width: 20 }
    ];
    
    // Procesar reportes para Excel
    const processedReports = reports.map(r => {
      const location = JSON.parse(r.location || '{}');
      const contact = JSON.parse(r.contact_info || '{}');
      
      return {
        id: r.id || r.report_id,
        created_at: r.created_at,
        category: r.category,
        priority: r.priority,
        status: r.status,
        description: r.description,
        location_text: location.address || `${location.latitude}, ${location.longitude}` || '',
        contact_name: contact.name || '',
        contact_phone: contact.phone || '',
        source: r.source || 'web',
        department: r.department || '',
        resolution_notes: r.resolution_notes || '',
        updated_at: r.updated_at
      };
    });
    
    detailSheet.addRows(processedReports);
    
    // Aplicar estilos
    [summarySheet, detailSheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' }
      };
      sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });
    
    // Hoja de estadísticas por categoría
    const categorySheet = workbook.addWorksheet('Por Categoría');
    categorySheet.columns = [
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Pendientes', key: 'pending', width: 12 },
      { header: 'En Proceso', key: 'in_progress', width: 12 },
      { header: 'Completados', key: 'completed', width: 12 }
    ];
    
    const categoryStats = {};
    reports.forEach(r => {
      if (!categoryStats[r.category]) {
        categoryStats[r.category] = {
          category: r.category,
          total: 0,
          pending: 0,
          in_progress: 0,
          completed: 0
        };
      }
      categoryStats[r.category].total++;
      categoryStats[r.category][r.status]++;
    });
    
    categorySheet.addRows(Object.values(categoryStats));
    
    // Guardar archivo
    const filename = `reportes_catemu_${Date.now()}.xlsx`;
    const filepath = path.join('exports', 'excel', filename);
    
    await workbook.xlsx.writeFile(filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error enviando Excel:', err);
      }
      // Limpiar archivo después de enviar
      setTimeout(() => {
        fs.unlink(filepath, () => {});
      }, 60000); // Eliminar después de 1 minuto
    });
  });
});

// Notificaciones push a departamentos
app.post('/api/notifications', (req, res) => {
  const { department, message, report_id, type } = req.body;
  
  const notification = {
    id: uuidv4(),
    department,
    message,
    report_id,
    type: type || 'info',
    timestamp: new Date().toISOString()
  };
  
  // Guardar notificación en DB (opcional)
  db.run(
    `INSERT INTO notifications (id, department, message, report_id, type, created_at, read) 
     VALUES (?, ?, ?, ?, ?, datetime('now'), 0)`,
    [notification.id, department, message, report_id, type],
    (err) => {
      if (err) {
        console.error('Error guardando notificación:', err);
      }
    }
  );
  
  // Emitir notificación en tiempo real
  if (department) {
    io.to(`department-${department}`).emit('notification', notification);
  } else {
    io.to('admin-room').emit('notification', notification);
  }
  
  res.json({ success: true, notification });
});

// Obtener conversaciones de WhatsApp
app.get('/api/whatsapp/conversations', (req, res) => {
  const { phone_number, limit = 50 } = req.query;
  
  let query = 'SELECT * FROM whatsapp_conversations';
  const params = [];
  
  if (phone_number) {
    query += ' WHERE phone_number = ?';
    params.push(phone_number);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo conversaciones' });
    }
    res.json(rows);
  });
});

// Obtener sesiones de WhatsApp
app.get('/api/whatsapp/sessions', (req, res) => {
  db.all(
    `SELECT 
      ws.*,
      COUNT(DISTINCT wr.id) as report_count,
      MAX(wr.created_at) as last_report
    FROM whatsapp_sessions ws
    LEFT JOIN whatsapp_reports wr ON ws.phone_number = wr.phone_number
    GROUP BY ws.phone_number
    ORDER BY ws.last_interaction DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo sesiones' });
      }
      res.json(rows);
    }
  );
});

// === FUNCIONES AUXILIARES ===

function calculateResolutionTime(created, updated) {
  const start = new Date(created);
  const end = new Date(updated);
  const hours = Math.round((end - start) / (1000 * 60 * 60));
  
  if (hours < 24) {
    return `${hours} horas`;
  } else {
    return `${Math.round(hours / 24)} días`;
  }
}

function calculateTrend() {
  // Calcular tendencia de últimos 7 días
  return new Promise((resolve) => {
    db.all(
      `SELECT 
        date(created_at) as date,
        COUNT(*) as count
      FROM reports
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date`,
      [],
      (err, rows) => {
        if (err || !rows) {
          resolve([]);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Manejo de errores global (debe ir al final, antes de iniciar el servidor)
app.use(errorHandler);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     🚀 CATEMU CONECTA BACKEND ENHANCED       ║
║                                              ║
║  API REST:     http://localhost:${PORT}      ║
║  WebSocket:    ws://localhost:${PORT}        ║
║                                              ║
║  Features:                                   ║
║  ✅ WhatsApp Bot Integration                ║
║  ✅ Real-time Notifications (Socket.IO)     ║
║  ✅ PDF/Excel Export                        ║
║  ✅ AI Analysis Ready                       ║
║                                              ║
║  Press Ctrl+C to stop                       ║
╚══════════════════════════════════════════════╝
  `);
});