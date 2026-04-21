// ============================================
// pedidos.js - Gestión de pedidos VERSIÓN COMPLETA CORREGIDA
// ============================================

// Variables globales para manejo de selección
let pedidosSeleccionados = new Set();
let modoSeleccionActivo = false;

// ============================================
// FUNCIÓN PARA MOSTRAR TOAST DE NOTIFICACIÓN
// ============================================
function mostrarToast(mensaje, tipo = 'success') {
    // Eliminar toast existente si hay uno
    const toastExistente = document.querySelector('.toast-notification');
    if (toastExistente) {
        toastExistente.remove();
    }
    
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${tipo}`;
    
    // Definir icono según tipo
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const icono = iconos[tipo] || 'fa-check-circle';
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icono} toast-icon"></i>
            <span class="toast-message">${mensaje}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ============================================
// FUNCIÓN PARA MOSTRAR MODAL DE MOTIVO DE RECHAZO
// ============================================
function mostrarModalMotivoRechazo(idPedido, botonClickeado = null) {
    // Crear modal para el motivo de rechazo
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'modalMotivoRechazo';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h3><i class="fas fa-times-circle" style="color: #dc2626;"></i> Rechazar Pedido #${idPedido}</h3>
                <span class="modal-close" onclick="document.getElementById('modalMotivoRechazo').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 15px; color: #374151;">Por favor, indique el motivo del rechazo:</p>
                <textarea id="motivoRechazoInput" 
                          placeholder="Escriba el motivo del rechazo..." 
                          style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical; box-sizing: border-box;"
                          autofocus></textarea>
                <p style="color: #6b7280; font-size: 12px; margin-top: 8px;">Este motivo será notificado al cliente.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('modalMotivoRechazo').remove()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn btn-danger" id="btnConfirmarRechazo" style="background-color: #dc2626; color: white;">
                    <i class="fas fa-check"></i> Confirmar Rechazo
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Enfocar el textarea
    setTimeout(() => {
        const textarea = document.getElementById('motivoRechazoInput');
        if (textarea) textarea.focus();
    }, 100);
    
    // Agregar event listener al botón de confirmar
    document.getElementById('btnConfirmarRechazo').addEventListener('click', async function() {
        const motivo = document.getElementById('motivoRechazoInput').value.trim();
        
        if (!motivo) {
            mostrarToast('Debe escribir un motivo para rechazar el pedido', 'warning');
            return;
        }
        
        // Cerrar modal
        modal.remove();
        
        // Llamar a la función de rechazar
        rechazarPedido(idPedido, motivo, botonClickeado);
    });
    
    // Permitir confirmar con Enter (Ctrl+Enter o Cmd+Enter)
    const textarea = document.getElementById('motivoRechazoInput');
    textarea.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btnConfirmarRechazo').click();
        }
    });
}

// ============================================
// FUNCIÓN PARA ACTIVAR/DESACTIVAR MODO SELECCIÓN
// ============================================
function toggleModoSeleccion() {
    modoSeleccionActivo = !modoSeleccionActivo;
    
    // Mostrar/ocultar checkboxes
    document.querySelectorAll('.checkbox-pedido, #selectAllCheckbox').forEach(el => {
        el.style.display = modoSeleccionActivo ? 'inline-block' : 'none';
    });
    
    // Actualizar botón
    const btnEliminar = document.getElementById('btnEliminarSeleccionados');
    if (btnEliminar) {
        if (modoSeleccionActivo) {
            btnEliminar.innerHTML = `<i class="fas fa-check"></i> Confirmar Eliminación (0)`;
            btnEliminar.style.backgroundColor = '#16a34a';
            btnEliminar.onclick = confirmarEliminacionSeleccionados;
        } else {
            btnEliminar.innerHTML = `<i class="fas fa-trash"></i> Eliminar Seleccionados`;
            btnEliminar.style.backgroundColor = '#dc2626';
            btnEliminar.onclick = toggleModoSeleccion;
            // Limpiar selección al salir del modo
            pedidosSeleccionados.clear();
            document.querySelectorAll('.checkbox-pedido').forEach(cb => cb.checked = false);
            const selectAll = document.getElementById('selectAllCheckbox');
            if (selectAll) selectAll.checked = false;
        }
    }
    
    // Mostrar toast informativo
    if (modoSeleccionActivo) {
        mostrarToast('Modo selección activado. Marca los pedidos que deseas eliminar.', 'info');
    }
}

// ============================================
// FUNCIÓN PARA CONFIRMAR ELIMINACIÓN DE SELECCIONADOS
// ============================================
async function confirmarEliminacionSeleccionados() {
    if (pedidosSeleccionados.size === 0) {
        mostrarToast('Selecciona al menos un pedido para eliminar', 'warning');
        return;
    }
    
    const idsPedidos = Array.from(pedidosSeleccionados);
    
    // Crear modal de confirmación personalizado
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'modalConfirmacionEliminar';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header" style="border-bottom: none;">
                <h3><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Eliminar Pedidos Seleccionados</h3>
                <span class="modal-close" onclick="document.getElementById('modalConfirmacionEliminar').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px;">¿Estás seguro de que deseas eliminar ${pedidosSeleccionados.size} pedido(s) seleccionado(s)?</p>
                <p style="color: #6b7280; font-size: 14px;">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer" style="border-top: none;">
                <button class="btn btn-secondary" onclick="document.getElementById('modalConfirmacionEliminar').remove()">
                    Cancelar
                </button>
                <button class="btn btn-danger" id="btnConfirmarEliminarSeleccionados" style="background-color: #dc2626; color: white;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar event listener al botón de confirmar
    document.getElementById('btnConfirmarEliminarSeleccionados').addEventListener('click', async function(e) {
        const btn = this;
        const contenidoOriginal = btn.innerHTML;
        
        // Mostrar spinner en el botón
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        btn.disabled = true;
        
        // Deshabilitar botón cancelar
        const btnCancelar = modal.querySelector('.btn-secondary');
        if (btnCancelar) btnCancelar.disabled = true;
        
        try {
            console.log('🗑️ Eliminando pedidos seleccionados:', idsPedidos);
            
            let eliminados = 0;
            let errores = 0;
            let mensajesError = [];
            
            for (const idPedido of idsPedidos) {
                try {
                    // Verificar cuenta por cobrar
                    const { data: cuenta } = await supabaseClient
                        .from('cuentaporcobrar')
                        .select('id_cuenta, saldo_pendiente, id_usuario')
                        .eq('id_pedido', idPedido)
                        .maybeSingle();
                    
                    if (cuenta) {
                        // Actualizar saldo de crédito
                        const { data: usuario } = await supabaseClient
                            .from('usuario')
                            .select('credito_saldo')
                            .eq('id_usuario', cuenta.id_usuario)
                            .single();
                        
                        if (usuario) {
                            const nuevoSaldo = Math.max(0, (usuario.credito_saldo || 0) - (cuenta.saldo_pendiente || 0));
                            await supabaseClient
                                .from('usuario')
                                .update({ credito_saldo: nuevoSaldo })
                                .eq('id_usuario', cuenta.id_usuario);
                        }
                        
                        // Eliminar pagos asociados
                        await supabaseClient
                            .from('pago')
                            .delete()
                            .eq('id_cuenta', cuenta.id_cuenta);
                        
                        // Eliminar cuenta
                        await supabaseClient
                            .from('cuentaporcobrar')
                            .delete()
                            .eq('id_pedido', idPedido);
                    }
                    
                    // Eliminar entregas
                    await supabaseClient
                        .from('entrega')
                        .delete()
                        .eq('id_pedido', idPedido);
                    
                    // Eliminar notificaciones
                    await supabaseClient
                        .from('notificacion')
                        .delete()
                        .eq('id_referencia', idPedido);
                    
                    // Eliminar detalles
                    await supabaseClient
                        .from('detalle_pedido')
                        .delete()
                        .eq('id_pedido', idPedido);
                    
                    // Anular referencias al usuario
                    await supabaseClient
                        .from('pedido')
                        .update({ 
                            id_usuario: null,
                            aprobado_por: null 
                        })
                        .eq('id_pedido', idPedido);
                    
                    // Eliminar el pedido
                    const { error } = await supabaseClient
                        .from('pedido')
                        .delete()
                        .eq('id_pedido', idPedido);
                    
                    if (error) throw error;
                    
                    console.log(`✅ Pedido #${idPedido} eliminado`);
                    eliminados++;
                } catch (error) {
                    console.error(`Error al eliminar pedido #${idPedido}:`, error);
                    errores++;
                    mensajesError.push(`Pedido #${idPedido}: ${error.message || 'Error desconocido'}`);
                }
            }
            
            // Cerrar modal
            modal.remove();
            
            // Desactivar modo selección
            modoSeleccionActivo = false;
            document.querySelectorAll('.checkbox-pedido, #selectAllCheckbox').forEach(el => {
                el.style.display = 'none';
            });
            pedidosSeleccionados.clear();
            
            // Actualizar botón
            const btnEliminar = document.getElementById('btnEliminarSeleccionados');
            if (btnEliminar) {
                btnEliminar.innerHTML = `<i class="fas fa-trash"></i> Eliminar Seleccionados`;
                btnEliminar.style.backgroundColor = '#dc2626';
                btnEliminar.onclick = toggleModoSeleccion;
            }
            
            // Mostrar mensajes de resultado
            if (eliminados > 0) {
                mostrarToast(`✅ ${eliminados} pedido(s) eliminado(s) exitosamente`, 'success');
            }
            
            if (errores > 0) {
                let mensajeError = `❌ ${errores} pedido(s) no se pudieron eliminar.`;
                if (mensajesError.length > 0) {
                    console.error('Errores detallados:', mensajesError);
                    mensajeError += `\n${mensajesError[0]}`;
                }
                mostrarToast(mensajeError, 'error');
            }
            
            // Recargar la vista
            cargarPedidos();
            
        } catch (error) {
            console.error('Error general:', error);
            modal.remove();
            mostrarToast(`Error al eliminar pedidos: ${error.message || 'Error desconocido'}`, 'error');
        }
    });
}

// ============================================
// FUNCIÓN PARA ELIMINAR UN PEDIDO INDIVIDUAL
// ============================================
async function eliminarPedidoIndividual(idPedido, botonClickeado = null) {
    // Crear modal de confirmación personalizado
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'modalConfirmacionIndividual';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header" style="border-bottom: none;">
                <h3><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Eliminar Pedido</h3>
                <span class="modal-close" onclick="document.getElementById('modalConfirmacionIndividual').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px;">¿Estás seguro de que deseas eliminar el pedido #${idPedido}?</p>
                <p style="color: #6b7280; font-size: 14px;">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer" style="border-top: none;">
                <button class="btn btn-secondary" onclick="document.getElementById('modalConfirmacionIndividual').remove()">
                    Cancelar
                </button>
                <button class="btn btn-danger" id="btnConfirmarEliminarIndividual" style="background-color: #dc2626; color: white;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar event listener al botón de confirmar
    document.getElementById('btnConfirmarEliminarIndividual').addEventListener('click', async function(e) {
        const btn = this;
        
        // Mostrar spinner en el botón del modal
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        btn.disabled = true;
        
        // Deshabilitar botón cancelar
        const btnCancelar = modal.querySelector('.btn-secondary');
        if (btnCancelar) btnCancelar.disabled = true;
        
        // Mostrar spinner en el botón original si existe
        if (botonClickeado) {
            mostrarSpinnerEnBoton(botonClickeado);
        }
        
        try {
            console.log('🗑️ Eliminando pedido individual:', idPedido);
            
            // PASO 1: Verificar cuenta por cobrar
            const { data: cuenta } = await supabaseClient
                .from('cuentaporcobrar')
                .select('id_cuenta, saldo_pendiente, id_usuario')
                .eq('id_pedido', idPedido)
                .maybeSingle();
            
            if (cuenta) {
                console.log(`💳 Pedido #${idPedido} tiene cuenta por cobrar asociada, actualizando saldo...`);
                
                const { data: usuario } = await supabaseClient
                    .from('usuario')
                    .select('credito_saldo')
                    .eq('id_usuario', cuenta.id_usuario)
                    .single();
                
                if (usuario) {
                    const nuevoSaldo = Math.max(0, (usuario.credito_saldo || 0) - (cuenta.saldo_pendiente || 0));
                    await supabaseClient
                        .from('usuario')
                        .update({ credito_saldo: nuevoSaldo })
                        .eq('id_usuario', cuenta.id_usuario);
                    console.log(`✅ Saldo de crédito actualizado: ${nuevoSaldo}`);
                }
                
                // Eliminar pagos asociados a la cuenta
                await supabaseClient
                    .from('pago')
                    .delete()
                    .eq('id_cuenta', cuenta.id_cuenta);
                
                // Eliminar la cuenta por cobrar
                await supabaseClient
                    .from('cuentaporcobrar')
                    .delete()
                    .eq('id_pedido', idPedido);
                
                console.log('✅ Cuenta por cobrar y pagos eliminados');
            }
            
            // PASO 2: Eliminar entregas asociadas
            await supabaseClient
                .from('entrega')
                .delete()
                .eq('id_pedido', idPedido);
            console.log('✅ Entregas eliminadas');
            
            // PASO 3: Eliminar notificaciones asociadas
            await supabaseClient
                .from('notificacion')
                .delete()
                .eq('id_referencia', idPedido);
            console.log('✅ Notificaciones eliminadas');
            
            // PASO 4: Eliminar detalles del pedido
            await supabaseClient
                .from('detalle_pedido')
                .delete()
                .eq('id_pedido', idPedido);
            console.log('✅ Detalles del pedido eliminados');
            
            // PASO 5: Anular la referencia al usuario
            await supabaseClient
                .from('pedido')
                .update({ 
                    id_usuario: null,
                    aprobado_por: null 
                })
                .eq('id_pedido', idPedido);
            console.log('✅ Referencias a usuario anuladas');
            
            // PASO 6: Eliminar el pedido
            const { error } = await supabaseClient
                .from('pedido')
                .delete()
                .eq('id_pedido', idPedido);
            
            if (error) {
                console.error('Error al eliminar pedido:', error);
                throw error;
            }
            
            // Cerrar modal
            modal.remove();
            
            console.log(`✅ Pedido #${idPedido} eliminado completamente`);
            mostrarToast(`✅ Pedido #${idPedido} eliminado exitosamente`, 'success');
            
            pedidosSeleccionados.delete(idPedido);
            cargarPedidos();
            
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            
            // Cerrar modal
            modal.remove();
            
            // Mostrar mensaje de error detallado
            let mensajeError = `❌ No se pudo eliminar el pedido #${idPedido}.`;
            
            if (error.message) {
                if (error.message.includes('foreign key constraint')) {
                    mensajeError += ' El pedido tiene registros relacionados que impiden su eliminación.';
                } else if (error.message.includes('permission denied')) {
                    mensajeError += ' No tienes permisos para eliminar este pedido.';
                } else {
                    mensajeError += ` Motivo: ${error.message}`;
                }
            }
            
            mostrarToast(mensajeError, 'error');
            
            if (botonClickeado) {
                restaurarBoton(botonClickeado);
            }
        }
    });
}

// ============================================
// FUNCIÓN PARA SELECCIONAR/DESELECCIONAR TODOS
// ============================================
function toggleSeleccionarTodos(checkbox) {
    const checkboxes = document.querySelectorAll('.checkbox-pedido');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const idPedido = parseInt(cb.dataset.id);
        if (checkbox.checked) {
            pedidosSeleccionados.add(idPedido);
        } else {
            pedidosSeleccionados.delete(idPedido);
        }
    });
    actualizarContadorSeleccion();
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR CHECKBOX INDIVIDUAL
// ============================================
function toggleSeleccionPedido(checkbox) {
    const idPedido = parseInt(checkbox.dataset.id);
    if (checkbox.checked) {
        pedidosSeleccionados.add(idPedido);
    } else {
        pedidosSeleccionados.delete(idPedido);
    }
    
    // Actualizar estado del checkbox "Seleccionar todos"
    const checkboxTodos = document.getElementById('selectAllCheckbox');
    if (checkboxTodos) {
        const totalCheckboxes = document.querySelectorAll('.checkbox-pedido').length;
        const seleccionados = document.querySelectorAll('.checkbox-pedido:checked').length;
        checkboxTodos.checked = totalCheckboxes > 0 && seleccionados === totalCheckboxes;
        checkboxTodos.indeterminate = seleccionados > 0 && seleccionados < totalCheckboxes;
    }
    
    actualizarContadorSeleccion();
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR CONTADOR DE SELECCIÓN
// ============================================
function actualizarContadorSeleccion() {
    const btnEliminar = document.getElementById('btnEliminarSeleccionados');
    if (btnEliminar && modoSeleccionActivo) {
        const count = pedidosSeleccionados.size;
        btnEliminar.innerHTML = `<i class="fas fa-check"></i> Confirmar Eliminación (${count})`;
    }
}

// ============================================
// FUNCIÓN PARA MOSTRAR SPINNER EN BOTÓN
// ============================================
function mostrarSpinnerEnBoton(boton) {
    const contenidoOriginal = boton.innerHTML;
    boton.dataset.originalHtml = contenidoOriginal;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ';
    boton.disabled = true;
    return contenidoOriginal;
}

function restaurarBoton(boton) {
    const contenidoOriginal = boton.dataset.originalHtml;
    if (contenidoOriginal) {
        boton.innerHTML = contenidoOriginal;
        boton.disabled = false;
        delete boton.dataset.originalHtml;
    }
}

async function cargarPedidos() {
    const content = document.getElementById('content');
    
    // Limpiar selección al recargar
    pedidosSeleccionados.clear();
    modoSeleccionActivo = false;
    
    try {
        content.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando pedidos...</p></div>';
        
        const { data: pedidos, error } = await supabaseClient
            .from('pedido')
            .select(`
                *,
                usuario:id_usuario (nombre, email, telefono, direccion, credito_limite, credito_saldo, credito_autorizado, credito_dias_plazo)
            `)
            .order('fecha_pedido', { ascending: false });
        
        if (error) throw error;
        
        content.innerHTML = pedidosTemplate(pedidos || []);
        
        // Agregar event listeners
        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                aprobarPedido(id, btn);
            });
        });
        
        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                mostrarModalMotivoRechazo(id, btn);
            });
        });
        
        document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                verDetallesPedido(id);
            });
        });
        
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                eliminarPedidoIndividual(id, btn);
            });
        });
        
        document.querySelectorAll('.checkbox-pedido').forEach(cb => {
            cb.addEventListener('change', () => toggleSeleccionPedido(cb));
        });
        
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => toggleSeleccionarTodos(selectAllCheckbox));
        }
        
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        content.innerHTML = '<div style="text-align: center; padding: 50px; color: red;">Error al cargar pedidos</div>';
    }
}

function pedidosTemplate(pedidos) {
    const pendientes = pedidos.filter(p => p.estado_admin === 'pendiente_admin');
    const aprobados = pedidos.filter(p => p.estado_admin === 'aprobado');
    const otros = pedidos.filter(p => p.estado_admin !== 'pendiente_admin' && p.estado_admin !== 'aprobado');
    
    // Combinar todos los pedidos para la tabla "Todos los Pedidos"
    const todosPedidos = [...aprobados, ...otros];
    
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Pendientes Admin</h3>
                    <span class="stat-number">${pendientes.length}</span>
                </div>
                <div class="stat-icon pending">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Aprobados</h3>
                    <span class="stat-number">${aprobados.length}</span>
                </div>
                <div class="stat-icon approved">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Crédito</h3>
                    <span class="stat-number">${pedidos.filter(p => p.es_credito).length}</span>
                </div>
                <div class="stat-icon pending">
                    <i class="fas fa-credit-card"></i>
                </div>
            </div>
        </div>
        
        <div class="table-container" style="margin-bottom: 20px;">
            <div class="table-header">
                <h3 class="table-title">Pedidos Pendientes de Aprobación</h3>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendientes.map(p => `
                        <tr>
                            <td>#${p.id_pedido}</td>
                            <td>
                                <strong>${p.usuario?.nombre || 'N/A'}</strong><br>
                                <small>${p.usuario?.email || ''}</small>
                            </td>
                            <td>${new Date(p.fecha_pedido).toLocaleString()}</td>
                            <td>$${(p.total || 0).toFixed(2)}</td>
                            <td>
                                <span class="status-badge ${p.es_credito ? 'status-credito' : 'status-efectivo'}">
                                    ${p.es_credito ? 'Crédito' : 'Efectivo'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-success btn-aprobar" data-id="${p.id_pedido}">
                                    <i class="fas fa-check"></i> Aprobar
                                </button>
                                <button class="btn btn-sm btn-danger btn-rechazar" data-id="${p.id_pedido}">
                                    <i class="fas fa-times"></i> Rechazar
                                </button>
                                <button class="btn btn-sm btn-primary btn-ver-detalles" data-id="${p.id_pedido}">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${pendientes.length === 0 ? `
                        <tr>
                            <td colspan="6" style="text-align: center;">No hay pedidos pendientes</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Todos los Pedidos</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="btnImprimirReporte" 
                            class="btn" 
                            onclick="generarReporteVentasEntregadas()" 
                            style="background-color: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        <i class="fas fa-print"></i> Imprimir Reporte
                    </button>
                    <button id="btnEliminarSeleccionados" 
                            class="btn" 
                            onclick="toggleModoSeleccion()" 
                            style="background-color: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        <i class="fas fa-trash"></i> Eliminar Seleccionados
                    </button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <input type="checkbox" id="selectAllCheckbox" style="width: 18px; height: 18px; cursor: pointer; display: none;">
                        </th>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${todosPedidos.map(p => `
                        <tr>
                            <td style="text-align: center;">
                                <input type="checkbox" 
                                       class="checkbox-pedido" 
                                       data-id="${p.id_pedido}" 
                                       style="width: 18px; height: 18px; cursor: pointer; display: none;">
                            </td>
                            <td>#${p.id_pedido}</td>
                            <td>${p.usuario?.nombre || 'N/A'}</td>
                            <td>${new Date(p.fecha_pedido).toLocaleDateString()}</td>
                            <td>$${(p.total || 0).toFixed(2)}</td>
                            <td>
                                <span class="status-badge status-${p.estado}">
                                    ${p.estado_admin === 'aprobado' ? 'Aprobado' : p.estado}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${p.es_credito ? 'status-credito' : 'status-efectivo'}">
                                    ${p.es_credito ? 'Crédito' : 'Efectivo'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary btn-ver-detalles" data-id="${p.id_pedido}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-danger btn-eliminar" 
                                        data-id="${p.id_pedido}"
                                        style="background-color: #dc2626; margin-left: 5px;"
                                        title="Eliminar pedido">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${todosPedidos.length === 0 ? `
                        <tr>
                            <td colspan="8" style="text-align: center;">No hay pedidos registrados</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

async function aprobarPedido(idPedido, botonClickeado = null) {
    // Mostrar spinner en el botón si se proporcionó
    if (botonClickeado) {
        mostrarSpinnerEnBoton(botonClickeado);
    }
    
    try {
        console.log('📝 Aprobando pedido:', idPedido);
        
        // Obtener información completa del pedido incluyendo detalles
        const { data: pedido, error: errorPedido } = await supabaseClient
            .from('pedido')
            .select(`
                id_pedido,
                total,
                id_usuario,
                es_credito,
                usuario:id_usuario (nombre, email, credito_limite, credito_saldo, credito_autorizado, credito_dias_plazo),
                detalle_pedido (
                    id_producto,
                    cantidad,
                    producto (nombre, stock_actual)
                )
            `)
            .eq('id_pedido', idPedido)
            .single();
        
        if (errorPedido) {
            console.error('Error al obtener pedido:', errorPedido);
            throw errorPedido;
        }
        
        console.log('✅ Pedido encontrado:', pedido);
        
        // ============================================
        // SOLO PARA PEDIDOS A CRÉDITO
        // Crear cuenta por cobrar y actualizar saldo
        // ============================================
        if (pedido.es_credito === true) {
            console.log('💳 Pedido con crédito detectado, creando cuenta por cobrar...');
            
            // Verificar que el usuario tiene crédito autorizado
            const usuario = pedido.usuario;
            if (!usuario.credito_autorizado) {
                throw new Error('El cliente no tiene crédito autorizado');
            }
            
            // Verificar que el pedido no exceda el límite de crédito disponible
            const disponibleActual = (usuario.credito_limite || 0) - (usuario.credito_saldo || 0);
            if (pedido.total > disponibleActual) {
                throw new Error(`El cliente no tiene suficiente crédito disponible. Disponible: $${disponibleActual.toFixed(2)}`);
            }
            
            // Calcular fecha de vencimiento según los días de plazo del cliente
            const diasPlazo = usuario.credito_dias_plazo || 30;
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPlazo);
            
            // Crear la cuenta por cobrar
            const { data: nuevaCuenta, error: errorCuenta } = await supabaseClient
                .from('cuentaporcobrar')
                .insert({
                    id_pedido: parseInt(idPedido),
                    id_usuario: pedido.id_usuario,
                    monto_total: pedido.total,
                    saldo_pendiente: pedido.total,
                    fecha_inicio: new Date().toISOString(),
                    fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
                    estado: 'activa',
                    observaciones: `Pedido #${idPedido} aprobado con crédito por ${currentUser?.nombre || 'admin'} el ${new Date().toLocaleString()}`
                })
                .select()
                .single();
            
            if (errorCuenta) {
                console.error('Error al crear cuenta por cobrar:', errorCuenta);
                throw new Error('No se pudo registrar la deuda de crédito: ' + errorCuenta.message);
            }
            
            console.log('✅ Cuenta por cobrar creada:', nuevaCuenta);
            
            // Actualizar el credito_saldo del usuario
            const nuevoSaldoCredito = (usuario.credito_saldo || 0) + pedido.total;
            const { error: errorUpdateSaldo } = await supabaseClient
                .from('usuario')
                .update({
                    credito_saldo: nuevoSaldoCredito
                })
                .eq('id_usuario', pedido.id_usuario);
            
            if (errorUpdateSaldo) {
                console.error('Error al actualizar saldo de crédito:', errorUpdateSaldo);
            } else {
                console.log(`✅ Saldo de crédito actualizado: $${(usuario.credito_saldo || 0).toFixed(2)} → $${nuevoSaldoCredito.toFixed(2)}`);
            }
            
            // Notificar al cliente sobre su nueva deuda
            await supabaseClient
                .from('notificacion')
                .insert({
                    id_usuario: pedido.id_usuario,
                    titulo: '💰 Crédito Aplicado',
                    mensaje: `Tu pedido #${idPedido} por $${pedido.total.toFixed(2)} ha sido cargado a tu crédito. Saldo pendiente: $${nuevoSaldoCredito.toFixed(2)}. Vence: ${fechaVencimiento.toLocaleDateString()}`,
                    tipo: 'credito_aplicado',
                    id_referencia: idPedido
                });
            
            console.log('✅ Notificación de crédito enviada al cliente');
        } else {
            console.log('💵 Pedido a efectivo - No se crea cuenta por cobrar');
        }
        
        // ============================================
        // CONTINUAR CON LA APROBACIÓN NORMAL DEL PEDIDO
        // (TANTO PARA CRÉDITO COMO PARA EFECTIVO)
        // ============================================
        
        // BUSCAR REPARTIDORES DISPONIBLES
        const { data: repartidores, error: errorRepartidores } = await supabaseClient
            .from('usuario')
            .select('id_usuario, nombre')
            .eq('rol', 'repartidor')
            .eq('disponible', true);
        
        if (errorRepartidores) {
            console.error('Error al buscar repartidores:', errorRepartidores);
            throw errorRepartidores;
        }
        
        console.log('👥 Repartidores disponibles:', repartidores?.length || 0);
        
        const hayRepartidores = repartidores && repartidores.length > 0;
        
        // Actualizar estado del pedido
        const { error: errorUpdate } = await supabaseClient
            .from('pedido')
            .update({
                estado_admin: 'aprobado',
                estado: hayRepartidores ? 'pendiente_repartidor' : 'aprobado',
                fecha_aprobacion: new Date().toISOString(),
                aprobado_por: currentUser.id_usuario
            })
            .eq('id_pedido', idPedido);
        
        if (errorUpdate) throw errorUpdate;
        
        // NOTIFICAR A REPARTIDORES si hay disponibles
        if (hayRepartidores) {
            for (const repartidor of repartidores) {
                await supabaseClient
                    .from('notificacion')
                    .insert({
                        id_usuario: repartidor.id_usuario,
                        titulo: '📦 Nuevo Pedido Disponible',
                        mensaje: `Pedido #${idPedido} - $${pedido.total} - Cliente: ${pedido.usuario?.nombre || 'Cliente'}`,
                        tipo: 'pedido_disponible',
                        id_referencia: idPedido
                    });
            }
        }
        
        // NOTIFICAR AL CLIENTE (confirmación de pedido)
        if (pedido.id_usuario) {
            const mensajeCliente = hayRepartidores 
                ? `Tu pedido #${idPedido} ha sido confirmado y ya hay repartidores disponibles`
                : `Tu pedido #${idPedido} ha sido confirmado. Estamos esperando repartidor disponible.`;
            
            await supabaseClient
                .from('notificacion')
                .insert({
                    id_usuario: pedido.id_usuario,
                    titulo: '✅ Pedido Confirmado',
                    mensaje: mensajeCliente,
                    tipo: 'pedido_confirmado',
                    id_referencia: idPedido
                });
        }
        
        // NOTIFICAR AL ADMIN (confirmación)
        await supabaseClient
            .from('notificacion')
            .insert({
                id_usuario: currentUser.id_usuario,
                titulo: '✅ Pedido Aprobado',
                mensaje: `Pedido #${idPedido} aprobado correctamente` + (hayRepartidores ? ` - Notificados ${repartidores.length} repartidor(es)` : ' - Sin repartidores disponibles'),
                tipo: 'pedido_aprobado',
                id_referencia: idPedido
            });
        
        // Mostrar mensaje de éxito con toast en lugar de alert
        let mensajeExito = '';
        if (pedido.es_credito) {
            mensajeExito = `✅ Pedido #${idPedido} aprobado. Se cargó $${pedido.total.toFixed(2)} al crédito del cliente.`;
        } else {
            mensajeExito = `✅ Pedido #${idPedido} aprobado correctamente.`;
        }
        
        if (hayRepartidores) {
            mensajeExito += ` Se notificó a ${repartidores.length} repartidor(es).`;
        } else {
            mensajeExito += ` No hay repartidores disponibles, el pedido quedará en espera.`;
        }
        
        mostrarToast(mensajeExito, 'success');
        
        // Actualizar badge de pedidos pendientes
        const badgePedidos = document.getElementById('pedidosPendientesBadge');
        if (badgePedidos) {
            const currentCount = parseInt(badgePedidos.textContent) || 0;
            if (currentCount > 0) {
                badgePedidos.textContent = currentCount - 1;
                if (badgePedidos.textContent === '0') {
                    badgePedidos.style.display = 'none';
                }
            }
        }
        
        // Recargar la vista de pedidos
        cargarPedidos();
        
        // Si estamos en la vista de inicio, también recargarla para actualizar estadísticas
        if (typeof currentView !== 'undefined' && currentView === 'inicio') {
            if (typeof cargarInicio === 'function') {
                cargarInicio();
            }
        }
        
    } catch (error) {
        console.error('❌ Error al aprobar pedido:', error);
        
        let mensajeError = 'Error al aprobar pedido';
        if (error.message) {
            mensajeError += ': ' + error.message;
        }
        
        mostrarToast(mensajeError, 'error');
        
        // Restaurar botón en caso de error
        if (botonClickeado) {
            restaurarBoton(botonClickeado);
        }
    }
}

async function rechazarPedido(idPedido, motivo, botonClickeado = null) {
    // Guardar referencia al botón pero NO mostrar spinner para evitar conflictos con la recarga del DOM
    // El botón será destruido cuando se recargue la vista, así que no lo manipulamos
    
    try {
        console.log('📝 Rechazando pedido:', idPedido, 'Motivo:', motivo);
        
        // Obtener información del pedido y sus detalles
        const { data: pedido, error } = await supabaseClient
            .from('pedido')
            .select(`
                id_usuario,
                detalle_pedido (
                    id_producto,
                    cantidad
                )
            `)
            .eq('id_pedido', idPedido)
            .single();
        
        if (error) throw error;
        
        console.log('📦 Detalles del pedido obtenidos:', pedido.detalle_pedido);
        
        // ============================================
        // RESTAURAR EL STOCK DE LOS PRODUCTOS
        // ============================================
        if (pedido.detalle_pedido && pedido.detalle_pedido.length > 0) {
            console.log('🔄 Restaurando stock de productos...');
            
            for (const detalle of pedido.detalle_pedido) {
                console.log(`Procesando producto ID: ${detalle.id_producto}, cantidad: ${detalle.cantidad}`);
                
                // Obtener el stock actual del producto
                const { data: producto, error: errorProducto } = await supabaseClient
                    .from('producto')
                    .select('stock_actual, nombre')
                    .eq('id_producto', detalle.id_producto)
                    .single();
                
                if (errorProducto) {
                    console.error(`Error al obtener producto ${detalle.id_producto}:`, errorProducto);
                    continue;
                }
                
                if (!producto) {
                    console.error(`Producto ${detalle.id_producto} no encontrado`);
                    continue;
                }
                
                const stockAnterior = producto.stock_actual || 0;
                // Calcular nuevo stock sumando la cantidad del pedido rechazado
                const nuevoStock = stockAnterior + detalle.cantidad;
                
                console.log(`Producto: ${producto.nombre}, Stock anterior: ${stockAnterior}, Cantidad a restaurar: ${detalle.cantidad}, Nuevo stock: ${nuevoStock}`);
                
                // Actualizar el stock del producto
                const { data: updateResult, error: errorUpdate } = await supabaseClient
                    .from('producto')
                    .update({ stock_actual: nuevoStock })
                    .eq('id_producto', detalle.id_producto)
                    .select();
                
                if (errorUpdate) {
                    console.error(`Error al restaurar stock del producto ${detalle.id_producto}:`, errorUpdate);
                } else {
                    console.log(`✅ Stock del producto ${detalle.id_producto} (${producto.nombre}) restaurado: ${stockAnterior} → ${nuevoStock} (+${detalle.cantidad})`);
                    console.log('Resultado de la actualización:', updateResult);
                }
            }
        } else {
            console.log('⚠️ No hay detalles de pedido para restaurar stock');
        }
        
        // Actualizar pedido
        const { error: errorUpdate } = await supabaseClient
            .from('pedido')
            .update({
                estado_admin: 'rechazado',
                estado: 'rechazado',
                motivo_rechazo: motivo,
                fecha_aprobacion: new Date().toISOString(),
                aprobado_por: currentUser.id_usuario
            })
            .eq('id_pedido', idPedido);
        
        if (errorUpdate) throw errorUpdate;
        
        // Notificar al cliente
        if (pedido.id_usuario) {
            await supabaseClient
                .from('notificacion')
                .insert({
                    id_usuario: pedido.id_usuario,
                    titulo: '❌ Pedido Rechazado',
                    mensaje: `Tu pedido #${idPedido} ha sido rechazado. Motivo: ${motivo}`,
                    tipo: 'pedido_rechazado',
                    id_referencia: idPedido
                });
        }
        
        mostrarToast(`✅ Pedido #${idPedido} rechazado correctamente. Stock restaurado.`, 'success');
        
        // Actualizar badge
        const badgePedidos = document.getElementById('pedidosPendientesBadge');
        if (badgePedidos) {
            const currentCount = parseInt(badgePedidos.textContent) || 0;
            if (currentCount > 0) {
                badgePedidos.textContent = currentCount - 1;
                if (badgePedidos.textContent === '0') {
                    badgePedidos.style.display = 'none';
                }
            }
        }
        
        cargarPedidos();
        
    } catch (error) {
        console.error('Error al rechazar pedido:', error);
        mostrarToast('Error al rechazar pedido: ' + error.message, 'error');
    }
}

async function verDetallesPedido(idPedido) {
    try {
        // Primero, obtener los datos del pedido
        const { data: pedido, error } = await supabaseClient
            .from('pedido')
            .select(`
                *,
                usuario:id_usuario (nombre, email, telefono, direccion),
                detalle_pedido (
                    *,
                    producto (nombre)
                )
            `)
            .eq('id_pedido', idPedido)
            .single();
        
        if (error) throw error;
        
        // Obtener la información de entrega por separado para tener más control
        const { data: entregaData, error: errorEntrega } = await supabaseClient
            .from('entrega')
            .select(`
                id_entrega,
                id_pedido,
                id_repartidor,
                id_repartidor_uuid,
                estado,
                fecha_asignacion
            `)
            .eq('id_pedido', idPedido)
            .maybeSingle();
        
        if (errorEntrega) {
            console.error('Error al obtener entrega:', errorEntrega);
        }
        
        let nombreRepartidor = 'No asignado';
        
        // Si hay datos de entrega y tiene algún ID de repartidor
        if (entregaData) {
            let idRepartidorBuscar = entregaData.id_repartidor || entregaData.id_repartidor_uuid;
            
            if (idRepartidorBuscar) {
                // Buscar el nombre del repartidor en la tabla usuario
                const { data: repartidorData, error: errorRepartidor } = await supabaseClient
                    .from('usuario')
                    .select('nombre')
                    .eq('id_usuario', idRepartidorBuscar)
                    .single();
                
                if (!errorRepartidor && repartidorData) {
                    nombreRepartidor = repartidorData.nombre;
                }
            }
        }
        
        // Debug para ver qué está pasando
        console.log('Pedido:', pedido);
        console.log('Entrega data:', entregaData);
        console.log('Nombre repartidor encontrado:', nombreRepartidor);
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'modalDetalles';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Detalles del Pedido #${idPedido}</h3>
                    <span class="modal-close" onclick="document.getElementById('modalDetalles').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <h4>Información del Cliente</h4>
                        <p><strong>Nombre:</strong> ${pedido.usuario?.nombre || 'N/A'}</p>
                        <p><strong>Email:</strong> ${pedido.usuario?.email || 'N/A'}</p>
                        <p><strong>Teléfono:</strong> ${pedido.usuario?.telefono || 'N/A'}</p>
                        <p><strong>Dirección:</strong> ${pedido.usuario?.direccion || 'N/A'}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Detalles del Pedido</h4>
                        <p><strong>Fecha:</strong> ${new Date(pedido.fecha_pedido).toLocaleString()}</p>
                        <p><strong>Estado Admin:</strong> 
                            <span class="status-badge status-${pedido.estado_admin}">
                                ${pedido.estado_admin}
                            </span>
                        </p>
                        <p><strong>Estado Entrega:</strong> 
                            <span class="status-badge status-${pedido.estado}">
                                ${pedido.estado}
                            </span>
                        </p>
                        <p><strong>Repartidor:</strong> ${nombreRepartidor}</p>
                        <p><strong>Método de Pago:</strong> 
                            <span class="status-badge ${pedido.es_credito ? 'status-credito' : 'status-efectivo'}">
                                ${pedido.es_credito ? 'Crédito' : 'Efectivo'}
                            </span>
                        </p>
                        ${pedido.motivo_rechazo ? `<p><strong>Motivo Rechazo:</strong> ${pedido.motivo_rechazo}</p>` : ''}
                    </div>
                    
                    <h4>Productos</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pedido.detalle_pedido.map(d => `
                                <tr>
                                    <td>${d.producto?.nombre || 'N/A'}</td>
                                    <td>${d.cantidad}</td>
                                    <td>$${(d.precio_unitario || 0).toFixed(2)}</td>
                                    <td>$${((d.cantidad || 0) * (d.precio_unitario || 0)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                                <td><strong>$${(pedido.total || 0).toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('modalDetalles').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarToast('Error al cargar detalles del pedido', 'error');
    }
}

// ============================================
// FUNCIÓN PARA GENERAR REPORTE DE VENTAS ENTREGADAS
// ============================================
async function generarReporteVentasEntregadas() {
    try {
        mostrarToast('📊 Generando reporte de ventas...', 'info');
        
        // Obtener pedidos entregados (estado = 'entregado')
        const { data: pedidos, error } = await supabaseClient
            .from('pedido')
            .select(`
                id_pedido,
                total,
                fecha_pedido,
                es_credito,
                usuario:id_usuario (nombre, email)
            `)
            .eq('estado', 'entregado')
            .order('fecha_pedido', { ascending: false });
        
        if (error) throw error;
        
        if (!pedidos || pedidos.length === 0) {
            mostrarToast('⚠️ No hay pedidos entregados para generar el reporte', 'warning');
            return;
        }
        
        // Calcular total de ventas
        const totalVentas = pedidos.reduce((sum, pedido) => sum + (pedido.total || 0), 0);
        
        // Obtener fecha actual para el reporte
        const fechaActual = new Date();
        
        // Formatear fecha para mostrar
        const formatoFecha = (fecha) => {
            return fecha.toLocaleDateString('es-MX', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
        };
        
        const fechaReporte = formatoFecha(fechaActual);
        
        // Generar nombre del archivo BIEN PERRÓN
        const nombreArchivo = `DISTRIBUIDORA_JARAMILLO_Reporte_Ventas_Entregadas_${fechaActual.toLocaleDateString('es-MX').replace(/\//g, '-')}_${fechaActual.toLocaleTimeString('es-MX').replace(/:/g, '-').replace(/\s/g, '')}.pdf`;
        
        // Cargar librerías necesarias dinámicamente
        const cargarScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
        
        // Cargar html2canvas y jsPDF
        mostrarToast('📄 Preparando documento PDF...', 'info');
        await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        
        // Crear contenedor temporal para el reporte
        const reporteContainer = document.createElement('div');
        reporteContainer.style.position = 'fixed';
        reporteContainer.style.left = '-9999px';
        reporteContainer.style.top = '0';
        reporteContainer.style.width = '1200px';
        reporteContainer.style.backgroundColor = 'white';
        reporteContainer.style.fontFamily = 'Arial, sans-serif';
        reporteContainer.style.padding = '20px';
        
        // Construir el HTML del reporte con colores AZULES
        reporteContainer.innerHTML = `
            <div style="max-width: 1100px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%); color: white; padding: 25px 30px; display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #3b82f6;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="width: 120px; height: 120px; background-color: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center;">
                            <img src="logotipoJaramillo/logotipooficialdjsinfondo.png" 
                                 alt="Distribuidora Jaramillo" 
                                 style="width: 100%; height: 100%; object-fit: contain;"
                                 onerror="this.parentElement.innerHTML='<div style=\\'font-size: 50px;\\'>🏭</div>'">
                        </div>
                        <div>
                            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 5px; margin: 0;">DISTRIBUIDORA JARAMILLO</h1>
                            <div style="font-size: 18px; opacity: 0.95; margin-top: 5px;">REPORTE DE VENTAS ENTREGADAS</div>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 16px; background: rgba(255, 255, 255, 0.15); padding: 12px 18px; border-radius: 8px;">
                        <span style="display: block; font-size: 14px; opacity: 0.9;">Fecha del reporte:</span>
                        ${fechaReporte}
                    </div>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-radius: 10px; padding: 20px 25px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #2563eb;">
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #1e293b; margin-bottom: 5px; font-weight: 500;">Total de Pedidos Entregados</div>
                            <div style="font-size: 32px; font-weight: bold; color: #1e3a5f;">${pedidos.length}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #1e293b; margin-bottom: 5px; font-weight: 500;">Total en Ventas</div>
                            <div style="font-size: 32px; font-weight: bold; color: #1e3a5f;">$${totalVentas.toFixed(2)} <small style="font-size: 16px; font-weight: normal;">MXN</small></div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #1e293b; margin-bottom: 5px; font-weight: 500;">Promedio por Pedido</div>
                            <div style="font-size: 32px; font-weight: bold; color: #1e3a5f;">$${(totalVentas / pedidos.length).toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px;">
                        <h3 style="font-size: 20px; color: #1e3a5f; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #93c5fd;">
                            📋 Detalle de Pedidos Entregados
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #2d5a7b 0%, #1e3a5f 100%); color: white;">
                                    <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">ID Pedido</th>
                                    <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Cliente</th>
                                    <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha Pedido</th>
                                    <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Método de Pago</th>
                                    <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pedidos.map((p, index) => `
                                    <tr style="border-bottom: 1px solid #bfdbfe; ${index % 2 === 0 ? 'background-color: #eff6ff;' : ''}">
                                        <td style="padding: 12px;"><strong>#${p.id_pedido}</strong></td>
                                        <td style="padding: 12px;">${p.usuario?.nombre || 'Cliente'}</td>
                                        <td style="padding: 12px;">${new Date(p.fecha_pedido).toLocaleDateString('es-MX')}</td>
                                        <td style="padding: 12px;">
                                            <span style="background-color: ${p.es_credito ? '#3b82f6' : '#2563eb'}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                                                ${p.es_credito ? '💳 Crédito' : '💵 Efectivo'}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-weight: 500;">$${(p.total || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background-color: #dbeafe; font-weight: bold; border-top: 2px solid #93c5fd;">
                                    <td colspan="4" style="padding: 15px 12px; text-align: right; font-size: 16px; color: #1e3a5f;">
                                        <strong>TOTAL DE VENTAS ENTREGADAS:</strong>
                                    </td>
                                    <td style="padding: 15px 12px; text-align: right; font-size: 20px; color: #1e3a5f; font-weight: bold;">
                                        <strong>$${totalVentas.toFixed(2)}</strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                <div style="background-color: #eff6ff; padding: 20px 30px; text-align: center; border-top: 1px solid #bfdbfe; color: #475569; font-size: 13px;">
                    <p style="margin: 0;">© ${fechaActual.getFullYear()} Distribuidora Jaramillo - Reporte generado el ${new Date().toLocaleString('es-MX')}</p>
                    <p style="margin-top: 5px; font-size: 12px; margin-bottom: 0;">Este reporte incluye todos los pedidos con estado "Entregado"</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(reporteContainer);
        
        // Convertir a canvas y luego a PDF
        const canvas = await html2canvas(reporteContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        // Remover contenedor temporal
        document.body.removeChild(reporteContainer);
        
        // Crear PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        const imgData = canvas.toDataURL('image/png');
        
        // Agregar primera página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Agregar páginas adicionales si es necesario
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Crear blob y abrir diálogo de guardado
        const pdfBlob = pdf.output('blob');
        
        // Crear un enlace temporal para el blob
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarToast('✅ Reporte generado exitosamente. Elige dónde guardarlo.', 'success');
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarToast('❌ Error al generar el reporte: ' + error.message, 'error');
    }
}

// Exportar funciones para uso global
window.cargarPedidos = cargarPedidos;
window.verDetallesPedido = verDetallesPedido;
window.aprobarPedido = aprobarPedido;
window.rechazarPedido = rechazarPedido;
window.eliminarPedidoIndividual = eliminarPedidoIndividual;
window.toggleModoSeleccion = toggleModoSeleccion;
window.confirmarEliminacionSeleccionados = confirmarEliminacionSeleccionados;
window.toggleSeleccionarTodos = toggleSeleccionarTodos;
window.toggleSeleccionPedido = toggleSeleccionPedido;
window.generarReporteVentasEntregadas = generarReporteVentasEntregadas;
window.mostrarModalMotivoRechazo = mostrarModalMotivoRechazo;

// ============================================
// INYECTAR ESTILOS CSS PARA TOAST Y SPINNER
// ============================================
(function injectStyles() {
    // Verificar si los estilos ya fueron inyectados
    if (document.getElementById('toast-spinner-styles')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'toast-spinner-styles';
    styleElement.textContent = `
        /* ============================================ */
        /* ESTILOS PARA TOAST DE NOTIFICACIÓN PROFESIONAL */
        /* ============================================ */
        .toast-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 450px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            border-left: 4px solid;
            backdrop-filter: blur(10px);
        }

        .toast-success {
            border-left-color: #10b981;
            background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
        }

        .toast-success .toast-icon {
            color: #10b981;
        }

        .toast-error {
            border-left-color: #ef4444;
            background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
        }

        .toast-error .toast-icon {
            color: #ef4444;
        }

        .toast-warning {
            border-left-color: #f59e0b;
            background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
        }

        .toast-warning .toast-icon {
            color: #f59e0b;
        }

        .toast-info {
            border-left-color: #3b82f6;
            background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
        }

        .toast-info .toast-icon {
            color: #3b82f6;
        }

        .toast-content {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .toast-icon {
            font-size: 24px;
            flex-shrink: 0;
        }

        .toast-message {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
            line-height: 1.4;
            white-space: pre-line;
        }

        .toast-close {
            background: transparent;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.2s;
            margin-left: 12px;
            flex-shrink: 0;
        }

        .toast-close:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #4b5563;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        /* Para dispositivos móviles */
        @media (max-width: 768px) {
            .toast-notification {
                top: 10px;
                right: 10px;
                left: 10px;
                min-width: auto;
                max-width: none;
            }
        }

        /* ============================================ */
        /* ESTILO PARA BOTÓN CON SPINNER */
        /* ============================================ */
        .btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .fa-spinner {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* ============================================ */
        /* ESTILOS PARA TABLA Y CHECKBOXES */
        /* ============================================ */
        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .btn-eliminar {
            background-color: #dc2626;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .btn-eliminar:hover {
            background-color: #b91c1c;
        }
        
        .checkbox-pedido {
            accent-color: #3b82f6;
        }
        
        #selectAllCheckbox {
            accent-color: #3b82f6;
        }
        
        /* Estilos para el modal de confirmación */
        .modal.show {
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }
        
        .btn-danger {
            background-color: #dc2626;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .btn-danger:hover:not(:disabled) {
            background-color: #b91c1c;
        }
        
        .btn-danger:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background-color: #6b7280;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .btn-secondary:hover:not(:disabled) {
            background-color: #4b5563;
        }
        
        .btn-secondary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    `;
    
    document.head.appendChild(styleElement);
    console.log('✅ Estilos de toast y spinner inyectados correctamente');
})();