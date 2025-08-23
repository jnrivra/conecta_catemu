const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const axios = require('axios');
const surveysData = require('./surveys-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

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

// Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Obtener encuestas activas
app.get('/api/surveys', (req, res) => {
  // Devolver las encuestas del archivo de datos
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

// Obtener preguntas de una encuesta
app.get('/api/surveys/:id/questions', (req, res) => {
  const { id } = req.params;
  const survey = surveysData.find(s => s.id === parseInt(id));
  
  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }
  
  res.json(survey.questions);
});

// Enviar respuesta de encuesta
app.post('/api/surveys/:id/responses', async (req, res) => {
  const { id } = req.params;
  const { responses, location, respondent_info } = req.body;
  const response_id = uuidv4();
  
  try {
    // Guardar respuesta principal
    db.run(
      `INSERT INTO survey_responses (id, survey_id, respondent_info, location, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [response_id, id, JSON.stringify(respondent_info), JSON.stringify(location)],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Guardar respuestas individuales
        responses.forEach(response => {
          db.run(
            `INSERT INTO survey_answers (response_id, question_id, answer) 
             VALUES (?, ?, ?)`,
            [response_id, response.question_id, response.answer]
          );
        });
        
        // Trigger n8n webhook si está configurado
        if (process.env.N8N_WEBHOOK_URL) {
          axios.post(`${process.env.N8N_WEBHOOK_URL}/survey-response`, {
            survey_id: id,
            response_id,
            responses,
            location,
            timestamp: new Date().toISOString()
          }).catch(err => console.error('Error enviando a n8n:', err));
        }
        
        res.json({ 
          success: true, 
          response_id,
          message: 'Encuesta enviada correctamente' 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener respuestas de una encuesta específica
app.get('/api/surveys/:id/responses', (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT sr.*, sa.question_id, sa.answer 
     FROM survey_responses sr
     LEFT JOIN survey_answers sa ON sr.id = sa.response_id
     WHERE sr.survey_id = ?
     ORDER BY sr.created_at DESC`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Agrupar respuestas por response_id
      const responsesMap = {};
      rows.forEach(row => {
        if (!responsesMap[row.id]) {
          responsesMap[row.id] = {
            id: row.id,
            survey_id: row.survey_id,
            respondent_info: JSON.parse(row.respondent_info || '{}'),
            created_at: row.created_at,
            answers: []
          };
        }
        if (row.question_id) {
          responsesMap[row.id].answers.push({
            question_id: row.question_id,
            answer: row.answer
          });
        }
      });
      
      const responses = Object.values(responsesMap);
      res.json(responses);
    }
  );
});

// Crear nuevo reporte/incidencia
app.post('/api/reports', upload.single('image'), async (req, res) => {
  const { 
    type, 
    description, 
    location, 
    category,
    contact_info 
  } = req.body;
  
  const report_id = uuidv4();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    db.run(
      `INSERT INTO reports (
        id, type, category, description, location, image_url, 
        contact_info, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
      [
        report_id,
        type,
        category || 'sin-categorizar',
        description,
        location,
        image_url,
        JSON.stringify(contact_info)
      ],
      async function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Enviar a n8n para procesamiento con IA
        if (process.env.N8N_WEBHOOK_URL) {
          try {
            const n8nResponse = await axios.post(`${process.env.N8N_WEBHOOK_URL}/new-report`, {
              report_id,
              type,
              description,
              location: JSON.parse(location),
              image_url,
              timestamp: new Date().toISOString()
            });
            
            // Actualizar categoría si la IA la procesó
            if (n8nResponse.data && n8nResponse.data.category) {
              db.run(
                'UPDATE reports SET category = ?, priority = ? WHERE id = ?',
                [n8nResponse.data.category, n8nResponse.data.priority || 'normal', report_id]
              );
            }
          } catch (error) {
            console.error('Error enviando a n8n:', error);
          }
        }
        
        res.json({ 
          success: true, 
          report_id,
          message: 'Reporte enviado correctamente. Lo revisaremos pronto.' 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los reportes (para dashboard)
app.get('/api/reports', (req, res) => {
  const { status, category, from_date, to_date } = req.query;
  
  let query = 'SELECT * FROM reports WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (from_date) {
    query += ' AND created_at >= ?';
    params.push(from_date);
  }
  
  if (to_date) {
    query += ' AND created_at <= ?';
    params.push(to_date);
  }
  
  query += ' ORDER BY datetime(created_at) DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Parsear JSON fields
    const reports = rows.map(row => ({
      ...row,
      location: JSON.parse(row.location),
      contact_info: JSON.parse(row.contact_info)
    }));
    
    res.json(reports);
  });
});

// Obtener un reporte específico
app.get('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    res.json({
      ...row,
      location: JSON.parse(row.location),
      contact_info: JSON.parse(row.contact_info)
    });
  });
});

// Actualizar estado de reporte
app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status, assigned_to, notes, priority } = req.body;
  
  const updates = [];
  const values = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  
  if (assigned_to) {
    updates.push('assigned_to = ?');
    values.push(assigned_to);
  }
  
  if (notes) {
    updates.push('notes = ?');
    values.push(notes);
  }
  
  if (priority) {
    updates.push('priority = ?');
    values.push(priority);
  }
  
  updates.push('updated_at = datetime("now")');
  values.push(id);
  
  const query = `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Notificar cambio a n8n si está configurado
    if (process.env.N8N_WEBHOOK_URL) {
      axios.post(`${process.env.N8N_WEBHOOK_URL}/report-updated`, {
        report_id: id,
        status,
        assigned_to,
        priority,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Error notificando a n8n:', err));
    }
    
    res.json({ success: true, message: 'Reporte actualizado' });
  });
});

// Estadísticas para dashboard
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  // Total de reportes
  db.get('SELECT COUNT(*) as total FROM reports', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.total_reports = row.total;
    
    // Reportes por estado
    db.all(
      'SELECT status, COUNT(*) as count FROM reports GROUP BY status',
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.by_status = rows;
        
        // Reportes por categoría
        db.all(
          'SELECT category, COUNT(*) as count FROM reports GROUP BY category',
          [],
          (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.by_category = rows;
            
            // Reportes últimos 7 días
            db.all(
              `SELECT DATE(created_at) as date, COUNT(*) as count 
               FROM reports 
               WHERE created_at >= datetime('now', '-7 days')
               GROUP BY DATE(created_at)
               ORDER BY date`,
              [],
              (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.last_7_days = rows;
                
                res.json(stats);
              }
            );
          }
        );
      }
    );
  });
});

// Crear directorio de uploads si no existe
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend API corriendo en http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/api/health`);
});