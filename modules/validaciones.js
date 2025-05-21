


export function validarPresupuesto() {
  const items = document.querySelectorAll(".item");

  // Validar nombre
  const nombreCliente = document.getElementById("nombreCliente").value.trim();
    if (!nombreCliente) {
        mostrarError('Nombre del cliente es obligatorio');
        return false;
    }

  // Validar items
  if (items.length === 0) {
    mostrarError("Debe agregar al menos un ítem");
    return false;
  }

  // Validar descripciones
  const itemsInvalidos = Array.from(items).filter((item, index) => {
    const desc = item.querySelector(".itemDesc").value.trim();
    if (!desc) mostrarError(`Ítem ${index + 1} sin descripción`);
    return !desc;
  });

  return itemsInvalidos.length === 0;
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#3085d6'
    });
}
