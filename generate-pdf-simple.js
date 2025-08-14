const fs = require('fs');
const path = require('path');

console.log('📋 Preparando archivos de presentación...\n');

// Verificar que el archivo HTML existe
const htmlPath = path.join(__dirname, 'presentacion-flujo-usuario.html');
if (fs.existsSync(htmlPath)) {
    const stats = fs.statSync(htmlPath);
    console.log('✅ Archivo HTML creado exitosamente:');
    console.log(`   📄 Archivo: ${htmlPath}`);
    console.log(`   📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('\n');
} else {
    console.error('❌ Error: No se encontró el archivo HTML');
    process.exit(1);
}

// Crear un script de impresión para el navegador
const printScript = `
<!DOCTYPE html>
<html>
<head>
    <title>Instrucciones para generar PDF</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #667eea;
        }
        .step {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .step h3 {
            margin-top: 0;
            color: #333;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px 0;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        code {
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .options {
            background: #e0f2fe;
            border: 1px solid #0284c7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <h1>🎨 CatemuConecta - Presentación de Flujo de Usuario</h1>
    
    <p>Se ha generado exitosamente la presentación del flujo de usuario de CatemuConecta.</p>
    
    <div class="step">
        <h3>📋 Archivos Disponibles:</h3>
        <ul>
            <li><strong>presentacion-flujo-usuario.html</strong> - Presentación interactiva (abrir en navegador)</li>
        </ul>
    </div>
    
    <div class="step">
        <h3>🖨️ Para generar el PDF:</h3>
        <ol>
            <li>Abre el archivo <code>presentacion-flujo-usuario.html</code> en tu navegador</li>
            <li>Presiona <code>Cmd+P</code> (Mac) o <code>Ctrl+P</code> (Windows/Linux)</li>
            <li>En las opciones de impresión, selecciona:
                <div class="options">
                    <p><strong>Destino:</strong> Guardar como PDF</p>
                    <p><strong>Tamaño de papel:</strong> Letter (8.5" x 11")</p>
                    <p><strong>Diseño:</strong> Horizontal (para presentación) o Vertical (para lectura)</p>
                    <p><strong>Márgenes:</strong> Mínimos o Sin márgenes</p>
                    <p><strong>Gráficos de fondo:</strong> ✓ Activado</p>
                </div>
            </li>
            <li>Haz clic en "Guardar" y elige el nombre del archivo</li>
        </ol>
    </div>
    
    <div class="step">
        <h3>💡 Recomendaciones:</h3>
        <ul>
            <li>Para presentaciones en proyector: usa orientación <strong>horizontal</strong></li>
            <li>Para documentos de lectura: usa orientación <strong>vertical</strong></li>
            <li>Chrome o Edge generan los mejores PDFs</li>
            <li>El archivo HTML también se puede compartir directamente para visualización interactiva</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
        <a href="presentacion-flujo-usuario.html" class="button" target="_blank">
            Abrir Presentación →
        </a>
    </div>
    
    <div style="text-align: center; margin-top: 60px; color: #666;">
        <p>CatemuConecta - Hackaton "Municipios a la VanguardIA"</p>
        <p>Municipalidad de Catemu • Agosto 2025</p>
    </div>
</body>
</html>
`;

const instructionsPath = path.join(__dirname, 'instrucciones-pdf.html');
fs.writeFileSync(instructionsPath, printScript);

console.log('📝 Archivo de instrucciones creado:');
console.log(`   📄 Archivo: ${instructionsPath}`);
console.log('\n');

console.log('🎉 ¡Presentación lista!\n');
console.log('Para visualizar y generar PDF:');
console.log('1. Abre el archivo "presentacion-flujo-usuario.html" en tu navegador');
console.log('2. Para PDF: Presiona Cmd+P (Mac) o Ctrl+P (Windows) y selecciona "Guardar como PDF"');
console.log('\n');
console.log('También puedes abrir "instrucciones-pdf.html" para ver instrucciones detalladas.');
console.log('\n');

// Intentar abrir el archivo en el navegador
const { exec } = require('child_process');
const platform = process.platform;

if (platform === 'darwin') {
    exec(`open ${htmlPath}`, (error) => {
        if (!error) {
            console.log('✅ Abriendo presentación en el navegador...');
        }
    });
} else if (platform === 'win32') {
    exec(`start ${htmlPath}`, (error) => {
        if (!error) {
            console.log('✅ Abriendo presentación en el navegador...');
        }
    });
} else {
    exec(`xdg-open ${htmlPath}`, (error) => {
        if (!error) {
            console.log('✅ Abriendo presentación en el navegador...');
        }
    });
}