const axios = require('axios');

class AICategorization {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        this.model = process.env.AI_MODEL || 'llama3.2:1b';
        
        // Categorías disponibles con palabras clave
        this.categories = {
            'baches': {
                keywords: ['bache', 'hoyo', 'pavimento', 'calle', 'vereda', 'acera', 'roto', 'hundimiento', 'grieta'],
                department: 'Obras',
                defaultPriority: 'media'
            },
            'alumbrado': {
                keywords: ['luz', 'luminaria', 'poste', 'alumbrado', 'oscuro', 'lámpara', 'foco', 'apagada', 'quemada'],
                department: 'Obras',
                defaultPriority: 'alta'
            },
            'basura': {
                keywords: ['basura', 'desecho', 'residuo', 'sucio', 'recolección', 'contenedor', 'escombro', 'mugre'],
                department: 'Aseo y Ornato',
                defaultPriority: 'media'
            },
            'areas_verdes': {
                keywords: ['árbol', 'pasto', 'plaza', 'parque', 'jardín', 'poda', 'riego', 'verde', 'césped'],
                department: 'Aseo y Ornato',
                defaultPriority: 'baja'
            },
            'agua': {
                keywords: ['agua', 'fuga', 'filtración', 'alcantarillado', 'inundación', 'cañería', 'tubería', 'desagüe'],
                department: 'Obras',
                defaultPriority: 'alta'
            },
            'seguridad': {
                keywords: ['seguridad', 'delito', 'robo', 'peligro', 'asalto', 'droga', 'delincuencia', 'vandalismo'],
                department: 'Seguridad Ciudadana',
                defaultPriority: 'urgente'
            },
            'transito': {
                keywords: ['tránsito', 'señalética', 'semáforo', 'pare', 'ceda', 'señal', 'tráfico', 'estacionamiento'],
                department: 'Tránsito',
                defaultPriority: 'media'
            },
            'ruidos': {
                keywords: ['ruido', 'molesto', 'música', 'fiesta', 'escándalo', 'volumen', 'bulla', 'ruidoso'],
                department: 'Inspección',
                defaultPriority: 'baja'
            },
            'animales': {
                keywords: ['perro', 'gato', 'animal', 'mascota', 'callejero', 'mordida', 'ladrido', 'abandonado'],
                department: 'Salud',
                defaultPriority: 'media'
            }
        };
    }

    // Categorización simple basada en palabras clave (fallback si Ollama no está disponible)
    categorizeByKeywords(text) {
        const textLower = text.toLowerCase();
        let bestMatch = { category: 'otros', score: 0, department: 'Administración', priority: 'media' };

        for (const [category, data] of Object.entries(this.categories)) {
            let score = 0;
            for (const keyword of data.keywords) {
                if (textLower.includes(keyword)) {
                    score += 1;
                }
            }
            
            if (score > bestMatch.score) {
                bestMatch = {
                    category,
                    score,
                    department: data.department,
                    priority: data.defaultPriority
                };
            }
        }

        // Ajustar prioridad basada en palabras de urgencia
        const urgentKeywords = ['urgente', 'peligro', 'peligroso', 'emergencia', 'grave', 'inmediato', 'rápido'];
        const highKeywords = ['importante', 'serio', 'problema', 'afecta', 'varios', 'muchos'];
        
        if (urgentKeywords.some(word => textLower.includes(word))) {
            bestMatch.priority = 'urgente';
        } else if (highKeywords.some(word => textLower.includes(word))) {
            bestMatch.priority = 'alta';
        }

        return bestMatch;
    }

    // Categorización con IA usando Ollama
    async categorizeWithAI(text) {
        try {
            const prompt = `Analiza el siguiente reporte ciudadano y determina:
1. Categoría principal (una de: baches, alumbrado, basura, areas_verdes, agua, seguridad, transito, ruidos, animales, otros)
2. Nivel de prioridad (urgente, alta, media, baja)
3. Departamento responsable

Reporte: "${text}"

Responde SOLO en formato JSON:
{"category": "...", "priority": "...", "department": "..."}`;

            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.9,
                    max_tokens: 100
                }
            }, {
                timeout: 10000 // 10 segundos timeout
            });

            // Intentar parsear la respuesta JSON
            try {
                const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    
                    // Validar que tiene los campos necesarios
                    if (result.category && result.priority) {
                        // Mapear departamento si no está presente
                        if (!result.department && this.categories[result.category]) {
                            result.department = this.categories[result.category].department;
                        }
                        return result;
                    }
                }
            } catch (parseError) {
                console.log('Error parseando respuesta IA, usando fallback');
            }
            
            // Si falla el parseo, usar categorización por keywords
            return this.categorizeByKeywords(text);
            
        } catch (error) {
            console.log('Ollama no disponible, usando categorización por palabras clave');
            return this.categorizeByKeywords(text);
        }
    }

    // Método principal para categorizar
    async categorize(text) {
        if (!text || text.length < 10) {
            return {
                category: 'otros',
                priority: 'media',
                department: 'Administración'
            };
        }

        // Intentar con IA primero, fallback a keywords
        const result = await this.categorizeWithAI(text);
        
        console.log(`📊 Categorización: ${result.category} | Prioridad: ${result.priority} | Depto: ${result.department}`);
        
        return result;
    }

    // Extraer entidades importantes del texto
    extractEntities(text) {
        const entities = {
            hasAddress: false,
            hasPhone: false,
            hasEmail: false,
            hasUrgency: false
        };

        // Detectar dirección (calle, avenida, pasaje, etc.)
        if (/\b(calle|avenida|av\.|pasaje|psje|plaza|parque)\b/i.test(text)) {
            entities.hasAddress = true;
        }

        // Detectar teléfono chileno
        if (/\+?56\s?9\s?\d{4}\s?\d{4}/.test(text)) {
            entities.hasPhone = true;
        }

        // Detectar email
        if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
            entities.hasEmail = true;
        }

        // Detectar urgencia
        if (/\b(urgente|emergencia|peligro|inmediato|ahora)\b/i.test(text)) {
            entities.hasUrgency = true;
        }

        return entities;
    }

    // Generar resumen del reporte
    async generateSummary(text) {
        if (text.length <= 100) {
            return text;
        }

        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.model,
                prompt: `Resume en máximo 50 palabras el siguiente reporte ciudadano, manteniendo la información clave:
"${text}"

Resumen:`,
                stream: false,
                options: {
                    temperature: 0.5,
                    max_tokens: 100
                }
            }, {
                timeout: 5000
            });

            return response.data.response.trim() || text.substring(0, 100) + '...';
        } catch (error) {
            // Fallback: primeras 100 caracteres
            return text.substring(0, 100) + '...';
        }
    }

    // Verificar si Ollama está disponible
    async checkHealth() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
                timeout: 2000
            });
            return {
                available: true,
                models: response.data.models || []
            };
        } catch (error) {
            return {
                available: false,
                models: []
            };
        }
    }
}

module.exports = AICategorization;