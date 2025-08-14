const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
    console.log('🚀 Iniciando generación del PDF...');
    
    try {
        // Lanzar navegador
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Cargar el archivo HTML
        const htmlPath = path.join(__dirname, 'presentacion-flujo-usuario.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Navegar al contenido HTML
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        // Configurar el viewport para mejor renderizado
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2
        });
        
        // Esperar un momento para que todo se cargue
        await page.waitForTimeout(2000);
        
        // Generar el PDF
        const pdfPath = path.join(__dirname, 'CatemuConecta-Flujo-Usuario.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            scale: 0.8
        });
        
        await browser.close();
        
        console.log('✅ PDF generado exitosamente!');
        console.log(`📄 Archivo: ${pdfPath}`);
        console.log(`📊 Tamaño: ${(fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2)} MB`);
        
        // También generar una versión vertical para mejor lectura en dispositivos
        console.log('\n🚀 Generando versión vertical del PDF...');
        
        const browserVertical = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const pageVertical = await browserVertical.newPage();
        await pageVertical.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        await pageVertical.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
        });
        
        await pageVertical.waitForTimeout(2000);
        
        const pdfVerticalPath = path.join(__dirname, 'CatemuConecta-Flujo-Usuario-Vertical.pdf');
        await pageVertical.pdf({
            path: pdfVerticalPath,
            format: 'A4',
            landscape: false,
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            scale: 0.75
        });
        
        await browserVertical.close();
        
        console.log('✅ PDF vertical generado exitosamente!');
        console.log(`📄 Archivo: ${pdfVerticalPath}`);
        console.log(`📊 Tamaño: ${(fs.statSync(pdfVerticalPath).size / 1024 / 1024).toFixed(2)} MB`);
        
        console.log('\n🎉 ¡Proceso completado! Se han generado:');
        console.log('   1. CatemuConecta-Flujo-Usuario.pdf (horizontal - ideal para proyector)');
        console.log('   2. CatemuConecta-Flujo-Usuario-Vertical.pdf (vertical - ideal para lectura)');
        console.log('   3. presentacion-flujo-usuario.html (versión web interactiva)');
        
    } catch (error) {
        console.error('❌ Error generando el PDF:', error);
        process.exit(1);
    }
}

// Ejecutar la función
generatePDF();