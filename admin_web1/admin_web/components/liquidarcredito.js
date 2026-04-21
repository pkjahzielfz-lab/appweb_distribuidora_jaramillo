// ============================================
// liquidarcredito.js - Versión MODIFICADA
// ============================================

// Función para mostrar la vista de liquidación de créditos
async function cargarLiquidarCredito() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
            <div style="text-align: center;">
                <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                <p style="color: var(--gray);">Cargando liquidación de créditos...</p>
            </div>
        </div>
    `;
    
    try {
        // PRIMERO: Obtener todas las cuentas por cobrar activas con saldo pendiente
        const { data: cuentasPorCobrar, error: errorCuentas } = await supabaseClient
            .from('cuentaporcobrar')
            .select('*')
            .eq('estado', 'activa')
            .gt('saldo_pendiente', 0)
            .order('fecha_vencimiento', { ascending: true });
        
        if (errorCuentas) throw errorCuentas;
        
        if (!cuentasPorCobrar || cuentasPorCobrar.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 60px; background: #f9fafb; border-radius: 12px;">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981; margin-bottom: 16px;"></i>
                    <h3 style="color: #1e293b;">No hay cuentas pendientes</h3>
                    <p style="color: #64748b;">Todos los créditos han sido liquidados</p>
                    <button onclick="cargarLiquidarCredito()" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            `;
            return;
        }
        
        // Obtener los IDs de usuario únicos de las cuentas
        const userIds = [...new Set(cuentasPorCobrar.map(cuenta => cuenta.id_usuario).filter(id => id))];
        
        if (userIds.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 60px; background: #fef2f2; border-radius: 12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 16px;"></i>
                    <h3 style="color: #1e293b;">Cuentas sin usuario asociado</h3>
                    <p style="color: #64748b;">Hay cuentas por cobrar que no tienen un usuario asignado</p>
                    <button onclick="cargarLiquidarCredito()" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-sync-alt"></i> Reintentar
                    </button>
                </div>
            `;
            return;
        }
        
        // SEGUNDO: Obtener la información de los usuarios
        const { data: usuarios, error: errorUsuarios } = await supabaseClient
            .from('usuario')
            .select('id_usuario, nombre, email, telefono, direccion, credito_limite, credito_saldo, credito_dias_plazo')
            .in('id_usuario', userIds);
        
        if (errorUsuarios) throw errorUsuarios;
        
        // Crear un mapa de usuarios por ID para acceso rápido
        const usuariosMap = new Map();
        usuarios.forEach(usuario => {
            usuariosMap.set(usuario.id_usuario, usuario);
        });
        
        // TERCERO: Combinar los datos
        const clientesConDeuda = cuentasPorCobrar
            .filter(cuenta => usuariosMap.has(cuenta.id_usuario))
            .map(cuenta => {
                const usuario = usuariosMap.get(cuenta.id_usuario);
                return {
                    id_cuenta: cuenta.id_cuenta,
                    id_usuario: usuario.id_usuario,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    telefono: usuario.telefono,
                    direccion: usuario.direccion,
                    credito_limite: usuario.credito_limite || 0,
                    credito_saldo: usuario.credito_saldo || 0,
                    credito_dias_plazo: usuario.credito_dias_plazo || 30,
                    saldo_pendiente: cuenta.saldo_pendiente,
                    monto_total: cuenta.monto_total,
                    fecha_vencimiento: cuenta.fecha_vencimiento,
                    fecha_inicio: cuenta.fecha_inicio,
                    numero_pedido: cuenta.numero_pedido || 'N/A',
                    observaciones: cuenta.observaciones
                };
            });
        
        // Calcular estadísticas
        const totalPendiente = clientesConDeuda?.reduce((sum, c) => sum + (c.saldo_pendiente || 0), 0) || 0;
        const cantidadDeudas = clientesConDeuda?.length || 0;
        
        // Renderizar la vista - ELIMINADAS LAS TARJETAS DE ESTADÍSTICAS QUE ROBAN ESPACIO
        content.innerHTML = `
            <div class="liquidacion-header">
                <div class="page-header">
                    <h2><i class="fas fa-hand-holding-usd" style="color: #10b981;"></i> Liquidación de Créditos</h2>
                    <p>Registra pagos y liquidaciones de créditos de clientes</p>
                </div>
                
                <!-- SECCIÓN ELIMINADA: stats-cards removida por solicitud -->
                
                <div class="busqueda-container" style="margin-bottom: 30px;">
                    <div class="search-box" style="display: flex; gap: 10px; max-width: 400px;">
                        <input type="text" id="buscarClienteLiquidacion" class="form-control" 
                               placeholder="Buscar cliente por nombre o email..." 
                               style="flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <button class="btn btn-primary" onclick="buscarClientesLiquidacion()">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                </div>
                
                <div id="listaClientesLiquidacion">
                    ${clientesConDeuda.length > 0 ? renderizarListaClientes(clientesConDeuda) : ''}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar liquidación:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626; margin-bottom: 16px;"></i>
                <h3 style="color: #dc2626; margin-bottom: 8px;">Error al cargar datos</h3>
                <p style="color: #64748b; margin-bottom: 20px;">${error.message}</p>
                <button onclick="cargarLiquidarCredito()" class="btn btn-primary">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función para renderizar la lista de clientes - AHORA CON NÚMERO DE PEDIDO Y CANTIDAD DE DEUDA
function renderizarListaClientes(clientes) {
    // Calcular cantidad de deudas (número de cuentas)
    const cantidadDeudas = clientes.length;
    
    return `
        <!-- Mostrar cantidad de deuda al inicio de la lista -->
        <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 500; color: #1e293b;">
                <i class="fas fa-receipt" style="margin-right: 8px; color: #10b981;"></i>
                Cantidad de deudas activas: 
            </span>
            <span style="font-weight: 700; font-size: 20px; color: #10b981;">${cantidadDeudas}</span>
        </div>
        
        <div style="display: grid; gap: 15px;">
            ${clientes.map(cliente => {
                const porcentajeUtilizado = (cliente.saldo_pendiente / cliente.credito_limite * 100) || 0;
                const disponible = cliente.credito_limite - cliente.saldo_pendiente;
                const fechaVencimiento = new Date(cliente.fecha_vencimiento);
                const hoy = new Date();
                const diasVencimiento = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
                const estaVencido = diasVencimiento < 0;
                
                return `
                    <div class="cliente-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-user" style="color: white; font-size: 20px;"></i>
                                    </div>
                                    <div>
                                        <h3 style="margin: 0; color: #1e293b;">${escapeHtml(cliente.nombre)}</h3>
                                        <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">${escapeHtml(cliente.email)}</p>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px;">
                                    <div>
                                        <span style="color: #64748b; font-size: 12px;">Número de pedido</span>
                                        <p style="margin: 0; font-weight: 600; color: #2563eb;">#${escapeHtml(cliente.numero_pedido)}</p>
                                    </div>
                                    <div>
                                        <span style="color: #64748b; font-size: 12px;">Límite de crédito</span>
                                        <p style="margin: 0; font-weight: 600; color: #2563eb;">$${cliente.credito_limite.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span style="color: #64748b; font-size: 12px;">Saldo pendiente</span>
                                        <p style="margin: 0; font-weight: 700; font-size: 18px; color: #dc2626;">$${cliente.saldo_pendiente.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span style="color: #64748b; font-size: 12px;">Monto original</span>
                                        <p style="margin: 0; font-weight: 600;">$${cliente.monto_total.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span style="color: #64748b; font-size: 12px;">Vencimiento</span>
                                        <p style="margin: 0; font-weight: 600; ${estaVencido ? 'color: #dc2626;' : 'color: #64748b;'}">
                                            ${new Date(cliente.fecha_vencimiento).toLocaleDateString()}
                                            ${estaVencido ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px;"></i>' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-success" onclick="abrirModalLiquidacion('${cliente.id_cuenta}', '${cliente.id_usuario}', '${escapeHtml(cliente.nombre)}', ${cliente.saldo_pendiente}, ${cliente.credito_limite}, ${cliente.credito_dias_plazo})">
                                    <i class="fas fa-hand-holding-usd"></i> Liquidar
                                </button>
                            </div>
                        </div>
                        <div style="margin-top: 15px; background: #f1f5f9; border-radius: 8px; height: 8px; overflow: hidden;">
                            <div style="width: ${porcentajeUtilizado}%; height: 100%; background: linear-gradient(90deg, #10b981, #059669);"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #64748b;">
                            <span>Disponible: $${disponible.toFixed(2)}</span>
                            <span>Utilizado: ${porcentajeUtilizado.toFixed(1)}%</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Función para buscar clientes
window.buscarClientesLiquidacion = async function() {
    const busqueda = document.getElementById('buscarClienteLiquidacion').value;
    const contenedor = document.getElementById('listaClientesLiquidacion');
    
    if (!busqueda || busqueda.length < 2) {
        if (contenedor) contenedor.innerHTML = '<p style="text-align: center; padding: 20px;">Escribe al menos 2 caracteres para buscar</p>';
        return;
    }
    
    contenedor.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
    
    try {
        // Buscar usuarios que coincidan con la búsqueda
        const { data: usuarios, error: errorUsuarios } = await supabaseClient
            .from('usuario')
            .select('id_usuario, nombre, email, telefono, direccion, credito_limite, credito_saldo, credito_dias_plazo')
            .or(`nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%`)
            .eq('rol', 'cliente');
        
        if (errorUsuarios) throw errorUsuarios;
        
        if (!usuarios || usuarios.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fef2f2; border-radius: 12px;">
                    <i class="fas fa-search" style="font-size: 40px; color: #dc2626; margin-bottom: 16px;"></i>
                    <p style="color: #64748b;">No se encontraron clientes</p>
                </div>
            `;
            return;
        }
        
        // Obtener IDs de usuarios
        const usuariosIds = usuarios.map(u => u.id_usuario);
        
        // Buscar cuentas por cobrar de esos usuarios
        const { data: cuentas, error: errorCuentas } = await supabaseClient
            .from('cuentaporcobrar')
            .select('*')
            .in('id_usuario', usuariosIds)
            .eq('estado', 'activa')
            .gt('saldo_pendiente', 0);
        
        if (errorCuentas) throw errorCuentas;
        
        if (!cuentas || cuentas.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fef2f2; border-radius: 12px;">
                    <i class="fas fa-search" style="font-size: 40px; color: #dc2626; margin-bottom: 16px;"></i>
                    <p style="color: #64748b;">No se encontraron cuentas pendientes para estos clientes</p>
                </div>
            `;
            return;
        }
        
        // Crear mapa de usuarios
        const usuariosMap = new Map();
        usuarios.forEach(u => usuariosMap.set(u.id_usuario, u));
        
        // Combinar resultados
        const resultados = cuentas
            .filter(cuenta => usuariosMap.has(cuenta.id_usuario))
            .map(cuenta => {
                const usuario = usuariosMap.get(cuenta.id_usuario);
                return {
                    id_cuenta: cuenta.id_cuenta,
                    id_usuario: usuario.id_usuario,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    telefono: usuario.telefono,
                    direccion: usuario.direccion,
                    credito_limite: usuario.credito_limite || 0,
                    credito_saldo: usuario.credito_saldo || 0,
                    credito_dias_plazo: usuario.credito_dias_plazo || 30,
                    saldo_pendiente: cuenta.saldo_pendiente,
                    monto_total: cuenta.monto_total,
                    fecha_vencimiento: cuenta.fecha_vencimiento,
                    fecha_inicio: cuenta.fecha_inicio,
                    numero_pedido: cuenta.numero_pedido || 'N/A'
                };
            });
        
        contenedor.innerHTML = renderizarListaClientes(resultados);
        
    } catch (error) {
        console.error('Error al buscar:', error);
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #fef2f2; border-radius: 12px;">
                <i class="fas fa-exclamation-circle" style="font-size: 40px; color: #dc2626; margin-bottom: 16px;"></i>
                <p style="color: #dc2626;">Error: ${error.message}</p>
                <button onclick="cargarLiquidarCredito()" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>
        `;
    }
};

// Función para abrir modal de liquidación - SIN CAMPO DE COMENTARIOS
window.abrirModalLiquidacion = function(idCuenta, idUsuario, nombreCliente, saldoActual, limite, diasPlazo) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'modalLiquidarCredito';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white;">
                <h3 style="color: white; margin: 0;">
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                    Liquidar Crédito
                </h3>
                <span class="modal-close" onclick="document.getElementById('modalLiquidarCredito').remove()" style="color: white; cursor: pointer; font-size: 28px;">&times;</span>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="background: #2563eb; width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                        <i class="fas fa-user" style="color: white; font-size: 30px;"></i>
                    </div>
                    <h3 style="color: #1e293b; margin-bottom: 5px;">${escapeHtml(nombreCliente)}</h3>
                </div>
                
                <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #64748b;">Límite de crédito:</span>
                        <span style="font-weight: 600;">$${limite.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #64748b;">Plazo:</span>
                        <span style="font-weight: 600;">${diasPlazo} días</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px dashed #cbd5e1;">
                        <span style="font-size: 16px; font-weight: 500;">Saldo a liquidar:</span>
                        <span style="font-size: 24px; font-weight: 700; color: #dc2626;">
                            $${saldoActual.toFixed(2)}
                        </span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Monto a liquidar</label>
                    <input type="number" id="montoLiquidar" class="form-control" 
                           min="0" max="${saldoActual}" step="0.01" 
                           value="${saldoActual}" style="font-size: 18px; padding: 12px; width: 100%; box-sizing: border-box;">
                    <small style="color: #64748b; display: block; margin-top: 5px;">
                        Monto máximo: $${saldoActual.toFixed(2)}
                    </small>
                </div>
                
                <div class="form-group">
                    <label>Forma de pago</label>
                    <select id="formaPago" class="form-control" style="width: 100%; padding: 8px;">
                        <option value="efectivo">💵 Efectivo</option>
                    </select>
                </div>
                
                <!-- CAMPO DE COMENTARIOS ELIMINADO -->
                
                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px;">
                    <p style="color: #92400e; margin: 0; font-size: 13px;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 5px;"></i>
                        Al liquidar, el saldo de la cuenta se actualizará automáticamente.
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('modalLiquidarCredito').remove()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn btn-success" onclick="procesarLiquidacion('${idCuenta}', '${idUsuario}', '${escapeHtml(nombreCliente)}', ${saldoActual})">
                    <i class="fas fa-check-circle"></i> Liquidar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Validar monto ingresado
    setTimeout(() => {
        const montoInput = document.getElementById('montoLiquidar');
        if (montoInput) {
            montoInput.addEventListener('input', function() {
                let valor = parseFloat(this.value);
                if (isNaN(valor)) valor = 0;
                if (valor > saldoActual) this.value = saldoActual;
                if (valor < 0) this.value = 0;
            });
        }
    }, 100);
};

// Función para procesar la liquidación - SIN COMENTARIOS
window.procesarLiquidacion = async function(idCuenta, idUsuario, nombreCliente, saldoActual) {
    const montoLiquidar = parseFloat(document.getElementById('montoLiquidar').value) || 0;
    const formaPago = document.getElementById('formaPago').value;
    // Variable comentarios eliminada
    
    if (montoLiquidar <= 0) {
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('Monto inválido', 'El monto debe ser mayor a cero', 'advertencia');
        } else {
            alert('El monto debe ser mayor a cero');
        }
        return;
    }
    
    if (montoLiquidar > saldoActual) {
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('Monto excede saldo', 'El monto no puede ser mayor al saldo actual', 'error');
        } else {
            alert('El monto no puede ser mayor al saldo actual');
        }
        return;
    }
    
    try {
        const btn = document.querySelector('#modalLiquidarCredito .btn-success');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            btn.disabled = true;
        }
        
        const nuevoSaldo = saldoActual - montoLiquidar;
        const nuevoEstado = nuevoSaldo === 0 ? 'pagada' : 'activa';
        
        // 1. Actualizar saldo y estado en la tabla cuentaporcobrar
        const { error: errorUpdateCuenta } = await supabaseClient
            .from('cuentaporcobrar')
            .update({ 
                saldo_pendiente: nuevoSaldo,
                estado: nuevoEstado
            })
            .eq('id_cuenta', idCuenta);
        
        if (errorUpdateCuenta) throw errorUpdateCuenta;
        
        // 2. Registrar pago en la tabla pago
        const { error: errorPago } = await supabaseClient
            .from('pago')
            .insert({
                id_cuenta: idCuenta,
                monto_pagado: montoLiquidar,
                metodo: formaPago,
                id_usuario: currentUser?.id_usuario,
                fecha_pago: new Date().toISOString()
            });
        
        if (errorPago) console.error('Error al registrar pago:', errorPago);
        
        // 3. Actualizar el credito_saldo en la tabla usuario
        const { data: usuarioData, error: errorGetUsuario } = await supabaseClient
            .from('usuario')
            .select('credito_saldo')
            .eq('id_usuario', idUsuario)
            .single();
        
        if (!errorGetUsuario && usuarioData) {
            const nuevoSaldoUsuario = Math.max(0, (usuarioData.credito_saldo || 0) - montoLiquidar);
            await supabaseClient
                .from('usuario')
                .update({ credito_saldo: nuevoSaldoUsuario })
                .eq('id_usuario', idUsuario);
        }
        
        // 4. Crear notificación para el cliente
        await supabaseClient.from('notificacion').insert({
            id_usuario: idUsuario,
            titulo: nuevoSaldo === 0 ? '¡Crédito Liquidado!' : 'Pago Registrado',
            mensaje: nuevoSaldo === 0 
                ? 'Has liquidado tu crédito completamente. ¡Gracias por tu pago!' 
                : `Se registró un pago de $${montoLiquidar.toFixed(2)} a tu crédito. Saldo pendiente: $${nuevoSaldo.toFixed(2)}`,
            tipo: 'pago_credito',
            fecha_creacion: new Date().toISOString()
        });
        
        // 5. Cerrar modal
        const modal = document.getElementById('modalLiquidarCredito');
        if (modal) modal.remove();
        
        // 6. Mostrar mensaje de éxito
        if (typeof mostrarMensaje === 'function') {
            if (nuevoSaldo === 0) {
                mostrarMensaje(
                    '¡Crédito liquidado!',
                    `El crédito de ${nombreCliente} ha sido liquidado completamente`,
                    'exito'
                );
            } else {
                mostrarMensaje(
                    'Pago registrado',
                    `Pago de $${montoLiquidar.toFixed(2)} registrado. Saldo pendiente: $${nuevoSaldo.toFixed(2)}`,
                    'exito'
                );
            }
        } else {
            alert(`Pago registrado exitosamente. Nuevo saldo: $${nuevoSaldo.toFixed(2)}`);
        }
        
        // 7. Recargar la vista
        cargarLiquidarCredito();
        
    } catch (error) {
        console.error('Error al procesar liquidación:', error);
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('Error', 'No se pudo procesar la liquidación: ' + error.message, 'error');
        } else {
            alert('Error al procesar la liquidación: ' + error.message);
        }
        
        // Restaurar botón
        const btn = document.querySelector('#modalLiquidarCredito .btn-success');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Liquidar';
            btn.disabled = false;
        }
    }
};

// Función para escapar HTML y prevenir XSS
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Exportar funciones
window.cargarLiquidarCredito = cargarLiquidarCredito;