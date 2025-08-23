#!/usr/bin/env node

/**
 * Script para crear un reporte de prueba
 */

const axios = require('axios');

async function crearReporte() {
    const reporte = {
        type: 'infrastructure',
        category: 'Alumbrado Público',
        description: 'Luz quemada en calle Patitos 1231',
        priority: 'high',
        location: JSON.stringify({
            address: 'Calle Patitos 1231',
            lat: -32.7805,
            lng: -70.9643
        }),
        contact_info: JSON.stringify({
            name: 'Juan Test',
            phone: '56977965404'
        }),
        source: 'whatsapp',
        whatsapp_number: '56977965404'
    };

    try {
        const response = await axios.post('http://localhost:3001/api/reports', reporte);
        console.log('✅ Reporte creado exitosamente:');
        console.log('ID:', response.data.id);
        console.log('Categoría:', response.data.category);
        console.log('Descripción:', response.data.description);
        console.log('Estado:', response.data.status);
    } catch (error) {
        console.error('❌ Error creando reporte:', error.response?.data || error.message);
    }
}

crearReporte();