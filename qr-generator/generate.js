const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = './qr-codes';

// QR Codes to generate
const qrCodes = [
  {
    name: 'home',
    url: BASE_URL,
    description: 'Página principal de CatemuConecta'
  },
  {
    name: 'survey-1',
    url: `${BASE_URL}/survey/1`,
    description: 'Encuesta de Satisfacción Municipal'
  },
  {
    name: 'report-problem',
    url: `${BASE_URL}/report`,
    description: 'Reportar un problema'
  },
  {
    name: 'plaza-principal',
    url: `${BASE_URL}/report?location=plaza`,
    description: 'Reportar problema en Plaza Principal'
  },
  {
    name: 'cesfam',
    url: `${BASE_URL}/report?location=cesfam`,
    description: 'Reportar problema en CESFAM'
  },
  {
    name: 'municipalidad',
    url: `${BASE_URL}/report?location=municipalidad`,
    description: 'Reportar problema en Municipalidad'
  }
];

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate QR codes
async function generateQRCodes() {
  console.log('🚀 Generando códigos QR para CatemuConecta...\n');

  for (const qr of qrCodes) {
    try {
      // Generate QR code as PNG
      const outputPath = path.join(OUTPUT_DIR, `${qr.name}.png`);
      
      await QRCode.toFile(outputPath, qr.url, {
        width: 500,
        margin: 2,
        color: {
          dark: '#1E40AF',  // Catemu blue
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      console.log(`✅ Generado: ${qr.name}.png`);
      console.log(`   URL: ${qr.url}`);
      console.log(`   Descripción: ${qr.description}\n`);

      // Generate printable HTML version
      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - ${qr.description}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: white;
    }
    .qr-container {
      text-align: center;
      padding: 40px;
      border: 2px solid #1E40AF;
      border-radius: 20px;
      background: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #1E40AF;
      margin-bottom: 20px;
    }
    .qr-code {
      width: 300px;
      height: 300px;
      margin: 20px auto;
    }
    .description {
      font-size: 24px;
      color: #333;
      margin: 20px 0;
      font-weight: 600;
    }
    .instructions {
      font-size: 16px;
      color: #666;
      margin: 20px 0;
      line-height: 1.5;
    }
    .url {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      font-family: monospace;
    }
    @media print {
      body {
        padding: 0;
      }
      .qr-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="qr-container">
    <div class="logo">🏛️ CatemuConecta</div>
    <img src="${qr.name}.png" alt="QR Code" class="qr-code">
    <div class="description">${qr.description}</div>
    <div class="instructions">
      Escanea este código QR con tu celular<br>
      para acceder directamente
    </div>
    <div class="url">${qr.url}</div>
  </div>
</body>
</html>
`;

      const htmlPath = path.join(OUTPUT_DIR, `${qr.name}.html`);
      fs.writeFileSync(htmlPath, html);

    } catch (error) {
      console.error(`❌ Error generando ${qr.name}:`, error);
    }
  }

  // Generate index HTML with all QR codes
  const indexHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CatemuConecta - Todos los QR Codes</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f5f5f5;
    }
    h1 {
      color: #1E40AF;
      text-align: center;
      margin-bottom: 40px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .qr-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .qr-card img {
      width: 200px;
      height: 200px;
      margin: 10px 0;
    }
    .qr-title {
      font-weight: bold;
      color: #333;
      margin: 10px 0;
    }
    .qr-desc {
      color: #666;
      font-size: 14px;
    }
    .qr-link {
      display: inline-block;
      margin-top: 10px;
      padding: 8px 16px;
      background: #1E40AF;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-size: 12px;
    }
    .qr-link:hover {
      background: #1e3a8a;
    }
  </style>
</head>
<body>
  <h1>🏛️ CatemuConecta - Códigos QR</h1>
  <div class="grid">
    ${qrCodes.map(qr => `
    <div class="qr-card">
      <div class="qr-title">${qr.description}</div>
      <img src="${qr.name}.png" alt="${qr.description}">
      <div class="qr-desc">${qr.url}</div>
      <a href="${qr.name}.html" class="qr-link">Ver versión imprimible</a>
    </div>
    `).join('')}
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  
  console.log('📋 Generado índice HTML: qr-codes/index.html');
  console.log('\n✨ ¡Todos los códigos QR han sido generados exitosamente!');
  console.log(`📁 Ubicación: ${path.resolve(OUTPUT_DIR)}`);
  console.log('\nPuedes abrir index.html en tu navegador para ver todos los QR codes.');
}

// Run generator
generateQRCodes().catch(console.error);