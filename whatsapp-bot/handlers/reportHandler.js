const path = require('path');
const fs = require('fs').promises;

class ReportHandler {
    constructor() {
        this.reportSteps = [
            'INIT',
            'WAITING_DESCRIPTION',
            'WAITING_CATEGORY_CONFIRM',
            'WAITING_LOCATION',
            'WAITING_IMAGE',
            'WAITING_CONTACT',
            'CONFIRMING',
            'SUBMITTED'
        ];
    }

    async processReport(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const step = userState.step || 'INIT';

        switch (step) {
            case 'INIT':
                await this.initReport(sock, chatId, userState);
                break;
            
            case 'WAITING_DESCRIPTION':
                await this.handleDescription(text, msg, sock, services, userState);
                break;
            
            case 'WAITING_CATEGORY_CONFIRM':
                await this.handleCategoryConfirm(text, msg, sock, services, userState);
                break;
            
            case 'WAITING_LOCATION':
                await this.handleLocation(text, msg, sock, services, userState);
                break;
            
            case 'WAITING_IMAGE':
                await this.handleImageDecision(text, msg, sock, services, userState);
                break;
            
            case 'WAITING_CONTACT':
                await this.handleContact(text, msg, sock, services, userState);
                break;
            
            case 'CONFIRMING':
                await this.handleConfirmation(text, msg, sock, services, userState);
                break;
            
            default:
                await this.initReport(sock, chatId, userState);
        }
    }

    async initReport(sock, chatId, userState) {
        userState.step = 'WAITING_DESCRIPTION';
        userState.data = {
            startTime: Date.now(),
            reportData: {}
        };

        const message = `📝 *NUEVO REPORTE CIUDADANO*\n\n` +
                       `Vamos a registrar tu reporte paso a paso.\n\n` +
                       `*Paso 1 de 5: Descripción*\n` +
                       `Por favor, describe detalladamente el problema:\n\n` +
                       `• ¿Qué problema observas?\n` +
                       `• ¿Desde cuándo existe?\n` +
                       `• ¿Afecta a muchas personas?\n\n` +
                       `_Puedes escribir o enviar un audio_ 🎤`;

        await sock.sendMessage(chatId, { text: message });
    }

    async handleDescription(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        // Guardar descripción
        userState.data.reportData.description = text;
        
        // Analizar con IA
        const analysis = await services.anthropic.analyzeReport(text);
        userState.data.reportData = {
            ...userState.data.reportData,
            ...analysis
        };

        // Mostrar análisis y pedir confirmación
        userState.step = 'WAITING_CATEGORY_CONFIRM';
        
        const categoryEmojis = {
            'baches': '🚧',
            'alumbrado': '💡',
            'basura': '🗑️',
            'areas_verdes': '🌳',
            'agua': '💧',
            'seguridad': '🚨',
            'transito': '🚦',
            'ruidos': '🔊',
            'animales': '🐕',
            'otros': '📋'
        };

        const priorityColors = {
            'urgente': '🔴',
            'alta': '🟠',
            'media': '🟡',
            'baja': '🟢'
        };

        const message = `🤖 *ANÁLISIS AUTOMÁTICO*\n\n` +
                       `He analizado tu reporte:\n\n` +
                       `${categoryEmojis[analysis.category]} *Categoría:* ${this.getCategoryName(analysis.category)}\n` +
                       `${priorityColors[analysis.priority]} *Prioridad:* ${analysis.priority.toUpperCase()}\n` +
                       `🏢 *Departamento:* ${analysis.department}\n\n` +
                       `📝 *Resumen:*\n` +
                       `_${analysis.summary}_\n\n` +
                       `*Paso 2 de 5: Confirmación de categoría*\n` +
                       `¿La categorización es correcta?\n\n` +
                       `1️⃣ Sí, continuar\n` +
                       `2️⃣ No, cambiar categoría\n` +
                       `3️⃣ Cancelar reporte`;

        await sock.sendMessage(chatId, { text: message });
    }

    async handleCategoryConfirm(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const option = text.trim();

        if (option === '1' || text.toLowerCase().includes('sí') || text.toLowerCase().includes('si')) {
            // Continuar con ubicación
            userState.step = 'WAITING_LOCATION';
            
            const message = `📍 *UBICACIÓN DEL PROBLEMA*\n\n` +
                           `*Paso 3 de 5: Ubicación*\n\n` +
                           `Necesito saber dónde está el problema.\n` +
                           `Tienes 3 opciones:\n\n` +
                           `1️⃣ Compartir ubicación actual 📍\n` +
                           `   _(Toca el clip 📎 → Ubicación)_\n\n` +
                           `2️⃣ Enviar ubicación del problema 🗺️\n` +
                           `   _(Busca en el mapa y envía)_\n\n` +
                           `3️⃣ Escribir la dirección 📝\n` +
                           `   _(Ej: Av. Principal 123, esquina Los Aromos)_`;

            await sock.sendMessage(chatId, { text: message });

        } else if (option === '2') {
            // Mostrar menú de categorías
            await this.showCategoryMenu(sock, chatId, userState);
            
        } else if (option === '3') {
            // Cancelar
            userState.step = 'MENU';
            userState.data = {};
            await sock.sendMessage(chatId, {
                text: '❌ Reporte cancelado.\n\nPuedes iniciar uno nuevo cuando quieras.'
            });
        }
    }

    async handleLocation(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const message = msg.message;

        // Verificar si es ubicación de WhatsApp
        if (message.locationMessage) {
            userState.data.reportData.location = {
                latitude: message.locationMessage.degreesLatitude,
                longitude: message.locationMessage.degreesLongitude,
                address: message.locationMessage.address || 'Ubicación en mapa'
            };
        } else {
            // Es texto con dirección
            const locationAnalysis = await services.anthropic.extractLocation(text);
            userState.data.reportData.location = {
                address: locationAnalysis.address || text,
                landmark: locationAnalysis.landmark,
                sector: locationAnalysis.sector
            };
        }

        // Preguntar por imagen
        userState.step = 'WAITING_IMAGE';
        
        const locationText = userState.data.reportData.location.address || 
                           `${userState.data.reportData.location.latitude}, ${userState.data.reportData.location.longitude}`;
        
        const confirmMessage = `✅ *Ubicación registrada:*\n` +
                              `📍 _${locationText}_\n\n` +
                              `📸 *EVIDENCIA FOTOGRÁFICA*\n\n` +
                              `*Paso 4 de 5: Foto (opcional)*\n` +
                              `Una foto ayuda mucho a evaluar el problema.\n\n` +
                              `¿Deseas adjuntar una foto?\n\n` +
                              `1️⃣ Sí, enviar foto\n` +
                              `2️⃣ No, continuar sin foto`;

        await sock.sendMessage(chatId, { text: confirmMessage });
    }

    async handleImageDecision(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        const option = text.trim();

        if (option === '1') {
            // Esperar imagen
            userState.step = 'WAITING_IMAGE_UPLOAD';
            await sock.sendMessage(chatId, {
                text: '📸 Por favor, envía la foto del problema.\n\n_Toca el clip 📎 → Cámara o Galería_'
            });
        } else {
            // Continuar sin imagen
            await this.requestContact(sock, chatId, userState);
        }
    }

    async handleImageUpload(msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        try {
            // Descargar imagen
            const buffer = await sock.downloadMediaMessage(msg);
            
            // Crear directorio si no existe
            const tempDir = path.join(__dirname, '..', 'temp');
            await fs.mkdir(tempDir, { recursive: true });
            
            // Guardar imagen
            const filename = `report_${Date.now()}.jpg`;
            const filepath = path.join(tempDir, filename);
            await fs.writeFile(filepath, buffer);
            
            // Analizar imagen con IA
            const imageAnalysis = await services.anthropic.analyzeImage(buffer);
            
            userState.data.reportData.imagePath = filepath;
            userState.data.reportData.imageAnalysis = imageAnalysis;
            
            // Mostrar análisis
            const message = `✅ *Imagen recibida y analizada*\n\n` +
                           `🔍 *Lo que detecté:*\n` +
                           `_${imageAnalysis.description}_\n\n` +
                           `⚠️ *Gravedad:* ${imageAnalysis.severity}\n`;

            await sock.sendMessage(chatId, { text: message });
            
            // Continuar con contacto
            await this.requestContact(sock, chatId, userState);
            
        } catch (error) {
            console.error('Error procesando imagen:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Error al procesar la imagen. Continuando sin ella...'
            });
            await this.requestContact(sock, chatId, userState);
        }
    }

    async requestContact(sock, chatId, userState) {
        userState.step = 'WAITING_CONTACT';
        
        const message = `👤 *DATOS DE CONTACTO*\n\n` +
                       `*Paso 5 de 5: Contacto*\n` +
                       `Para dar seguimiento a tu reporte.\n\n` +
                       `Por favor, proporciona tu nombre:\n\n` +
                       `_Si prefieres mantener el anonimato, escribe "anónimo"_`;

        await sock.sendMessage(chatId, { text: message });
    }

    async handleContact(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        if (text.toLowerCase() === 'anónimo' || text.toLowerCase() === 'anonimo') {
            userState.data.reportData.contact = {
                name: 'Anónimo',
                phone: msg.key.remoteJid,
                anonymous: true
            };
        } else {
            userState.data.reportData.contact = {
                name: text,
                phone: msg.key.remoteJid,
                anonymous: false
            };
        }

        // Mostrar resumen para confirmación
        userState.step = 'CONFIRMING';
        await this.showReportSummary(sock, chatId, userState);
    }

    async showReportSummary(sock, chatId, userState) {
        const data = userState.data.reportData;
        
        const summary = `📋 *RESUMEN DEL REPORTE*\n\n` +
                       `*Problema:*\n${data.description}\n\n` +
                       `📁 *Categoría:* ${this.getCategoryName(data.category)}\n` +
                       `⚡ *Prioridad:* ${data.priority.toUpperCase()}\n` +
                       `📍 *Ubicación:* ${data.location?.address || 'No especificada'}\n` +
                       `📸 *Foto:* ${data.imagePath ? 'Sí' : 'No'}\n` +
                       `👤 *Contacto:* ${data.contact?.name}\n\n` +
                       `¿Confirmas el envío del reporte?\n\n` +
                       `✅ Escribe *SÍ* para enviar\n` +
                       `❌ Escribe *NO* para cancelar`;

        await sock.sendMessage(chatId, { text: summary });
    }

    async handleConfirmation(text, msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        if (text.toLowerCase().includes('sí') || text.toLowerCase().includes('si') || text.toLowerCase() === 'yes') {
            await this.submitReport(msg, sock, services, userState);
        } else {
            userState.step = 'MENU';
            userState.data = {};
            await sock.sendMessage(chatId, {
                text: '❌ Reporte cancelado.\n\nVolviendo al menú principal...'
            });
        }
    }

    async submitReport(msg, sock, services, userState) {
        const chatId = msg.key.remoteJid;
        
        try {
            // Mostrar mensaje de procesamiento
            await sock.sendMessage(chatId, {
                text: '⏳ Enviando reporte al sistema municipal...'
            });

            const reportData = {
                ...userState.data.reportData,
                whatsapp_number: msg.key.remoteJid,
                source: 'whatsapp'
            };

            // Enviar al backend
            const response = await services.api.createReport(reportData, reportData.imagePath);
            
            // Guardar en base de datos local
            await services.database.saveWhatsAppReport({
                ...reportData,
                phone_number: msg.key.remoteJid
            });

            // Incrementar contador de reportes del usuario
            await services.database.getOrCreateSession(msg.key.remoteJid, reportData.contact?.name);

            const estimatedTime = this.getEstimatedTime(reportData.priority);
            
            // Enviar confirmación exitosa
            const successMessage = `✅ *¡REPORTE REGISTRADO EXITOSAMENTE!*\n\n` +
                                  `🎫 *Tu número de reporte es:*\n` +
                                  `\`\`\`${response.reportId}\`\`\`\n\n` +
                                  `📱 *Guarda este número* para consultar el estado\n\n` +
                                  `⏱️ *Tiempo estimado de respuesta:*\n` +
                                  `${estimatedTime}\n\n` +
                                  `📬 *Te notificaremos por WhatsApp cuando haya actualizaciones*\n\n` +
                                  `Para consultar el estado, escribe:\n` +
                                  `/estado ${response.reportId}\n\n` +
                                  `¡Gracias por ayudarnos a mejorar Catemu! 🏘️`;

            await sock.sendMessage(chatId, { text: successMessage });

            // Si es urgente, notificar administradores
            if (reportData.priority === 'urgente' || reportData.priority === 'alta') {
                await this.notifyUrgentReport(sock, reportData, response.reportId);
            }

            // Limpiar estado
            userState.step = 'MENU';
            userState.data = {};

        } catch (error) {
            console.error('Error enviando reporte:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Hubo un error al registrar el reporte.\n\nPor favor, intenta nuevamente o llama al 34 259 1001'
            });
        }
    }

    async showCategoryMenu(sock, chatId, userState) {
        userState.step = 'WAITING_CATEGORY_SELECTION';
        
        const categories = [
            '1️⃣ 🚧 Baches y Pavimento',
            '2️⃣ 💡 Alumbrado Público',
            '3️⃣ 🗑️ Basura y Limpieza',
            '4️⃣ 🌳 Áreas Verdes',
            '5️⃣ 💧 Agua y Alcantarillado',
            '6️⃣ 🚦 Tránsito y Señalética',
            '7️⃣ 🔊 Ruidos Molestos',
            '8️⃣ 🐕 Animales',
            '9️⃣ 🚨 Seguridad',
            '🔟 📋 Otros'
        ];

        const message = `📁 *SELECCIONA LA CATEGORÍA*\n\n` +
                       categories.join('\n') +
                       `\n\n_Responde con el número de la categoría correcta_`;

        await sock.sendMessage(chatId, { text: message });
    }

    getCategoryName(category) {
        const names = {
            'baches': 'Baches y Pavimento',
            'alumbrado': 'Alumbrado Público',
            'basura': 'Basura y Limpieza',
            'areas_verdes': 'Áreas Verdes',
            'agua': 'Agua y Alcantarillado',
            'transito': 'Tránsito y Señalética',
            'ruidos': 'Ruidos Molestos',
            'animales': 'Animales',
            'seguridad': 'Seguridad',
            'otros': 'Otros'
        };
        return names[category] || category;
    }

    getEstimatedTime(priority) {
        const times = {
            'urgente': '⚡ 24-48 horas (URGENTE)',
            'alta': '🔴 2-5 días hábiles',
            'media': '🟡 5-10 días hábiles',
            'baja': '🟢 10-15 días hábiles'
        };
        return times[priority] || '5-10 días hábiles';
    }

    async notifyUrgentReport(sock, reportData, reportId) {
        const adminNumbers = process.env.ADMIN_NUMBERS?.split(',') || [];
        
        const urgentMessage = `🚨 *ALERTA: REPORTE URGENTE*\n\n` +
                             `🎫 ID: ${reportId}\n` +
                             `📁 Categoría: ${this.getCategoryName(reportData.category)}\n` +
                             `⚡ Prioridad: ${reportData.priority.toUpperCase()}\n\n` +
                             `📝 Descripción:\n${reportData.description}\n\n` +
                             `📍 Ubicación: ${reportData.location?.address || 'Ver en sistema'}\n` +
                             `👤 Reportado por: ${reportData.contact?.name}\n\n` +
                             `⚠️ *Requiere atención inmediata*\n\n` +
                             `Ver en dashboard: www.catconecta.cl/reports/${reportId}`;

        for (const number of adminNumbers) {
            try {
                await sock.sendMessage(`${number}@s.whatsapp.net`, { text: urgentMessage });
            } catch (error) {
                console.error(`Error notificando admin ${number}:`, error);
            }
        }
    }
}

module.exports = ReportHandler;