const Anthropic = require('@anthropic-ai/sdk');

class AnthropicService {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        
        this.model = process.env.AI_MODEL || 'claude-3-haiku-20240307';
        this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000;
        this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    }

    async analyzeReport(description) {
        try {
            const prompt = `Eres un asistente municipal experto en categorizar reportes ciudadanos para la Municipalidad de Catemu, Chile.

Analiza el siguiente reporte ciudadano y proporciona:
1. Categoría principal (una de: baches, alumbrado, basura, areas_verdes, seguridad, transito, agua, ruidos, animales, otros)
2. Nivel de prioridad (urgente, alta, media, baja) basado en:
   - Riesgo para la seguridad
   - Número de personas afectadas
   - Impacto en servicios esenciales
3. Departamento municipal sugerido
4. Palabras clave relevantes
5. Resumen breve del problema

Reporte: "${description}"

Responde SOLO en formato JSON sin markdown:
{
  "category": "categoria",
  "priority": "nivel",
  "department": "departamento",
  "keywords": ["palabra1", "palabra2"],
  "summary": "resumen breve",
  "risk_factors": ["factor1", "factor2"]
}`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: 0.3, // Baja temperatura para respuestas más consistentes
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const content = response.content[0].text;
            
            try {
                // Intentar parsear JSON
                const analysis = JSON.parse(content);
                return {
                    category: analysis.category || 'otros',
                    priority: analysis.priority || 'media',
                    department: analysis.department || 'Obras Municipales',
                    keywords: analysis.keywords || [],
                    summary: analysis.summary || description.substring(0, 100),
                    riskFactors: analysis.risk_factors || []
                };
            } catch (parseError) {
                console.error('Error parseando respuesta de IA:', parseError);
                // Fallback con análisis básico
                return this.basicAnalysis(description);
            }

        } catch (error) {
            console.error('Error en análisis de IA:', error);
            return this.basicAnalysis(description);
        }
    }

    async analyzeIntention(text) {
        try {
            const prompt = `Analiza la intención del siguiente mensaje ciudadano y determina qué quiere hacer:

Mensaje: "${text}"

Posibles intenciones:
- reportar_problema: Quiere reportar un problema urbano
- consultar_estado: Quiere saber el estado de un reporte
- hacer_pregunta: Tiene una pregunta general
- solicitar_ayuda: Necesita ayuda o información
- responder_encuesta: Quiere participar en encuesta
- queja: Está expresando una queja
- agradecimiento: Está agradeciendo
- otro: Otra intención

Responde SOLO con la intención identificada y una breve explicación en JSON:
{
  "intention": "intencion_identificada",
  "confidence": 0.0 a 1.0,
  "explanation": "breve explicación",
  "suggested_action": "acción sugerida"
}`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 200,
                temperature: 0.5,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const content = response.content[0].text;
            
            try {
                return JSON.parse(content);
            } catch {
                return {
                    intention: 'otro',
                    confidence: 0.5,
                    explanation: 'No se pudo determinar la intención',
                    suggested_action: 'mostrar_menu'
                };
            }

        } catch (error) {
            console.error('Error analizando intención:', error);
            return {
                intention: 'otro',
                confidence: 0,
                explanation: 'Error en análisis',
                suggested_action: 'mostrar_menu'
            };
        }
    }

    async generateResponse(context, userMessage) {
        try {
            const prompt = `Eres un asistente virtual amigable de la Municipalidad de Catemu.
            
Contexto: ${context}
Mensaje del ciudadano: "${userMessage}"

Genera una respuesta útil, amigable y concisa. Usa emojis apropiados.
Si no estás seguro, sugiere opciones o pide más información.
Mantén un tono profesional pero cercano.`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 300,
                temperature: this.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return response.content[0].text;

        } catch (error) {
            console.error('Error generando respuesta:', error);
            return 'Entiendo tu consulta. ¿Podrías proporcionar más detalles para poder ayudarte mejor?';
        }
    }

    async analyzeSentiment(text) {
        try {
            const prompt = `Analiza el sentimiento del siguiente mensaje:
"${text}"

Responde solo con: positivo, negativo, neutro, urgente`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 50,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const sentiment = response.content[0].text.trim().toLowerCase();
            return ['positivo', 'negativo', 'neutro', 'urgente'].includes(sentiment) 
                ? sentiment 
                : 'neutro';

        } catch (error) {
            console.error('Error analizando sentimiento:', error);
            return 'neutro';
        }
    }

    async extractLocation(text) {
        try {
            const prompt = `Extrae información de ubicación del siguiente texto:
"${text}"

Busca: direcciones, calles, intersecciones, landmarks, sectores de Catemu.

Responde en JSON:
{
  "found": true/false,
  "address": "dirección extraída o null",
  "landmark": "punto de referencia o null",
  "sector": "sector o barrio o null"
}`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 200,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            try {
                return JSON.parse(response.content[0].text);
            } catch {
                return { found: false, address: null, landmark: null, sector: null };
            }

        } catch (error) {
            console.error('Error extrayendo ubicación:', error);
            return { found: false, address: null, landmark: null, sector: null };
        }
    }

    async analyzeImage(imageBuffer) {
        try {
            // Convertir buffer a base64
            const base64Image = imageBuffer.toString('base64');
            
            const response = await this.client.messages.create({
                model: 'claude-3-haiku-20240307', // Modelo con capacidad de visión
                max_tokens: 500,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analiza esta imagen de un reporte ciudadano municipal. Describe:
1. Qué problema se observa
2. Gravedad del problema (leve, moderado, grave)
3. Elementos relevantes visibles
4. Riesgos potenciales
5. Categoría sugerida (baches, basura, alumbrado, etc.)

Responde en formato JSON:
{
  "description": "descripción del problema",
  "severity": "gravedad",
  "elements": ["elemento1", "elemento2"],
  "risks": ["riesgo1", "riesgo2"],
  "suggested_category": "categoría"
}`
                            },
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            });

            try {
                const analysis = JSON.parse(response.content[0].text);
                return {
                    description: analysis.description || 'Imagen recibida',
                    severity: analysis.severity || 'moderado',
                    elements: analysis.elements || [],
                    risks: analysis.risks || [],
                    suggested_category: analysis.suggested_category || 'otros'
                };
            } catch {
                return {
                    description: response.content[0].text,
                    severity: 'moderado',
                    elements: [],
                    risks: [],
                    suggested_category: 'otros'
                };
            }

        } catch (error) {
            console.error('Error analizando imagen:', error);
            return {
                description: 'No se pudo analizar la imagen',
                severity: 'desconocido',
                elements: [],
                risks: [],
                suggested_category: 'otros'
            };
        }
    }

    async generateSurveyAnalysis(responses) {
        try {
            const prompt = `Analiza estas respuestas de encuesta municipal y genera insights:

Respuestas: ${JSON.stringify(responses)}

Genera:
1. Resumen de tendencias principales
2. Puntos críticos identificados
3. Recomendaciones de acción
4. Sentimiento general

Responde en formato estructurado.`;

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 500,
                temperature: 0.5,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return response.content[0].text;

        } catch (error) {
            console.error('Error analizando encuesta:', error);
            return 'No se pudo analizar las respuestas de la encuesta.';
        }
    }

    // Análisis básico de fallback cuando la IA falla
    basicAnalysis(description) {
        const lowerDesc = description.toLowerCase();
        
        // Categorización básica por palabras clave
        let category = 'otros';
        let priority = 'media';
        let department = 'Obras Municipales';
        
        // Detección de categorías
        if (lowerDesc.includes('bache') || lowerDesc.includes('hoyo') || lowerDesc.includes('pavimento')) {
            category = 'baches';
            department = 'Obras Municipales';
        } else if (lowerDesc.includes('luz') || lowerDesc.includes('luminaria') || lowerDesc.includes('alumbrado') || lowerDesc.includes('poste')) {
            category = 'alumbrado';
            department = 'Alumbrado Público';
        } else if (lowerDesc.includes('basura') || lowerDesc.includes('desecho') || lowerDesc.includes('sucio')) {
            category = 'basura';
            department = 'Aseo y Ornato';
        } else if (lowerDesc.includes('agua') || lowerDesc.includes('alcantarilla') || lowerDesc.includes('inundac')) {
            category = 'agua';
            department = 'Agua y Alcantarillado';
        } else if (lowerDesc.includes('segur') || lowerDesc.includes('peligr') || lowerDesc.includes('delincuen')) {
            category = 'seguridad';
            department = 'Seguridad Ciudadana';
            priority = 'alta';
        }
        
        // Detección de urgencia
        if (lowerDesc.includes('urgente') || lowerDesc.includes('peligro') || lowerDesc.includes('accidente')) {
            priority = 'alta';
        }
        if (lowerDesc.includes('niño') || lowerDesc.includes('escuela') || lowerDesc.includes('hospital')) {
            priority = 'alta';
        }
        
        return {
            category,
            priority,
            department,
            keywords: this.extractKeywords(description),
            summary: description.substring(0, 100),
            riskFactors: []
        };
    }

    extractKeywords(text) {
        const stopWords = ['el', 'la', 'de', 'en', 'y', 'a', 'los', 'las', 'por', 'con', 'para', 'es', 'un', 'una'];
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));
        
        // Retornar las 5 palabras más relevantes
        return [...new Set(words)].slice(0, 5);
    }
}

module.exports = AnthropicService;