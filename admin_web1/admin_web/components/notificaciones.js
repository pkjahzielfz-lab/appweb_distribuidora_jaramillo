// ============================================
// notificaciones.js - Sistema de notificaciones
// ============================================

// Las funciones principales están en app.js
// Este archivo es principalmente para mantener la estructura

async function actualizarNotificaciones() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('notificacion')
            .select('*')
            .eq('id_usuario', currentUser.id_usuario)
            .order('fecha_creacion', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        notificaciones = data || [];
        notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = notificacionesNoLeidas;
            badge.style.display = notificacionesNoLeidas > 0 ? 'block' : 'none';
        }
        
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
    }
}

function iniciarEscuchaNotificaciones() {
    // Esta función ahora está en app.js como iniciarEscuchaNotificacionesRealtime
    console.log('🔔 Sistema de notificaciones iniciado');
}

// Exportar funciones para compatibilidad
window.actualizarNotificaciones = actualizarNotificaciones;
window.iniciarEscuchaNotificaciones = iniciarEscuchaNotificaciones;aq