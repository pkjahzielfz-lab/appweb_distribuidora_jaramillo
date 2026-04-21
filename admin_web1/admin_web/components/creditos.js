// ============================================
// creditos.js - Gestión de créditos (CORREGIDO)
// ============================================

// Estilos para mensajes elegantes (insertados directamente)
const estilosMensajes = `
<style>
/* Mensajes flotantes elegantes */
.mensaje-flotante {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.05);
    z-index: 9999;
    overflow: hidden;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    border-left: 4px solid;
}

.mensaje-flotante.mostrar {
    transform: translateX(0);
}

.mensaje-contenido {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 12px;
}

.mensaje-icono {
    font-size: 24px;
    line-height: 1;
}

.mensaje-texto {
    flex: 1;
}

.mensaje-texto strong {
    display: block;
    color: #1e293b;
    font-size: 15px;
    margin-bottom: 4px;
}

.mensaje-texto p {
    color: #64748b;
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
}

.mensaje-progreso {
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5));
    animation: progreso 3s linear;
}

@keyframes progreso {
    from { width: 100%; }
    to { width: 0%; }
}

.mensaje-exito {
    border-left-color: #10b981;
    background: linear-gradient(to right, #f0fdf4, white);
}

.mensaje-exito .mensaje-icono {
    color: #10b981;
}

.mensaje-error {
    border-left-color: #ef4444;
    background: linear-gradient(to right, #fef2f2, white);
}

.mensaje-error .mensaje-icono {
    color: #ef4444;
}

.mensaje-info {
    border-left-color: #3b82f6;
    background: linear-gradient(to right, #eff6ff, white);
}

.mensaje-info .mensaje-icono {
    color: #3b82f6;
}

.mensaje-advertencia {
    border-left-color: #f59e0b;
    background: linear-gradient(to right, #fffbeb, white);
}

.mensaje-advertencia .mensaje-icono {
    color: #f59e0b;
}

/* Confirmación modal elegante */
.confirmacion-modal .modal-content {
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateY(-30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Tarjetas de estadísticas */
.credit-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.credit-summary > div {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    text-align: center;
}

.credit-summary h4 {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 10px;
}

.credit-summary .amount {
    font-size: 28px;
    font-weight: bold;
    color: #1e293b;
}
</style>
`;

// Insertar estilos al cargar el script
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', estilosMensajes);
}

// Función para mostrar mensajes elegantes
function mostrarMensaje(titulo, mensaje, tipo = 'exito') {
    const mensajeAnterior = document.querySelector('.mensaje-flotante');
    if (mensajeAnterior) mensajeAnterior.remove();
    
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje-flotante mensaje-${tipo}`;
    
    const iconos = {
        'exito': '<i class="fas fa-check-circle"></i>',
        'error': '<i class="fas fa-exclamation-circle"></i>',
        'info': '<i class="fas fa-info-circle"></i>',
        'advertencia': '<i class="fas fa-exclamation-triangle"></i>'
    };
    
    mensajeDiv.innerHTML = `
        <div class="mensaje-contenido">
            <div class="mensaje-icono">${iconos[tipo] || iconos.info}</div>
            <div class="mensaje-texto">
                <strong>${titulo}</strong>
                <p>${mensaje}</p>
            </div>
        </div>
        <div class="mensaje-progreso"></div>
    `;
    
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => mensajeDiv.classList.add('mostrar'), 10);
    
    setTimeout(() => {
        mensajeDiv.classList.remove('mostrar');
        setTimeout(() => mensajeDiv.remove(), 300);
    }, 3000);
}

// Función para mostrar diálogo de confirmación elegante - CORREGIDA
function mostrarConfirmacion(titulo, mensaje, onConfirmar, onCancelar) {
    // Crear un ID único para este modal
    const modalId = 'modalConfirmacion_' + Date.now();
    
    const confirmacionDiv = document.createElement('div');
    confirmacionDiv.className = 'modal confirmacion-modal show';
    confirmacionDiv.id = modalId;
    confirmacionDiv.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-question-circle" style="color: #f59e0b;"></i>
                    ${titulo}
                </h3>
                <span class="modal-close" onclick="document.getElementById('${modalId}').remove()">&times;</span>
            </div>
            <div class="modal-body" style="padding: 24px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 16px;"></i>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">${mensaje}</p>
            </div>
            <div class="modal-footer" style="justify-content: center; gap: 12px;">
                <button class="btn btn-secondary" id="cancelBtn_${modalId}">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn btn-danger" id="confirmBtn_${modalId}">
                    <i class="fas fa-check"></i> Confirmar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmacionDiv);
    
    // Agregar event listeners en lugar de onclick inline
    document.getElementById(`cancelBtn_${modalId}`).addEventListener('click', function() {
        confirmacionDiv.remove();
        if (onCancelar && typeof onCancelar === 'function') {
            onCancelar();
        }
    });
    
    document.getElementById(`confirmBtn_${modalId}`).addEventListener('click', function() {
        confirmacionDiv.remove();
        if (onConfirmar && typeof onConfirmar === 'function') {
            onConfirmar();
        }
    });
}

// Función para calcular días de plazo según el monto
function calcularDiasPlazoPorMonto(monto) {
    if (monto <= 10000) {
        return 20; // Hasta $10,000 -> 20 días
    } else if (monto <= 100000) {
        return 30; // $10,001 - $100,000 -> 30 días
    } else {
        return 60; // Más de $100,000 -> 60 días
    }
}

// FUNCIÓN ELIMINAR CRÉDITO - CORREGIDA (días de plazo también se ponen en cero)
async function eliminarCreditoCliente(idUsuario, nombreCliente) {
    const nombreEscapado = nombreCliente.replace(/'/g, "\\'");
    
    mostrarConfirmacion(
        'Eliminar Crédito',
        '¿Estás seguro de eliminar el crédito de <strong>' + nombreEscapado + '</strong>?<br><br>' +
        'Esto pondrá todos sus datos de crédito en cero:<br>' +
        '• Límite: $0.00<br>' +
        '• Saldo: $0.00<br>' +
        '• Días de plazo: 0<br>' +
        '• Crédito desautorizado<br><br>' +
        'El cliente podrá solicitar crédito nuevamente.',
        async function() {
            try {
                // Verificar que supabaseClient existe
                if (typeof supabaseClient === 'undefined') {
                    throw new Error('supabaseClient no está definido');
                }
                
                // Poner todos los datos de crédito en cero (incluyendo días de plazo)
                const { error } = await supabaseClient
                    .from('usuario')
                    .update({
                        'credito_autorizado': false,
                        'credito_limite': 0,
                        'credito_saldo': 0,
                        'credito_dias_plazo': 0,
                        'credito_autorizado_por': null,
                        'credito_fecha_autorizacion': null
                    })
                    .eq('id_usuario', idUsuario);
                
                if (error) throw error;
                
                mostrarMensaje(
                    'Crédito eliminado',
                    'El crédito de ' + nombreEscapado + ' ha sido eliminado correctamente.<br>' +
                    '• Límite: $0.00<br>' +
                    '• Saldo: $0.00<br>' +
                    '• Días de plazo: 0',
                    'exito'
                );
                
                // Recargar la lista
                if (typeof cargarCreditos === 'function') {
                    cargarCreditos();
                }
                
            } catch (error) {
                console.error('Error al eliminar crédito:', error);
                mostrarMensaje(
                    'Error al eliminar',
                    'Ocurrió un error al eliminar el crédito: ' + error.message,
                    'error'
                );
            }
        }
    );
}

async function cargarCreditos() {
    const content = document.getElementById('content');
    if (!content) return;
    
    try {
        content.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
                <div style="text-align: center;">
                    <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: var(--gray);">Cargando solicitudes de crédito...</p>
                </div>
            </div>
        `;
        
        if (typeof supabaseClient === 'undefined') {
            throw new Error('supabaseClient no está definido');
        }
        
        const { data: solicitudes, error } = await supabaseClient
            .from('solicitud_credito')
            .select(`
                *,
                usuario:id_usuario (nombre, email, credito_limite, credito_saldo, credito_autorizado)
            `)
            .order('fecha_solicitud', { ascending: false });
        
        if (error) throw error;
        
        const { data: clientesCredito, error: errorClientes } = await supabaseClient
            .from('usuario')
            .select('id_usuario, nombre, email, credito_autorizado, credito_limite, credito_saldo, credito_dias_plazo')
            .eq('rol', 'cliente')
            .order('nombre');
        
        if (errorClientes) throw errorClientes;
        
        const pendientes = solicitudes?.filter(s => s.estado === 'pendiente') || [];
        const aprobadas = solicitudes?.filter(s => s.estado === 'aprobada') || [];
        const rechazadas = solicitudes?.filter(s => s.estado === 'rechazada') || [];
        
        // MODIFICADO: Ahora son 4 tarjetas: Total, Pendientes, Aprobadas, Rechazadas
        content.innerHTML = `
            <div class="credit-summary">
                <div>
                    <h4>Total Solicitudes</h4>
                    <span class="amount">${solicitudes?.length || 0}</span>
                </div>
                <div>
                    <h4>Pendientes</h4>
                    <span class="amount" style="color: #fbbf24;">${pendientes.length}</span>
                </div>
                <div>
                    <h4>Aprobadas</h4>
                    <span class="amount" style="color: #10b981;">${aprobadas.length}</span>
                </div>
                <div>
                    <h4>Rechazadas</h4>
                    <span class="amount" style="color: #ef4444;">${rechazadas.length}</span>
                </div>
            </div>
        `;
        
        if (pendientes.length > 0) {
            content.innerHTML += `
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">
                            <i class="fas fa-clock" style="color: var(--warning); margin-right: 8px;"></i>
                            Solicitudes Pendientes
                        </h3>
                        <div style="font-size: 13px; color: var(--gray);">
                            <i class="fas fa-info-circle"></i> Los plazos se asignan automáticamente según el monto
                        </div>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Email</th>
                                <th>Monto</th>
                                <th>Plazo sugerido</th>
                                <th>Motivo</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendientes.map(s => {
                                const diasSugeridos = calcularDiasPlazoPorMonto(s.monto_solicitado || 0);
                                const nombre = s.usuario?.nombre || 'N/A';
                                return `
                                    <tr>
                                        <td><strong>${nombre.replace(/'/g, "\\'")}</strong></td>
                                        <td>${s.usuario?.email || 'N/A'}</td>
                                        <td><span style="font-weight: 600; color: var(--primary);">$${(s.monto_solicitado || 0).toFixed(2)}</span></td>
                                        <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${diasSugeridos} días</span></td>
                                        <td>${s.motivo || '-'}</td>
                                        <td>${new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                                        <td>
                                            <button class="btn btn-sm btn-success" onclick="mostrarModalAprobarCredito('${s.id_solicitud}', '${nombre.replace(/'/g, "\\'")}', ${s.monto_solicitado || 0})">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="rechazarSolicitudCredito('${s.id_solicitud}')">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        if (aprobadas.length > 0 || rechazadas.length > 0) {
            content.innerHTML += `
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">
                            <i class="fas fa-history" style="color: var(--gray); margin-right: 8px;"></i>
                            Historial de Solicitudes
                        </h3>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Monto</th>
                                <th>Motivo</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${[...aprobadas, ...rechazadas].map(s => {
                                const nombre = s.usuario?.nombre || 'N/A';
                                return `
                                    <tr>
                                        <td>${nombre}</td>
                                        <td>$${(s.monto_solicitado || 0).toFixed(2)}</td>
                                        <td>${s.motivo || '-'}</td>
                                        <td>${new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                                        <td>
                                            <span class="status-badge status-${s.estado}">
                                                ${s.estado === 'aprobada' ? '✓ Aprobada' : '✗ Rechazada'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // MODIFICADO: Los días de plazo ahora muestran 0 cuando no hay crédito
        // CORRECCIÓN: Se agregó table-layout: fixed y anchos específicos para mantener los botones alineados
        content.innerHTML += `
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">
                        <i class="fas fa-users" style="color: var(--secondary); margin-right: 8px;"></i>
                        Clientes
                    </h3>
                </div>
                ${clientesCredito.length > 0 ? `
                    <table class="data-table" style="table-layout: fixed; width: 100%;">
                        <colgroup>
                            <col style="width: 15%;">
                            <col style="width: 20%;">
                            <col style="width: 10%;">
                            <col style="width: 10%;">
                            <col style="width: 10%;">
                            <col style="width: 8%;">
                            <col style="width: 15%;">
                            <col style="width: 12%;">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Email</th>
                                <th>Límite</th>
                                <th>Saldo Actual</th>
                                <th>Disponible</th>
                                <th>Plazo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientesCredito.map(c => {
                                const disponible = (c.credito_limite || 0) - (c.credito_saldo || 0);
                                const tieneCredito = c.credito_autorizado === true && (c.credito_limite || 0) > 0;
                                // CORRECCIÓN: Si no tiene crédito, mostrar 0 días
                                const diasPlazoMostrar = tieneCredito ? (c.credito_dias_plazo || 0) : 0;
                                return `
                                    <tr>
                                        <td style="word-wrap: break-word;"><strong>${c.nombre || 'N/A'}</strong></td>
                                        <td style="word-wrap: break-word;">${c.email || 'N/A'}</td>
                                        <td><span style="color: var(--primary); font-weight: 600;">$${(c.credito_limite || 0).toFixed(2)}</span></td>
                                        <td>$${(c.credito_saldo || 0).toFixed(2)}</td>
                                        <td>
                                            <span style="color: ${disponible > 0 ? 'var(--secondary)' : 'var(--danger)'}; font-weight: 600;">
                                                $${disponible.toFixed(2)}
                                            </span>
                                        </td>
                                        <td>${diasPlazoMostrar} días</td>
                                        <td>
                                            ${tieneCredito ? 
                                                '<span class="badge" style="background: #d1fae5; color: #065f46;">✓ Crédito Activo</span>' : 
                                                '<span class="badge" style="background: #fee2e2; color: #991b1b;">✗ Sin Crédito</span>'
                                            }
                                        </td>
                                        <td style="white-space: nowrap;">
                                            <button class="btn btn-sm btn-warning" onclick="mostrarModalEditarCredito('${c.id_usuario}', '${(c.nombre || '').replace(/'/g, "\\'")}', ${c.credito_limite || 0}, ${diasPlazoMostrar})" style="margin-right: 5px;">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="eliminarCreditoCliente('${c.id_usuario}', '${(c.nombre || '').replace(/'/g, "\\'")}')">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 8px;">
                        <i class="fas fa-users" style="font-size: 48px; color: var(--gray-light); margin-bottom: 16px;"></i>
                        <p style="color: var(--gray);">No hay clientes registrados</p>
                    </div>
                `}
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar créditos:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger); margin-bottom: 16px;"></i>
                <h3 style="color: var(--danger); margin-bottom: 8px;">Error al cargar datos</h3>
                <p style="color: var(--gray);">${error.message}</p>
            </div>
        `;
    }
}

// Función para actualizar días de plazo según el límite ingresado en APROBAR
function actualizarDiasPlazoDesdeLimite() {
    const limiteInput = document.getElementById('limiteCredito');
    const diasInput = document.getElementById('diasPlazo');
    const mensajePlazo = document.getElementById('mensajePlazoSugerido');
    
    if (limiteInput && diasInput && mensajePlazo) {
        const monto = parseFloat(limiteInput.value) || 0;
        const diasSugeridos = calcularDiasPlazoPorMonto(monto);
        diasInput.value = diasSugeridos;
        mensajePlazo.innerHTML = `
            <i class="fas fa-clock"></i> 
            Plazo sugerido según monto: ${diasSugeridos} días
        `;
    }
}

// Función para actualizar días de plazo según el límite ingresado en EDITAR
function actualizarDiasPlazoDesdeLimiteEditar() {
    const limiteInput = document.getElementById('editarLimite');
    const diasInput = document.getElementById('editarDias');
    const mensajePlazo = document.getElementById('mensajePlazoEditar');
    
    if (limiteInput && diasInput && mensajePlazo) {
        const monto = parseFloat(limiteInput.value) || 0;
        const diasSugeridos = calcularDiasPlazoPorMonto(monto);
        diasInput.value = diasSugeridos;
        mensajePlazo.innerHTML = `
            <i class="fas fa-clock"></i> 
            Los días de plazo se calculan automáticamente según el monto: ${diasSugeridos} días
        `;
    }
}

function mostrarModalAprobarCredito(idSolicitud, nombreCliente, montoSolicitado) {
    const diasSugeridos = calcularDiasPlazoPorMonto(montoSolicitado);
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'modalAprobarCredito';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Aprobar Crédito</h3>
                <span class="modal-close" onclick="document.getElementById('modalAprobarCredito').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: var(--primary); font-weight: 500;">Cliente: ${nombreCliente}</p>
                    <p style="color: var(--primary); font-size: 14px; margin-top: 8px;">
                        <i class="fas fa-info-circle"></i> 
                        Monto solicitado: <strong>$${montoSolicitado.toFixed(2)}</strong>
                    </p>
                </div>
                <form id="formAprobarCredito">
                    <div class="form-group">
                        <label>Límite de Crédito ($)</label>
                        <input type="number" id="limiteCredito" min="0" step="100" value="${montoSolicitado}" required oninput="actualizarDiasPlazoDesdeLimite()">
                    </div>
                    <div class="form-group">
                        <label>Días de Plazo</label>
                        <input type="number" id="diasPlazo" min="1" max="90" value="${diasSugeridos}" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                        <small style="color: var(--gray); display: block; margin-top: 5px;" id="mensajePlazoSugerido">
                            <i class="fas fa-clock"></i> 
                            Plazo sugerido según monto: ${diasSugeridos} días
                        </small>
                    </div>
                    <div class="form-group">
                        <label>Comentarios (opcional)</label>
                        <textarea id="comentariosCredito" rows="3" placeholder="Agregar notas sobre la aprobación..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('modalAprobarCredito').remove()">
                    Cancelar
                </button>
                <button class="btn btn-success" onclick="aprobarSolicitudCredito('${idSolicitud}')">
                    <i class="fas fa-check"></i> Aprobar Crédito
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function mostrarModalEditarCredito(idUsuario, nombreCliente, limiteActual, diasActual) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'modalEditarCredito';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Crédito</h3>
                <span class="modal-close" onclick="document.getElementById('modalEditarCredito').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: var(--primary); font-weight: 500;">Cliente: ${nombreCliente}</p>
                </div>
                <form id="formEditarCredito">
                    <div class="form-group">
                        <label>Límite de Crédito ($)</label>
                        <input type="number" id="editarLimite" min="0" step="100" value="${limiteActual}" required oninput="actualizarDiasPlazoDesdeLimiteEditar()">
                    </div>
                    <div class="form-group">
                        <label>Días de Plazo</label>
                        <input type="number" id="editarDias" min="1" max="90" value="${diasActual}" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                        <small style="color: var(--gray); display: block; margin-top: 5px;" id="mensajePlazoEditar">
                            <i class="fas fa-clock"></i> 
                            Los días de plazo se calculan automáticamente según el monto
                        </small>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select id="editarEstado" class="form-control">
                            <option value="true" ${limiteActual > 0 ? 'selected' : ''}>✓ Autorizado</option>
                            <option value="false" ${limiteActual === 0 ? 'selected' : ''}>✗ No Autorizado</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('modalEditarCredito').remove()">
                    Cancelar
                </button>
                <button class="btn btn-success" onclick="actualizarCreditoCliente('${idUsuario}')">
                    <i class="fas fa-save"></i> Guardar Cambios
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function aprobarSolicitudCredito(idSolicitud) {
    try {
        const limite = document.getElementById('limiteCredito').value;
        const dias = document.getElementById('diasPlazo').value;
        
        const { data: solicitud, error: errorSolicitud } = await supabaseClient
            .from('solicitud_credito')
            .select('id_usuario, monto_solicitado')
            .eq('id_solicitud', idSolicitud)
            .single();
        
        if (errorSolicitud) throw errorSolicitud;
        
        const { data: usuarioData, error: errorUsuario } = await supabaseClient
            .from('usuario')
            .select('nombre')
            .eq('id_usuario', solicitud.id_usuario)
            .single();
        
        if (errorUsuario) throw errorUsuario;
        
        const { error: errorUpdateUsuario } = await supabaseClient
            .from('usuario')
            .update({
                'credito_autorizado': true,
                'credito_limite': parseFloat(limite),
                'credito_dias_plazo': parseInt(dias),
                'credito_autorizado_por': currentUser?.id_usuario,
                'credito_fecha_autorizacion': new Date().toISOString()
            })
            .eq('id_usuario', solicitud.id_usuario);
        
        if (errorUpdateUsuario) throw errorUpdateUsuario;
        
        const { error: errorUpdate } = await supabaseClient
            .from('solicitud_credito')
            .update({
                'estado': 'aprobada',
                'fecha_resolucion': new Date().toISOString(),
                'resuelto_por': currentUser?.id_usuario
            })
            .eq('id_solicitud', idSolicitud);
        
        if (errorUpdate) throw errorUpdate;
        
        await supabaseClient.from('notificacion').insert({
            'id_usuario': solicitud.id_usuario,
            'titulo': '¡Crédito Aprobado!',
            'mensaje': `Tu solicitud de crédito por $${solicitud.monto_solicitado} ha sido aprobada con un límite de $${limite} a ${dias} días.`,
            'tipo': 'credito_aprobado',
            'id_referencia': idSolicitud
        });
        
        const modalAprobar = document.getElementById('modalAprobarCredito');
        if (modalAprobar) modalAprobar.remove();
        
        mostrarMensaje(
            '¡Crédito aprobado!', 
            'El crédito para ' + (usuarioData?.nombre || 'el cliente') + ' ha sido aprobado correctamente.',
            'exito'
        );
        
        cargarCreditos();
        
    } catch (error) {
        console.error('Error al aprobar crédito:', error);
        mostrarMensaje(
            'Error al aprobar', 
            'Ocurrió un error al procesar la aprobación: ' + error.message,
            'error'
        );
    }
}

async function rechazarSolicitudCredito(idSolicitud) {
    mostrarConfirmacion(
        'Rechazar Solicitud',
        '¿Estás seguro de rechazar esta solicitud de crédito? Esta acción no se puede deshacer.',
        async function() {
            try {
                const { data: solicitud, error: errorSolicitud } = await supabaseClient
                    .from('solicitud_credito')
                    .select('id_usuario, monto_solicitado')
                    .eq('id_solicitud', idSolicitud)
                    .single();
                
                if (errorSolicitud) throw errorSolicitud;
                
                const { error } = await supabaseClient
                    .from('solicitud_credito')
                    .update({
                        'estado': 'rechazada',
                        'fecha_resolucion': new Date().toISOString(),
                        'resuelto_por': currentUser?.id_usuario
                    })
                    .eq('id_solicitud', idSolicitud);
                
                if (error) throw error;
                
                await supabaseClient.from('notificacion').insert({
                    'id_usuario': solicitud.id_usuario,
                    'titulo': 'Crédito no aprobado',
                    'mensaje': 'Tu solicitud de crédito no ha sido aprobada en esta ocasión.',
                    'tipo': 'credito_rechazado',
                    'id_referencia': idSolicitud
                });
                
                mostrarMensaje(
                    'Solicitud rechazada',
                    'La solicitud ha sido rechazada correctamente.',
                    'info'
                );
                
                cargarCreditos();
                
            } catch (error) {
                console.error('Error al rechazar solicitud:', error);
                mostrarMensaje(
                    'Error al rechazar',
                    'Ocurrió un error al procesar el rechazo: ' + error.message,
                    'error'
                );
            }
        }
    );
}

async function actualizarCreditoCliente(idUsuario) {
    try {
        const limite = document.getElementById('editarLimite').value;
        const dias = document.getElementById('editarDias').value;
        const estado = document.getElementById('editarEstado').value === 'true';
        
        const { data: usuario } = await supabaseClient
            .from('usuario')
            .select('nombre')
            .eq('id_usuario', idUsuario)
            .single();
        
        const { error } = await supabaseClient
            .from('usuario')
            .update({
                'credito_autorizado': estado,
                'credito_limite': parseFloat(limite),
                'credito_dias_plazo': parseInt(dias),
                'credito_autorizado_por': currentUser?.id_usuario,
                'credito_fecha_autorizacion': estado ? new Date().toISOString() : null
            })
            .eq('id_usuario', idUsuario);
        
        if (error) throw error;
        
        const modalEditar = document.getElementById('modalEditarCredito');
        if (modalEditar) modalEditar.remove();
        
        mostrarMensaje(
            '¡Cambios guardados!',
            'El crédito de ' + (usuario?.nombre || 'el cliente') + ' ha sido actualizado correctamente.',
            'exito'
        );
        
        cargarCreditos();
        
    } catch (error) {
        console.error('Error al actualizar crédito:', error);
        mostrarMensaje(
            'Error al actualizar',
            'Ocurrió un error al guardar los cambios: ' + error.message,
            'error'
        );
    }
}

// Exportar funciones
window.cargarCreditos = cargarCreditos;
window.mostrarModalAprobarCredito = mostrarModalAprobarCredito;
window.mostrarModalEditarCredito = mostrarModalEditarCredito;
window.aprobarSolicitudCredito = aprobarSolicitudCredito;
window.rechazarSolicitudCredito = rechazarSolicitudCredito;
window.actualizarCreditoCliente = actualizarCreditoCliente;
window.eliminarCreditoCliente = eliminarCreditoCliente;
window.mostrarMensaje = mostrarMensaje;
window.actualizarDiasPlazoDesdeLimite = actualizarDiasPlazoDesdeLimite;
window.actualizarDiasPlazoDesdeLimiteEditar = actualizarDiasPlazoDesdeLimiteEditar;