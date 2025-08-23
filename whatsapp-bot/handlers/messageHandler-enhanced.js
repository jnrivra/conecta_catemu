/**
 * Handler mejorado con respuestas contextualizadas de Catemu
 */

const { findBestResponse, analyzeUrgency, extractLocation } = require('./catemu-responses');
const BackendAPI = require('../services/api');

class EnhancedMessageHandler {
    constructor() {
        this.backendAPI = new BackendAPI();
        this.userStates = new Map();
    }

    /**
     * Procesa mensajes entrantes con contexto de Catemu
     */
    async handleMessage({ from, body, senderName }) {
        try {
            // Limpiar y normalizar mensaje
            const cleanMessage = body.trim();
            const lowerMessage = cleanMessage.toLowerCase();
            
            // Obtener o crear estado del usuario
            let userState = this.userStates.get(from) || {
                step: 'IDLE',
                data: {},
                lastActivity: Date.now()
            };

            // Limpiar estados inactivos (30 minutos)
            if (Date.now() - userState.lastActivity > 30 * 60 * 1000) {
                userState = { step: 'IDLE', data: {}, lastActivity: Date.now() };
            }

            userState.lastActivity = Date.now();
            this.userStates.set(from, userState);

            // Si está esperando información específica
            if (userState.step === 'WAITING_LOCATION') {
                return await this.handleLocationInput(cleanMessage, userState, from, senderName);
            }

            if (userState.step === 'WAITING_DESCRIPTION') {
                return await this.handleDescriptionInput(cleanMessage, userState, from, senderName);
            }

            // Analizar urgencia
            const urgency = analyzeUrgency(cleanMessage);
            
            // Extraer ubicación si la menciona
            const location = extractLocation(cleanMessage);

            // Detectar si es un reporte directo
            if (this.isDirectReport(cleanMessage)) {
                return await this.createQuickReport(cleanMessage, from, senderName, urgency, location);
            }

            // Buscar respuesta contextualizada
            const response = findBestResponse(cleanMessage);

            // Si el usuario quiere reportar, cambiar estado
            if (lowerMessage.includes('reportar') || lowerMessage.includes('problema')) {
                userState.step = 'WAITING_DESCRIPTION';
                userState.data = { startTime: Date.now() };
                this.userStates.set(from, userState);
            }

            return response;
        } catch (error) {
            console.error('Error procesando mensaje:', error);
            return `❌ Hubo un error procesando tu mensaje. Por favor intenta de nuevo o escribe "ayuda".`;
        }
    }

    /**
     * Detecta si el mensaje es un reporte directo
     */
    isDirectReport(message) {
        const reportKeywords = [
            'hay un', 'hay una', 'existe un', 'existe una',
            'vi un', 'vi una', 'encontré', 'está roto',
            'está dañado', 'no funciona', 'problema con',
            'bache', 'basura', 'luz apagada', 'semáforo malo'
        ];

        const lower = message.toLowerCase();
        return reportKeywords.some(keyword => lower.includes(keyword));
    }

    /**
     * Crea un reporte rápido desde el mensaje
     */
    async createQuickReport(message, from, senderName, urgency, location) {
        try {
            // Determinar categoría automáticamente
            const category = this.detectCategory(message);
            
            // Crear reporte en el backend
            const reportData = {
                type: category.type,
                category: category.name,
                description: message,
                priority: urgency === 'urgent' ? 'high' : 'medium',
                location: location ? JSON.stringify({
                    address: `${location.street} ${location.number || ''}`.trim(),
                    lat: -32.7805, // Coordenadas de Catemu centro
                    lng: -70.9643
                }) : null,
                contact_info: JSON.stringify({
                    name: senderName,
                    phone: from.replace('@s.whatsapp.net', '')
                }),
                source: 'whatsapp',
                whatsapp_number: from.replace('@s.whatsapp.net', '')
            };

            const response = await this.backendAPI.createReport(reportData);

            if (response && response.id) {
                // Limpiar estado del usuario
                this.userStates.delete(from);

                return `✅ *REPORTE CREADO EXITOSAMENTE*

📋 *Número de reporte:* ${response.id}
📍 *Tipo:* ${category.name}
⚡ *Prioridad:* ${urgency === 'urgent' ? 'URGENTE' : 'Normal'}
🏢 *Asignado a:* ${category.department}

Tu reporte fue recibido y será atendido por el departamento correspondiente.

*Has ganado +10 puntos* 🏆

Puedes consultar el estado escribiendo: "estado ${response.id}"

¡Gracias por ayudar a mejorar Catemu! 💚`;
            }
        } catch (error) {
            console.error('Error creando reporte:', error);
        }

        return `📝 He recibido tu reporte. Lo estoy procesando...

*Descripción:* ${message}
${location ? `*Ubicación detectada:* ${location.street}` : ''}
${urgency === 'urgent' ? '🚨 *Marcado como URGENTE*' : ''}

Un momento mientras lo registro en el sistema...`;
    }

    /**
     * Detecta la categoría del problema
     */
    detectCategory(message) {
        const lower = message.toLowerCase();
        
        const categories = {
            infrastructure: {
                keywords: ['bache', 'hoyo', 'pavimento', 'calle', 'vereda', 'acera'],
                name: 'Infraestructura vial',
                type: 'infrastructure',
                department: 'Dirección de Obras'
            },
            lighting: {
                keywords: ['luz', 'lámpara', 'alumbrado', 'poste', 'iluminación', 'oscuro'],
                name: 'Alumbrado público',
                type: 'infrastructure',
                department: 'Obras Eléctricas'
            },
            waste: {
                keywords: ['basura', 'desecho', 'contenedor', 'sucio', 'limpieza', 'escombros'],
                name: 'Aseo y ornato',
                type: 'environment',
                department: 'Aseo y Ornato'
            },
            security: {
                keywords: ['robo', 'peligro', 'inseguro', 'delincuencia', 'vandalismo'],
                name: 'Seguridad ciudadana',
                type: 'security',
                department: 'Seguridad Ciudadana'
            },
            water: {
                keywords: ['agua', 'fuga', 'inundación', 'alcantarilla', 'desagüe'],
                name: 'Agua y alcantarillado',
                type: 'services',
                department: 'Agua Potable'
            },
            traffic: {
                keywords: ['semáforo', 'señalética', 'tránsito', 'tráfico', 'señal'],
                name: 'Tránsito y transporte',
                type: 'infrastructure',
                department: 'Tránsito'
            }
        };

        for (const [key, cat] of Object.entries(categories)) {
            for (const keyword of cat.keywords) {
                if (lower.includes(keyword)) {
                    return cat;
                }
            }
        }

        // Categoría por defecto
        return {
            name: 'Otros',
            type: 'other',
            department: 'Administración General'
        };
    }

    /**
     * Maneja input de ubicación
     */
    async handleLocationInput(message, userState, from, senderName) {
        userState.data.location = message;
        userState.step = 'COMPLETE';
        
        // Crear el reporte con toda la información
        const reportData = {
            description: userState.data.description || message,
            location: userState.data.location,
            from,
            senderName
        };

        return await this.createQuickReport(
            reportData.description,
            from,
            senderName,
            'normal',
            extractLocation(reportData.location)
        );
    }

    /**
     * Maneja input de descripción
     */
    async handleDescriptionInput(message, userState, from, senderName) {
        userState.data.description = message;
        
        // Verificar si incluye ubicación
        const location = extractLocation(message);
        
        if (location) {
            // Si ya tiene ubicación, crear reporte
            return await this.createQuickReport(
                message,
                from,
                senderName,
                analyzeUrgency(message),
                location
            );
        } else {
            // Pedir ubicación
            userState.step = 'WAITING_LOCATION';
            this.userStates.set(from, userState);
            
            return `📍 Gracias por tu reporte. Para completarlo, necesito la ubicación.

Por favor indica:
• Nombre de la calle
• Número o referencia
• Sector o villa

Ejemplo: _"Av. O'Higgins 234, cerca del supermercado"_`;
        }
    }
}

module.exports = EnhancedMessageHandler;