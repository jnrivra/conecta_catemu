const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear o abrir base de datos
const db = new sqlite3.Database(path.join(__dirname, '../database/catemu.db'), (err) => {
  if (err) {
    console.error('Error abriendo base de datos:', err);
  } else {
    console.log('Conectado a SQLite database');
    initDatabase();
  }
});

// Inicializar esquema de base de datos
function initDatabase() {
  db.serialize(() => {
    // Tabla de reportes/incidencias
    db.run(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        image_url TEXT,
        image_path TEXT,
        contact_info TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        assigned_to TEXT,
        notes TEXT,
        source TEXT DEFAULT 'web',
        department TEXT,
        whatsapp_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de encuestas
    db.run(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de preguntas de encuestas
    db.run(`
      CREATE TABLE IF NOT EXISTS survey_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        type TEXT NOT NULL,
        options TEXT,
        required INTEGER DEFAULT 0,
        order_num INTEGER DEFAULT 0,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      )
    `);

    // Tabla de respuestas de encuestas
    db.run(`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id TEXT PRIMARY KEY,
        survey_id INTEGER NOT NULL,
        respondent_info TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      )
    `);

    // Tabla de respuestas individuales
    db.run(`
      CREATE TABLE IF NOT EXISTS survey_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        response_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        answer TEXT,
        FOREIGN KEY (response_id) REFERENCES survey_responses(id),
        FOREIGN KEY (question_id) REFERENCES survey_questions(id)
      )
    `);

    // Tabla de categorías
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        department TEXT,
        color TEXT,
        icon TEXT
      )
    `);

    // Tabla de departamentos
    db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        email TEXT,
        responsible TEXT
      )
    `);

    // Insertar datos de ejemplo
    seedDatabase();
  });
}

// Datos iniciales de ejemplo
function seedDatabase() {
  // Verificar si ya hay datos
  db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
    if (err || row.count > 0) return;

    // Insertar categorías
    const categories = [
      ['Alumbrado Público', 'Obras', '#FFA500', 'lightbulb'],
      ['Baches y Pavimento', 'Obras', '#8B4513', 'road'],
      ['Basura y Limpieza', 'Aseo y Ornato', '#228B22', 'trash'],
      ['Áreas Verdes', 'Aseo y Ornato', '#32CD32', 'tree'],
      ['Seguridad', 'Seguridad Ciudadana', '#FF0000', 'shield'],
      ['Ruidos Molestos', 'Inspección', '#800080', 'volume-up'],
      ['Animales', 'Salud', '#4169E1', 'pets'],
      ['Señalética', 'Tránsito', '#FFD700', 'sign'],
      ['Agua y Alcantarillado', 'Obras', '#1E90FF', 'water'],
      ['Otros', 'Administración', '#808080', 'help']
    ];

    categories.forEach(cat => {
      db.run('INSERT INTO categories (name, department, color, icon) VALUES (?, ?, ?, ?)', cat);
    });

    // Insertar departamentos
    const departments = [
      ['Obras', 'obras@municatemu.cl', 'Juan Pérez'],
      ['Aseo y Ornato', 'aseo@municatemu.cl', 'María González'],
      ['Seguridad Ciudadana', 'seguridad@municatemu.cl', 'Carlos López'],
      ['Inspección', 'inspeccion@municatemu.cl', 'Ana Martínez'],
      ['Salud', 'salud@municatemu.cl', 'Pedro Silva'],
      ['Tránsito', 'transito@municatemu.cl', 'Laura Rojas'],
      ['Administración', 'admin@municatemu.cl', 'Diego Galaz'],
      ['DIDECO', 'dideco@municatemu.cl', 'Katherina Erazo']
    ];

    departments.forEach(dept => {
      db.run('INSERT INTO departments (name, email, responsible) VALUES (?, ?, ?)', dept);
    });

    // Insertar encuesta de ejemplo
    db.run(
      'INSERT INTO surveys (title, description) VALUES (?, ?)',
      [
        'Satisfacción Servicios Municipales 2025',
        'Queremos conocer tu opinión sobre los servicios que brinda el municipio'
      ],
      function(err) {
        if (err) return;
        
        const surveyId = this.lastID;
        
        // Preguntas de la encuesta
        const questions = [
          [surveyId, '¿Cómo calificarías la atención municipal en general?', 'rating', null, 1, 1],
          [surveyId, '¿Qué servicios municipales has utilizado?', 'checkbox', 
           JSON.stringify(['Permisos de circulación', 'Licencias de conducir', 'Patentes comerciales', 
                          'Ayuda social', 'Inscripción talleres', 'Otros']), 1, 2],
          [surveyId, '¿Cuál es el principal problema de tu barrio?', 'radio',
           JSON.stringify(['Seguridad', 'Limpieza', 'Alumbrado', 'Áreas verdes', 'Pavimento', 'Otro']), 1, 3],
          [surveyId, '¿Tienes alguna sugerencia para mejorar los servicios?', 'text', null, 0, 4],
          [surveyId, '¿Recomendarías vivir en Catemu a un amigo?', 'radio',
           JSON.stringify(['Sí', 'No', 'Tal vez']), 1, 5]
        ];

        questions.forEach(q => {
          db.run(
            'INSERT INTO survey_questions (survey_id, question, type, options, required, order_num) VALUES (?, ?, ?, ?, ?, ?)',
            q
          );
        });
      }
    );

    console.log('Base de datos inicializada con datos de ejemplo');
  });
}

module.exports = db;