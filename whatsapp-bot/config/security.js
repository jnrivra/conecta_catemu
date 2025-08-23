// Configuración de seguridad del bot
module.exports = {
    // Modo seguro: cuando está activo, no envía mensajes reales
    SAFE_MODE: process.env.SAFE_MODE === 'true' || true, // Por defecto en modo seguro
    
    // Lista blanca de números permitidos (formato: 569XXXXXXXX)
    WHITELIST: process.env.WHITELIST?.split(',').map(n => n.trim()) || [],
    
    // Números de prueba (solo reciben mensajes en modo desarrollo)
    TEST_NUMBERS: process.env.TEST_NUMBERS?.split(',').map(n => n.trim()) || [],
    
    // Validar si un número está permitido
    isNumberAllowed(number) {
        // Extraer solo el número sin @s.whatsapp.net
        const cleanNumber = number.replace('@s.whatsapp.net', '').replace('@c.us', '');
        
        // En modo seguro, solo permitir números de prueba
        if (this.SAFE_MODE) {
            const allowed = this.TEST_NUMBERS.includes(cleanNumber);
            if (!allowed) {
                console.log(`🔒 MODO SEGURO: Mensaje bloqueado a ${cleanNumber}`);
            }
            return allowed;
        }
        
        // Si hay whitelist configurada, validar contra ella
        if (this.WHITELIST.length > 0) {
            return this.WHITELIST.includes(cleanNumber);
        }
        
        // Si no hay whitelist, permitir todos (usar con precaución)
        return true;
    },
    
    // Validar formato de número chileno
    isValidChileanNumber(number) {
        const cleanNumber = number.replace(/\D/g, '');
        return /^569\d{8}$/.test(cleanNumber);
    },
    
    // Log de seguridad
    logSecurityEvent(event, details) {
        const timestamp = new Date().toISOString();
        console.log(`[SEGURIDAD ${timestamp}] ${event}:`, details);
        
        // Aquí podrías agregar logging a archivo si es necesario
    }
};