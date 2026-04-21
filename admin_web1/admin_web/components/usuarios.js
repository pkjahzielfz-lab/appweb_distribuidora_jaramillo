// ============================================
// usuarios.js - Gestión de usuarios FUNCIONAL
// ============================================

// Variable para almacenar el modal
let modalUsuario = null;

// Variable para controlar si el usuario ya existe
let usuarioExiste = false;

// Variable para el filtro activo
let filtroActivo = 'todos';

// Función principal para cargar la lista de usuarios
async function cargarUsuarios() {
    const content = document.getElementById('content');
    
    try {
        content.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando usuarios...</p></div>';
        
        const { data: usuarios, error } = await supabaseClient
            .from('usuario')
            .select('*')
            .order('fecha_registro', { ascending: false });
        
        if (error) throw error;
        
        content.innerHTML = usuariosTemplate(usuarios || []);
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        content.innerHTML = '<div style="text-align: center; padding: 50px; color: red;">Error al cargar usuarios</div>';
    }
}

// Template para la lista de usuarios
function usuariosTemplate(usuarios) {
    // Contar usuarios por rol
    const conteoRoles = {
        todos: usuarios.length,
        admin: usuarios.filter(u => u.rol === 'admin').length,
        repartidor: usuarios.filter(u => u.rol === 'repartidor').length,
        cliente: usuarios.filter(u => u.rol === 'cliente').length
    };
    
    return `
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Gestión de Usuarios</h3>
                <button class="btn btn-primary" onclick="mostrarFormularioUsuario()">
                    <i class="fas fa-plus"></i> Nuevo Usuario
                </button>
            </div>
            
            <!-- Filtros de usuarios -->
            <div class="filtros-usuarios" style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="filtro-btn ${filtroActivo === 'todos' ? 'active' : ''}" 
                        onclick="filtrarUsuarios('todos')" 
                        data-filtro="todos"
                        style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-users"></i> Todos 
                    <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 10px; margin-left: 5px; font-size: 12px;">${conteoRoles.todos}</span>
                </button>
                
                <button class="filtro-btn ${filtroActivo === 'admin' ? 'active' : ''}" 
                        onclick="filtrarUsuarios('admin')" 
                        data-filtro="admin"
                        style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-crown" style="color: #ffc107;"></i> Administradores
                    <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 10px; margin-left: 5px; font-size: 12px;">${conteoRoles.admin}</span>
                </button>
                
                <button class="filtro-btn ${filtroActivo === 'repartidor' ? 'active' : ''}" 
                        onclick="filtrarUsuarios('repartidor')" 
                        data-filtro="repartidor"
                        style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-motorcycle" style="color: #17a2b8;"></i> Repartidores
                    <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 10px; margin-left: 5px; font-size: 12px;">${conteoRoles.repartidor}</span>
                </button>
                
                <button class="filtro-btn ${filtroActivo === 'cliente' ? 'active' : ''}" 
                        onclick="filtrarUsuarios('cliente')" 
                        data-filtro="cliente"
                        style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-user" style="color: #28a745;"></i> Clientes
                    <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 10px; margin-left: 5px; font-size: 12px;">${conteoRoles.cliente}</span>
                </button>
            </div>
            
            <style>
                .filtro-btn.active {
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
                    color: white !important;
                    border-color: #1e3c72 !important;
                }
                
                .filtro-btn.active span {
                    background: rgba(255, 255, 255, 0.3) !important;
                    color: white !important;
                }
                
                .filtro-btn:hover {
                    background: #f8f9fa;
                    border-color: #1e3c72;
                }
                
                .filtro-btn.active:hover {
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                
                table th {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 2px solid #dee2e6;
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                    text-transform: uppercase;
                    font-size: 13px;
                    letter-spacing: 0.5px;
                }
                
                table td {
                    padding: 12px;
                    border-bottom: 1px solid #dee2e6;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                table th:nth-child(1) { width: 12%; }
                table th:nth-child(2) { width: 15%; }
                table th:nth-child(3) { width: 20%; }
                table th:nth-child(4) { width: 10%; }
                table th:nth-child(5) { width: 12%; }
                table th:nth-child(6) { width: 12%; }
                table th:nth-child(7) { width: 19%; text-align: center; }
            </style>
            
            <table>
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Teléfono</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaUsuarios">
                    ${generarFilasUsuarios(usuarios)}
                </tbody>
            </table>
        </div>
    `;
}

// Función para generar las filas de la tabla
function generarFilasUsuarios(usuarios) {
    const usuariosFiltrados = filtroActivo === 'todos' 
        ? usuarios 
        : usuarios.filter(u => u.rol === filtroActivo);
    
    if (usuariosFiltrados.length === 0) {
        return `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users-slash" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>No hay usuarios ${filtroActivo !== 'todos' ? 'de tipo ' + filtroActivo : 'registrados'}</p>
                </td>
            </tr>
        `;
    }
    
    return usuariosFiltrados.map(u => `
        <tr>
            <td><strong>${u.usuario || '-'}</strong></td>
            <td>${u.nombre || 'No disponible'}</td>
            <td>${u.email || 'No disponible'}</td>
            <td><span class="status-badge status-${u.rol || 'cliente'}">${u.rol || 'cliente'}</span></td>
            <td>${u.telefono || '-'}</td>
            <td>${u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetallesUsuario('${u.id_usuario}')" title="Ver detalles" style="background-color: #17a2b8; color: white; border: none;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editarUsuario('${u.id_usuario}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarUsuario('${u.id_usuario}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para filtrar usuarios
window.filtrarUsuarios = async function(rol) {
    filtroActivo = rol;
    
    try {
        const { data: usuarios, error } = await supabaseClient
            .from('usuario')
            .select('*')
            .order('fecha_registro', { ascending: false });
        
        if (error) throw error;
        
        const tablaBody = document.getElementById('tablaUsuarios');
        if (tablaBody) {
            tablaBody.innerHTML = generarFilasUsuarios(usuarios || []);
            
            // Actualizar estilos de los botones de filtro
            document.querySelectorAll('.filtro-btn').forEach(btn => {
                if (btn.dataset.filtro === rol) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Actualizar contadores
            actualizarContadoresFiltros(usuarios || []);
        }
        
    } catch (error) {
        console.error('Error al filtrar usuarios:', error);
    }
};

// Función para actualizar los contadores de los filtros
function actualizarContadoresFiltros(usuarios) {
    const conteoRoles = {
        todos: usuarios.length,
        admin: usuarios.filter(u => u.rol === 'admin').length,
        repartidor: usuarios.filter(u => u.rol === 'repartidor').length,
        cliente: usuarios.filter(u => u.rol === 'cliente').length
    };
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        const filtro = btn.dataset.filtro;
        const span = btn.querySelector('span');
        if (span) {
            span.textContent = conteoRoles[filtro] || 0;
        }
    });
}

// Función para mostrar el formulario de usuario
window.mostrarFormularioUsuario = function(usuario = null) {
    // Resetear variable de validación
    usuarioExiste = false;
    
    // Crear o reutilizar el modal
    if (!modalUsuario) {
        modalUsuario = document.createElement('div');
        modalUsuario.className = 'modal';
        modalUsuario.id = 'modalUsuario';
        document.body.appendChild(modalUsuario);
    }
    
    // Generar contenido del modal
    modalUsuario.innerHTML = formularioUsuarioTemplate(usuario);
    modalUsuario.classList.add('show');
    
    // Configurar eventos del formulario
    const form = document.getElementById('usuarioForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!usuarioExiste) {
                guardarUsuario(usuario?.id_usuario);
            } else {
                mostrarError('El nombre de usuario no está disponible');
            }
        });
    }
    
    // Configurar validación en tiempo real para el campo usuario
    const usuarioInput = document.getElementById('usuario');
    const usuarioContainer = document.getElementById('usuarioContainer');
    
    if (usuarioInput) {
        usuarioInput.addEventListener('input', debounce(async function() {
            const valor = this.value.trim();
            const checkIcon = document.getElementById('usuarioCheck');
            const errorMsg = document.getElementById('usuarioError');
            const submitBtn = document.querySelector('.modal-footer .btn-success');
            
            // Ocultar iconos y mensajes por defecto
            if (checkIcon) checkIcon.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';
            this.style.borderColor = '#ddd';
            
            if (valor.length < 3) {
                if (errorMsg) {
                    errorMsg.textContent = 'El usuario debe tener al menos 3 caracteres';
                    errorMsg.style.display = 'block';
                }
                this.style.borderColor = '#dc3545';
                usuarioExiste = true;
                if (submitBtn) submitBtn.disabled = true;
                return;
            }
            
            try {
                const { data, error } = await supabaseClient
                    .from('usuario')
                    .select('usuario')
                    .eq('usuario', valor);
                
                if (error) throw error;
                
                // Verificar si es edición y el usuario no ha cambiado
                if (usuario && usuario.usuario === valor) {
                    // Usuario sin cambios - válido
                    if (checkIcon) {
                        checkIcon.style.display = 'block';
                        checkIcon.style.color = '#28a745';
                    }
                    this.style.borderColor = '#28a745';
                    usuarioExiste = false;
                    if (submitBtn) submitBtn.disabled = false;
                } else if (data && data.length > 0) {
                    // Usuario ya existe
                    if (errorMsg) {
                        errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Este usuario ya está registrado';
                        errorMsg.style.display = 'block';
                    }
                    this.style.borderColor = '#dc3545';
                    usuarioExiste = true;
                    if (submitBtn) submitBtn.disabled = true;
                } else {
                    // Usuario disponible
                    if (checkIcon) {
                        checkIcon.style.display = 'block';
                        checkIcon.style.color = '#28a745';
                    }
                    this.style.borderColor = '#28a745';
                    usuarioExiste = false;
                    if (submitBtn) submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error al validar usuario:', error);
            }
        }, 500));
    }
    
    // Configurar toggle de contraseña
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            if (passwordInput) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.textContent = type === 'password' ? '👁️' : '🔒';
            }
        });
    });
    
    // Evento del botón de correo
    const btnCorreo = document.getElementById('btnEnviarCorreo');
    if (btnCorreo) {
        btnCorreo.addEventListener('click', async () => {
            const email = document.getElementById('email')?.value;
            
            if (!email) {
                alert('No se encontró el email del usuario');
                return;
            }

            try {
                btnCorreo.disabled = true;
                btnCorreo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

                const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
                    email,
                    {
                        redirectTo: window.location.origin + '/reset_password.html',
                    }
                );

                if (resetError) throw resetError;

                const successMsg = document.getElementById('successMessage');
                if (successMsg) {
                    successMsg.innerHTML = `
                        <strong>Correo enviado</strong><br>
                        <small>Se ha enviado un email a ${email} con instrucciones para restablecer la contraseña.</small>
                    `;
                    successMsg.style.display = 'block';
                    
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 5000);
                }

            } catch (error) {
                console.error('Error:', error);
                const errorMsg = document.getElementById('errorMessage');
                if (errorMsg) {
                    errorMsg.textContent = error.message;
                    errorMsg.style.display = 'block';
                    
                    setTimeout(() => {
                        errorMsg.style.display = 'none';
                    }, 5000);
                }
            } finally {
                btnCorreo.disabled = false;
                btnCorreo.innerHTML = '<i class="fas fa-envelope"></i> Enviar Correo de Restablecimiento';
            }
        });
    }
    
    // Cerrar modal al hacer click en la X
    const closeBtn = modalUsuario.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalUsuario);
    }
    
    // Cerrar modal al hacer click fuera
    modalUsuario.addEventListener('click', (e) => {
        if (e.target === modalUsuario) {
            cerrarModalUsuario();
        }
    });
};

// Template del formulario de usuario
function formularioUsuarioTemplate(usuario = null) {
    const esEdicion = usuario !== null;
    
    return `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>${esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="error-message" id="errorMessage" style="display: none; color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin-bottom: 15px;"></div>
                <div class="success-message" id="successMessage" style="display: none; color: #28a745; background: #d4edda; padding: 10px; border-radius: 5px; margin-bottom: 15px;"></div>
                
                <form id="usuarioForm">
                    <!-- === CAMPO Usuario CON VALIDACIÓN MEJORADA === -->
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Nombre de Usuario *</label>
                        <div class="input-container" id="usuarioContainer" style="position: relative;">
                            <input type="text" id="usuario" name="usuario" 
                                   value="${usuario?.usuario || ''}" 
                                   placeholder="Ej: juan.perez" 
                                   ${esEdicion ? '' : 'required'}
                                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; transition: border-color 0.3s;">
                            <i class="fas fa-check-circle input-icon" id="usuarioCheck" style="display: none; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #28a745; font-size: 18px;"></i>
                        </div>
                        <div id="usuarioError" style="display: none; color: #dc3545; font-size: 13px; margin-top: 5px; padding-left: 5px;">
                            <i class="fas fa-exclamation-circle"></i> Mensaje de error
                        </div>
                        ${esEdicion ? '<small style="color: #666; display: block; margin-top: 5px;"><i class="fas fa-info-circle"></i> Deja en blanco si no quieres cambiar el usuario</small>' : ''}
                    </div>
                    <!-- === FIN CAMPO USUARIO === -->

                    <div class="form-group">
                        <label><i class="fas fa-id-card"></i> Nombre Completo *</label>
                        <input type="text" id="nombre" name="nombre" 
                               value="${usuario?.nombre || ''}" 
                               placeholder="Ej: Juan Pérez" required>
                    </div>

                    <div class="form-group">
                        <label><i class="fas fa-envelope"></i> Correo Electrónico *</label>
                        <input type="email" id="email" name="email" 
                               value="${usuario?.email || ''}" 
                               placeholder="usuario@ejemplo.com" 
                               ${esEdicion ? 'readonly' : 'required'}>
                        ${esEdicion ? '<small style="color: #666;"><i class="fas fa-lock"></i> El email no se puede modificar</small>' : ''}
                    </div>

                    ${!esEdicion ? `
                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Contraseña *</label>
                            <div class="password-container" style="position: relative;">
                                <input type="password" id="password" name="password" 
                                       placeholder="●●●●●●●●" required style="width: 100%; padding: 10px; padding-right: 40px; border: 1px solid #ddd; border-radius: 5px;">
                                <span class="toggle-password" data-target="password" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px;">👁️</span>
                            </div>
                        </div>
                    ` : ''}

                    ${esEdicion ? `
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Cambiar Contraseña</label>
                            <div style="margin-bottom: 10px;">
                                <button type="button" class="btn btn-warning" id="btnEnviarCorreo" style="width: 100%; background-color: #ffc107; color: #333; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-envelope"></i> Enviar Correo de Restablecimiento
                                </button>
                                <small style="color: #666; display: block; margin-top: 5px;"><i class="fas fa-info-circle"></i> Se enviará un email al usuario con instrucciones para cambiar su contraseña</small>
                            </div>
                        </div>
                    ` : ''}

                    <div class="form-group">
                        <label><i class="fas fa-user-tag"></i> Rol *</label>
                        <select id="rol" name="rol" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="cliente" ${usuario?.rol === 'cliente' ? 'selected' : ''}>Cliente</option>
                            <option value="admin" ${usuario?.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                            <option value="repartidor" ${usuario?.rol === 'repartidor' ? 'selected' : ''}>Repartidor</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label><i class="fas fa-phone"></i> Teléfono</label>
                        <input type="tel" id="telefono" name="telefono" 
                               value="${usuario?.telefono || ''}" 
                               placeholder="+56 9 1234 5678">
                    </div>

                    <div class="form-group">
                        <label><i class="fas fa-map-marker-alt"></i> Dirección</label>
                        <input type="text" id="direccion" name="direccion" 
                               value="${usuario?.direccion || ''}" 
                               placeholder="Calle, número, comuna">
                    </div>

                    ${!esEdicion ? `
                        <div class="checkbox-group" style="margin-top: 15px;">
                            <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="enviarAuth" checked style="width: auto;">
                                <span><i class="fas fa-user-plus"></i> Crear usuario en autenticación</span>
                            </label>
                        </div>
                    ` : ''}
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" onclick="cerrarModalUsuario()">Cancelar</button>
                <button type="submit" class="btn btn-success" form="usuarioForm">
                    ${esEdicion ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </div>
    `;
}

// Función para guardar usuario
async function guardarUsuario(idUsuario = null) {
    const esEdicion = idUsuario !== null;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.querySelector('.modal-footer .btn-success');
    
    // Ocultar mensajes anteriores
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    
    // Deshabilitar botón
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = esEdicion ? 'Actualizando...' : 'Guardando...';
    }
    
    try {
        // Preparar datos del formulario
        const formData = {
            usuario: document.getElementById('usuario')?.value.trim() || null,
            nombre: document.getElementById('nombre')?.value,
            email: document.getElementById('email')?.value,
            rol: document.getElementById('rol')?.value,
            telefono: document.getElementById('telefono')?.value || null,
            direccion: document.getElementById('direccion')?.value || null,
        };

        // Validar campos requeridos
        if (!formData.nombre || !formData.email || !formData.rol) {
            throw new Error('Por favor completa todos los campos requeridos');
        }

        // Validar que el usuario no esté vacío en creación
        if (!esEdicion && !formData.usuario) {
            throw new Error('El nombre de usuario es requerido');
        }

        // Validar que el usuario no exista (solo si se proporcionó)
        if (formData.usuario) {
            let query = supabaseClient
                .from('usuario')
                .select('usuario')
                .eq('usuario', formData.usuario);
            
            // En edición, excluir el usuario actual
            if (esEdicion) {
                query = query.neq('id_usuario', idUsuario);
            }
            
            const { data: usuarioExistente, error: checkError } = await query;
            
            if (checkError) throw checkError;
            
            if (usuarioExistente && usuarioExistente.length > 0) {
                throw new Error('Este nombre de usuario ya está registrado');
            }
        }

        if (esEdicion) {
            // ===== SECCIÓN DE EDICIÓN =====
            
            // Actualizar datos básicos del usuario
            const { error: errorAlActualizar } = await supabaseClient
                .from('usuario')
                .update(formData)
                .eq('id_usuario', idUsuario);

            if (errorAlActualizar) throw errorAlActualizar;

            // Mostrar mensaje apropiado
            if (successMessage) {
                successMessage.textContent = 'Usuario actualizado correctamente';
                successMessage.style.display = 'block';
            }
            // ===== FIN SECCIÓN DE EDICIÓN =====
            
        } else {
            // CREAR NUEVO USUARIO
            const password = document.getElementById('password')?.value;
            
            if (!password) {
                throw new Error('La contraseña es requerida');
            }

            const crearEnAuth = document.getElementById('enviarAuth')?.checked || false;
            let userId = null;

            if (crearEnAuth) {
                try {
                    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                        email: formData.email,
                        password: password,
                    });

                    if (authError) {
                        if (authError.message.includes('User already registered')) {
                            console.log('Usuario ya existe en Auth, buscando ID...');
                            
                            const { data: usuarioExistente, error: searchError } = await supabaseClient
                                .from('usuario')
                                .select('id_usuario')
                                .eq('email', formData.email)
                                .maybeSingle();
                            
                            if (searchError) throw searchError;
                            
                            if (usuarioExistente) {
                                userId = usuarioExistente.id_usuario;
                            } else {
                                throw new Error('El correo ya está registrado en autenticación pero no existe en la tabla usuarios');
                            }
                        } else {
                            throw authError;
                        }
                    } else {
                        userId = authData.user.id;
                    }
                } catch (error) {
                    throw error;
                }
            }

            const usuarioData = {
                ...formData,
                id_usuario: userId,
                fecha_registro: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('usuario')
                .insert([usuarioData]);

            if (error) throw error;

            if (successMessage) {
                successMessage.textContent = 'Usuario agregado correctamente';
                successMessage.style.display = 'block';
            }
        }

        if (!esEdicion && document.getElementById('usuarioForm')) {
            document.getElementById('usuarioForm').reset();
        }

        setTimeout(() => {
            cerrarModalUsuario();
            cargarUsuarios();
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = esEdicion ? 'Actualizar' : 'Guardar';
        }
    }
}

// Función para ver detalles del usuario
window.verDetallesUsuario = async function(idUsuario) {
    try {
        const { data: usuario, error } = await supabaseClient
            .from('usuario')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (error) throw error;

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const modalDetalles = document.createElement('div');
        modalDetalles.className = 'modal';
        modalDetalles.id = 'modalDetalles';
        
        modalDetalles.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>Detalles del Usuario</h3>
                    <span class="modal-close" onclick="cerrarModalDetalles()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <i class="fas fa-user-circle" style="font-size: 80px; color: #1e3c72;"></i>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px; font-weight: bold; width: 40%;"><i class="fas fa-user"></i> Usuario:</td>
                            <td style="padding: 10px;"><strong>${usuario.usuario || 'No disponible'}</strong></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px; font-weight: bold;"><i class="fas fa-id-card"></i> Nombre:</td>
                            <td style="padding: 10px;">${usuario.nombre || 'No disponible'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px; font-weight: bold;"><i class="fas fa-envelope"></i> Email:</td>
                            <td style="padding: 10px;">${usuario.email || 'No disponible'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px; font-weight: bold;"><i class="fas fa-user-tag"></i> Rol:</td>
                            <td style="padding: 10px;">
                                <span class="status-badge status-${usuario.rol || 'cliente'}">${usuario.rol || 'cliente'}</span>
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px; font-weight: bold;"><i class="fas fa-phone"></i> Teléfono:</td>
                            <td style="padding: 10px;">${usuario.telefono || 'No registrado'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 10px; font-weight: bold;"><i class="fas fa-map-marker-alt"></i> Dirección:</td>
                            <td style="padding: 10px;">${usuario.direccion || 'No registrada'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;"><i class="fas fa-calendar-alt"></i> Fecha Registro:</td>
                            <td style="padding: 10px;">${usuario.fecha_registro ? new Date(usuario.fecha_registro).toLocaleString() : 'No disponible'}</td>
                        </tr>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="cerrarModalDetalles()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalDetalles);
        
        setTimeout(() => {
            modalDetalles.classList.add('show');
        }, 10);
        
        modalDetalles.addEventListener('click', (e) => {
            if (e.target === modalDetalles) {
                cerrarModalDetalles();
            }
        });
        
    } catch (error) {
        console.error('Error al cargar detalles del usuario:', error);
        alert('Error al cargar detalles del usuario: ' + error.message);
    }
};

// Función para cerrar modal de detalles
window.cerrarModalDetalles = function() {
    const modal = document.getElementById('modalDetalles');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Función para editar usuario
window.editarUsuario = async function(idUsuario) {
    try {
        const { data: usuario, error } = await supabaseClient
            .from('usuario')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (error) throw error;

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        window.mostrarFormularioUsuario(usuario);
        
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        alert('Error al cargar datos del usuario: ' + error.message);
    }
};

// Función para eliminar usuario
window.eliminarUsuario = async function(idUsuario) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('usuario')
            .delete()
            .eq('id_usuario', idUsuario);

        if (error) throw error;

        await cargarUsuarios();
        mostrarToast('Éxito', 'Usuario eliminado correctamente');
        
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar usuario: ' + error.message);
    }
};

// Función para cerrar modal
window.cerrarModalUsuario = function() {
    if (modalUsuario) {
        modalUsuario.classList.remove('show');
    }
};

// Función auxiliar para mostrar error en el formulario
function mostrarError(mensaje) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        errorMessage.style.display = 'block';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Función auxiliar para mostrar toast
function mostrarToast(titulo, mensaje) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s;
        max-width: 300px;
        border-left: 4px solid #28a745;
    `;
    toast.innerHTML = `
        <strong><i class="fas fa-check-circle" style="color: #28a745;"></i> ${titulo}</strong><br>
        <small>${mensaje}</small>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Función debounce para evitar muchas llamadas a la API
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Asegurar que las funciones estén disponibles globalmente
window.cargarUsuarios = cargarUsuarios;
window.filtrarUsuarios = filtrarUsuarios;