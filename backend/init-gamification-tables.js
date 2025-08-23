#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database/catemu.db'));

console.log('Inicializando tablas de gamificación...');

db.serialize(() => {
  // Tabla de usuarios y puntos
  db.run(`
    CREATE TABLE IF NOT EXISTS user_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_identifier TEXT UNIQUE NOT NULL,
      user_name TEXT,
      total_points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      badges TEXT DEFAULT '[]',
      reports_count INTEGER DEFAULT 0,
      surveys_count INTEGER DEFAULT 0,
      validated_reports INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creando user_points:', err);
    else console.log('✅ Tabla user_points creada');
  });

  // Tabla de actividades que dan puntos
  db.run(`
    CREATE TABLE IF NOT EXISTS point_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_identifier TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      points_earned INTEGER NOT NULL,
      reference_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creando point_activities:', err);
    else console.log('✅ Tabla point_activities creada');
  });

  // Tabla de analytics del bot (si no existe)
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
});

setTimeout(() => {
  db.close(() => {
    console.log('✅ Tablas de gamificación inicializadas');
  });
}, 1000);