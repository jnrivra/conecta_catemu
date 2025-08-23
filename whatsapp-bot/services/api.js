const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class BackendAPI {
    constructor() {
        this.baseURL = process.env.BACKEND_API_URL || 'http://localhost:3001';
        this.apiKey = process.env.BACKEND_API_KEY;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'X-API-Key': this.apiKey })
            }
        });

        // Interceptor para logging
        this.client.interceptors.request.use(request => {
            console.log(`📤 API Request: ${request.method?.toUpperCase()} ${request.url}`);
            return request;
        });

        this.client.interceptors.response.use(
            response => {
                console.log(`📥 API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            error => {
                console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
                return Promise.reject(error);
            }
        );
    }

    async createReport(reportData, imagePath = null) {
        try {
            if (imagePath && fs.existsSync(imagePath)) {
                // Si hay imagen, usar multipart/form-data
                const formData = new FormData();
                
                // Agregar campos del reporte
                formData.append('type', reportData.type || 'incidencia');
                formData.append('category', reportData.category);
                formData.append('description', reportData.description);
                formData.append('location', JSON.stringify(reportData.location || {}));
                formData.append('contact_info', JSON.stringify(reportData.contact_info || {}));
                formData.append('priority', reportData.priority || 'media');
                formData.append('source', 'whatsapp');
                
                // Agregar imagen
                formData.append('image', fs.createReadStream(imagePath));

                const response = await this.client.post('/api/reports', formData, {
                    headers: {
                        ...formData.getHeaders()
                    }
                });

                return {
                    success: true,
                    reportId: response.data.id || `CAT-2025-${Math.floor(Math.random() * 9000) + 1000}`,
                    data: response.data
                };
            } else {
                // Sin imagen, enviar JSON normal
                const response = await this.client.post('/api/reports', {
                    type: reportData.type || 'incidencia',
                    category: reportData.category,
                    description: reportData.description,
                    location: JSON.stringify(reportData.location || {}),
                    contact_info: JSON.stringify(reportData.contact_info || {}),
                    priority: reportData.priority || 'media',
                    source: 'whatsapp',
                    department: reportData.department,
                    whatsapp_number: reportData.whatsapp_number
                });

                return {
                    success: true,
                    reportId: response.data.id || `CAT-2025-${Math.floor(Math.random() * 9000) + 1000}`,
                    data: response.data
                };
            }
        } catch (error) {
            console.error('Error creando reporte:', error.response?.data || error.message);
            throw new Error('No se pudo crear el reporte');
        }
    }

    async getReportStatus(reportId) {
        try {
            const response = await this.client.get(`/api/reports/${reportId}`);
            return {
                success: true,
                report: response.data
            };
        } catch (error) {
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'Reporte no encontrado'
                };
            }
            throw new Error('Error consultando estado del reporte');
        }
    }

    async getUserReports(whatsappNumber) {
        try {
            const response = await this.client.get('/api/reports', {
                params: {
                    whatsapp_number: whatsappNumber,
                    limit: 10,
                    sort: 'created_at:desc'
                }
            });
            
            return {
                success: true,
                reports: response.data
            };
        } catch (error) {
            console.error('Error obteniendo reportes del usuario:', error);
            return {
                success: false,
                reports: []
            };
        }
    }

    async getActiveSurveys() {
        try {
            const response = await this.client.get('/api/surveys');
            return response.data || [];
        } catch (error) {
            console.error('Error obteniendo encuestas:', error);
            return [];
        }
    }

    async getSurveyDetails(surveyId) {
        try {
            const response = await this.client.get(`/api/surveys/${surveyId}`);
            return {
                success: true,
                survey: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: 'Encuesta no encontrada'
            };
        }
    }

    async submitSurveyResponse(surveyId, responses, whatsappNumber) {
        try {
            const response = await this.client.post(`/api/surveys/${surveyId}/responses`, {
                responses: responses,
                respondent_info: {
                    source: 'whatsapp',
                    whatsapp_number: whatsappNumber,
                    timestamp: new Date().toISOString()
                }
            });

            return {
                success: true,
                responseId: response.data.id
            };
        } catch (error) {
            console.error('Error enviando respuesta de encuesta:', error);
            throw new Error('No se pudo enviar la respuesta de la encuesta');
        }
    }

    async getStatistics() {
        try {
            const response = await this.client.get('/api/stats');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }

    async updateReportStatus(reportId, status, notes = '') {
        try {
            const response = await this.client.patch(`/api/reports/${reportId}`, {
                status: status,
                resolution_notes: notes,
                updated_at: new Date().toISOString()
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error actualizando estado del reporte:', error);
            return {
                success: false,
                error: 'No se pudo actualizar el estado'
            };
        }
    }

    async searchReports(query) {
        try {
            const response = await this.client.get('/api/reports/search', {
                params: { q: query }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error buscando reportes:', error);
            return [];
        }
    }

    async getDepartmentReports(department) {
        try {
            const response = await this.client.get('/api/reports', {
                params: {
                    department: department,
                    status: 'pending,in_progress',
                    limit: 50
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error obteniendo reportes del departamento:', error);
            return [];
        }
    }

    async getReportsByCategory(category, limit = 10) {
        try {
            const response = await this.client.get('/api/reports', {
                params: {
                    category: category,
                    limit: limit,
                    sort: 'created_at:desc'
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error obteniendo reportes por categoría:', error);
            return [];
        }
    }

    async getUrgentReports() {
        try {
            const response = await this.client.get('/api/reports', {
                params: {
                    priority: 'urgente,alta',
                    status: 'pending,in_progress',
                    limit: 20
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error obteniendo reportes urgentes:', error);
            return [];
        }
    }

    async notifyDepartment(department, message, reportId) {
        try {
            const response = await this.client.post('/api/notifications', {
                department: department,
                message: message,
                report_id: reportId,
                type: 'urgent',
                source: 'whatsapp_bot'
            });
            return response.data;
        } catch (error) {
            console.error('Error notificando departamento:', error);
            return null;
        }
    }

    async addReportComment(reportId, comment, author = 'WhatsApp Bot') {
        try {
            const response = await this.client.post(`/api/reports/${reportId}/comments`, {
                comment: comment,
                author: author,
                timestamp: new Date().toISOString()
            });
            return response.data;
        } catch (error) {
            console.error('Error agregando comentario:', error);
            return null;
        }
    }

    async getReportHistory(reportId) {
        try {
            const response = await this.client.get(`/api/reports/${reportId}/history`);
            return response.data || [];
        } catch (error) {
            console.error('Error obteniendo historial del reporte:', error);
            return [];
        }
    }

    // Método para verificar conexión con el backend
    async healthCheck() {
        try {
            const response = await this.client.get('/api/health');
            return response.data.status === 'OK';
        } catch (error) {
            console.error('Backend no disponible:', error.message);
            return false;
        }
    }
}

module.exports = BackendAPI;