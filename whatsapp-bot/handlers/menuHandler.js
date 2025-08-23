class MenuHandler {
    constructor() {
        this.menus = {
            main: this.getMainMenu(),
            categories: this.getCategoriesMenu(),
            info: this.getInfoMenu()
        };
    }

    getMainMenu() {
        return {
            title: '🏘️ CATEMU CONECTA - MENÚ PRINCIPAL',
            options: [
                { id: '1', label: '📝 Reportar un problema', action: 'report' },
                { id: '2', label: '🔍 Consultar estado de reporte', action: 'status' },
                { id: '3', label: '📊 Responder encuesta', action: 'survey' },
                { id: '4', label: 'ℹ️ Información municipal', action: 'info' },
                { id: '5', label: '📈 Mis estadísticas', action: 'stats' },
                { id: '6', label: '❓ Ayuda', action: 'help' }
            ],
            footer: 'Responde con el número de tu elección'
        };
    }

    getCategoriesMenu() {
        return {
            title: '📁 CATEGORÍAS DE REPORTES',
            options: [
                { id: '1', label: '🚧 Baches y Pavimento', value: 'baches' },
                { id: '2', label: '💡 Alumbrado Público', value: 'alumbrado' },
                { id: '3', label: '🗑️ Basura y Limpieza', value: 'basura' },
                { id: '4', label: '🌳 Áreas Verdes', value: 'areas_verdes' },
                { id: '5', label: '💧 Agua y Alcantarillado', value: 'agua' },
                { id: '6', label: '🚦 Tránsito y Señalética', value: 'transito' },
                { id: '7', label: '🔊 Ruidos Molestos', value: 'ruidos' },
                { id: '8', label: '🐕 Animales', value: 'animales' },
                { id: '9', label: '🚨 Seguridad', value: 'seguridad' },
                { id: '10', label: '📋 Otros', value: 'otros' }
            ],
            footer: 'Selecciona la categoría que mejor describe el problema'
        };
    }

    getInfoMenu() {
        return {
            title: 'ℹ️ INFORMACIÓN MUNICIPAL',
            options: [
                { id: '1', label: '📞 Contactos importantes', action: 'contacts' },
                { id: '2', label: '🕐 Horarios de atención', action: 'schedule' },
                { id: '3', label: '📍 Direcciones útiles', action: 'addresses' },
                { id: '4', label: '🚨 Números de emergencia', action: 'emergency' },
                { id: '5', label: '📋 Trámites frecuentes', action: 'procedures' },
                { id: '6', label: '🔙 Volver al menú', action: 'back' }
            ],
            footer: 'Selecciona una opción para más información'
        };
    }

    formatMenu(menuType = 'main') {
        const menu = this.menus[menuType];
        if (!menu) return 'Menú no disponible';

        let text = `*${menu.title}*\n\n`;
        
        menu.options.forEach(option => {
            text += `${option.id}. ${option.label}\n`;
        });
        
        text += `\n_${menu.footer}_`;
        
        return text;
    }

    parseSelection(input, menuType = 'main') {
        const menu = this.menus[menuType];
        if (!menu) return null;

        const selection = input.trim();
        const option = menu.options.find(opt => 
            opt.id === selection || 
            opt.label.toLowerCase().includes(selection.toLowerCase())
        );

        return option || null;
    }

    getQuickResponses() {
        return {
            greeting: [
                '¡Hola! 👋',
                '¡Bienvenido a CatemuConecta! 🏘️',
                '¡Hola! ¿En qué puedo ayudarte hoy?'
            ],
            thanks: [
                '¡De nada! Estamos para ayudarte 😊',
                '¡Un gusto poder ayudarte! 🤝',
                'Gracias a ti por ayudarnos a mejorar Catemu 🏘️'
            ],
            error: [
                'Disculpa, no entendí tu mensaje. ¿Podrías reformularlo?',
                'Lo siento, no pude procesar tu solicitud. Intenta de nuevo.',
                'Hmm, parece que hubo un problema. ¿Puedes intentar nuevamente?'
            ],
            wait: [
                'Un momento por favor... ⏳',
                'Procesando tu solicitud... 🔄',
                'Dame un segundo... ⚡'
            ],
            confirm: [
                '✅ Perfecto, continuemos.',
                '👍 Entendido, sigamos.',
                '✓ Excelente, procedamos.'
            ]
        };
    }

    getContactsInfo() {
        return `📞 *CONTACTOS MUNICIPALES*\n\n` +
               `🏛️ *Central Telefónica*\n` +
               `📱 +56 34 259 1001\n\n` +
               `*Departamentos:*\n` +
               `• DIDECO: +56 34 259 1002\n` +
               `• Obras: +56 34 259 1003\n` +
               `• Tránsito: +56 34 259 1004\n` +
               `• Salud: +56 34 259 1005\n` +
               `• Educación: +56 34 259 1006\n\n` +
               `📧 *Email:* contacto@municatemu.cl\n` +
               `🌐 *Web:* www.municatemu.cl`;
    }

    getScheduleInfo() {
        return `🕐 *HORARIOS DE ATENCIÓN*\n\n` +
               `*Atención Presencial:*\n` +
               `Lunes a Viernes: 8:30 - 14:00\n\n` +
               `*Atención Telefónica:*\n` +
               `Lunes a Viernes: 8:30 - 17:30\n\n` +
               `*WhatsApp Bot:*\n` +
               `24/7 - Siempre disponible 🤖\n\n` +
               `*Oficina de Partes:*\n` +
               `Lunes a Viernes: 8:30 - 13:30`;
    }

    getEmergencyInfo() {
        return `🚨 *NÚMEROS DE EMERGENCIA*\n\n` +
               `🚒 *Bomberos:* 132\n` +
               `🚓 *Carabineros:* 133\n` +
               `🚑 *Ambulancia:* 131\n` +
               `🔴 *PDI:* 134\n\n` +
               `*Emergencias Municipales:*\n` +
               `📞 1404 (24 horas)\n\n` +
               `*Otros:*\n` +
               `• Fono Drogas: 135\n` +
               `• Violencia Mujer: 1455\n` +
               `• Salud Responde: 600 360 7777`;
    }

    getHelpText() {
        return `❓ *AYUDA - CÓMO USAR EL BOT*\n\n` +
               `*Comandos disponibles:*\n` +
               `/menu - Ver menú principal\n` +
               `/estado [ID] - Consultar estado de reporte\n` +
               `/ayuda - Ver esta ayuda\n` +
               `/stats - Ver tus estadísticas\n\n` +
               `*Para reportar un problema:*\n` +
               `1. Selecciona opción 1 del menú\n` +
               `2. Describe el problema\n` +
               `3. Envía ubicación o dirección\n` +
               `4. Opcionalmente envía una foto\n\n` +
               `*Tips:*\n` +
               `• Puedes enviar fotos directamente\n` +
               `• Comparte tu ubicación para mayor precisión\n` +
               `• Guarda tu número de reporte\n\n` +
               `¿Necesitas ayuda humana?\n` +
               `Llama al 34 259 1001`;
    }

    getProceduresInfo() {
        return `📋 *TRÁMITES FRECUENTES*\n\n` +
               `*Presenciales en Municipalidad:*\n` +
               `• Permisos de circulación\n` +
               `• Patentes comerciales\n` +
               `• Licencias de conducir\n` +
               `• Registro social de hogares\n\n` +
               `*Online en www.municatemu.cl:*\n` +
               `• Certificados varios\n` +
               `• Pago de contribuciones\n` +
               `• Solicitud hora médica\n\n` +
               `*Por este WhatsApp:*\n` +
               `• Reportes de problemas\n` +
               `• Consultas generales\n` +
               `• Responder encuestas\n\n` +
               `Para más información sobre trámites específicos,\n` +
               `visita www.municatemu.cl/tramites`;
    }

    formatReportSummary(reportData) {
        return `📋 *RESUMEN DE TU REPORTE*\n\n` +
               `📁 *Categoría:* ${reportData.categoryName}\n` +
               `📝 *Descripción:* ${reportData.description}\n` +
               `📍 *Ubicación:* ${reportData.location?.address || 'No especificada'}\n` +
               `⚡ *Prioridad:* ${reportData.priority}\n` +
               `🏢 *Departamento:* ${reportData.department}\n\n` +
               `¿Confirmas estos datos?\n\n` +
               `1. ✅ Sí, enviar reporte\n` +
               `2. ✏️ Modificar datos\n` +
               `3. ❌ Cancelar`;
    }

    formatReportConfirmation(reportId, estimatedTime) {
        return `✅ *REPORTE REGISTRADO EXITOSAMENTE*\n\n` +
               `🎫 *Número de reporte:*\n` +
               `\`${reportId}\`\n\n` +
               `⏱️ *Tiempo estimado de respuesta:*\n` +
               `${estimatedTime}\n\n` +
               `📱 *Seguimiento:*\n` +
               `• Te notificaremos por WhatsApp\n` +
               `• Consulta el estado con: /estado ${reportId}\n` +
               `• Dashboard web: www.catconecta.cl\n\n` +
               `¡Gracias por ayudarnos a mejorar Catemu! 🏘️`;
    }

    formatStatusUpdate(report) {
        const statusEmojis = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'cancelled': '❌'
        };

        const statusText = {
            'pending': 'Pendiente',
            'in_progress': 'En proceso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };

        return `📊 *ESTADO DEL REPORTE*\n\n` +
               `🎫 *ID:* ${report.id}\n` +
               `${statusEmojis[report.status]} *Estado:* ${statusText[report.status]}\n` +
               `📁 *Categoría:* ${report.category}\n` +
               `📅 *Fecha:* ${report.created_at}\n` +
               `🏢 *Departamento:* ${report.department || 'Por asignar'}\n\n` +
               `${report.resolution_notes ? `💬 *Notas:* ${report.resolution_notes}\n\n` : ''}` +
               `${report.estimated_completion ? `⏰ *Estimado:* ${report.estimated_completion}\n\n` : ''}` +
               `_Última actualización: ${report.updated_at}_`;
    }
}

module.exports = MenuHandler;