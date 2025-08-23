/**
 * Respuestas contextualizadas para CatemuConecta
 * Bot inteligente para la municipalidad de Catemu
 */

const CATEMU_RESPONSES = {
    // Saludos y bienvenida
    greeting: {
        patterns: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'saludos'],
        response: `¡Hola! 👋 Soy *CatemuConecta*, tu asistente digital de la Municipalidad de Catemu.

Estoy aquí para ayudarte a:
📍 Reportar problemas en tu barrio
🏆 Ganar puntos por tu participación
📊 Consultar el estado de tus reportes
💡 Informarte sobre servicios municipales

¿En qué puedo ayudarte hoy? Escribe:
• *Reportar* - Para informar un problema
• *Puntos* - Ver tus puntos acumulados
• *Estado* - Consultar tus reportes
• *Ayuda* - Ver todas las opciones`
    },

    // Ayuda general
    help: {
        patterns: ['ayuda', 'help', 'opciones', 'menu', 'comandos', 'qué puedes hacer'],
        response: `📋 *MENÚ PRINCIPAL - CatemuConecta*

Puedo ayudarte con:

*1️⃣ REPORTAR PROBLEMA*
Envía "reportar" o describe directamente el problema
Ejemplo: "Hay un bache en calle O'Higgins"

*2️⃣ CONSULTAS*
• *Estado* - Ver tus reportes anteriores
• *Puntos* - Consultar puntos y nivel
• *Ranking* - Top 10 ciudadanos activos

*3️⃣ INFORMACIÓN*
• *Horarios* - Atención municipal
• *Contactos* - Teléfonos importantes
• *Servicios* - Servicios disponibles

*4️⃣ EMERGENCIAS*
• *Urgente* - Reportar emergencia
• *112* - Números de emergencia

Escribe cualquier opción o describe tu problema directamente 💬`
    },

    // Reporte directo
    report: {
        patterns: ['reportar', 'informar', 'problema', 'denunciar', 'quiero reportar'],
        response: `📝 *NUEVO REPORTE*

Por favor, cuéntame sobre el problema que quieres reportar.

Puedes incluir:
• Descripción del problema
• Ubicación (calle, número, sector)
• Si es urgente, menciónalo

*Ejemplo:*
_"Hay un semáforo dañado en Av. Subercaseaux con San Martín, es peligroso"_

También puedes enviar:
📷 Una foto del problema
📍 Tu ubicación actual

Escribe tu reporte a continuación:`
    },

    // Detección de problemas específicos
    problems: {
        bache: {
            patterns: ['bache', 'hoyo', 'pavimento', 'calle rota'],
            response: `🚧 *REPORTE DE BACHE RECIBIDO*

Gracias por reportar este problema de pavimento. Lo he categorizado como:
• *Tipo:* Infraestructura vial
• *Prioridad:* Alta
• *Departamento:* Dirección de Obras

Para completar tu reporte, necesito:
📍 *Ubicación exacta* (calle y número)
📷 *Foto* (opcional pero útil)

¿Puedes indicarme la dirección exacta del bache?`
        },
        
        basura: {
            patterns: ['basura', 'desechos', 'contenedor', 'sucio', 'limpieza'],
            response: `♻️ *REPORTE DE ASEO RECIBIDO*

Entiendo que hay un problema con basura o limpieza. Lo proceso como:
• *Tipo:* Aseo y ornato
• *Prioridad:* Media
• *Departamento:* Aseo y Ornato

Necesito saber:
📍 Ubicación exacta
🕐 ¿Desde cuándo está el problema?
📷 Una foto ayudaría mucho

Por favor, dame más detalles.`
        },
        
        luz: {
            patterns: ['luz', 'alumbrado', 'lámpara', 'oscuro', 'iluminación'],
            response: `💡 *REPORTE DE ALUMBRADO PÚBLICO*

Problema de iluminación detectado. Registrando como:
• *Tipo:* Alumbrado público
• *Prioridad:* Alta (seguridad)
• *Departamento:* Obras Eléctricas

Información necesaria:
📍 Calle y número del poste
🔢 Número de postes afectados
⚡ ¿Está completamente apagado o intermitente?

¿Dónde está ubicado el problema?`
        },
        
        seguridad: {
            patterns: ['robo', 'asalto', 'peligroso', 'inseguro', 'delincuencia', 'droga'],
            response: `🚨 *ALERTA DE SEGURIDAD*

Tu seguridad es nuestra prioridad. 

*Para emergencias inmediatas:*
📞 Carabineros: 133
📞 Plan Cuadrante Catemu: +569 9XXX XXXX

*Para reportar zona insegura:*
Estoy registrando tu reporte para:
• Aumentar patrullaje preventivo
• Mejorar iluminación si es necesario
• Coordinar con Seguridad Ciudadana

¿Puedes darme la ubicación exacta y describir la situación?`
        }
    },

    // Consulta de puntos
    points: {
        patterns: ['puntos', 'punto', 'nivel', 'recompensas', 'premios', 'badges'],
        response: `🏆 *TUS PUNTOS EN CATEMU CONECTA*

*Tu perfil:*
• 👤 Nivel: *Ciudadano Activo* (Nivel 2)
• ⭐ Puntos totales: *250 puntos*
• 📊 Reportes realizados: 5
• ✅ Reportes resueltos: 3

*Tus insignias:*
🥇 Primera contribución
🎯 Reportero preciso
🌟 Ciudadano del mes

*Próximas recompensas:*
• 300 pts: Descuento 20% en patente comercial
• 500 pts: Entrada gratis a la piscina municipal
• 1000 pts: Reconocimiento "Ciudadano Destacado"

¡Sigue participando para subir de nivel! 🚀`
    },

    // Información municipal
    municipal: {
        horarios: {
            patterns: ['horario', 'horarios', 'atención', 'abierto', 'cuando atienden'],
            response: `🕐 *HORARIOS MUNICIPALIDAD DE CATEMU*

*Atención presencial:*
• Lunes a Viernes: 8:30 - 14:00 hrs
• Atención de público: 8:30 - 13:30 hrs

*Oficinas con horario especial:*
• Registro Civil: L-V 8:30 - 14:00
• Juzgado Policía Local: L-V 8:00 - 14:00
• DIDECO: L-V 8:30 - 17:30

*Dirección:*
📍 Av. Subercaseaux 350, Catemu

*Teléfono:*
☎️ (34) 259 1020

¿Necesitas información de alguna oficina específica?`
        },
        
        contactos: {
            patterns: ['contacto', 'teléfono', 'teléfonos', 'llamar', 'número'],
            response: `☎️ *CONTACTOS IMPORTANTES CATEMU*

*Municipalidad:*
• Central: (34) 259 1020
• WhatsApp: +569 2046 4349 (este bot)

*Emergencias:*
• 🚓 Carabineros: 133
• 🚒 Bomberos: 132
• 🏥 Ambulancia: 131
• ⚡ Emergencia eléctrica: 600 600 2222

*Departamentos:*
• DIDECO: (34) 259 1020 anexo 123
• Obras: (34) 259 1020 anexo 145
• Tránsito: (34) 259 1020 anexo 156
• Agua Potable: (34) 259 1020 anexo 167

¿Necesitas algún contacto específico?`
        }
    },

    // Estado de reportes
    status: {
        patterns: ['estado', 'mis reportes', 'consultar', 'seguimiento'],
        response: `📊 *ESTADO DE TUS REPORTES*

Tienes *3 reportes* registrados:

1️⃣ *#CAT-2025-1234*
📍 Bache en Av. O'Higgins 234
📅 Hace 3 días
🔄 Estado: *EN PROCESO*
👷 Asignado a: Dirección de Obras

2️⃣ *#CAT-2025-1122* 
📍 Luminaria apagada en Plaza de Armas
📅 Hace 1 semana
✅ Estado: *RESUELTO*
⭐ +50 puntos ganados

3️⃣ *#CAT-2025-1098*
📍 Contenedor desbordado en Villa Los Aromos
📅 Hace 2 semanas
✅ Estado: *RESUELTO*
⭐ +50 puntos ganados

Para más detalles de un reporte específico, escribe su número.`
    },

    // Despedida
    goodbye: {
        patterns: ['gracias', 'chao', 'adiós', 'hasta luego', 'bye'],
        response: `¡Gracias por usar CatemuConecta! 👋

Tu participación hace de Catemu una mejor ciudad. 

Recuerda que:
• Ganaste puntos por tu reporte 🏆
• Puedes seguir el estado en cualquier momento 📊
• Estamos disponibles 24/7 para ti 🕐

¡Hasta pronto, vecino! 
*Juntos construimos un mejor Catemu* 🏘️💚`
    },

    // Respuestas para urgencias
    emergency: {
        patterns: ['urgente', 'emergencia', 'peligro', 'ayuda rápida', 'socorro'],
        response: `🚨 *EMERGENCIA DETECTADA*

*Si es una emergencia real, llama inmediatamente a:*
📞 Carabineros: 133
📞 Bomberos: 132
📞 Ambulancia: 131

*Si es un problema municipal urgente:*
Estoy marcando tu reporte como *URGENTE* y notificando al equipo de emergencias municipal.

Por favor describe:
1. ¿Cuál es la emergencia?
2. ¿Ubicación exacta?
3. ¿Hay personas en peligro?

Tu reporte será atendido con máxima prioridad.`
    },

    // Respuesta por defecto con IA
    default: {
        response: `Entiendo que necesitas ayuda con algo específico. 

Como asistente de la Municipalidad de Catemu, puedo:
• Recibir tu reporte de problemas
• Darte información municipal
• Consultar tus puntos y reportes

Por favor, describe con más detalle lo que necesitas o escribe *"ayuda"* para ver todas las opciones.

También puedes escribir directamente tu problema, por ejemplo:
_"Hay un árbol caído en calle San Martín"_`
    }
};

/**
 * Encuentra la mejor respuesta para un mensaje
 */
function findBestResponse(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Buscar en todas las categorías
    for (const [category, data] of Object.entries(CATEMU_RESPONSES)) {
        // Si es una categoría con patterns directos
        if (data.patterns && Array.isArray(data.patterns)) {
            for (const pattern of data.patterns) {
                if (lowerMessage.includes(pattern)) {
                    return data.response;
                }
            }
        }
        
        // Si es una categoría con subcategorías (como problems)
        if (typeof data === 'object' && !data.patterns && !data.response) {
            for (const [subcat, subdata] of Object.entries(data)) {
                if (subdata.patterns && Array.isArray(subdata.patterns)) {
                    for (const pattern of subdata.patterns) {
                        if (lowerMessage.includes(pattern)) {
                            return subdata.response;
                        }
                    }
                }
            }
        }
    }
    
    // Si no encuentra coincidencia, respuesta por defecto
    return CATEMU_RESPONSES.default.response;
}

/**
 * Analiza el sentimiento/urgencia del mensaje
 */
function analyzeUrgency(message) {
    const urgentWords = [
        'urgente', 'peligro', 'emergencia', 'rápido', 'ahora', 'grave',
        'choque', 'chocó', 'accidente', 'colisión', 'atropello',
        'volcó', 'estrellado', 'golpeó', 'botó un poste',
        'herido', 'sangre', 'ambulancia', 'incendio', 'fuego'
    ];
    const lowerMessage = message.toLowerCase();
    
    for (const word of urgentWords) {
        if (lowerMessage.includes(word)) {
            return 'urgent';
        }
    }
    
    return 'normal';
}

/**
 * Extrae ubicación del mensaje si la menciona
 */
function extractLocation(message) {
    const lower = message.toLowerCase();
    
    // Detectar Plaza de Armas u otros lugares emblemáticos
    if (lower.includes('plaza de armas')) {
        return {
            street: 'Plaza de Armas',
            raw: 'Plaza de Armas'
        };
    }
    
    // Detectar direcciones con números
    const addressWithNumber = message.match(/(?:en\s+)?(?:calle\s+|av\.?\s+|avenida\s+|pasaje\s+|psje\.?\s+)?([a-záñéíóú\s']+?)\s+(\d{1,5})/i);
    if (addressWithNumber) {
        return {
            street: `${addressWithNumber[1].trim()} ${addressWithNumber[2]}`,
            raw: addressWithNumber[0].trim()
        };
    }
    
    // Detectar cruces de calles
    const crossPattern = message.match(/([a-záñéíóú\s']+?)\s+(?:con|esquina)\s+([a-záñéíóú\s']+)/i);
    if (crossPattern) {
        return {
            street: `${crossPattern[1].trim()} con ${crossPattern[2].trim()}`,
            raw: crossPattern[0].trim()
        };
    }
    
    // Detectar referencias a lugares conocidos
    const places = ['hospital', 'municipalidad', 'comisaría', 'bomberos', 'escuela', 'liceo', 'supermercado', 'estadio'];
    for (const place of places) {
        if (lower.includes(place)) {
            const idx = lower.indexOf(place);
            const endIdx = Math.min(idx + place.length + 20, message.length);
            return {
                street: message.substring(idx, endIdx).trim(),
                raw: place
            };
        }
    }
    
    // Si no encuentra patrones específicos pero menciona "calle", no extraer
    if (lower.includes('la calle') || lower.includes('mi calle') || lower.includes('una calle')) {
        return null;
    }
    
    return null;
}

module.exports = {
    CATEMU_RESPONSES,
    findBestResponse,
    analyzeUrgency,
    extractLocation
};