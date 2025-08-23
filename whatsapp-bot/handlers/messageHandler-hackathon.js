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
                
                return `🏆 *ENCUESTA DE SATISFACCIÓN*\n` +
                       `_Hackathon IA y Municipalidades_\n\n` +
                       `📊 6 preguntas rápidas (2 minutos)\n\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                       `*PREGUNTA 1/6*\n\n` +
                       `👥 ¿Cuál fue tu rol en la hackathon?\n\n` +
                       `1️⃣ Funcionario(a) municipal\n` +
                       `2️⃣ Desarrollador(a)\n\n` +
                       `_Responde con el número (1-2)_`;
            }
            
            // Manejar respuestas de la encuesta de hackaton
            // PREGUNTA 1: Rol en la hackathon
            if (userState.step === 'HACKATON_Q1') {
                if (['1','2'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'rol',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q2';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 2/6*\n\n` +
                           `🌟 ¿Cómo evaluarías la organización general de la hackathon?\n\n` +
                           `1️⃣ Muy deficiente\n` +
                           `2️⃣ Deficiente\n` +
                           `3️⃣ Regular\n` +
                           `4️⃣ Buena\n` +
                           `5️⃣ Excelente\n\n` +
                           `_Responde con el número (1-5)_`;
                } else {
                    return `❌ Por favor responde con 1 o 2`;
                }
            }
            
            // PREGUNTA 2: Organización general
            if (userState.step === 'HACKATON_Q2') {
                if (['1','2','3','4','5'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'organizacion',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q3';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 3/6*\n\n` +
                           `🤝 ¿Qué tan valiosa fue la colaboración entre funcionarios municipales y desarrolladores en tu equipo?\n\n` +
                           `1️⃣ Nada valiosa\n` +
                           `2️⃣ Poco valiosa\n` +
                           `3️⃣ Algo valiosa\n` +
                           `4️⃣ Valiosa\n` +
                           `5️⃣ Muy valiosa\n\n` +
                           `_Responde con el número (1-5)_`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 5`;
                }
            }
            
            // PREGUNTA 3: Colaboración
            if (userState.step === 'HACKATON_Q3') {
                if (['1','2','3','4','5'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'colaboracion',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q4';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 4/6*\n\n` +
                           `🤖 Según tu experiencia, ¿qué tanto puede aportar la inteligencia artificial para resolver problemáticas municipales?\n\n` +
                           `1️⃣ Mucho\n` +
                           `2️⃣ Bastante\n` +
                           `3️⃣ Poco\n` +
                           `4️⃣ Nada\n\n` +
                           `_Responde con el número (1-4)_`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 5`;
                }
            }
            
            // PREGUNTA 4: Aporte de IA
            if (userState.step === 'HACKATON_Q4') {
                if (['1','2','3','4'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'aporte_ia',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q5';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 5/6*\n\n` +
                           `🍴 ¿Cómo calificarías el almuerzo entregado durante la hackathon?\n\n` +
                           `1️⃣ Muy malo\n` +
                           `2️⃣ Malo\n` +
                           `3️⃣ Regular\n` +
                           `4️⃣ Bueno\n` +
                           `5️⃣ Excelente\n\n` +
                           `_Responde con el número (1-5)_`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 4`;
                }
            }
            
            // PREGUNTA 5: Almuerzo
            if (userState.step === 'HACKATON_Q5') {
                if (['1','2','3','4','5'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'almuerzo',
                        answer: cleanMessage
                    });
                    userState.step = 'HACKATON_Q6';
                    this.userStates.set(from, userState);
                    
                    return `✅ Respuesta registrada!\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `*PREGUNTA 6/6* (Última)\n\n` +
                           `⭐ En general, ¿qué tan satisfecho(a) quedaste con la hackathon?\n\n` +
                           `1️⃣ Muy insatisfecho\n` +
                           `2️⃣ Insatisfecho\n` +
                           `3️⃣ Neutral\n` +
                           `4️⃣ Satisfecho\n` +
                           `5️⃣ Muy satisfecho\n\n` +
                           `_Responde con el número (1-5)_`;
                } else {
                    return `❌ Por favor responde con un número del 1 al 5`;
                }
            }
            
            // PREGUNTA 6: Satisfacción general (FINAL)
            if (userState.step === 'HACKATON_Q6') {
                if (['1','2','3','4','5'].includes(cleanMessage)) {
                    userState.data.responses.push({
                        question: 'satisfaccion',
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
                           `🏆 Tu opinión nos ayudará a mejorar futuros eventos\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `🏛️ *HACKATHON IA Y MUNICIPALIDADES*\n` +
                           `_Ministerio Secretaría General de Gobierno_\n\n` +
                           `💡 *Innovación para el servicio público*\n` +
                           `🤖 IA al servicio de los ciudadanos\n` +
                           `🌐 Transformación digital del Estado\n\n` +
                           `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                           `Para volver al menú principal, escribe *hola*\n\n` +
                           `#HackathonIA #MunicipiosDigitales`;
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

    // ... resto de los métodos de la clase ...
}

module.exports = FixedMessageHandler;