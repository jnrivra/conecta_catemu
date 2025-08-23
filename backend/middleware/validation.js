/**
 * Middleware de validación y sanitización para CatemuConecta
 */

const validator = require('validator');
const xss = require('xss');

// Configuración de XSS
const xssOptions = {
  whiteList: {}, // No permitir ninguna etiqueta HTML
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
};

/**
 * Sanitiza strings removiendo HTML y scripts maliciosos
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return xss(validator.trim(str), xssOptions);
};

/**
 * Sanitiza objetos recursivamente
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Middleware para sanitizar request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Validadores específicos para reportes
 */
const validateReport = (req, res, next) => {
  const errors = [];
  const { type, category, description, priority, location } = req.body;

  // Validar tipo
  const validTypes = ['infrastructure', 'security', 'environment', 'services', 'other'];
  if (!type || !validTypes.includes(type)) {
    errors.push('Tipo de reporte inválido');
  }

  // Validar categoría
  if (!category || category.length < 3 || category.length > 100) {
    errors.push('Categoría debe tener entre 3 y 100 caracteres');
  }

  // Validar descripción
  if (!description || description.length < 10 || description.length > 2000) {
    errors.push('Descripción debe tener entre 10 y 2000 caracteres');
  }

  // Validar prioridad
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (priority && !validPriorities.includes(priority)) {
    errors.push('Prioridad inválida');
  }

  // Validar ubicación si existe
  if (location) {
    try {
      const loc = typeof location === 'string' ? JSON.parse(location) : location;
      if (loc.lat && (loc.lat < -90 || loc.lat > 90)) {
        errors.push('Latitud inválida');
      }
      if (loc.lng && (loc.lng < -180 || loc.lng > 180)) {
        errors.push('Longitud inválida');
      }
    } catch (e) {
      errors.push('Formato de ubicación inválido');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors
    });
  }

  next();
};

/**
 * Validador de número de teléfono chileno
 */
const validateChileanPhone = (phone) => {
  // Formato: +56912345678 o 56912345678
  const phoneRegex = /^(\+?56)?9[0-9]{8}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleaned);
};

/**
 * Validador de RUT chileno
 */
const validateRUT = (rut) => {
  if (!rut) return false;
  
  // Limpiar formato
  const cleaned = rut.replace(/[.-]/g, '').toUpperCase();
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Validar formato
  if (!/^[0-9]+$/.test(body) || (dv !== 'K' && !/^[0-9]$/.test(dv))) {
    return false;
  }
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return calculatedDV === dv;
};

/**
 * Middleware para validar mensajes del bot
 */
const validateBotMessage = (req, res, next) => {
  const errors = [];
  const { chat_id, message_content, message_type } = req.body;

  // Validar chat_id (número WhatsApp) - Simplificado para la demo
  if (!chat_id) {
    errors.push('Chat ID requerido');
  }

  // Validar contenido del mensaje
  if (!message_content || message_content.length > 4096) {
    errors.push('Mensaje debe tener máximo 4096 caracteres');
  }

  // Validar tipo de mensaje
  const validTypes = ['text', 'image', 'document', 'audio', 'video', 'location'];
  if (!message_type || !validTypes.includes(message_type)) {
    errors.push('Tipo de mensaje inválido');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors
    });
  }

  next();
};

/**
 * Rate limiting por IP
 */
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitMap.get(ip);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes. Por favor intente más tarde.'
      });
    }
    
    limit.count++;
    next();
  };
};

/**
 * Limpieza periódica del rate limit map
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime + 300000) { // 5 minutos después del reset
      rateLimitMap.delete(ip);
    }
  }
}, 300000); // Cada 5 minutos

/**
 * Validador de archivos subidos
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const errors = [];
    
    for (const fieldName in req.files) {
      const file = req.files[fieldName];
      
      // Validar tipo MIME
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`Tipo de archivo no permitido: ${file.name}`);
      }
      
      // Validar tamaño
      if (file.size > maxSize) {
        errors.push(`Archivo muy grande: ${file.name} (máximo ${maxSize / 1024 / 1024}MB)`);
      }
      
      // Validar extensión
      const allowedExtensions = allowedTypes.map(type => {
        const parts = type.split('/');
        return '.' + parts[parts.length - 1];
      });
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`Extensión no permitida: ${fileExtension}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }
    
    next();
  };
};

/**
 * Middleware de manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // No exponer detalles del error en producción
  const isDev = process.env.NODE_ENV === 'development';
  
  // Errores de validación de MongoDB/Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      errors: errors
    });
  }
  
  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
  
  // Errores de base de datos
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      success: false,
      error: 'Conflicto con datos existentes'
    });
  }
  
  // Error por defecto
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Error interno del servidor',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  validateReport,
  validateChileanPhone,
  validateRUT,
  validateBotMessage,
  rateLimit,
  validateFileUpload,
  errorHandler
};