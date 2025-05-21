export function setupDeleteHandler(itemElement) {
    /**
     * Configura el evento de eliminación para un ítem del presupuesto
     * @param {HTMLElement} itemElement - Elemento DOM del ítem a manejar
     */
    const deleteBtn = itemElement.querySelector(".deleteBtn");
    
    deleteBtn.addEventListener("click", () => {
        Swal.fire({
            title: '¿Eliminar ítem?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                itemElement.remove();
                
                // Actualizar totales si existe la función
                if (typeof actualizarTotal === 'function') {
                    actualizarTotal();
                }
                
                // Feedback visual
                Swal.fire(
                    '¡Eliminado!',
                    'El ítem fue removido del presupuesto',
                    'success'
                );
            }
        });
    });
}

export function setupToggleHandler(itemElement) {
    /**
     * Configura el evento de expandir/contraer para un ítem
     * @param {HTMLElement} itemElement - Elemento DOM del ítem a manejar
     */
    const toggleBtn = itemElement.querySelector(".toggleBtn");
    const content = itemElement.querySelector(".itemContent");
    const icon = toggleBtn.querySelector("i");
    
    // Estado inicial: contraído
    content.style.display = 'none';
    icon.style.transform = 'rotate(0deg)';

    toggleBtn.addEventListener("click", () => {
        const isExpanded = content.style.display === 'block';
        
        // Animación del ícono
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(90deg)';
        
        // Transición suave para el contenido
        if (isExpanded) {
            content.style.maxHeight = '0';
            setTimeout(() => {
                content.style.display = 'none';
            }, 300);
        } else {
            content.style.display = 'block';
            content.style.maxHeight = `${content.scrollHeight}px`;
        }
        
        // Para accesibilidad
        toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    });
}

export function setupFormHandlers() {
    /**
     * Configura los handlers globales del formulario
     */
    // Ejemplo: Podrías agregar aquí validación en tiempo real
    document.querySelectorAll('.itemDesc').forEach(input => {
        input.addEventListener('input', () => {
            if (typeof actualizarTotal === 'function') {
                actualizarTotal();
            }
        });
    });
}