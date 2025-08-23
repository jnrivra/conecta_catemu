#!/usr/bin/env node

/**
 * Script para poblar la base de datos con datos de demo realistas
 * Basado en problemas reales de Catemu
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database(path.join(__dirname, '../database/catemu.db'));

// Datos realistas de Catemu
const DEMO_REPORTS = [
  // Problemas de infraestructura
  {
    type: 'infrastructure',
    category: 'Baches y Pavimento',
    description: 'Hoyo peligroso en calle San Martín esquina O\'Higgins. Varios autos han sufrido daños.',
    location: JSON.stringify({ lat: -32.7805, lng: -70.9643, address: 'San Martín con O\'Higgins' }),
    priority: 'high',
    status: 'in_progress',
    department: 'Obras',
    source: 'whatsapp',
    whatsapp_number: '56912345678',
    contact_info: JSON.stringify({ name: 'María González', phone: '56912345678' })
  },
  {
    type: 'infrastructure',
    category: 'Alumbrado Público',
    description: 'Toda la cuadra de Av. Chacabuco entre Portales y Maipú sin luz hace 3 días.',
    location: JSON.stringify({ lat: -32.7812, lng: -70.9651, address: 'Av. Chacabuco' }),
    priority: 'high',
    status: 'pending',
    department: 'Obras',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Pedro Silva', email: 'pedro.silva@gmail.com' })
  },
  {
    type: 'infrastructure',
    category: 'Agua y Alcantarillado',
    description: 'Fuga de agua en la vereda frente al número 245 de calle Prat. Desperdicio considerable.',
    location: JSON.stringify({ lat: -32.7798, lng: -70.9638, address: 'Prat 245' }),
    priority: 'medium',
    status: 'pending',
    department: 'Obras',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Ana Martínez', phone: '56987654321' })
  },
  
  // Problemas ambientales
  {
    type: 'environment',
    category: 'Basura y Limpieza',
    description: 'Microbasural en sitio eriazo de calle Los Aromos. Vecinos preocupados por ratones.',
    location: JSON.stringify({ lat: -32.7821, lng: -70.9655, address: 'Los Aromos s/n' }),
    priority: 'high',
    status: 'pending',
    department: 'Aseo y Ornato',
    source: 'whatsapp',
    whatsapp_number: '56923456789',
    contact_info: JSON.stringify({ name: 'Juan Pérez', phone: '56923456789' })
  },
  {
    type: 'environment',
    category: 'Áreas Verdes',
    description: 'Árboles tapan señalética en Plaza de Armas. Ramas secas con riesgo de caída.',
    location: JSON.stringify({ lat: -32.7803, lng: -70.9640, address: 'Plaza de Armas' }),
    priority: 'medium',
    status: 'completed',
    department: 'Aseo y Ornato',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Carlos López', email: 'carlos.l@hotmail.com' })
  },
  {
    type: 'environment',
    category: 'Basura y Limpieza',
    description: 'Contenedor de basura desbordado en Población San José hace 5 días.',
    location: JSON.stringify({ lat: -32.7835, lng: -70.9662, address: 'Población San José' }),
    priority: 'medium',
    status: 'in_progress',
    department: 'Aseo y Ornato',
    source: 'whatsapp',
    whatsapp_number: '56934567890',
    contact_info: JSON.stringify({ name: 'Rosa Díaz', phone: '56934567890' })
  },
  
  // Problemas de seguridad
  {
    type: 'security',
    category: 'Seguridad',
    description: 'Luminarias apagadas en pasaje Los Copihues generan inseguridad nocturna.',
    location: JSON.stringify({ lat: -32.7790, lng: -70.9635, address: 'Pasaje Los Copihues' }),
    priority: 'high',
    status: 'pending',
    department: 'Seguridad Ciudadana',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Miguel Ángel Rojas', phone: '56945678901' })
  },
  {
    type: 'security',
    category: 'Seguridad',
    description: 'Solicitud de mayor patrullaje en Villa Los Jardines. Aumento de robos.',
    location: JSON.stringify({ lat: -32.7845, lng: -70.9670, address: 'Villa Los Jardines' }),
    priority: 'high',
    status: 'in_progress',
    department: 'Seguridad Ciudadana',
    source: 'whatsapp',
    whatsapp_number: '56956789012',
    contact_info: JSON.stringify({ name: 'Patricia Morales', phone: '56956789012' })
  },
  
  // Problemas sociales
  {
    type: 'social',
    category: 'Ruidos Molestos',
    description: 'Local comercial con música alta hasta altas horas. Vecinos no pueden dormir.',
    location: JSON.stringify({ lat: -32.7808, lng: -70.9645, address: 'Independencia 432' }),
    priority: 'medium',
    status: 'pending',
    department: 'Inspección',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Fernando Castro', email: 'fcastro@gmail.com' })
  },
  {
    type: 'social',
    category: 'Animales',
    description: 'Perros vagos en Pack cerca del colegio San Francisco. Padres preocupados.',
    location: JSON.stringify({ lat: -32.7815, lng: -70.9648, address: 'Colegio San Francisco' }),
    priority: 'high',
    status: 'pending',
    department: 'Salud',
    source: 'whatsapp',
    whatsapp_number: '56967890123',
    contact_info: JSON.stringify({ name: 'Laura Soto', phone: '56967890123' })
  },
  
  // Problemas viales
  {
    type: 'transit',
    category: 'Señalética',
    description: 'Falta señal de Pare en cruce peligroso. Ya han ocurrido 3 accidentes.',
    location: JSON.stringify({ lat: -32.7825, lng: -70.9658, address: 'Los Álamos con Las Acacias' }),
    priority: 'urgent',
    status: 'in_progress',
    department: 'Tránsito',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Roberto Vargas', phone: '56978901234' })
  },
  {
    type: 'transit',
    category: 'Señalética',
    description: 'Semáforo descompuesto en Av. Principal con Comercio. Congestión vehicular.',
    location: JSON.stringify({ lat: -32.7800, lng: -70.9642, address: 'Av. Principal con Comercio' }),
    priority: 'urgent',
    status: 'in_progress',
    department: 'Tránsito',
    source: 'whatsapp',
    whatsapp_number: '56989012345',
    contact_info: JSON.stringify({ name: 'Claudia Herrera', phone: '56989012345' })
  },
  
  // Más reportes variados
  {
    type: 'infrastructure',
    category: 'Baches y Pavimento',
    description: 'Vereda quebrada frente a consultorio. Adultos mayores han tropezado.',
    location: JSON.stringify({ lat: -32.7792, lng: -70.9637, address: 'Consultorio Municipal' }),
    priority: 'high',
    status: 'pending',
    department: 'Obras',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Isabel Fuentes', email: 'isabel.f@yahoo.com' })
  },
  {
    type: 'environment',
    category: 'Áreas Verdes',
    description: 'Plaza infantil necesita mantención urgente. Juegos oxidados y peligrosos.',
    location: JSON.stringify({ lat: -32.7830, lng: -70.9665, address: 'Plaza Los Niños' }),
    priority: 'high',
    status: 'pending',
    department: 'Aseo y Ornato',
    source: 'whatsapp',
    whatsapp_number: '56990123456',
    contact_info: JSON.stringify({ name: 'Mónica Valdés', phone: '56990123456' })
  },
  {
    type: 'infrastructure',
    category: 'Alumbrado Público',
    description: 'Poste de luz inclinado con riesgo de caída en calle Balmaceda.',
    location: JSON.stringify({ lat: -32.7818, lng: -70.9652, address: 'Balmaceda 567' }),
    priority: 'urgent',
    status: 'in_progress',
    department: 'Obras',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Diego Muñoz', phone: '56901234567' })
  },
  {
    type: 'social',
    category: 'Otros',
    description: 'Solicitud de taller de computación para adultos mayores en sede vecinal.',
    location: JSON.stringify({ lat: -32.7810, lng: -70.9647, address: 'Sede Vecinal Villa Esperanza' }),
    priority: 'low',
    status: 'pending',
    department: 'DIDECO',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Teresa Campos', email: 'tcampos@gmail.com' })
  },
  {
    type: 'environment',
    category: 'Basura y Limpieza',
    description: 'Escombros abandonados en esquina de calle Nueva con Progreso.',
    location: JSON.stringify({ lat: -32.7838, lng: -70.9668, address: 'Nueva con Progreso' }),
    priority: 'medium',
    status: 'completed',
    department: 'Aseo y Ornato',
    source: 'whatsapp',
    whatsapp_number: '56912345678',
    contact_info: JSON.stringify({ name: 'Alejandro Rivas', phone: '56912345678' })
  },
  {
    type: 'infrastructure',
    category: 'Agua y Alcantarillado',
    description: 'Alcantarilla tapada causa inundación con lluvia en Población Nueva Esperanza.',
    location: JSON.stringify({ lat: -32.7850, lng: -70.9675, address: 'Población Nueva Esperanza' }),
    priority: 'high',
    status: 'in_progress',
    department: 'Obras',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Raúl Vergara', phone: '56923456789' })
  },
  {
    type: 'security',
    category: 'Seguridad',
    description: 'Cámara de seguridad no funciona en esquina conflictiva.',
    location: JSON.stringify({ lat: -32.7795, lng: -70.9639, address: 'Los Pinos con Las Rosas' }),
    priority: 'high',
    status: 'pending',
    department: 'Seguridad Ciudadana',
    source: 'whatsapp',
    whatsapp_number: '56934567890',
    contact_info: JSON.stringify({ name: 'Eduardo Pinto', phone: '56934567890' })
  },
  {
    type: 'transit',
    category: 'Señalética',
    description: 'Falta paso de cebra frente a escuela. Niños cruzan sin seguridad.',
    location: JSON.stringify({ lat: -32.7820, lng: -70.9654, address: 'Escuela República' }),
    priority: 'urgent',
    status: 'pending',
    department: 'Tránsito',
    source: 'web',
    contact_info: JSON.stringify({ name: 'Profesora Andrea Sáez', email: 'asaez@escuela.cl' })
  }
];

// Datos de usuarios para gamificación
const DEMO_USERS = [
  { identifier: '56912345678', name: 'María González', points: 850, level: 4, reports: 12, badges: '["first_report","reporter_bronze","verified_citizen"]' },
  { identifier: '56923456789', name: 'Juan Pérez', points: 1250, level: 5, reports: 18, badges: '["first_report","reporter_silver","verified_citizen","community_hero"]' },
  { identifier: '56934567890', name: 'Rosa Díaz', points: 450, level: 3, reports: 7, badges: '["first_report","reporter_bronze"]' },
  { identifier: '56945678901', name: 'Miguel Rojas', points: 320, level: 2, reports: 5, badges: '["first_report"]' },
  { identifier: '56956789012', name: 'Patricia Morales', points: 680, level: 3, reports: 9, badges: '["first_report","reporter_bronze","active_participant"]' },
  { identifier: '56967890123', name: 'Laura Soto', points: 150, level: 1, reports: 3, badges: '["first_report"]' },
  { identifier: '56978901234', name: 'Roberto Vargas', points: 920, level: 4, reports: 14, badges: '["first_report","reporter_silver","trusted_reporter"]' },
  { identifier: '56989012345', name: 'Claudia Herrera', points: 550, level: 3, reports: 8, badges: '["first_report","reporter_bronze"]' },
  { identifier: '56990123456', name: 'Mónica Valdés', points: 380, level: 2, reports: 6, badges: '["first_report"]' },
  { identifier: '56901234567', name: 'Diego Muñoz', points: 1580, level: 6, reports: 25, badges: '["first_report","reporter_gold","verified_citizen","trusted_reporter","community_hero"]' }
];

// Mensajes de bot para historial
const DEMO_BOT_MESSAGES = [
  { chat_id: '56912345678@s.whatsapp.net', sender_number: '56912345678', sender_name: 'María González', message_type: 'text', message_content: 'Hola, quiero reportar un bache peligroso', direction: 'incoming' },
  { chat_id: '56912345678@s.whatsapp.net', sender_number: 'bot', sender_name: 'CatemuConecta Bot', message_type: 'text', message_content: '¡Hola María! Gracias por contactarnos. Por favor, envíame una foto del problema y la ubicación.', direction: 'outgoing' },
  { chat_id: '56912345678@s.whatsapp.net', sender_number: '56912345678', sender_name: 'María González', message_type: 'image', message_content: 'Foto del bache', direction: 'incoming' },
  { chat_id: '56912345678@s.whatsapp.net', sender_number: 'bot', sender_name: 'CatemuConecta Bot', message_type: 'text', message_content: '✅ Reporte recibido. Número de seguimiento: CAT-2025-1234. El departamento de Obras ha sido notificado.', direction: 'outgoing' },
  
  { chat_id: '56923456789@s.whatsapp.net', sender_number: '56923456789', sender_name: 'Juan Pérez', message_type: 'text', message_content: 'Hay un microbasural en mi calle', direction: 'incoming' },
  { chat_id: '56923456789@s.whatsapp.net', sender_number: 'bot', sender_name: 'CatemuConecta Bot', message_type: 'text', message_content: '¡Hola Juan! Lamento escuchar eso. ¿Puedes compartir la ubicación exacta?', direction: 'outgoing' },
  { chat_id: '56923456789@s.whatsapp.net', sender_number: '56923456789', sender_name: 'Juan Pérez', message_type: 'location', message_content: 'Ubicación: Los Aromos s/n', direction: 'incoming' },
  { chat_id: '56923456789@s.whatsapp.net', sender_number: 'bot', sender_name: 'CatemuConecta Bot', message_type: 'text', message_content: '📍 Ubicación recibida. He categorizado esto como ALTA PRIORIDAD. Aseo y Ornato actuará dentro de 24-48 horas.', direction: 'outgoing' }
];

console.log('🌱 Iniciando seed de datos de demo para CatemuConecta...\n');

// Limpiar datos existentes
console.log('🧹 Limpiando datos anteriores...');
db.serialize(() => {
  // Limpiar reportes antiguos (mantener solo los últimos 3)
  db.run('DELETE FROM reports WHERE id NOT IN (SELECT id FROM reports ORDER BY created_at DESC LIMIT 3)');
  
  // Limpiar mensajes del bot
  db.run('DELETE FROM bot_messages');
  
  // Limpiar puntos de usuarios
  db.run('DELETE FROM user_points');
  
  // Limpiar actividades
  db.run('DELETE FROM point_activities');
  
  console.log('✅ Datos anteriores limpiados\n');
  
  // Insertar nuevos reportes
  console.log('📝 Insertando reportes de demo...');
  let reportCount = 0;
  
  DEMO_REPORTS.forEach((report, index) => {
    const id = `CAT-2025-${1000 + index}`;
    const created = new Date();
    created.setDate(created.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 días
    
    db.run(
      `INSERT INTO reports (id, type, category, description, location, priority, status, 
       department, source, whatsapp_number, contact_info, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        report.type,
        report.category,
        report.description,
        report.location,
        report.priority,
        report.status,
        report.department,
        report.source,
        report.whatsapp_number,
        report.contact_info,
        created.toISOString(),
        created.toISOString()
      ],
      (err) => {
        if (!err) {
          reportCount++;
          if (reportCount === DEMO_REPORTS.length) {
            console.log(`✅ ${reportCount} reportes insertados\n`);
          }
        } else {
          console.error('Error insertando reporte:', err);
        }
      }
    );
  });
  
  // Insertar usuarios de gamificación
  console.log('🎮 Insertando usuarios de gamificación...');
  let userCount = 0;
  
  DEMO_USERS.forEach(user => {
    db.run(
      `INSERT INTO user_points (user_identifier, user_name, total_points, level, 
       reports_count, badges, validated_reports)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.identifier,
        user.name,
        user.points,
        user.level,
        user.reports,
        user.badges,
        Math.floor(user.reports * 0.7) // 70% validados
      ],
      (err) => {
        if (!err) {
          userCount++;
          if (userCount === DEMO_USERS.length) {
            console.log(`✅ ${userCount} usuarios con puntos insertados\n`);
          }
        } else {
          console.error('Error insertando usuario:', err);
        }
      }
    );
  });
  
  // Insertar mensajes del bot
  console.log('💬 Insertando historial de conversaciones...');
  let messageCount = 0;
  
  DEMO_BOT_MESSAGES.forEach(message => {
    const created = new Date();
    created.setHours(created.getHours() - Math.floor(Math.random() * 72)); // Últimas 72 horas
    
    db.run(
      `INSERT INTO bot_messages (chat_id, sender_number, sender_name, message_type, 
       message_content, direction, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'delivered', ?)`,
      [
        message.chat_id,
        message.sender_number,
        message.sender_name,
        message.message_type,
        message.message_content,
        message.direction,
        created.toISOString()
      ],
      (err) => {
        if (!err) {
          messageCount++;
          if (messageCount === DEMO_BOT_MESSAGES.length) {
            console.log(`✅ ${messageCount} mensajes de bot insertados\n`);
          }
        } else {
          console.error('Error insertando mensaje:', err);
        }
      }
    );
  });
  
  // Actualizar estadísticas
  setTimeout(() => {
    console.log('📊 Actualizando estadísticas...');
    
    // Actualizar analytics del bot
    const today = new Date().toISOString().split('T')[0];
    db.run(
      `INSERT OR REPLACE INTO bot_analytics (date, metric_type, metric_value)
       VALUES (?, 'daily_reports', ?)`,
      [today, Math.floor(Math.random() * 5) + 3]
    );
    
    console.log('✅ Estadísticas actualizadas\n');
    
    // Cerrar conexión
    setTimeout(() => {
      db.close(() => {
        console.log('✨ ¡Seed completado exitosamente!');
        console.log('📊 Resumen:');
        console.log(`   - ${DEMO_REPORTS.length} reportes realistas de Catemu`);
        console.log(`   - ${DEMO_USERS.length} usuarios con gamificación`);
        console.log(`   - ${DEMO_BOT_MESSAGES.length} mensajes de WhatsApp`);
        console.log('\n🚀 El sistema está listo para la demo');
      });
    }, 1000);
  }, 2000);
});