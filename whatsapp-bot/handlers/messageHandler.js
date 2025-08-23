const fs = require('fs').promises;
const path = require('path');
const NodeCache = require('node-cache');
const MenuHandler = require('./menuHandler');
const ReportHandler = require('./reportHandler');

class MessageHandler {
    constructor() {
        this.sessionCache = new NodeCache({ stdTTL: 3600 }); // Cache de 1 hora
        this.menuHandler = new MenuHandler();
        this.reportHandler = new ReportHandler();
        this.userStates = new Map(); // Estado de conversación por usuario
    }

    async process(msg, sock, services) {
        const chatId = msg.key.remoteJid;
        const message = msg.message;
        const messageText = this.extractText(message);
        const senderNumber = msg.key.participant || msg.key.remoteJid;
        const senderName = msg.pushName || 'Ciudadano';

        // Obtener o crear estado de usuario
        let userState = this.userStates.get(senderNumber) || {
            step: 'MENU',
            data: {},
            lastActivity: Date.now()
        };

        // Limpiar estados inactivos (30 minutos)
        if (Date.now() - userState.lastActivity > 30 * 60 * 1000) {
            userState = { step: 'MENU', data: {}, lastActivity: Date.now() };
        }

        userState.lastActivity = Date.now();

        // Detectar tipo de mensaje
        const messageType = this.getMessageType(message);

        // Si es una imagen y estamos esperando una para el reporte
        if (messageType === 'image' && userState.step === 'WAITING_IMAGE') {
            return await this.handleReportImage(msg, sock, services, userState);
        }

        // Si es ubicación y la estamos esperando
        if (messageType === 'location' && userState.step === 'WAITING_LOCATION') {
            return await this.handleReportLocation(msg, sock, services, userState);
        }

        // Procesar comandos especiales
        if (messageText.toLowerCase().startsWith('/')) {
            return await this.handleCommand(messageText, msg, sock, services);
        }

        // Procesar según el estado actual del usuario
        switch (userState.step) {
            case 'MENU':
                await this.handleMenuSelection(messageText, msg, sock, services, userState);
                break;
            
            case 'REPORTING':
                await this.reportHandler.processReport(messageText, msg, sock, services, userState);
                break;
            
            case 'WAITING_DESCRIPTION':
                await this.handleReportDescription(messageText, msg, sock, services, userState);
                break;
            
            case 'WAITING_CATEGORY_CONFIRM':
                await this.handleCategoryConfirmation(messageText, msg, sock, services, userState);
                break;
            
            case 'CHECKING_STATUS':
                await this.handleStatusCheck(messageText, msg, sock, services);
                break;
            
            case 'SURVEY':
                await this.handleSurveyResponse(messageText, msg, sock, services, userState);
                break;
            
            default:
                await this.showMainMenu(sock, chatId, senderName);
                userState.step = 'MENU';
        }

        // Guardar estado actualizado
        this.userStates.set(senderNumber, userState);
    }

    extractText(message) {
        return message.conversation || 
               message.extendedTextMessage?.text || 
               message.imageMessage?.caption ||
               message.videoMessage?.caption ||
               message.buttonsResponseMessage?.selectedButtonId ||
               message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
    }

    getMessageType(message) {
        if (message.imageMessage) return 'image';
        if (message.videoMessage) return 'video';
        if (message.audioMessage || message.pttMessage) return 'audio';
        if (message.documentMessage) return 'document';
        if (message.locationMessage || message.liveLocationMessage) return 'location';
        if (message.contactMessage) return 'contact';
        if (message.stickerMessage) return 'sticker';
        return 'text';
    }

    async handleMenuSelection(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const option = text.trim();

        if (option === '1' || text.toLowerCase().includes('reportar')) {
            userState.step = 'WAITING_DESCRIPTION';
            userState.data = { startTime: Date.now() };
            
            await sock.sendMessage(chatId, {
                text: '📝 *NUEVO REPORTE*\n\n' +
                      'Por favor, describe el problema que deseas reportar.\n\n' +
                      'Puedes incluir:\n' +
                      '• Descripción detallada del problema\n' +
                      '• Hace cuánto tiempo existe\n' +
                      '• Si afecta a muchas personas\n\n' +
                      '_También puedes enviar una foto del problema._',
                quoted: msg
            });

        } else if (option === '2' || text.toLowerCase().includes('consultar')) {
            userState.step = 'CHECKING_STATUS';
            
            await sock.sendMessage(chatId, {
                text: '🔍 *CONSULTAR ESTADO*\n\n' +
                      'Por favor, ingresa tu número de reporte.\n' +
                      'Ejemplo: CAT-2025-0847\n\n' +
                      '_O escribe "mis reportes" para ver todos tus reportes._',
                quoted: msg
            });

        } else if (option === '3' || text.toLowerCase().includes('encuesta')) {
            await this.showAvailableSurveys(sock, chatId, services, userState);

        } else if (option === '4' || text.toLowerCase().includes('información')) {
            await this.showMunicipalInfo(sock, chatId);

        } else if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('menu')) {
            await this.showMainMenu(sock, chatId, msg.pushName);

        } else {
            // Por defecto, mostrar el menú si no se entiende el comando
            await sock.sendMessage(chatId, {
                text: '❓ No entendí tu mensaje. Por favor, selecciona una opción del menú:',
                quoted: msg
            });
            await this.showMainMenu(sock, chatId, msg.pushName);
        }
    }

    async handleReportDescription(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        // Guardar descripción
        userState.data.description = text;
        
        // Usar IA para categorizar y analizar urgencia
        const analysis = await services.anthropic.analyzeReport(text);
        
        userState.data.category = analysis.category;
        userState.data.priority = analysis.priority;
        userState.data.suggestedDepartment = analysis.department;
        
        // Confirmar categoría con el usuario
        userState.step = 'WAITING_CATEGORY_CONFIRM';
        
        await sock.sendMessage(chatId, {
            text: `🤖 *ANÁLISIS AUTOMÁTICO*\n\n` +
                  `He identificado tu reporte como:\n\n` +
                  `📁 *Categoría:* ${this.getCategoryName(analysis.category)}\n` +
                  `⚡ *Prioridad:* ${this.getPriorityEmoji(analysis.priority)} ${analysis.priority}\n` +
                  `🏢 *Departamento:* ${analysis.department}\n\n` +
                  `¿Es correcta esta categorización?\n\n` +
                  `1️⃣ Sí, es correcto\n` +
                  `2️⃣ No, cambiar categoría\n\n` +
                  `_Responde con el número de tu elección_`,
            quoted: msg
        });
    }

    async handleCategoryConfirmation(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const option = text.trim();

        if (option === '1' || text.toLowerCase().includes('sí') || text.toLowerCase().includes('si')) {
            // Continuar con ubicación
            userState.step = 'WAITING_LOCATION';
            
            await sock.sendMessage(chatId, {
                text: '📍 *UBICACIÓN DEL PROBLEMA*\n\n' +
                      'Por favor, comparte la ubicación exacta del problema.\n\n' +
                      'Puedes:\n' +
                      '1. Usar el botón de 📎 adjuntar → 📍 Ubicación\n' +
                      '2. Escribir la dirección completa\n\n' +
                      '_La ubicación nos ayuda a enviar el equipo correcto._',
                quoted: msg
            });

        } else if (option === '2' || text.toLowerCase().includes('no')) {
            // Mostrar categorías para selección manual
            await this.showCategorySelection(sock, chatId, userState);
        }
    }

    async handleReportLocation(msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const location = msg.message.locationMessage;
        
        if (location) {
            userState.data.location = {
                latitude: location.degreesLatitude,
                longitude: location.degreesLongitude,
                address: location.address || 'Sin dirección'
            };
        } else {
            // Es texto con dirección
            userState.data.location = {
                address: this.extractText(msg.message)
            };
        }

        // Preguntar por imagen
        userState.step = 'WAITING_IMAGE_CONFIRM';
        
        await sock.sendMessage(chatId, {
            text: '📸 *EVIDENCIA FOTOGRÁFICA*\n\n' +
                  '¿Deseas adjuntar una foto del problema?\n\n' +
                  '1️⃣ Sí, enviar foto\n' +
                  '2️⃣ No, continuar sin foto\n\n' +
                  '_Una foto ayuda a evaluar mejor el problema_',
            quoted: msg
        });
    }

    async handleReportImage(msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        try {
            // Descargar imagen
            const buffer = await sock.downloadMediaMessage(msg);
            
            // Guardar imagen temporalmente
            const filename = `report_${Date.now()}.jpg`;
            const filepath = path.join(__dirname, '..', 'temp', filename);
            await fs.writeFile(filepath, buffer);
            
            // Analizar imagen con IA
            const imageAnalysis = await services.anthropic.analyzeImage(buffer);
            userState.data.imageAnalysis = imageAnalysis;
            userState.data.imagePath = filepath;
            
            // Confirmar análisis
            await sock.sendMessage(chatId, {
                text: `📸 *Imagen recibida*\n\n` +
                      `${imageAnalysis.description}\n\n` +
                      `Continuando con el reporte...`,
                quoted: msg
            });
            
            // Solicitar datos de contacto
            await this.requestContactInfo(sock, chatId, userState);
            
        } catch (error) {
            console.error('Error procesando imagen:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Error al procesar la imagen. Continuando sin ella...',
                quoted: msg
            });
            await this.requestContactInfo(sock, chatId, userState);
        }
    }

    async requestContactInfo(sock, chatId, userState) {
        userState.step = 'WAITING_CONTACT';
        
        await sock.sendMessage(chatId, {
            text: '👤 *DATOS DE CONTACTO*\n\n' +
                  'Por último, necesitamos tus datos para el seguimiento.\n\n' +
                  'Por favor, proporciona:\n' +
                  '• Tu nombre completo\n' +
                  '• Teléfono de contacto (opcional)\n' +
                  '• Email (opcional)\n\n' +
                  '_Ejemplo: Juan Pérez, 912345678, juan@email.com_\n\n' +
                  'O escribe "anónimo" si prefieres no compartir tus datos.',
        });
    }

    async submitReport(msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        try {
            // Preparar datos para el backend
            const reportData = {
                type: 'whatsapp',
                category: userState.data.category,
                description: userState.data.description,
                location: userState.data.location,
                priority: userState.data.priority,
                department: userState.data.suggestedDepartment,
                contact_info: userState.data.contact,
                image_analysis: userState.data.imageAnalysis,
                source: 'whatsapp',
                whatsapp_number: msg.key.remoteJid
            };

            // Enviar al backend
            const response = await services.api.createReport(reportData, userState.data.imagePath);
            
            // Enviar confirmación al usuario
            await sock.sendMessage(chatId, {
                text: `✅ *REPORTE REGISTRADO EXITOSAMENTE*\n\n` +
                      `📋 *Número de reporte:* ${response.reportId}\n` +
                      `📁 *Categoría:* ${this.getCategoryName(userState.data.category)}\n` +
                      `⚡ *Prioridad:* ${this.getPriorityEmoji(userState.data.priority)} ${userState.data.priority}\n` +
                      `🏢 *Asignado a:* ${userState.data.suggestedDepartment}\n` +
                      `⏱️ *Tiempo estimado:* ${this.getEstimatedTime(userState.data.priority)}\n\n` +
                      `Te notificaremos por este medio cuando haya actualizaciones.\n\n` +
                      `Para consultar el estado, usa el comando:\n` +
                      `/estado ${response.reportId}\n\n` +
                      `¡Gracias por ayudarnos a mejorar Catemu! 🏘️`,
            });

            // Notificar a administradores si es urgente
            if (userState.data.priority === 'alta' || userState.data.priority === 'urgente') {
                await this.notifyUrgentReport(sock, reportData, response.reportId);
            }

            // Limpiar estado del usuario
            userState.step = 'MENU';
            userState.data = {};

        } catch (error) {
            console.error('Error enviando reporte:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Error al registrar el reporte. Por favor, intenta nuevamente.',
                quoted: msg
            });
        }
    }

    async showMainMenu(sock, chatId, userName = 'Ciudadano') {
        const menuText = `👋 ¡Hola ${userName}!\n\n` +
                        `Soy el asistente virtual de *CatemuConecta* 🏘️\n\n` +
                        `¿En qué puedo ayudarte hoy?\n\n` +
                        `1️⃣ *Reportar un problema*\n` +
                        `   _Baches, luminarias, basura, etc._\n\n` +
                        `2️⃣ *Consultar estado de reporte*\n` +
                        `   _Seguimiento de tus reportes_\n\n` +
                        `3️⃣ *Responder encuesta*\n` +
                        `   _Tu opinión es importante_\n\n` +
                        `4️⃣ *Información municipal*\n` +
                        `   _Servicios y contactos_\n\n` +
                        `Responde con el número de tu elección o escribe tu consulta directamente.`;

        await sock.sendMessage(chatId, { text: menuText });
    }

    async showAvailableSurveys(sock, chatId, services, userState) {
        try {
            const surveys = await services.api.getActiveSurveys();
            
            if (surveys.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '📊 No hay encuestas activas en este momento.\n\nTe notificaremos cuando haya nuevas encuestas disponibles.'
                });
                return;
            }

            let surveyText = '📊 *ENCUESTAS DISPONIBLES*\n\n';
            surveys.forEach((survey, index) => {
                surveyText += `${index + 1}. *${survey.title}*\n`;
                surveyText += `   📝 ${survey.description}\n`;
                surveyText += `   ⏱️ Tiempo: ${survey.estimated_time}\n`;
                surveyText += `   🎯 ${survey.question_count} preguntas\n\n`;
            });
            
            surveyText += '_Responde con el número de la encuesta que deseas completar_';
            
            userState.step = 'SURVEY_SELECTION';
            userState.data.availableSurveys = surveys;
            
            await sock.sendMessage(chatId, { text: surveyText });
            
        } catch (error) {
            console.error('Error obteniendo encuestas:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Error al obtener las encuestas. Por favor, intenta más tarde.'
            });
        }
    }

    async showMunicipalInfo(sock, chatId) {
        const infoText = `🏛️ *MUNICIPALIDAD DE CATEMU*\n\n` +
                        `📍 *Dirección:*\nAv. Alejandro Galaz 100, Catemu\n\n` +
                        `📞 *Teléfonos:*\n` +
                        `• Central: +56 34 259 1001\n` +
                        `• Emergencias: 1404\n` +
                        `• WhatsApp: Este mismo número\n\n` +
                        `🕐 *Horario de atención:*\n` +
                        `Lunes a Viernes: 8:30 - 14:00\n\n` +
                        `🌐 *Sitio web:*\nwww.municatemu.cl\n\n` +
                        `📧 *Email:*\ncontacto@municatemu.cl\n\n` +
                        `*Departamentos:*\n` +
                        `• DIDECO: +56 34 259 1002\n` +
                        `• Obras: +56 34 259 1003\n` +
                        `• Tránsito: +56 34 259 1004\n` +
                        `• Salud: +56 34 259 1005\n\n` +
                        `_Para reportar un problema, selecciona la opción 1 del menú principal._`;

        await sock.sendMessage(chatId, { text: infoText });
    }

    async handleCommand(command, msg, sock, services) {
        const chatId = msg.key.remoteJid;
        const cmd = command.toLowerCase().split(' ')[0];
        const args = command.split(' ').slice(1).join(' ');

        switch(cmd) {
            case '/help':
            case '/ayuda':
                await this.showHelp(sock, chatId);
                break;
            
            case '/estado':
            case '/status':
                await this.checkReportStatus(args, sock, chatId, services);
                break;
            
            case '/stats':
            case '/estadisticas':
                await this.showStatistics(sock, chatId, services);
                break;
            
            case '/admin':
                await this.handleAdminCommand(args, msg, sock, services);
                break;
            
            default:
                await sock.sendMessage(chatId, {
                    text: '❌ Comando no reconocido. Usa /ayuda para ver los comandos disponibles.',
                    quoted: msg
                });
        }
    }

    getCategoryName(category) {
        const categories = {
            'baches': '🚧 Baches y Pavimento',
            'alumbrado': '💡 Alumbrado Público',
            'basura': '🗑️ Basura y Limpieza',
            'areas_verdes': '🌳 Áreas Verdes',
            'seguridad': '🚨 Seguridad',
            'transito': '🚦 Tránsito',
            'agua': '💧 Agua y Alcantarillado',
            'ruidos': '🔊 Ruidos Molestos',
            'animales': '🐕 Animales',
            'otros': '📋 Otros'
        };
        return categories[category] || category;
    }

    getPriorityEmoji(priority) {
        const emojis = {
            'baja': '🟢',
            'media': '🟡',
            'alta': '🟠',
            'urgente': '🔴'
        };
        return emojis[priority] || '⚪';
    }

    getEstimatedTime(priority) {
        const times = {
            'urgente': '24-48 horas',
            'alta': '2-5 días',
            'media': '5-10 días',
            'baja': '10-15 días'
        };
        return times[priority] || '5-10 días';
    }

    async notifyUrgentReport(sock, reportData, reportId) {
        // VALIDACIÓN DE SEGURIDAD - Solo notificar a admins válidos
        const adminNumbers = process.env.ADMIN_NUMBERS?.split(',') || [];
        const validatedNumbers = adminNumbers.filter(num => {
            // Validar formato de número chileno (569XXXXXXXX)
            const cleanNum = num.trim();
            const isValid = /^569\d{8}$/.test(cleanNum);
            if (!isValid) {
                console.warn(`⚠️ Número de admin inválido ignorado en reporte urgente: ${cleanNum}`);
            }
            return isValid;
        });
        
        if (validatedNumbers.length === 0) {
            console.error('❌ No hay números de admin válidos configurados para reportes urgentes');
            return;
        }
        
        const message = `🚨 *REPORTE URGENTE*\n\n` +
                       `ID: ${reportId}\n` +
                       `Categoría: ${this.getCategoryName(reportData.category)}\n` +
                       `Descripción: ${reportData.description}\n` +
                       `Ubicación: ${reportData.location?.address || 'No especificada'}\n\n` +
                       `Requiere atención inmediata.`;

        console.log(`🚨 Enviando reporte urgente a ${validatedNumbers.length} admins`);
        
        for (const number of validatedNumbers) {
            try {
                await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
                console.log(`✅ Reporte urgente enviado a: ${number}`);
            } catch (error) {
                console.error(`❌ Error notificando admin ${number}:`, error);
            }
        }
    }
}

module.exports = MessageHandler;