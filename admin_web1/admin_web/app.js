// ============================================
// app.js - Sistema Admin Unificado (MODIFICADO para login con usuario)
// ============================================

// Configuración de Supabase
const SUPABASE_URL = 'https://nsqmdzggpmkgqxambcdb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YNAruRZW71R3uUkWKHeONQ_dBWQwS4k';

// Crear cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global
let currentUser = null;
let currentView = 'inicio';
let notificaciones = [];
let notificacionesNoLeidas = 0;
let intervalNotificaciones = null;

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicación admin...');
    
    // Verificar sesión existente
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (user) {
        validarRolAdmin(user.id);
    } else {
        console.log('❌ No hay sesión, mostrando login');
        mostrarLogin();
    }
});

// Validar que el usuario autenticado sea Administrador
async function validarRolAdmin(userId) {
    try {
        const { data: usuario, error } = await supabaseClient
            .from('usuario')
            .select('*')
            .eq('id_usuario', userId)
            .single();
        
        if (usuario && usuario.rol === 'admin') {
            currentUser = usuario;
            console.log('✅ Usuario admin:', currentUser.nombre);
            mostrarInicio();
            iniciarEscuchaNotificaciones();
        } else {
            console.warn('❌ Acceso denegado: El usuario no es administrador');
            await supabaseClient.auth.signOut();
            mostrarLogin();
            alert('No tienes permisos de administrador para acceder aquí.');
        }
    } catch (err) {
        console.error('Error al validar rol:', err);
        mostrarLogin();
    }
}

// Función para cerrar sesión
window.cerrarSesion = async function() {
    if (intervalNotificaciones) clearInterval(intervalNotificaciones);
    await supabaseClient.auth.signOut();
    currentUser = null;
    mostrarLogin();
};

// === MODIFICADO: Función para mostrar login (ahora escucha evento personalizado) ===
function mostrarLogin() {
    const app = document.getElementById('app');
    app.innerHTML = loginTemplate();
    
    // Configurar event listener para el login con usuario
    document.addEventListener('loginWithUsername', handleLoginWithUsername);
    
    // También mantener el evento submit por si acaso, pero redirigirlo al manejador de usuario
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Emitir el evento personalizado
            const loginEvent = new CustomEvent('loginWithUsername', {
                detail: { username, password }
            });
            document.dispatchEvent(loginEvent);
        });
    }
}

// === MODIFICADO: Manejador de login con usuario (CORREGIDO: mantiene loader hasta el final) ===
async function handleLoginWithUsername(e) {
    const { username, password } = e.detail;
    
    try {
        console.log('🔍 Buscando usuario:', username);
        
        // Buscar el email asociado al nombre de usuario
        const { data: userData, error: userError } = await supabaseClient
            .from('usuario')
            .select('email, id_usuario, nombre, rol')
            .eq('usuario', username)
            .maybeSingle();
            
        if (userError) {
            console.error('Error en consulta de usuario:', userError);
            throw new Error('Error al buscar usuario');
        }
        
        if (!userData) {
            console.log('❌ Usuario no encontrado:', username);
            throw new Error('Usuario o contraseña incorrectos');
        }
        
        console.log('✅ Usuario encontrado:', userData.email);
        
        // Intentar autenticar con el email encontrado
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: userData.email,
            password: password
        });
        
        if (error) {
            console.error('Error de autenticación:', error);
            throw new Error('Usuario o contraseña incorrectos');
        }
        
        console.log('✅ Autenticación exitosa');
        
        // Validar rol de administrador
        if (userData.rol !== 'admin') {
            console.warn('❌ Acceso denegado: El usuario no es administrador');
            await supabaseClient.auth.signOut();
            mostrarError('No tienes permisos de administrador para acceder aquí.');
            restaurarBotonLogin(); // Restaurar botón en caso de error de permisos
            return;
        }
        
        // Establecer usuario actual
        const { data: usuarioCompleto, error: usuarioError } = await supabaseClient
            .from('usuario')
            .select('*')
            .eq('id_usuario', userData.id_usuario)
            .single();
            
        if (usuarioError) throw usuarioError;
        
        currentUser = usuarioCompleto;
        console.log('✅ Sesión iniciada como:', currentUser.nombre);
        
        // Limpiar el event listener antes de cambiar la vista
        document.removeEventListener('loginWithUsername', handleLoginWithUsername);
        
        // Mostrar vista principal (esto elimina el botón de login del DOM)
        mostrarInicio();
        iniciarEscuchaNotificaciones();
        
        // ✅ NO llamar a restaurarBotonLogin() aquí porque el botón ya no existe
        // El loader se mantiene girando hasta que se carga la nueva vista
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        mostrarError(error.message);
        restaurarBotonLogin(); // Solo restaurar el botón si hay error
    }
}

// === NUEVO: Función para restaurar botón de login ===
function restaurarBotonLogin() {
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        const btnText = btnLogin.querySelector('.btn-text');
        const btnLoader = btnLogin.querySelector('.btn-loader');
        const btnIcon = btnLogin.querySelector('.btn-icon');
        
        if (btnText) btnText.style.display = 'inline-block';
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnIcon) btnIcon.style.display = 'inline-block';
        btnLogin.disabled = false;
    }
}

// === NUEVO: Función para mostrar errores ===
function mostrarError(mensaje) {
    // Usar el sistema de toast existente o crear uno simple
    if (typeof mostrarToast === 'function') {
        mostrarToast(mensaje, 'error');
    } else {
        alert(mensaje);
    }
}

// Función para inyectar la estructura de la vista de inicio
function mostrarInicio() {
    const app = document.getElementById('app');
    app.innerHTML = inicioTemplate();
    cargarVista(currentView);
    actualizarNotificaciones();
    
    // Iniciar polling de notificaciones cada 30 segundos
    intervalNotificaciones = setInterval(actualizarNotificaciones, 30000);
    
    // Configurar manejadores de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            currentView = item.dataset.view;
            cargarVista(currentView);
        });
    });
    
    // Manejo del panel de notificaciones
    const notifIcon = document.getElementById('notificationsIcon');
    if (notifIcon) {
        notifIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('notificationsPanel')?.classList.toggle('show');
        });
    }

    // Cerrar panel al hacer clic fuera
    document.addEventListener('click', () => {
        document.getElementById('notificationsPanel')?.classList.remove('show');
    });
}

// En la función cargarVista, agregar un nuevo case:
async function cargarVista(vista) {
    console.log('📂 Cargando vista:', vista);
    
    // Actualizar título de la página
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = vista === 'creditos' ? 'Solicitudes de Crédito' : 
                               vista === 'liquidarcredito' ? 'Liquidar Créditos' :
                               vista === 'inicio' ? 'Inicio' :
                               vista.charAt(0).toUpperCase() + vista.slice(1);
    }
    
    const content = document.getElementById('content');
    if (content) content.innerHTML = '<div class="loader">Cargando...</div>';
    
    switch(vista) {
        case 'inicio':
            await cargarInicio();
            break;
        case 'productos':
            await cargarProductos();
            break;
        case 'pedidos':
            await cargarPedidos();
            break;
        case 'creditos':
            await cargarCreditos();
            break;
        case 'liquidarcredito':
            await cargarLiquidarCredito();
            break;
        case 'usuarios':
            await cargarUsuarios();
            break;
        default:
            console.error('Vista no encontrada:', vista);
            if (content) content.innerHTML = '<div style="text-align: center; padding: 50px;">Vista no encontrada</div>';
    }
}

// --- LÓGICA DE NOTIFICACIONES ---

async function actualizarNotificaciones() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('notificacion')
            .select('*')
            .eq('id_usuario', currentUser.id_usuario)
            .order('fecha_creacion', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        notificaciones = data || [];
        notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = notificacionesNoLeidas;
            badge.style.display = notificacionesNoLeidas > 0 ? 'block' : 'none';
        }
        
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
            if (notificaciones.length === 0) {
                panel.innerHTML = '<div class="notification-item">No hay notificaciones</div>';
            } else {
                panel.innerHTML = notificaciones.map(n => `
                    <div class="notification-item ${!n.leida ? 'unread' : ''}" onclick="marcarNotificacionLeida('${n.id_notificacion}')">
                        <div class="notification-title">${n.titulo}</div>
                        <div class="notification-message">${n.mensaje}</div>
                        <div class="notification-time">${new Date(n.fecha_creacion).toLocaleString()}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
    }
}

window.marcarNotificacionLeida = async function(id) {
    try {
        await supabaseClient
            .from('notificacion')
            .update({ 
                leida: true,
                fecha_lectura: new Date().toISOString()
            })
            .eq('id_notificacion', id);
        
        actualizarNotificaciones();
    } catch (error) {
        console.error('Error al marcar notificación:', error);
    }
};

function iniciarEscuchaNotificaciones() {
    // Listener existente para notificaciones
    supabaseClient
        .channel('notificaciones_admin')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notificacion',
                filter: `id_usuario=eq.${currentUser.id_usuario}`
            },
            (payload) => {
                mostrarToast(payload.new.titulo, payload.new.mensaje);
                actualizarNotificaciones();
            }
        )
        .subscribe();
    
    // NUEVO: Listener para nuevos pedidos
    supabaseClient
        .channel('pedidos_realtime')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'pedido'
            },
            async (payload) => {
                console.log('🛍️ Nuevo pedido detectado:', payload.new);
                actualizarNotificaciones();
                
                // Obtener información del cliente para el mensaje
                const { data: cliente } = await supabaseClient
                    .from('usuario')
                    .select('nombre')
                    .eq('id_usuario', payload.new.id_usuario)
                    .single();
                
                const mensaje = `Nuevo pedido de ${cliente?.nombre || 'Cliente'} por $${payload.new.total.toFixed(2)}`;
                mostrarToast('Nuevo Pedido', mensaje);
            }
        )
        .subscribe();
    
    // NUEVO: Listener para nuevas solicitudes de crédito
    supabaseClient
        .channel('creditos_realtime')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'solicitud_credito'
            },
            async (payload) => {
                console.log('💳 Nueva solicitud de crédito detectada:', payload.new);
                actualizarNotificaciones();
                
                // Obtener información del cliente para el mensaje
                const { data: cliente } = await supabaseClient
                    .from('usuario')
                    .select('nombre')
                    .eq('id_usuario', payload.new.id_usuario)
                    .single();
                
                const mensaje = `Solicitud de crédito de ${cliente?.nombre || 'Cliente'} por $${payload.new.monto_solicitado.toFixed(2)}`;
                mostrarToast('Solicitud de Crédito', mensaje);
            }
        )
        .subscribe();
}

function mostrarToast(titulo, mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: white; padding: 15px; border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 9999;
        border-left: 4px solid #1e3c72; max-width: 300px;
        animation: slideIn 0.3s;
    `;
    toast.innerHTML = `<strong>${titulo}</strong><br><small>${mensaje}</small>`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// NOTA: Este archivo asume que existen las siguientes funciones en otros archivos:
// - loginTemplate() - en login.js
// - inicioTemplate(), cargarInicio() - en inicio.js
// - cargarPedidos() - en pedidos.js
// - cargarProductos() - en productos.js
// - cargarUsuarios() - en usuarios.js
// - cargarCreditos() - en creditos.js