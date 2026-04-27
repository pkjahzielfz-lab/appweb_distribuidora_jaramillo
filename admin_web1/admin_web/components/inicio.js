// ============================================
// inicio.js - VISTA DE INICIO PARA ADMINISTRADOR
// ============================================

// Template de la vista de inicio
function inicioTemplate() {
    return `
        <div class="inicio-container">
            <div class="sidebar">
                <div class="sidebar-header" style="background: transparent; border-bottom: none; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 15px;">
                    <img src="logotipoJaramillo/logotipooficialdj.png" alt="Distribuidora Jaramillo" style="width: 140px; max-width: 80%; height: auto; margin-bottom: 10px; border-radius: 0; box-shadow: none; background: transparent; display: block; object-fit: contain;">
                    <p style="margin-top: 5px; font-size: 13px;">${currentUser?.nombre || 'Admin'}</p>
                    <small style="font-size: 10px;">${currentUser?.email || ''}</small>
                </div>
                
                <div class="nav-item active" data-view="inicio">
                    <i class="fas fa-home"></i>
                    <span>Inicio</span>
                </div>
                <div class="nav-item" data-view="productos">
                    <i class="fas fa-box"></i>
                    <span>Productos</span>
                </div>
                <div class="nav-item" data-view="pedidos">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Pedidos</span>
                    <span class="badge" id="pedidosPendientesBadge" style="display: none; margin-left: auto;">0</span>
                </div>
                <div class="nav-item" data-view="creditos">
                    <i class="fas fa-credit-card"></i>
                    <span>Créditos</span>
                    <span class="badge" id="solicitudesPendientesBadge" style="display: none; margin-left: auto;">0</span>
                </div>
                <div class="nav-item" data-view="liquidarcredito">
                    <i class="fas fa-hand-holding-usd"></i>
                    <span>Liquidar Créditos</span>
                </div>
                <div class="nav-item" data-view="usuarios">
                    <i class="fas fa-users"></i>
                    <span>Usuarios</span>
                </div>
                
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px;">
                    <div class="nav-item" onclick="cerrarSesion()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Cerrar Sesión</span>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div class="top-bar">
                    <h1 class="page-title" id="pageTitle">Inicio</h1>
                    <div class="user-info">
                        <div class="notifications" id="notificationsIcon">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge" id="notificationBadge">0</span>
                            <div class="notifications-panel" id="notificationsPanel"></div>
                        </div>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                
                <div class="content-area" id="content"></div>
            </div>
        </div>
    `;
}

// Función para cargar datos de la vista de inicio
async function cargarInicio() {
    const content = document.getElementById('content');
    
    try {
        content.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando datos...</p></div>';
        
        console.log('📊 Cargando vista de inicio...');
        
        const hoy = new Date().toISOString().split('T')[0];
        
        // Pedidos pendientes
        const { count: pedidosPendientes } = await supabaseClient
            .from('pedido')
            .select('*', { count: 'exact', head: true })
            .eq('estado_admin', 'pendiente_admin');
        
        // Pedidos aprobados
        const { count: pedidosAprobados } = await supabaseClient
            .from('pedido')
            .select('*', { count: 'exact', head: true })
            .eq('estado_admin', 'aprobado');
        
        // Pedidos entregados
        const { count: pedidosEntregados } = await supabaseClient
            .from('pedido')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'entregado');
        
        // Productos con stock bajo
        const { count: productosStockBajo } = await supabaseClient
            .from('producto')
            .select('*', { count: 'exact', head: true })
            .lt('stock_actual', 10);
        
        // Solicitudes de crédito pendientes
        const { count: solicitudesPendientes } = await supabaseClient
            .from('solicitud_credito')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'pendiente');
        
        // Ventas hoy
        const { data: ventasHoy } = await supabaseClient
            .from('pedido')
            .select('total')
            .gte('fecha_pedido', hoy);
        
        // Pedidos recientes
        const { data: pedidosRecientes } = await supabaseClient
            .from('pedido')
            .select(`
                id_pedido,
                fecha_pedido,
                total,
                estado,
                estado_admin,
                es_credito,
                usuario:id_usuario (nombre, email)
            `)
            .order('fecha_pedido', { ascending: false })
            .limit(5);
        
        const totalVentasHoy = ventasHoy?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
        
        content.innerHTML = inicioContent({
            pedidosPendientes: pedidosPendientes || 0,
            pedidosAprobados: pedidosAprobados || 0,
            pedidosEntregados: pedidosEntregados || 0,
            productosStockBajo: productosStockBajo || 0,
            solicitudesPendientes: solicitudesPendientes || 0,
            totalVentasHoy,
            pedidosRecientes: pedidosRecientes || []
        });
        
        // Actualizar badges
        const badgePedidos = document.getElementById('pedidosPendientesBadge');
        if (badgePedidos) {
            badgePedidos.textContent = pedidosPendientes || 0;
            badgePedidos.style.display = pedidosPendientes > 0 ? 'inline-block' : 'none';
        }
        
        const badgeSolicitudes = document.getElementById('solicitudesPendientesBadge');
        if (badgeSolicitudes) {
            badgeSolicitudes.textContent = solicitudesPendientes || 0;
            badgeSolicitudes.style.display = solicitudesPendientes > 0 ? 'inline-block' : 'none';
        }
        
    } catch (error) {
        console.error('❌ Error al cargar vista de inicio:', error);
        content.innerHTML = '<div style="text-align: center; padding: 50px; color: red;"><i class="fas fa-exclamation-triangle fa-3x"></i><p>Error al cargar datos</p></div>';
    }
}

function inicioContent(stats) {
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Pedidos Pendientes</h3>
                    <span class="stat-number">${stats.pedidosPendientes}</span>
                </div>
                <div class="stat-icon pending">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            
            <div class="stat-card" onclick="cargarVista('productos', { stockBajo: true })" style="cursor: pointer;">
                <div class="stat-info">
                    <h3>Stock Bajo</h3>
                    <span class="stat-number">${stats.productosStockBajo}</span>
                </div>
                <div class="stat-icon pending">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Ventas Hoy</h3>
                    <span class="stat-number">$${stats.totalVentasHoy.toFixed(2)}</span>
                </div>
                <div class="stat-icon approved">
                    <i class="fas fa-dollar-sign"></i>
                </div>
            </div>
        </div>
        
        <div class="table-container" style="margin-top: 20px;">
            <div class="table-header">
                <h3 class="table-title">Pedidos Recientes</h3>
                <button class="btn btn-primary btn-sm" onclick="cargarVista('pedidos')">
                    Ver todos <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Pago</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.pedidosRecientes.map(p => `
                        <tr>
                            <td>#${p.id_pedido}</td>
                            <td>${p.usuario?.nombre || 'N/A'}</td>
                            <td>${new Date(p.fecha_pedido).toLocaleDateString()}</td>
                            <td>$${(p.total || 0).toFixed(2)}</td>
                            <td>
                                <span class="status-badge status-${p.estado}">
                                    ${p.estado_admin === 'pendiente_admin' ? 'Pendiente' : p.estado}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${p.es_credito ? 'status-credito' : 'status-efectivo'}">
                                    ${p.es_credito ? 'Crédito' : 'Efectivo'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                    ${stats.pedidosRecientes.length === 0 ? `
                        <tr>
                            <td colspan="6" style="text-align: center;">No hay pedidos recientes</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}