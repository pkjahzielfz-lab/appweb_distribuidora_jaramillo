function loginTemplate() {
    return `
        <div class="login-container">
            <div class="login-card animate__animated animate__fadeIn">
                <div class="login-header">
                    <!-- LOGOTIPO AGREGADO AQUÍ -->
                    <div class="logo-image-container">
                        <img src="logotipoJaramillo/logotipooficialdj.png" alt="Distribuidora Jaramillo" class="logo-image">
                    </div>
                </div>
                
                <form id="loginForm" class="login-form">
                    <div class="form-group animate__animated animate__fadeInLeft">
                        <label><i class="fas fa-user"></i> Usuario</label>
                        <div class="input-container">
                            <input type="text" id="username" placeholder="Ingresa tu usuario" required autocomplete="username">
                            <i class="fas fa-check-circle input-icon" id="usernameCheck" style="display: none;"></i>
                        </div>
                    </div>
                    
                    <div class="form-group animate__animated animate__fadeInRight">
                        <label><i class="fas fa-lock"></i> Contraseña</label>
                        <div class="password-container">
                            <input type="password" id="password" placeholder="••••••••" required autocomplete="current-password">
                            <span class="toggle-password" onclick="togglePasswordVisibility()">
                                <i class="fas fa-eye"></i>
                            </span>
                        </div>
                    </div>

                    <div class="form-options animate__animated animate__fadeInUp">
                        <label class="checkbox-label">
                            <input type="checkbox" id="rememberMe">
                            <span>Recordarme</span>
                        </label>
                        <a href="#" class="forgot-password" onclick="handleForgotPassword()">¿Olvidaste tu contraseña?</a>
                    </div>

                    <button type="submit" class="btn btn-primary" id="btnLogin">
                        <span class="btn-text">Iniciar Sesión</span>
                        <span class="btn-loader" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i> Validando...
                        </span>
                        <i class="fas fa-arrow-right btn-icon"></i>
                    </button>
                </form>

                <div class="login-footer">
                    <p class="version">Versión 2.0.0 - Sistema de Administración Jahziel FZ</p>
                </div>
            </div>
        </div>
    `;
}

// === MODIFICADO: Configurar el evento del formulario ===
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.removeEventListener('submit', handleLoginSubmit);
        loginForm.addEventListener('submit', handleLoginSubmit);
        console.log('✅ Evento de login configurado para usar usuario');
    }
}

// === MODIFICADO: Manejador del envío del formulario ===
function handleLoginSubmit(e) {
    e.preventDefault();
    
    const btnLogin = document.getElementById('btnLogin');
    if (!btnLogin) return;
    
    const btnText = btnLogin.querySelector('.btn-text');
    const btnLoader = btnLogin.querySelector('.btn-loader');
    const btnIcon = btnLogin.querySelector('.btn-icon');
    
    // Mostrar loader
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    if (btnIcon) btnIcon.style.display = 'none';
    btnLogin.disabled = true;
    
    console.log('🔄 Validando credenciales con usuario...');
    
    // Obtener los valores del formulario
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Aquí necesitas modificar app.js para que acepte usuario en lugar de email
    // Por ahora, emitimos un evento personalizado que app.js puede escuchar
    const loginEvent = new CustomEvent('loginWithUsername', {
        detail: { username, password }
    });
    document.dispatchEvent(loginEvent);
}

// === MODIFICADO: Validar campo de usuario en tiempo real ===
window.validateUsername = function(username) {
    const usernameCheck = document.getElementById('usernameCheck');
    
    if (username && username.length >= 3) {
        usernameCheck.style.display = 'block';
        usernameCheck.style.color = '#28a745';
        return true;
    } else {
        usernameCheck.style.display = 'none';
        return false;
    }
};

// Función para mostrar/ocultar contraseña
window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
};

// === MODIFICADO: Función para manejar "Olvidé mi contraseña" ===
window.handleForgotPassword = function() {
    // Ya no usamos el email del campo de usuario, mostramos modal para ingresar email
    showForgotPasswordModal();
};

// === MODIFICADO: Función para mostrar modal de recuperación ===
function showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'forgotPasswordModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Recuperar Contraseña</h3>
                <span class="modal-close" onclick="closeForgotPasswordModal()">&times;</span>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px;">Ingresa tu correo electrónico para recibir el enlace de recuperación:</p>
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="resetEmail" placeholder="tu@email.com" required>
                </div>
                <p style="color: #666; font-size: 12px; margin-bottom: 20px;">
                    <i class="fas fa-info-circle"></i>
                    El enlace expirará en 1 hora
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-danger" onclick="closeForgotPasswordModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="sendResetEmail()">
                    <i class="fas fa-paper-plane"></i> Enviar Enlace
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Función para cerrar modal
window.closeForgotPasswordModal = function() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Función para enviar email de recuperación (sin cambios)
window.sendResetEmail = async function() {
    const email = document.getElementById('resetEmail').value;
    const submitBtn = document.querySelector('#forgotPasswordModal .btn-primary');
    
    if (!email || !email.includes('@')) {
        mostrarToast('Por favor ingresa un email válido', 'warning');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset_password.html',
        });
        
        if (error) throw error;
        
        closeForgotPasswordModal();
        mostrarToast(`Enlace enviado a ${email}`, 'success');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Enlace';
    }
};

// Función para manejar registro
window.handleRegister = function() {
    mostrarToast('Función de registro próximamente', 'info');
};

// Función mejorada para mostrar toast (sin cambios)
function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        border-left: 4px solid ${colors[tipo]};
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    toast.innerHTML = `
        <i class="fas ${icons[tipo]}" style="color: ${colors[tipo]}; font-size: 20px;"></i>
        <div style="flex: 1;">
            <strong style="color: ${colors[tipo]}; text-transform: capitalize;">${tipo}</strong>
            <div style="font-size: 14px; color: #666;">${mensaje}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Inicializar cuando se carga el template
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(setupLoginForm, 100);
        // Agregar evento para validar username en tiempo real
        document.addEventListener('input', function(e) {
            if (e.target.id === 'username') {
                window.validateUsername(e.target.value);
            }
        });
    });
} else {
    setTimeout(setupLoginForm, 100);
    document.addEventListener('input', function(e) {
        if (e.target.id === 'username') {
            window.validateUsername(e.target.value);
        }
    });
}

// Mantener las animaciones CSS sin cambios
const style = document.createElement('style');
style.textContent = `
    /* ESTILOS PARA EL LOGOTIPO MODIFICADO - MÁS GRANDE */
    .logo-image-container {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .logo-image {
        max-width: 180px;
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .animate__animated {
        animation-duration: 0.5s;
        animation-fill-mode: both;
    }
    
    .animate__fadeIn {
        animation-name: fadeIn;
    }
    
    .animate__fadeInLeft {
        animation-name: fadeInLeft;
    }
    
    .animate__fadeInRight {
        animation-name: fadeInRight;
    }
    
    .animate__fadeInUp {
        animation-name: fadeInUp;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes fadeInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .gradient-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .logo-animation {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
    
    .input-container {
        position: relative;
    }
    
    .input-icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #28a745;
    }
    
    .password-container {
        position: relative;
    }
    
    .toggle-password {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        color: #666;
        transition: color 0.3s;
    }
    
    .toggle-password:hover {
        color: #333;
    }
    
    .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 20px 0;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        color: #666;
    }
    
    .forgot-password {
        color: #667eea;
        text-decoration: none;
        font-size: 14px;
        transition: color 0.3s;
    }
    
    .forgot-password:hover {
        color: #764ba2;
        text-decoration: underline;
    }
    
    .social-login {
        margin-top: 30px;
        text-align: center;
    }
    
    .social-text {
        color: #999;
        font-size: 14px;
        margin-bottom: 15px;
        position: relative;
    }
    
    .social-text::before,
    .social-text::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 30%;
        height: 1px;
        background: #e0e0e0;
    }
    
    .social-text::before {
        left: 0;
    }
    
    .social-text::after {
        right: 0;
    }
    
    .social-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
    }
    
    .social-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.3s, box-shadow 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .social-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .social-btn.google {
        background: #fff;
        color: #333;
        border: 1px solid #ddd;
    }
    
    .social-btn.facebook {
        background: #1877f2;
        color: white;
    }
    
    .social-btn.apple {
        background: #000;
        color: white;
    }
    
    .login-footer {
        margin-top: 20px;
        text-align: center;
    }
    
    .login-footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
    }
    
    .login-footer a:hover {
        text-decoration: underline;
    }
    
    .version {
        margin-top: 10px;
        color: #999;
        font-size: 11px;
    }
    
    .btn-loader {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .btn-loader i {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;

document.head.appendChild(style);