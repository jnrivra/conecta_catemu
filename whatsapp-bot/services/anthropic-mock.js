// Servicio MOCK de Anthropic para demo sin API key
// Simula respuestas de IA con lógica básica

class AnthropicMockService {
    constructor() {
        console.log('⚠️ Usando servicio MOCK de IA (sin API key real)');
    }

    async analyzeReport(description) {
        const lowerDesc = description.toLowerCase();
        
        // Categorización simulada basada en palabras clave
        let category = 'otros';
        let priority = 'media';
        let department = 'Obras Municipales';
        
        if (lowerDesc.includes('bache') || lowerDesc.includes('hoyo') || lowerDesc.includes('calle')) {
            category = 'baches';
            priority = 'alta';
        } else if (lowerDesc.includes('luz') || lowerDesc.includes('poste') || lowerDesc.includes('oscur')) {
            category = 'alumbrado';
            department = 'Alumbrado Público';
        } else if (lowerDesc.includes('basura') || lowerDesc.includes('sucio')) {
            category = 'basura';
            department = 'Aseo y Ornato';
        } else if (lowerDesc.includes('agua') || lowerDesc.includes('inunda')) {
            category = 'agua';
            department = 'Agua y Alcantarillado';
            priority = 'alta';
        } else if (lowerDesc.includes('peligr') || lowerDesc.includes('urgent') || lowerDesc.includes('segur')) {
            category = 'seguridad';
            priority = 'urgente';
            department = 'Seguridad Ciudadana';
        }
        
        // Detectar urgencia adicional
        if (lowerDesc.includes('niño') || lowerDesc.includes('escuela') || lowerDesc.includes('hospital')) {
            priority = 'urgente';
        }
        
        return {
            category,
            priority,
            department,
            keywords: this.extractKeywords(description),
            summary: description.substring(0, 100),
            riskFactors: priority === 'urgente' ? ['Requiere atención inmediata'] : []
        };
    }

    async analyzeIntention(text) {
        const lower = text.toLowerCase();
        
        if (lower.includes('reportar') || lower.includes('problema') || lower.includes('hay un')) {
            return {
                intention: 'reportar_problema',
                confidence: 0.9,
                explanation: 'Usuario quiere reportar un problema',
                suggested_action: 'iniciar_reporte'
            };
        } else if (lower.includes('estado') || lower.includes('consultar')) {
            return {
                intention: 'consultar_estado',
                confidence: 0.8,
                explanation: 'Usuario quiere consultar estado',
                suggested_action: 'solicitar_numero_reporte'
            };
        } else if (lower.includes('hola') || lower.includes('buenas') || lower.includes('ayuda')) {
            return {
                intention: 'saludo',
                confidence: 0.9,
                explanation: 'Usuario está saludando',
                suggested_action: 'mostrar_menu'
            };
        }
        
        return {
            intention: 'otro',
            confidence: 0.5,
            explanation: 'Intención no clara',
            suggested_action: 'mostrar_menu'
        };
    }

    async generateResponse(context, userMessage) {
        // Respuestas predefinidas según contexto
        const responses = {
            'greeting': '¡Hola! Estoy aquí para ayudarte con tus reportes ciudadanos. ¿En qué puedo asistirte?',
            'report_started': 'Perfecto, vamos a registrar tu reporte. Por favor, describe el problema detalladamente.',
            'location_needed': 'Ahora necesito la ubicación del problema. Puedes compartir tu ubicación o escribir la dirección.',
            'confirmation': 'He recibido tu información. ¿Todo está correcto?',
            'thanks': '¡Gracias por tu reporte! Juntos mejoramos Catemu.',
            'error': 'Disculpa, no entendí bien. ¿Podrías reformular tu mensaje?',
            'default': 'Entiendo tu consulta. ¿Cómo puedo ayudarte específicamente?'
        };
        
        // Seleccionar respuesta según contexto
        if (context.includes('saludo') || context.includes('greeting')) {
            return responses.greeting;
        } else if (context.includes('reporte')) {
            return responses.report_started;
        } else if (context.includes('ubicacion')) {
            return responses.location_needed;
        }
        
        return responses.default;
    }

    async analyzeSentiment(text) {
        const lower = text.toLowerCase();
        
        if (lower.includes('urgente') || lower.includes('peligro') || lower.includes('grave')) {
            return 'urgente';
        } else if (lower.includes('mal') || lower.includes('problema') || lower.includes('molest')) {
            return 'negativo';
        } else if (lower.includes('bien') || lower.includes('gracias') || lower.includes('excelente')) {
            return 'positivo';
        }
        
        return 'neutro';
    }

    async extractLocation(text) {
        const lower = text.toLowerCase();
        
        // Buscar patrones de dirección
        const patterns = {
            'centro': 'Centro de Catemu',
            'plaza': 'Plaza de Armas',
            'escuela': 'Sector Escuela',
            'hospital': 'Sector Hospital',
            'esquina': text,
            'calle': text,
            'avenida': text,
            'av.': text
        };
        
        for (const [key, value] of Object.entries(patterns)) {
            if (lower.includes(key)) {
                return {
                    found: true,
                    address: value,
                    landmark: key,
                    sector: 'Catemu Centro'
                };
            }
        }
        
        return {
            found: false,
            address: text,
            landmark: null,
            sector: null
        };
    }

    async analyzeImage(imageBuffer) {
        // Simulación de análisis de imagen
        return {
            description: 'Imagen recibida y procesada (modo demo)',
            severity: 'moderado',
            elements: ['problema visible', 'requiere atención'],
            risks: ['posible riesgo para peatones'],
            suggested_category: 'otros'
        };
    }

    async generateSurveyAnalysis(responses) {
        return `Análisis de Encuesta (Modo Demo):
        - Total respuestas analizadas: ${responses.length}
        - Tendencia general: Neutral
        - Recomendación: Continuar monitoreando
        
        Este es un análisis simulado para demostración.`;
    }

    extractKeywords(text) {
        const stopWords = ['el', 'la', 'de', 'en', 'y', 'a', 'los', 'las', 'por', 'con', 'para'];
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));
        
        return [...new Set(words)].slice(0, 5);
    }
}

module.exports = AnthropicMockService;