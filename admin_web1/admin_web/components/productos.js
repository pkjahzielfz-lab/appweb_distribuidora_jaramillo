// productos.js - VISTA DE PRODUCTOS PARA ADMINISTRADOR
// Versión completa con subida de imágenes desde archivo y recorte de imágenes

// ============================================
// VARIABLE GLOBAL PARA EL RECORTADOR
// ============================================
let cropper = null;

// ============================================
// VARIABLES PARA FILTROS Y BÚSQUEDA
// ============================================
let productosOriginales = [];
let categoriaActual = 'Todo';
let terminoBusqueda = '';
let timeoutBusqueda = null;

// ============================================
// FUNCIÓN PRINCIPAL PARA CARGAR PRODUCTOS
// ============================================
async function cargarProductos(opciones = {}) {
    const content = document.getElementById('content');
    
    try {
        content.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando productos...</p></div>';
        
        let query = supabaseClient
            .from('producto')
            .select('*')
            .order('nombre');
        
        // Si viene de la tarjeta "Stock Bajo", filtrar productos con stock < 10
        if (opciones.stockBajo) {
            query = query.lt('stock_actual', 10);
        }
        
        const { data: productos, error } = await query;
        
        if (error) throw error;
        
        productosOriginales = productos || [];
        categoriaActual = 'Todo';
        terminoBusqueda = '';
        
        content.innerHTML = productosTemplate(productosOriginales);
        
        // Inicializar el input de búsqueda
        inicializarBusqueda();
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        content.innerHTML = '<div style="text-align: center; padding: 50px; color: red;">Error al cargar productos</div>';
    }
}

// ============================================
// FUNCIÓN PARA INICIALIZAR LA BÚSQUEDA
// ============================================
function inicializarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = terminoBusqueda;
        searchInput.removeEventListener('input', manejarInputBusqueda);
        searchInput.addEventListener('input', manejarInputBusqueda);
    }
}

// Manejador para el evento input
function manejarInputBusqueda(e) {
    terminoBusqueda = e.target.value;
    
    if (timeoutBusqueda) {
        clearTimeout(timeoutBusqueda);
    }
    
    timeoutBusqueda = setTimeout(() => {
        filtrarProductosSinRecargarInput();
    }, 300);
}

// ============================================
// FUNCIÓN PARA FILTRAR PRODUCTOS SIN RECARGAR EL INPUT
// ============================================
function filtrarProductosSinRecargarInput() {
    let productosFiltrados = [...productosOriginales];
    
    if (categoriaActual !== 'Todo') {
        productosFiltrados = productosFiltrados.filter(p => 
            p.categoria && p.categoria.toLowerCase() === categoriaActual.toLowerCase()
        );
    }
    
    if (terminoBusqueda.trim() !== '') {
        const termino = terminoBusqueda.toLowerCase().trim();
        productosFiltrados = productosFiltrados.filter(p => 
            (p.nombre && p.nombre.toLowerCase().includes(termino)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(termino)) ||
            (p.marca && p.marca.toLowerCase().includes(termino))
        );
    }
    
    actualizarProductosGrid(productosFiltrados);
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-categoria') === categoriaActual) {
            btn.classList.add('active');
        }
    });
    
    actualizarTextoResultados(productosFiltrados.length);
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR SOLO LA GRID DE PRODUCTOS
// ============================================
function actualizarProductosGrid(productos) {
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.innerHTML = productos.map(p => `
            <div class="product-card" data-id="${p.id_producto}">
                <span class="stock-indicator ${p.stock_actual <= 0 ? 'stock-out' : (p.stock_actual < 10 ? 'stock-low' : 'stock-ok')}"></span>
                ${p.categoria ? `
                    <span style="position: absolute; top: 10px; left: 10px; background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; z-index: 1;">
                        ${p.categoria}
                    </span>
                ` : ''}
                <div class="product-image">
                    ${p.imagen_url ? 
                        `<img src="${p.imagen_url}" alt="${p.nombre}" style="object-fit: contain; width: 100%; height: 100%;" 
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'50\\' y=\\'50\\' font-family=\\'Arial\\' font-size=\\'14\\' fill=\\'%23999\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3ESin imagen%3C/text%3E%3C/svg%3E';">` : 
                        '<i class="fas fa-box" style="font-size: 50px; color: #ccc;"></i>'
                    }
                </div>
                <div class="product-name">${p.nombre}</div>
                <div class="product-price">$${(p.precio_por_paquete || p.precio || 0).toFixed(2)}</div>
                <div class="product-stock ${p.stock_actual <= 0 ? 'stock-agotado-texto' : ''}">
                    ${p.stock_actual <= 0 ? '🚫 AGOTADO' : `Stock: ${p.stock_actual} unidades`}
                </div>
                <div class="product-actions">
                    <button class="btn-icon btn-edit" onclick="editarProducto(${p.id_producto})" title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="eliminarProducto(${p.id_producto})" title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        if (productos.length === 0) {
            const hayFiltrosActivos = categoriaActual !== 'Todo' || terminoBusqueda.trim() !== '';
            productGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search fa-3x"></i>
                    <p>No se encontraron productos</p>
                    ${hayFiltrosActivos ? `
                        <button class="btn btn-secondary" onclick="limpiarFiltros()">
                            <i class="fas fa-times"></i> Limpiar filtros
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="mostrarFormularioProducto()">
                            Crear primer producto
                        </button>
                    `}
                </div>
            `;
        }
    }
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR EL TEXTO DE RESULTADOS
// ============================================
function actualizarTextoResultados(cantidad) {
    const resultadosDiv = document.querySelector('.resultados-info');
    if (resultadosDiv) {
        const hayFiltrosActivos = categoriaActual !== 'Todo' || terminoBusqueda.trim() !== '';
        resultadosDiv.innerHTML = `
            Mostrando ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}
            ${categoriaActual !== 'Todo' ? ` en ${categoriaActual}` : ''}
            ${terminoBusqueda ? ` que coinciden con "${terminoBusqueda}"` : ''}
            ${hayFiltrosActivos ? `
                <button onclick="limpiarFiltros()" style="margin-left: 15px; background: none; border: none; color: #e74c3c; cursor: pointer; text-decoration: underline; font-size: 13px;">
                    <i class="fas fa-times"></i> Limpiar filtros
                </button>
            ` : ''}
        `;
    }
}

function filtrarProductos() {
    filtrarProductosSinRecargarInput();
}

function cambiarCategoria(categoria) {
    categoriaActual = categoria;
    filtrarProductosSinRecargarInput();
}

function limpiarBusqueda() {
    terminoBusqueda = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    filtrarProductosSinRecargarInput();
}

function limpiarFiltros() {
    categoriaActual = 'Todo';
    terminoBusqueda = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    filtrarProductosSinRecargarInput();
}

// ============================================
// TEMPLATE PARA LA VISTA DE PRODUCTOS
// ============================================
function productosTemplate(productos) {
    const hayFiltrosActivos = categoriaActual !== 'Todo' || terminoBusqueda.trim() !== '';
    
    return `
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Gestión de Productos</h3>
                <button class="btn btn-primary" onclick="mostrarFormularioProducto()">
                    <i class="fas fa-plus"></i> Nuevo Producto
                </button>
            </div>
            
            <div style="padding: 20px 20px 0 20px;">
                <div style="position: relative; margin-bottom: 15px;">
                    <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #999; z-index: 1;"></i>
                    <input type="text" 
                           id="searchInput"
                           class="search-input" 
                           placeholder="Buscar por nombre, descripción o marca..." 
                           autocomplete="off"
                           spellcheck="false"
                           style="width: 100%; padding: 12px 40px 12px 45px; border: 2px solid #e0e0e0; border-radius: 25px; font-size: 16px; transition: all 0.3s;">
                    ${terminoBusqueda ? `
                        <button onclick="limpiarBusqueda()" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #999; cursor: pointer; padding: 5px; z-index: 2;">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div style="padding: 0 20px 20px 20px; display: flex; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid #eee;">
                <button class="category-btn ${categoriaActual === 'Todo' ? 'active' : ''}" data-categoria="Todo" onclick="cambiarCategoria('Todo')" style="padding: 10px 20px; border: 2px solid #e0e0e0; background: ${categoriaActual === 'Todo' ? '#2ecc71' : 'white'}; color: ${categoriaActual === 'Todo' ? 'white' : '#666'}; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-th-large"></i> Todo
                </button>
                <button class="category-btn ${categoriaActual === 'Cerveza' ? 'active' : ''}" data-categoria="Cerveza" onclick="cambiarCategoria('Cerveza')" style="padding: 10px 20px; border: 2px solid #e0e0e0; background: ${categoriaActual === 'Cerveza' ? '#2ecc71' : 'white'}; color: ${categoriaActual === 'Cerveza' ? 'white' : '#666'}; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-beer"></i> Cerveza
                </button>
                <button class="category-btn ${categoriaActual === 'Refresco' ? 'active' : ''}" data-categoria="Refresco" onclick="cambiarCategoria('Refresco')" style="padding: 10px 20px; border: 2px solid #e0e0e0; background: ${categoriaActual === 'Refresco' ? '#2ecc71' : 'white'}; color: ${categoriaActual === 'Refresco' ? 'white' : '#666'}; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-glass-cheers"></i> Refresco
                </button>
                <button class="category-btn ${categoriaActual === 'Botana' ? 'active' : ''}" data-categoria="Botana" onclick="cambiarCategoria('Botana')" style="padding: 10px 20px; border: 2px solid #e0e0e0; background: ${categoriaActual === 'Botana' ? '#2ecc71' : 'white'}; color: ${categoriaActual === 'Botana' ? 'white' : '#666'}; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-cookie"></i> Botana
                </button>
                <button class="category-btn ${categoriaActual === 'Agua' ? 'active' : ''}" data-categoria="Agua" onclick="cambiarCategoria('Agua')" style="padding: 10px 20px; border: 2px solid #e0e0e0; background: ${categoriaActual === 'Agua' ? '#2ecc71' : 'white'}; color: ${categoriaActual === 'Agua' ? 'white' : '#666'}; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-tint"></i> Agua
                </button>
            </div>
            
            <div class="resultados-info" style="padding: 10px 20px; color: #666; font-size: 14px; background: #f9f9f9;">
                Mostrando ${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}
                ${categoriaActual !== 'Todo' ? ` en ${categoriaActual}` : ''}
                ${terminoBusqueda ? ` que coinciden con "${terminoBusqueda}"` : ''}
                ${hayFiltrosActivos ? `
                    <button onclick="limpiarFiltros()" style="margin-left: 15px; background: none; border: none; color: #e74c3c; cursor: pointer; text-decoration: underline; font-size: 13px;">
                        <i class="fas fa-times"></i> Limpiar filtros
                    </button>
                ` : ''}
            </div>
            
            <div class="product-grid">
                ${productos.map(p => `
                    <div class="product-card" data-id="${p.id_producto}">
                        <span class="stock-indicator ${p.stock_actual <= 0 ? 'stock-out' : (p.stock_actual < 10 ? 'stock-low' : 'stock-ok')}"></span>
                        ${p.categoria ? `
                            <span style="position: absolute; top: 10px; left: 10px; background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; z-index: 1;">
                                ${p.categoria}
                            </span>
                        ` : ''}
                        <div class="product-image">
                            ${p.imagen_url ? 
                                `<img src="${p.imagen_url}" alt="${p.nombre}" style="object-fit: contain; width: 100%; height: 100%;" 
                                    onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'50\\' y=\\'50\\' font-family=\\'Arial\\' font-size=\\'14\\' fill=\\'%23999\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3ESin imagen%3C/text%3E%3C/svg%3E';">` : 
                                '<i class="fas fa-box" style="font-size: 50px; color: #ccc;"></i>'
                            }
                        </div>
                        <div class="product-name">${p.nombre}</div>
                        <div class="product-price">$${(p.precio_por_paquete || p.precio || 0).toFixed(2)}</div>
                        <div class="product-stock ${p.stock_actual <= 0 ? 'stock-agotado-texto' : ''}">
                            ${p.stock_actual <= 0 ? '🚫 AGOTADO' : `Stock: ${p.stock_actual} unidades`}
                        </div>
                        <div class="product-actions">
                            <button class="btn-icon btn-edit" onclick="editarProducto(${p.id_producto})" title="Editar producto">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="eliminarProducto(${p.id_producto})" title="Eliminar producto">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
                
                ${productos.length === 0 ? `
                    <div class="no-products">
                        <i class="fas fa-search fa-3x"></i>
                        <p>No se encontraron productos</p>
                        ${hayFiltrosActivos ? `
                            <button class="btn btn-secondary" onclick="limpiarFiltros()">
                                <i class="fas fa-times"></i> Limpiar filtros
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="mostrarFormularioProducto()">
                                Crear primer producto
                            </button>
                        `}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================
// FUNCIÓN PARA SUBIR IMAGEN A SUPABASE STORAGE
// ============================================
async function subirImagen(file, productoId = null) {
    if (!file) return null;
    
    try {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            throw new Error('Tipo de archivo no permitido. Usa JPG, PNG, GIF o WEBP');
        }
        
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('La imagen no debe exceder 5MB');
        }
        
        const timestamp = Date.now();
        const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `productos/${productoId || 'nuevo'}_${timestamp}_${nombreLimpio}`;
        
        console.log('📤 Subiendo imagen:', fileName);
        
        const { data, error } = await supabaseClient.storage
            .from('imagenes-productos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Error detallado:', error);
            throw error;
        }
        
        console.log('✅ Imagen subida:', data);
        
        const { data: { publicUrl } } = supabaseClient.storage
            .from('imagenes-productos')
            .getPublicUrl(fileName);
        
        console.log('🔗 URL generada:', publicUrl);
        
        return publicUrl;
        
    } catch (error) {
        console.error('❌ Error al subir imagen:', error);
        throw new Error('Error al subir la imagen: ' + error.message);
    }
}

// ============================================
// FUNCIÓN PARA ELIMINAR IMAGEN DEL STORAGE
// ============================================
async function eliminarImagenStorage(url) {
    if (!url) return;
    
    try {
        const urlParts = url.split('/');
        const fileName = urlParts.slice(urlParts.indexOf('imagenes-productos') + 1).join('/');
        
        if (!fileName) return;
        
        console.log('🗑️ Eliminando imagen:', fileName);
        
        const { error } = await supabaseClient.storage
            .from('imagenes-productos')
            .remove([fileName]);
        
        if (error) console.error('Error al eliminar imagen:', error);
        else console.log('✅ Imagen eliminada');
        
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
    }
}

// ============================================
// FUNCIÓN PARA INICIAR RECORTE DE IMAGEN
// ============================================
function iniciarRecorteImagen(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
        mostrarNotificacion('Tipo de archivo no permitido. Usa JPG, PNG, GIF o WEBP', 'error');
        event.target.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('La imagen no debe exceder 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('cropImage');
        img.src = e.target.result;
        
        const modal = document.getElementById('cropModal');
        if (modal) {
            modal.style.display = 'flex';
        }
        
        img.onload = function() {
            if (cropper) {
                cropper.destroy();
            }
            
            cropper = new Cropper(img, {
                viewMode: 1,
                aspectRatio: NaN,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                background: false,
                modal: true,
                rotatable: true,
                scalable: true,
                zoomable: true,
                zoomOnWheel: true
            });
        };
    };
    reader.readAsDataURL(file);
}

function aplicarRecorte() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 1200,
        maxHeight: 1200
    });
    
    const imagenRecortada = canvas.toDataURL('image/jpeg', 0.9);
    
    const imagenRecortadaField = document.getElementById('imagen_recortada');
    if (imagenRecortadaField) {
        imagenRecortadaField.value = imagenRecortada;
    }
    
    const previewContainer = document.getElementById('imagePreviewLarge');
    if (previewContainer) {
        previewContainer.innerHTML = `<img src="${imagenRecortada}" alt="Vista previa" id="previewImg" style="width: 100%; height: auto; object-fit: contain;">`;
    }
    
    const imagenFile = document.getElementById('imagen_file');
    if (imagenFile) {
        imagenFile.value = '';
    }
    
    cerrarModalRecorte();
    
    mostrarNotificacion('Imagen procesada correctamente', 'success');
}

function cerrarModalRecorte() {
    const modal = document.getElementById('cropModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    const imagenFile = document.getElementById('imagen_file');
    if (imagenFile) {
        imagenFile.value = '';
    }
}

function mostrarFormularioProducto(producto = null) {
    const modalExistente = document.getElementById('modalProducto');
    if (modalExistente) modalExistente.remove();
    
    const modalHTML = `
        <div class="modal-overlay" id="modalProducto">
            <div class="modal-container" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>${producto ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button class="btn-icon" onclick="cerrarModalProducto()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formProducto" onsubmit="guardarProducto(event, ${producto?.id_producto || 'null'})">
                        <div class="form-group">
                            <label>Nombre del producto *</label>
                            <input type="text" id="nombre" value="${producto?.nombre || ''}" required 
                                placeholder="Ej: Coca-Cola, Corona, etc.">
                        </div>
                        
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="descripcion" rows="3" placeholder="Descripción del producto...">${producto?.descripcion || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Stock actual *</label>
                            <input type="number" id="stock" min="0" 
                                value="${producto?.stock_actual || 0}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Imagen del producto</label>
                            <div class="image-upload-container">
                                <div class="image-preview-large" id="imagePreviewLarge">
                                    ${producto?.imagen_url ? 
                                        `<img src="${producto.imagen_url}" alt="Vista previa" id="previewImg" style="width: 100%; height: auto; object-fit: contain;">` : 
                                        '<div class="preview-placeholder"><i class="fas fa-image"></i><span>Selecciona una imagen</span></div>'
                                    }
                                </div>
                                <div class="upload-controls">
                                    <input type="file" id="imagen_file" accept="image/*" onchange="iniciarRecorteImagen(event)">
                                    <small class="form-help">
                                        <i class="fas fa-info-circle"></i>
                                        Selecciona una imagen y podrás recortarla
                                    </small>
                                    ${producto?.imagen_url ? `
                                        <div class="current-image-info">
                                            <small>Imagen actual: ${producto.imagen_url.split('/').pop()}</small>
                                            <button type="button" class="btn-link" onclick="eliminarImagenActual(${producto.id_producto})">
                                                <i class="fas fa-times"></i> Eliminar imagen
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div id="cropModal" class="crop-modal" style="display: none;">
                                <div class="crop-modal-content">
                                    <div class="crop-modal-header">
                                        <h4>Recortar imagen</h4>
                                        <button type="button" class="btn-icon" onclick="cerrarModalRecorte()">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="crop-modal-body">
                                        <div class="crop-container">
                                            <img id="cropImage" src="" alt="Imagen para recortar">
                                        </div>
                                        <div class="crop-controls">
                                            <button type="button" class="btn btn-secondary" onclick="cerrarModalRecorte()">
                                                Cancelar
                                            </button>
                                            <button type="button" class="btn btn-primary" onclick="aplicarRecorte()">
                                                <i class="fas fa-crop"></i> Aplicar recorte
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <input type="hidden" id="imagen_recortada" value="">
                            <input type="hidden" id="imagen_url" value="${producto?.imagen_url || ''}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Marca</label>
                                <input type="text" id="marca" value="${producto?.marca || ''}" 
                                    placeholder="Ej: Coca-Cola, Modelo, etc.">
                            </div>
                            
                            <div class="form-group">
                                <label>Categoría</label>
                                <select id="categoria" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                                    <option value="">Selecciona una categoría</option>
                                    <option value="Cerveza" ${producto?.categoria === 'Cerveza' ? 'selected' : ''}>Cerveza</option>
                                    <option value="Refresco" ${producto?.categoria === 'Refresco' ? 'selected' : ''}>Refresco</option>
                                    <option value="Botana" ${producto?.categoria === 'Botana' ? 'selected' : ''}>Botana</option>
                                    <option value="Agua" ${producto?.categoria === 'Agua' ? 'selected' : ''}>Agua</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4>Detalles adicionales</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Capacidad/Volumen</label>
                                    <input type="text" id="capacidad" value="${producto?.capacidad_volumen || ''}" 
                                        placeholder="Ej: 355, 500, 1000">
                                </div>
                                
                                <div class="form-group">
                                    <label>Unidad de medida</label>
                                    <select id="unidad_medida">
                                        <option value="ml" ${producto?.unidad_medida === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                                        <option value="l" ${producto?.unidad_medida === 'l' ? 'selected' : ''}>Litros (l)</option>
                                        <option value="oz" ${producto?.unidad_medida === 'oz' ? 'selected' : ''}>Onzas (oz)</option>
                                        <option value="g" ${producto?.unidad_medida === 'g' ? 'selected' : ''}>Gramos (g)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Piezas por paquete</label>
                                    <input type="number" id="piezas_paquete" min="1" 
                                        value="${producto?.piezas_por_paquete || 1}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Precio por paquete *</label>
                                    <input type="number" id="precio_paquete" step="0.01" min="0" 
                                        value="${producto?.precio_por_paquete || ''}" 
                                        placeholder="0.00" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="cerrarModalProducto()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${producto ? 'Actualizar' : 'Guardar'} Producto
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function guardarProducto(event, idProducto = null) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        let imagenUrl = document.getElementById('imagen_url').value;
        const imagenRecortada = document.getElementById('imagen_recortada').value;
        
        if (imagenRecortada) {
            if (imagenUrl) {
                await eliminarImagenStorage(imagenUrl);
            }
            
            const blob = await fetch(imagenRecortada).then(res => res.blob());
            const file = new File([blob], `producto_${Date.now()}.jpg`, { type: 'image/jpeg' });
            imagenUrl = await subirImagen(file, idProducto);
        }
        
        const precioPaquete = document.getElementById('precio_paquete').value;
        
        const productoData = {
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim() || null,
            precio: precioPaquete ? parseFloat(precioPaquete) : 0,
            stock_actual: parseInt(document.getElementById('stock').value),
            imagen_url: imagenUrl,
            marca: document.getElementById('marca').value.trim() || null,
            categoria: document.getElementById('categoria').value || null,
            capacidad_volumen: document.getElementById('capacidad').value.trim() || null,
            unidad_medida: document.getElementById('unidad_medida').value,
            piezas_por_paquete: parseInt(document.getElementById('piezas_paquete').value) || 1,
            precio_por_paquete: precioPaquete ? parseFloat(precioPaquete) : null
        };
        
        if (!productoData.nombre) throw new Error('El nombre es requerido');
        if (!precioPaquete || parseFloat(precioPaquete) <= 0) throw new Error('El precio por paquete debe ser mayor a 0');
        if (productoData.stock_actual < 0) throw new Error('El stock no puede ser negativo');
        
        let error;
        
        if (idProducto) {
            ({ error } = await supabaseClient
                .from('producto')
                .update(productoData)
                .eq('id_producto', idProducto));
        } else {
            ({ error } = await supabaseClient
                .from('producto')
                .insert([productoData]));
        }
        
        if (error) throw error;
        
        cerrarModalProducto();
        await cargarProductos();
        mostrarNotificacion(`Producto ${idProducto ? 'actualizado' : 'creado'} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        mostrarNotificacion(error.message || 'Error al guardar el producto', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function editarProducto(idProducto) {
    try {
        const { data: producto, error } = await supabaseClient
            .from('producto')
            .select('*')
            .eq('id_producto', idProducto)
            .single();
        
        if (error) throw error;
        mostrarFormularioProducto(producto);
        
    } catch (error) {
        console.error('Error al cargar producto para editar:', error);
        mostrarNotificacion('Error al cargar los datos del producto', 'error');
    }
}

// ============================================
// FUNCIÓN PARA ELIMINAR PRODUCTO (CORREGIDA - CON DETALLE_PEDIDO)
// ============================================
async function eliminarProducto(idProducto) {
    const modalConfirmacion = document.createElement('div');
    modalConfirmacion.className = 'modal-overlay';
    modalConfirmacion.id = 'modalConfirmacionEliminar';
    modalConfirmacion.style.zIndex = '2000';
    
    modalConfirmacion.innerHTML = `
        <div class="modal-container" style="max-width: 450px;">
            <div class="modal-header" style="border-bottom: none; padding-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 20px;"></i>
                    </div>
                    <h3 style="margin: 0; color: #1f2937;">Confirmar eliminación</h3>
                </div>
                <button class="btn-icon" onclick="cerrarModalConfirmacion()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding-top: 0;">
                <div style="margin-bottom: 20px;">
                    <p style="color: #4b5563; margin-bottom: 15px; font-size: 15px;">
                        ¿Estás seguro de que deseas eliminar este producto?
                    </p>
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 15px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; display: flex; gap: 8px;">
                            <i class="fas fa-info-circle" style="margin-top: 2px;"></i>
                            <span>Esta acción es permanente y no se puede deshacer. Se eliminará toda la información del producto incluyendo su imagen y registros de pedidos asociados.</span>
                        </p>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        <i class="fas fa-database" style="margin-right: 5px;"></i>
                        Si el producto tiene pedidos asociados, se eliminarán automáticamente los detalles del pedido.
                    </p>
                </div>
                
                <div class="form-actions" style="margin-top: 0; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalConfirmacion()" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="button" class="btn btn-danger" id="btnConfirmarEliminar" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; transition: background 0.3s;">
                        <i class="fas fa-trash"></i> Eliminar definitivamente
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalConfirmacion);
    
    const style = document.createElement('style');
    style.textContent = `
        .btn-danger:hover {
            background: #b91c1c !important;
        }
    `;
    document.head.appendChild(style);
    
    window.cerrarModalConfirmacion = function() {
        const modal = document.getElementById('modalConfirmacionEliminar');
        if (modal) modal.remove();
    };
    
    document.getElementById('btnConfirmarEliminar').onclick = async function() {
        const btn = document.getElementById('btnConfirmarEliminar');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        try {
            let imagenUrl = null;
            try {
                const { data: producto, error: getError } = await supabaseClient
                    .from('producto')
                    .select('imagen_url')
                    .eq('id_producto', idProducto)
                    .single();
                
                if (!getError && producto) {
                    imagenUrl = producto.imagen_url;
                }
            } catch (err) {
                console.warn('Error al obtener producto para eliminar:', err);
            }
            
            // 1. Eliminar los detalles de pedido asociados a este producto
            console.log(`🗑️ Eliminando detalles de pedido para el producto ${idProducto}...`);
            const { error: deleteDetallesError } = await supabaseClient
                .from('detalle_pedido')
                .delete()
                .eq('id_producto', idProducto);
            
            if (deleteDetallesError) {
                console.error('Error al eliminar detalles de pedido:', deleteDetallesError);
                if (deleteDetallesError.code !== 'PGRST116') {
                    throw new Error(`No se pudieron eliminar los detalles de pedido: ${deleteDetallesError.message}`);
                }
            } else {
                console.log('✅ Detalles de pedido eliminados correctamente');
            }
            
            // 2. Eliminar el producto
            console.log(`🗑️ Eliminando producto ${idProducto}...`);
            const { error: deleteError } = await supabaseClient
                .from('producto')
                .delete()
                .eq('id_producto', idProducto);
            
            if (deleteError) {
                if (deleteError.code === 'PGRST116') {
                    mostrarNotificacion('El producto ya no existe en la base de datos', 'info');
                    await cargarProductos();
                    cerrarModalConfirmacion();
                    return;
                }
                throw deleteError;
            }
            
            console.log('✅ Producto eliminado correctamente');
            
            if (imagenUrl) {
                try {
                    await eliminarImagenStorage(imagenUrl);
                } catch (imgError) {
                    console.error('Error al eliminar imagen del storage:', imgError);
                }
            }
            
            cerrarModalConfirmacion();
            await cargarProductos();
            mostrarNotificacion('Producto eliminado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            cerrarModalConfirmacion();
            let mensajeError = 'Error al eliminar el producto: ' + error.message;
            mostrarNotificacion(mensajeError, 'error');
        }
    };
}

async function eliminarImagenActual(idProducto) {
    const modalConfirmacion = document.createElement('div');
    modalConfirmacion.className = 'modal-overlay';
    modalConfirmacion.id = 'modalConfirmacionImagen';
    modalConfirmacion.style.zIndex = '2000';
    
    modalConfirmacion.innerHTML = `
        <div class="modal-container" style="max-width: 450px;">
            <div class="modal-header" style="border-bottom: none; padding-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-image" style="color: #dc2626; font-size: 20px;"></i>
                    </div>
                    <h3 style="margin: 0; color: #1f2937;">Eliminar imagen</h3>
                </div>
                <button class="btn-icon" onclick="cerrarModalConfirmacionImagen()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding-top: 0;">
                <div style="margin-bottom: 20px;">
                    <p style="color: #4b5563; margin-bottom: 15px; font-size: 15px;">
                        ¿Estás seguro de que deseas eliminar la imagen de este producto?
                    </p>
                    <div style="background: #f3f4f6; padding: 12px 15px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="color: #374151; margin: 0; font-size: 14px; display: flex; gap: 8px;">
                            <i class="fas fa-info-circle" style="margin-top: 2px; color: #6b7280;"></i>
                            <span>La imagen se eliminará permanentemente del servidor. El producto quedará sin imagen.</span>
                        </p>
                    </div>
                </div>
                
                <div class="form-actions" style="margin-top: 0; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalConfirmacionImagen()" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="button" class="btn btn-danger" id="btnConfirmarEliminarImagen" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-trash"></i> Eliminar imagen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalConfirmacion);
    
    window.cerrarModalConfirmacionImagen = function() {
        const modal = document.getElementById('modalConfirmacionImagen');
        if (modal) modal.remove();
    };
    
    document.getElementById('btnConfirmarEliminarImagen').onclick = async function() {
        const btn = document.getElementById('btnConfirmarEliminarImagen');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        try {
            const { data: producto, error } = await supabaseClient
                .from('producto')
                .select('imagen_url')
                .eq('id_producto', idProducto)
                .single();
            
            if (error) throw error;
            
            if (producto.imagen_url) {
                await eliminarImagenStorage(producto.imagen_url);
            }
            
            const { error: updateError } = await supabaseClient
                .from('producto')
                .update({ imagen_url: null })
                .eq('id_producto', idProducto);
            
            if (updateError) throw updateError;
            
            cerrarModalConfirmacionImagen();
            cerrarModalProducto();
            await cargarProductos();
            mostrarNotificacion('Imagen eliminada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            cerrarModalConfirmacionImagen();
            mostrarNotificacion('Error al eliminar la imagen', 'error');
        }
    };
}

function cerrarModalProducto() {
    const modal = document.getElementById('modalProducto');
    if (modal) {
        modal.remove();
    }
    cerrarModalRecorte();
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    let container = document.getElementById('notificacion-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificacion-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.style.cssText = `
        background: ${tipo === 'success' ? '#2ecc71' : tipo === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        margin-bottom: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    const icono = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notificacion.innerHTML = `
        <i class="fas fa-${icono}"></i>
        <span>${mensaje}</span>
    `;
    
    container.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 300);
    }, 3000);
}

// ============================================
// ESTILOS CSS
// ============================================
if (!document.getElementById('productos-estilos')) {
    const estilos = document.createElement('style');
    estilos.id = 'productos-estilos';
    estilos.textContent = `
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            padding: 20px 0;
        }
        
        .product-card {
            background: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: relative;
            transition: transform 0.3s, box-shadow 0.3s;
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        
        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .stock-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            z-index: 1;
        }
        
        .stock-ok { background-color: #2ecc71; }
        .stock-low { background-color: #f39c12; }
        .stock-out { background-color: #e74c3c; }
        
        .stock-agotado-texto {
            color: #e74c3c !important;
            font-weight: bold !important;
        }
        
        .product-image {
            width: 100%;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            background: #f5f5f5;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }
        
        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .product-image i {
            font-size: 50px;
            color: #ccc;
        }
        
        .product-name {
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
            margin-top: auto;
        }
        
        .product-price {
            color: #2ecc71;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .product-stock {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .product-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            border-top: 1px solid #eee;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .btn-icon {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 5px;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        .btn-edit {
            color: #3498db;
        }
        
        .btn-edit:hover {
            background: #e8f0fe;
        }
        
        .btn-delete {
            color: #e74c3c;
        }
        
        .btn-delete:hover {
            background: #fde9e9;
        }
        
        .no-products {
            grid-column: 1 / -1;
            text-align: center;
            padding: 50px;
            color: #999;
        }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-container {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: white;
            z-index: 1;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #2ecc71;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .form-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .form-section h4 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .form-help {
            display: block;
            margin-top: 5px;
            font-size: 12px;
            color: #999;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .btn-secondary {
            background: #95a5a6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        
        .btn-link {
            background: none;
            border: none;
            color: #e74c3c;
            cursor: pointer;
            text-decoration: underline;
            font-size: 12px;
        }
        
        .btn-link:hover {
            color: #c0392b;
        }
        
        .image-upload-container {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            margin-top: 5px;
        }
        
        .image-preview-large {
            width: 150px;
            height: 150px;
            border: 2px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
        }
        
        .image-preview-large img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .preview-placeholder {
            text-align: center;
            color: #999;
        }
        
        .preview-placeholder i {
            font-size: 32px;
            display: block;
            margin-bottom: 5px;
        }
        
        .preview-placeholder span {
            font-size: 12px;
        }
        
        .upload-controls {
            flex: 1;
        }
        
        .upload-controls input[type="file"] {
            padding: 8px 0;
            border: none;
        }
        
        .current-image-info {
            margin-top: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            font-size: 12px;
        }
        
        .crop-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
        }
        
        .crop-modal-content {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .crop-modal-header {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .crop-modal-body {
            padding: 20px;
            flex: 1;
            overflow-y: auto;
        }
        
        .crop-container {
            width: 100%;
            height: 500px;
            background: #f0f0f0;
            margin-bottom: 20px;
        }
        
        .crop-container img {
            max-width: 100%;
            max-height: 100%;
        }
        
        .crop-controls {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #2ecc71 !important;
            box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
        }
        
        .category-btn:hover {
            border-color: #2ecc71 !important;
            color: #2ecc71 !important;
            background: white !important;
        }
        
        .category-btn.active:hover {
            background: #27ae60 !important;
            color: white !important;
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
    `;
    document.head.appendChild(estilos);
}
// ============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================
window.cargarProductos = cargarProductos;
window.filtrarProductos = filtrarProductos;
window.cambiarCategoria = cambiarCategoria;
window.limpiarBusqueda = limpiarBusqueda;
window.limpiarFiltros = limpiarFiltros;
window.mostrarFormularioProducto = mostrarFormularioProducto;
window.guardarProducto = guardarProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.eliminarImagenActual = eliminarImagenActual;
window.cerrarModalProducto = cerrarModalProducto;
window.cerrarModalRecorte = cerrarModalRecorte;
window.aplicarRecorte = aplicarRecorte;
window.iniciarRecorteImagen = iniciarRecorteImagen;
window.cerrarModalConfirmacion = function() {
    const modal = document.getElementById('modalConfirmacionEliminar');
    if (modal) modal.remove();
};
window.cerrarModalConfirmacionImagen = function() {
    const modal = document.getElementById('modalConfirmacionImagen');
    if (modal) modal.remove();
};