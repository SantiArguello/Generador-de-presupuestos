// script.js - Punto de entrada principal

// Importaciones
import { validarPresupuesto } from "./modules/validaciones.js";
import { setupDeleteHandler, setupToggleHandler } from "./modules/handlers.js";
import { generarPDF } from "./modules/pdfGenerator.js";
window.jspdf = window.jspdf || { jsPDF };

// Variables globales
let itemsGuardados = JSON.parse(localStorage.getItem("presupuestoItems")) || [];

document.addEventListener('DOMContentLoaded', () => {
    const elementosRequeridos = [
        'ivaCheckbox', 
        'ivaPercentage', 
        'descuento',  // ¡Este debe coincidir con el ID del input!
        'totalPreview'
    ];
    
    elementosRequeridos.forEach(id => {
        if (!document.getElementById(id)) {
            Swal.fire('Error crítico', `Elemento requerido no encontrado: ${id}`, 'error');
            throw new Error(`Elemento requerido no encontrado: ${id}`);
        }
    });
});

// Configuración inicial al cargar la página
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById('limpiarBtn').addEventListener('click', limpiarFormulario);

  // Cargar items guardados
  cargarItemsGuardados();

  // Event Listeners principales
  document.getElementById("addItemBtn").addEventListener("click", agregarItem);
  document
    .getElementById("generatePdfBtn")
    .addEventListener("click", generarPDF);

  // Actualización en tiempo real
  document.getElementById("items").addEventListener("input", actualizarTotal);

  // Control del IVA
    document.getElementById('ivaCheckbox').addEventListener('change', function() {
        const ivaInput = document.getElementById('ivaPercentage');
        ivaInput.disabled = !this.checked;
        document.getElementById('ivaContainer').classList.toggle('disabled-input', !this.checked);
        actualizarTotal();
    });

    document.getElementById('ivaPercentage').addEventListener('input', actualizarTotal);
});

// Función principal para agregar ítems
function agregarItem() {
    const itemsContainer = document.getElementById("items");
    const nuevoItem = document.createElement("div");
    nuevoItem.className = "item mb-3 p-3 border rounded";
    
    // Generar IDs únicos para cada input
    const uniqueId = Date.now();
    
    nuevoItem.innerHTML = `
         <div class="item-header d-flex justify-content-between align-items-center mb-2">
        <button type="button" 
                class="toggleBtn btn btn-link text-dark p-0 text-start" 
                aria-expanded="false">
            <i class=" me-2"></i>
            <span class="item-title"> Nuevo Ítem</span>
        </button>
        <button type="button" class="deleteBtn btn btn-danger btn-sm">
            <i class="bi bi-trash"></i>
        </button>
    </div>
        <div class="itemContent">
            <div class="row g-3">
                <div class="col-md-6">
                    <label for="itemDesc-${uniqueId}" class="form-label">Descripción</label>
                    <input type="text" 
                           class="form-control itemDesc" 
                           id="itemDesc-${uniqueId}" 
                           required>
                </div>
                <div class="col-md-3">
                    <label for="itemQty-${uniqueId}" class="form-label">Cantidad</label>
                    <input type="number" 
                           class="form-control itemQty" 
                           id="itemQty-${uniqueId}" 
                           min="1" 
                           value="1"
                           step="1">
                </div>
                <div class="col-md-3">
                    <label for="itemPrice-${uniqueId}" class="form-label">Precio Unitario</label>
                    <input type="number" 
                           class="form-control itemPrice" 
                           id="itemPrice-${uniqueId}" 
                           step="0.01" 
                           min="0">
                </div>
            </div>
        </div>
    `;

    // Configurar handlers con validación
    try {
        setupDeleteHandler(nuevoItem);
        setupToggleHandler(nuevoItem);
    } catch (error) {
        console.error("Error configurando handlers:", error);
        Swal.fire('Error', 'No se pudo configurar el ítem', 'error');
        return;
    }

    // Agregar al DOM
  itemsContainer.appendChild(nuevoItem);
  
  // // // Configurar actualización automática del título
    const descInput = nuevoItem.querySelector('.itemDesc');
    const titleSpan = nuevoItem.querySelector('.item-title');
    
    descInput.addEventListener('input', () => {
        titleSpan.textContent = descInput.value.trim() || 'Nuevo Ítem';
    });

    // Configurar handlers y resto de la lógica...
    // setupDeleteHandler(nuevoItem);
    // setupToggleHandler(nuevoItem);
    
    // Contraer todos los ítems excepto el nuevo
    document.querySelectorAll('.itemContent').forEach(content => {
       content.style.display = 'none';
   }); 
    
    // Expandir el nuevo ítem
    nuevoItem.querySelector('.itemContent').style.display = 'block';
    
    // itemsContainer.appendChild(nuevoItem);
    // actualizarTotal();
    // guardarEnLocalStorage();

    // Actualizar totales después de que el DOM se haya renderizado
    setTimeout(() => {
        try {
            actualizarTotal();
            guardarEnLocalStorage();
        } catch (error) {
            console.error("Error post-agregar:", error);
            Swal.fire('Error', 'No se pudo actualizar los totales', 'error');
        }
    }, 100); // Aumentar el delay si es necesario
}

// Función para actualizar totales en tiempo real
export function actualizarTotal() {
    try {
        const items = document.querySelectorAll('.item');
        let subtotal = 0;

        items.forEach(item => {
            const qtyInput = item.querySelector('.itemQty');
            const priceInput = item.querySelector('.itemPrice');
            
            // Validación crítica
            if (!qtyInput || !priceInput) {
                console.warn('Elementos no encontrados en el ítem:', item);
                return;
            }

            const cantidad = Number(qtyInput?.value || 0);
            const precio = Number(priceInput?.value || 0);
            
            subtotal += cantidad * precio;
        });

        const ivaCheckbox = document.getElementById('ivaCheckbox');
        const ivaInput = document.getElementById('ivaPercentage');
        const descuentoInput = document.getElementById('descuento');
        
        // Validar elementos del formulario
        if (!ivaCheckbox || !ivaInput || !descuentoInput) {
            console.error('Elementos de configuración no encontrados');
            return;
        }

        const iva = ivaCheckbox.checked ? subtotal * Number(ivaInput.value || 0) / 100 : 0
        const descuento = Number(descuentoInput.value || 0);
        const total = (subtotal + iva) * (1 - descuento / 100);

        const totalPreview = document.getElementById('totalPreview');
        if (totalPreview) {
            totalPreview.textContent = `$${total.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error en actualizarTotal:', error);
    }
}

function calcularSubtotal(items) {
    return Array.from(items).reduce((acc, item) => {
        const qty = parseFloat(item.querySelector('.itemQty').value) || 0;
        const price = parseFloat(item.querySelector('.itemPrice').value) || 0;
        return acc + (qty * price);
    }, 0);
}

// Sistema de guardado automático
function guardarEnLocalStorage() {
    // Guardar items
    const items = Array.from(document.querySelectorAll('.item')).map(item => ({
        desc: item.querySelector('.itemDesc')?.value || '',
        qty: item.querySelector('.itemQty')?.value || '1',
        price: item.querySelector('.itemPrice')?.value || '0'
    }));
    
    // Guardar configuración de IVA
    const ivaConfig = {
        aplicado: document.getElementById('ivaCheckbox').checked,
        valor: document.getElementById('ivaPercentage').value
    };
    
    // Guardar todo
    localStorage.setItem('presupuestoItems', JSON.stringify(items));
    localStorage.setItem('ivaConfig', JSON.stringify(ivaConfig));
}

function cargarItemsGuardados() {
    try {
        const itemsGuardados = JSON.parse(localStorage.getItem('presupuestoItems')) || [];
        const ivaConfig = JSON.parse(localStorage.getItem('ivaConfig')) || { aplicado: false, valor: 21 };

        // Cargar configuración IVA
        if (document.getElementById('ivaCheckbox') && document.getElementById('ivaPercentage')) {
            document.getElementById('ivaCheckbox').checked = ivaConfig.aplicado;
            document.getElementById('ivaPercentage').value = ivaConfig.valor;
            document.getElementById('ivaPercentage').disabled = !ivaConfig.aplicado;
            document.getElementById('ivaContainer').classList.toggle('disabled-input', !ivaConfig.aplicado);
        }

        // Cargar ítems
        itemsGuardados.forEach(item => {
            try {
                agregarItem();
                const items = document.querySelectorAll('.item');
                const ultimoItem = items[items.length - 1];
                
                if (ultimoItem) {
                    ultimoItem.querySelector('.itemDesc').value = item.desc || '';
                    ultimoItem.querySelector('.itemQty').value = item.qty || '1';
                    ultimoItem.querySelector('.itemPrice').value = item.price || '0';
                }
            } catch (error) {
                console.error('Error cargando ítem:', item, error);
            }
        });
    } catch (error) {
        console.error('Error cargando datos guardados:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos guardados', 'error');
    }
}

// Función para limpiar formulario (opcional)
export function limpiarFormulario() {
    try {
        // Limpiar formulario
        document.getElementById("presupuestoForm").reset();
        
        // Limpiar items
        document.getElementById("items").innerHTML = "";
        
        // Limpiar localStorage completamente
        localStorage.removeItem("presupuestoItems");
        localStorage.removeItem("ivaConfig");
        
        // Resetear campos especiales
        document.getElementById('ivaCheckbox').checked = false;
        document.getElementById('ivaPercentage').disabled = true;
        document.getElementById('ivaContainer').classList.add('disabled-input');
        
        // Forzar actualización
        actualizarTotal();
        
        Swal.fire('¡Formulario limpiado!', 'Todos los datos han sido reseteados', 'success');
    } catch (error) {
        console.error("Error limpiando formulario:", error);
        Swal.fire('Error', 'No se pudo limpiar el formulario', 'error');
    }
}

