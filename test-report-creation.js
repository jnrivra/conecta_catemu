#!/usr/bin/env node

// Script de prueba para crear reportes desde WhatsApp Bot API
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/reports';

async function createTestReport() {
    const testReports = [
        {
            type: 'incidencia',
            category: 'baches',
            description: 'Bache peligroso de 50cm en calle Principal frente al supermercado Unimarc. Varios vehículos han sufrido daños.',
            location: JSON.stringify({ lat: -32.7805, lng: -70.9643, address: 'Calle Principal 123, Centro' }),
            contact_info: JSON.stringify({ 
                name: 'María González', 
                phone: '+56912345678',
                email: 'maria@example.com'
            }),
            source: 'whatsapp',
            priority: 'alta',
            department: 'Obras',
            whatsapp_number: '+56912345678'
        },
        {
            type: 'incidencia',
            category: 'alumbrado',
            description: 'Luminarias apagadas en toda la cuadra de Avenida San Martín entre calles 1 y 2. Zona muy oscura y peligrosa.',
            location: JSON.stringify({ lat: -32.7812, lng: -70.9650, address: 'Av. San Martín, Cerrillos' }),
            contact_info: JSON.stringify({ 
                name: 'Pedro Silva', 
                phone: '+56987654321'
            }),
            source: 'whatsapp',
            priority: 'alta',
            department: 'Obras',
            whatsapp_number: '+56987654321'
        },
        {
            type: 'incidencia',
            category: 'basura',
            description: 'Acumulación de basura en esquina de Plaza de Armas. Lleva más de una semana sin ser recolectada.',
            location: JSON.stringify({ lat: -32.7798, lng: -70.9640, address: 'Plaza de Armas, Centro' }),
            contact_info: JSON.stringify({ 
                name: 'Ana Martínez', 
                phone: '+56911223344'
            }),
            source: 'whatsapp',
            priority: 'media',
            department: 'Aseo y Ornato',
            whatsapp_number: '+56911223344'
        }
    ];

    console.log('🚀 Creando reportes de prueba...\n');

    for (const report of testReports) {
        try {
            const response = await axios.post(API_URL, report);
            console.log(`✅ Reporte creado:`, {
                id: response.data.report_id,
                categoria: report.category,
                prioridad: report.priority,
                descripcion: report.description.substring(0, 50) + '...'
            });
        } catch (error) {
            console.error(`❌ Error creando reporte:`, error.response?.data || error.message);
        }
    }

    // Verificar estadísticas
    try {
        const stats = await axios.get('http://localhost:3001/api/stats');
        console.log('\n📊 Estadísticas actualizadas:');
        console.log(`   Total reportes: ${stats.data.totalReports}`);
        console.log(`   Pendientes: ${stats.data.pendingReports}`);
        console.log(`   Por categoría:`, stats.data.reportsByCategory);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
    }
}

// Ejecutar
createTestReport()
    .then(() => {
        console.log('\n✅ Prueba completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error en prueba:', error);
        process.exit(1);
    });