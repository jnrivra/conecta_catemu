/**
 * Handler mejorado con flujo completo de reporte y tickets
 */

const { findBestResponse, analyzeUrgency, extractLocation } = require('./catemu-responses');
const BackendAPI = require('../services/api');

class FixedMessageHandler {
    constructor() {
        this.backendAPI = new BackendAPI();
        this.userStates = new Map();
        this.reportCounter = Math.floor(Math.random() * 900) + 100; // Para IDs únicos
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
                lastActivity: Date.now(),
                attempts: 0
            };

            // Limpiar estados inactivos (30 minutos)
            if (Date.now() - userState.lastActivity > 30 * 60 * 1000) {
                userState = { step: 'IDLE', data: {}, lastActivity: Date.now(), attempts: 0 };
            }

            userState.lastActivity = Date.now();
            this.userStates.set(from, userState);

            // Manejar cancelación
            if (lowerMessage === 'cancelar' || lowerMessage === 'salir') {
                this.userStates.delete(from);
                return `❌ Proceso cancelado. 

Puedes comenzar de nuevo cuando quieras escribiendo:
• "Reportar" para un nuevo reporte
• "Ayuda" para ver opciones

¡Estoy aquí cuando me necesites! 👋`;
            }

            // Si está esperando información específica
            if (userState.step === 'WAITING_LOCATION') {
                return await this.handleLocationInput(cleanMessage, userState, from, senderName);
            }

            if (userState.step === 'WAITING_DESCRIPTION') {
                return await this.handleDescriptionInput(cleanMessage, userState, from, senderName);
            }

            if (userState.step === 'WAITING_CONFIRMATION') {
                return await this.handleConfirmation(cleanMessage, userState, from, senderName);
            }

            // IMPORTANTE: Primero verificar si está en medio de la encuesta de hackaton
            if (userState.step && userState.step.startsWith('HACKATON_')) {
                // El usuario está en medio de la encuesta, procesar su respuesta
                // NO reiniciar la encuesta aunque escriba "3"
                // La lógica de manejo de respuestas se ejecutará más abajo
            } else if (cleanMessage === '3' || lowerMessage === 'encuesta' || lowerMessage === 'encuestas') {
                // Solo iniciar encuesta si NO está ya en una
                // Iniciar encuesta de hackaton directamente
                userState.step = 'HACKATON_Q1';
                userState.data = {
                    surveyType: 'hackaton',
                    responses: [],
                    startTime: Date.now()
                };
                this.userStates.set(from, userState);
                
                return `🏆 *HACKATON MUNICIPIOS A LA VANGUARDIA*\n` +
                       `_Ministerio Secretaría General de Gobierno_\n\n` +
                       `📊 3 preguntas rápidas (30 segundos)\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                       `*PREGUNTA 1/3*\n\n` +
                       `🎯 ¿Qué te parece la iniciativa del Ministerio de promover innovación con IA en municipios?\n\n` +
                       `1️⃣ No me interesa\n` +
                       `2️⃣ Poco relevante\n` +
                       `3️⃣ Interesante\n` +
                       `4️⃣ Muy importante\n` +
                       `5️⃣ Fundamental para Chile\n\n` +
                       `_Responde con el número (1-5)_`;
            }
            
            // Manejar respuestas de la encuesta de hackaton
            // Esto debe estar DESPUÉS de verificar si se está iniciando una nueva encuesta
            if (userState.step === 'HACKATON_Q1') {
                if (['1','2','3','4','5'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'utilidad',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q2';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 2/3*\n\n` +
                           `🤖 ¿Qué tipo de tecnología con IA debería priorizar tu municipio?\n\n` +
                           `1️⃣ Atención ciudadana automatizada\n` +
                           `2️⃣ Análisis predictivo de problemas urbanos\n` +
                           `3️⃣ Optimización de recursos municipales\n` +
                           `4️⃣ Participación ciudadana digital\n\n` +
                           `_Responde con el número (1-4)_`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 5`;
                }
            }
            
            if (userState.step === 'HACKATON_Q2') {
                if (['1','2','3','4'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'funcionalidad_favorita',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q3';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 3/3*\n\n` +
                           `🌟 ¿Participarías en más hackatones de innovación pública?\n\n` +
                           `1️⃣ No, no me interesa\n` +
                           `2️⃣ Tal vez, depende del tema\n` +
                           `3️⃣ Sí, me parece útil\n` +
                           `4️⃣ Sí, es muy necesario\n` +
                           `5️⃣ ¡Absolutamente! Es el futuro\n\n` +
                           `_Responde con el número (1-5)_`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 4`;
                }
            }
            
            if (userState.step === 'HACKATON_Q3') {
                if (['1','2','3','4','5'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'recomendacion',
                        answer: cleanMessage
                    });
                    
                    // Calcular tiempo total
                    const timeSpent = Math.round((Date.now() - userState.data.startTime) / 1000);
                    
                    // Guardar respuestas en base de datos
                    try {
                        // Guardar respuesta de la encuesta hackaton (ID: 6)
                        const surveyResponse = await this.backendAPI.submitSurveyResponse(
                            6, // ID de la encuesta de hackaton
                            userState.data.responses.map((r, idx) => ({
                                question_id: idx + 1,
                                answer: r.answer
                            })),
                            from.replace('@s.whatsapp.net', '')
                        );
                        
                        console.log('📊 Encuesta Hackaton guardada:', {
                            usuario: from,
                            respuestas: userState.data.responses,
                            tiempo: timeSpent + ' segundos',
                            responseId: surveyResponse.responseId
                        });
                    } catch (error) {
                        console.error('Error guardando encuesta:', error.message);
                        console.error('Detalles del error:', error.response?.data || error);
                    }
                    
                    // Limpiar estado
                    this.userStates.delete(from);
                    
                    return `🎉 *¡ENCUESTA COMPLETADA!*\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `✅ Gracias por participar\n` +
                           `⏱️ Tiempo: ${timeSpent} segundos\n` +
                           `🏆 Tu opinión es valiosa para el futuro de la innovación pública\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `🏛️ *HACKATON MUNICIPIOS A LA VANGUARDIA*\n` +
                           `_Ministerio Secretaría General de Gobierno_\n\n` +
                           `💡 *Este proyecto fue desarrollado en 48 horas*\n` +
                           `🤖 Usando IA para mejorar la gestión municipal\n` +
                           `🌐 100% Open Source y replicable\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `📱 *¿Quieres probar el sistema?*\n` +
                           `Escribe "reportar" para crear un reporte de prueba\n\n` +
                           `¡Gracias por visitar nuestro stand! 🚀\n` +
                           `#MunicipiosALaVanguardIA`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 5`;
                }
            }

            // Manejar opción 1 - Reportar problema
            if (cleanMessage === '1' && userState.step === 'IDLE') {
                userState.step = 'WAITING_DESCRIPTION';
                userState.data = { startTime: Date.now() };
                this.userStates.set(from, userState);
                
                return `📝 *NUEVO REPORTE*\n\n` +
                       `Por favor, describe el problema que quieres reportar.\n\n` +
                       `Puedes incluir:\n` +
                       `• Descripción del problema\n` +
                       `• Ubicación (calle, número, sector)\n` +
                       `• Si es urgente, menciónalo\n\n` +
                       `*Ejemplo:*\n` +
                       `_"Hay un semáforo dañado en Av. Subercaseaux con San Martín"_\n\n` +
                       `También puedes enviar:\n` +
                       `📷 Una foto del problema\n` +
                       `📍 Tu ubicación actual\n\n` +
                       `💡 Escribe *"cancelar"* para cancelar el reporte.`;
            }
            
            // Manejar opción 2 - Estado de reportes
            if (cleanMessage === '2' && userState.step === 'IDLE') {
                return `📊 *ESTADO DE TUS REPORTES*\n\n` +
                       `Tienes *2 reportes* registrados:\n\n` +
                       `1️⃣ *#CAT-2025-1234*\n` +
                       `📍 Bache en Av. O'Higgins 234\n` +
                       `📅 Hace 3 días\n` +
                       `🔄 Estado: *EN PROCESO*\n` +
                       `👷 Asignado a: Dirección de Obras\n\n` +
                       `2️⃣ *#CAT-2025-1122*\n` + 
                       `📍 Luminaria apagada en Plaza de Armas\n` +
                       `📅 Hace 1 semana\n` +
                       `✅ Estado: *RESUELTO*\n` +
                       `⭐ +50 puntos ganados\n\n` +
                       `Para más detalles de un reporte, escribe su número.\n\n` +
                       `💡 Escribe *"reportar"* para crear un nuevo reporte.`;
            }
            
            // Manejar opción 4 - Información municipal
            if (cleanMessage === '4' || lowerMessage === 'información' || lowerMessage === 'info municipal') {
                return `🏛️ *INFORMACIÓN MUNICIPAL DE CATEMU*\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `📍 *¿DÓNDE ESTAMOS?*\n` +
                       `Avenida Subercaseaux número 350\n` +
                       `Comuna de Catemu, Región de Valparaíso\n` +
                       `(Al frente de la Plaza de Armas)\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `📞 *¿CÓMO CONTACTARNOS?*\n\n` +
                       `*Teléfono principal:*\n` +
                       `☎️ (34) 259 1020\n` +
                       `_Llame y diga qué trámite necesita_\n\n` +
                       `*WhatsApp (este número):*\n` +
                       `📱 +569 2046 4349\n` +
                       `_Puede escribirnos por aquí mismo_\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `🕐 *HORARIO DE ATENCIÓN*\n\n` +
                       `*Abierto de Lunes a Viernes:*\n` +
                       `• Mañana: 8:30 AM\n` +
                       `• Cierre: 2:00 PM (14:00 hrs)\n` +
                       `• Sábados y Domingos: CERRADO\n\n` +
                       `⚠️ *Llegue antes de la 1:30 PM*\n` +
                       `_Para asegurar su atención_\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `🏢 *OFICINAS IMPORTANTES*\n\n` +
                       `*DIDECO (Ayuda Social):*\n` +
                       `• Teléfono: (34) 259 1020 anexo 123\n` +
                       `• Beneficios sociales\n` +
                       `• Pensiones y subsidios\n` +
                       `• Ayuda para adulto mayor\n\n` +
                       `*OFICINA DE PARTES:*\n` +
                       `• Para entregar cartas y documentos\n` +
                       `• Primer piso, entrada principal\n\n` +
                       `*REGISTRO CIVIL:*\n` +
                       `• Certificados de nacimiento\n` +
                       `• Certificados de defunción\n` +
                       `• Horario: 8:30 AM a 2:00 PM\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `🚌 *¿CÓMO LLEGAR?*\n\n` +
                       `• Micro desde San Felipe\n` +
                       `• Colectivos desde Llay Llay\n` +
                       `• Buses desde Santiago\n` +
                       `• Estacionamiento disponible\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n` +
                       `🆘 *NÚMEROS DE EMERGENCIA*\n\n` +
                       `• Carabineros: 133\n` +
                       `• Bomberos: 132\n` +
                       `• Ambulancia: 131\n` +
                       `• Fono Mayor: 800 400 035\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                       `💡 *¿NECESITA MÁS AYUDA?*\n` +
                       `Escriba "hola" para volver al menú principal`;
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

            // Si el mensaje parece ser un reporte de problema, cambiar estado para pedir ubicación
            if (response && response.includes('¿Dónde está ubicado el problema?')) {
                userState.step = 'WAITING_LOCATION';
                userState.data = { 
                    description: cleanMessage,
                    urgency: urgency,
                    category: this.detectCategory(cleanMessage),
                    startTime: Date.now()
                };
                this.userStates.set(from, userState);
            }
            // Si el usuario quiere reportar, cambiar estado
            else if (lowerMessage.includes('reportar') || lowerMessage.includes('problema')) {
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
            'bache', 'basura', 'luz apagada', 'semáforo malo',
            'choque', 'chocó', 'accidente', 'botó un poste',
            'poste caído', 'poste dañado', 'colisión',
            'atropello', 'volcó', 'estrellado', 'golpeó',
            'derribó', 'tumbó', 'cayó', 'se cayó',
            'rompió', 'destrozó', 'dañó', 'quebró'
        ];

        const lower = message.toLowerCase();
        return reportKeywords.some(keyword => lower.includes(keyword));
    }

    /**
     * Crea un reporte rápido desde el mensaje
     */
    async createQuickReport(message, from, senderName, urgency, location) {
        try {
            // Si no tiene ubicación, pedirla
            if (!location) {
                const userState = this.userStates.get(from) || { step: 'IDLE', data: {}, attempts: 0 };
                userState.step = 'WAITING_LOCATION';
                userState.data = {
                    description: message,
                    urgency: urgency,
                    category: this.detectCategory(message)
                };
                this.userStates.set(from, userState);

                return `📍 *UBICACIÓN NECESARIA*

He registrado tu reporte:
_"${message}"_

Para completarlo, necesito saber *dónde exactamente* está el problema.

Por favor indica:
• Nombre de la calle y número
• O alguna referencia cercana
• O comparte tu 📍 ubicación actual

Ejemplo: _"Av. O'Higgins 234"_ o _"Frente al supermercado Líder"_

💡 Escribe *"cancelar"* si deseas cancelar el reporte.`;
            }

            // Generar ticket
            const ticketId = await this.generateTicket(message, urgency, location, from, senderName);
            
            // Limpiar estado del usuario
            this.userStates.delete(from);

            return ticketId;
        } catch (error) {
            console.error('Error creando reporte:', error);
            return `❌ Error al crear el reporte. Por favor intenta nuevamente.`;
        }
    }

    /**
     * Maneja input de ubicación
     */
    async handleLocationInput(message, userState, from, senderName) {
        // Verificar si dio una ubicación válida
        if (message.length < 5) {
            userState.attempts++;
            
            if (userState.attempts >= 3) {
                // Después de 3 intentos, crear sin ubicación
                const ticketId = await this.generateTicket(
                    userState.data.description,
                    userState.data.urgency,
                    null,
                    from,
                    senderName
                );
                this.userStates.delete(from);
                return ticketId;
            }

            return `❓ *UBICACIÓN NO CLARA*

No pude entender la ubicación. Por favor sé más específico.

Ejemplos válidos:
• "Calle San Martín 456"
• "Plaza de Armas"
• "Villa Los Aromos, pasaje 3"
• "Esquina de O'Higgins con Comercio"

Intento ${userState.attempts}/3. Escribe *"cancelar"* para salir.`;
        }

        // Guardar ubicación y generar ticket
        const location = { street: message, raw: message };
        const ticketId = await this.generateTicket(
            userState.data.description,
            userState.data.urgency || 'normal',
            location,
            from,
            senderName
        );

        // Limpiar estado
        this.userStates.delete(from);
        
        return ticketId;
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
            const ticketId = await this.generateTicket(
                message,
                analyzeUrgency(message),
                location,
                from,
                senderName
            );
            this.userStates.delete(from);
            return ticketId;
        } else {
            // Pedir ubicación
            userState.step = 'WAITING_LOCATION';
            userState.data.urgency = analyzeUrgency(message);
            userState.data.category = this.detectCategory(message);
            userState.attempts = 0;
            this.userStates.set(from, userState);
            
            return `📍 *UBICACIÓN DEL PROBLEMA*

Perfecto, he registrado:
_"${message}"_

Ahora necesito saber *dónde* está el problema.

Por favor indica:
• Dirección completa
• O referencias cercanas
• O envía tu 📍 ubicación

Ejemplo: _"Frente a la escuela San José"_`;
        }
    }

    /**
     * Genera el ticket y mensaje de confirmación
     */
    async generateTicket(description, urgency, location, from, senderName) {
        // Generar ID único
        const ticketId = `CAT-2025-${this.reportCounter++}`;
        const category = this.detectCategory(description);
        
        // Crear reporte en el backend
        try {
            const reportData = {
                type: category.type,
                category: category.name,
                description: description,
                priority: urgency === 'urgent' ? 'high' : 'medium',
                location: {
                    address: location ? (location.street || location.raw) : 'Por confirmar',
                    lat: -32.7805,
                    lng: -70.9643
                },
                contact_info: {
                    name: senderName,
                    phone: from.replace('@s.whatsapp.net', '')
                },
                source: 'whatsapp',
                department: category.department,
                whatsapp_number: from.replace('@s.whatsapp.net', '')
            };

            console.log('📤 Enviando reporte al backend:', reportData);
            const result = await this.backendAPI.createReport(reportData);
            console.log('✅ Reporte guardado con ID:', result.reportId);
        } catch (error) {
            console.error('❌ Error guardando en backend:', error);
        }

        // Generar mensaje de confirmación con ticket
        const confirmationMessage = `✅ *REPORTE CREADO EXITOSAMENTE*

━━━━━━━━━━━━━━━━━━━━━━
🎫 *TICKET: ${ticketId}*
━━━━━━━━━━━━━━━━━━━━━━

📋 *Resumen del reporte:*
${description}

📍 *Ubicación:*
${location ? (location.street || location.raw) : 'Por confirmar con el departamento'}

🏷️ *Categoría:*
${category.name}

⚡ *Prioridad:*
${urgency === 'urgent' ? '🔴 URGENTE' : '🟡 Normal'}

🏢 *Asignado a:*
${category.department}

⏱️ *Tiempo estimado de respuesta:*
${urgency === 'urgent' ? '24 horas' : '48-72 horas'}

━━━━━━━━━━━━━━━━━━━━━━

🏆 *¡Has ganado 10 puntos!*
Tu participación mejora Catemu.

📱 *Seguimiento:*
• Guarda tu número de ticket
• Consulta el estado escribiendo: "estado ${ticketId}"
• Recibirás notificaciones de avance

💚 *Gracias por tu colaboración*
Juntos hacemos un mejor Catemu

━━━━━━━━━━━━━━━━━━━━━━

¿Necesitas reportar algo más? Escribe "reportar"
¿Necesitas ayuda? Escribe "ayuda"`;

        return confirmationMessage;
    }

    /**
     * Detecta la categoría del problema
     */
    detectCategory(message) {
        const lower = message.toLowerCase();
        
        const categories = {
            emergency: {
                keywords: ['choque', 'chocó', 'accidente', 'colisión', 'atropello', 'volcó', 'estrellado', 'emergencia', 'urgente'],
                name: 'Emergencia/Accidente',
                type: 'emergency',
                department: 'Departamento de Emergencias'
            },
            infrastructure: {
                keywords: ['bache', 'hoyo', 'pavimento', 'calle', 'vereda', 'acera', 'grieta'],
                name: 'Infraestructura vial',
                type: 'infrastructure',
                department: 'Dirección de Obras Municipales'
            },
            lighting: {
                keywords: ['luz', 'lámpara', 'alumbrado', 'poste', 'iluminación', 'oscuro', 'foco', 'botó un poste', 'poste caído'],
                name: 'Alumbrado público',
                type: 'infrastructure',
                department: 'Departamento de Obras Eléctricas'
            },
            waste: {
                keywords: ['basura', 'desecho', 'contenedor', 'sucio', 'limpieza', 'escombros', 'vertedero'],
                name: 'Aseo y ornato',
                type: 'environment',
                department: 'Departamento de Aseo y Ornato'
            },
            security: {
                keywords: ['robo', 'peligro', 'inseguro', 'delincuencia', 'vandalismo', 'graffiti'],
                name: 'Seguridad ciudadana',
                type: 'security',
                department: 'Oficina de Seguridad Ciudadana'
            },
            water: {
                keywords: ['agua', 'fuga', 'inundación', 'alcantarilla', 'desagüe', 'cañería'],
                name: 'Agua y alcantarillado',
                type: 'services',
                department: 'Departamento de Agua Potable'
            },
            traffic: {
                keywords: ['semáforo', 'señalética', 'tránsito', 'tráfico', 'señal', 'disco pare'],
                name: 'Tránsito y transporte',
                type: 'infrastructure',
                department: 'Departamento de Tránsito'
            },
            green: {
                keywords: ['árbol', 'poda', 'plaza', 'parque', 'jardín', 'pasto', 'riego'],
                name: 'Áreas verdes',
                type: 'environment',
                department: 'Departamento de Parques y Jardines'
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
            name: 'Otros - Administración General',
            type: 'other',
            department: 'Mesa de Entrada Municipal'
        };
    }

    /**
     * Muestra las encuestas disponibles
     */
    async showAvailableSurveys(from, senderName) {
        try {
            const surveys = await this.backendAPI.getActiveSurveys();
            
            if (!surveys || surveys.length === 0) {
                return '📊 No hay encuestas activas en este momento.\n\nTe notificaremos cuando haya nuevas encuestas disponibles.';
            }

            let surveyText = '📊 *ENCUESTAS DISPONIBLES*\n\n';
            
            // Ordenar por prioridad (la de hackaton debería aparecer primera)
            const sortedSurveys = surveys.sort((a, b) => {
                if (a.priority === 'muy alta') return -1;
                if (b.priority === 'muy alta') return 1;
                return 0;
            });

            sortedSurveys.forEach((survey, index) => {
                surveyText += `${index + 1}. *${survey.title}*\n`;
                surveyText += `   📝 ${survey.description}\n`;
                surveyText += `   ⏱️ Tiempo: ${survey.estimated_time}\n`;
                if (survey.question_count) {
                    surveyText += `   🎯 ${survey.question_count} preguntas\n`;
                }
                surveyText += '\n';
            });
            
            surveyText += '_Responde con el número de la encuesta que deseas completar_\n\n';
            surveyText += '💡 Escribe *"cancelar"* para volver al menú principal';
            
            // Guardar estado para esperar selección
            let userState = this.userStates.get(from) || { step: 'IDLE', data: {}, attempts: 0 };
            userState.step = 'SURVEY_SELECTION';
            userState.data.availableSurveys = sortedSurveys;
            this.userStates.set(from, userState);
            
            return surveyText;
            
        } catch (error) {
            console.error('Error obteniendo encuestas:', error);
            return '❌ Error al obtener las encuestas. Por favor, intenta más tarde.';
        }
    }

    /**
     * Maneja confirmaciones
     */
    async handleConfirmation(message, userState, from, senderName) {
        const lower = message.toLowerCase();
        
        if (lower === 'si' || lower === 'sí' || lower === 'confirmar') {
            const ticketId = await this.generateTicket(
                userState.data.description,
                userState.data.urgency,
                userState.data.location,
                from,
                senderName
            );
            this.userStates.delete(from);
            return ticketId;
        } else if (lower === 'no' || lower === 'cancelar') {
            this.userStates.delete(from);
            return `❌ Reporte cancelado. 

Puedes crear uno nuevo cuando quieras escribiendo "reportar".`;
        } else {
            return `Por favor responde:
• *Sí* para confirmar el reporte
• *No* para cancelar

¿Deseas crear este reporte?`;
        }
    }
}

module.exports = FixedMessageHandler;