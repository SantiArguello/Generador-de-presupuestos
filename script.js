// Accede a jsPDF desde el objeto global `window`
const { jsPDF } = window.jspdf;

function agregarItem() {
  const itemsDiv = document.getElementById("items");
  const nuevoItem = document.createElement("div");
  nuevoItem.classList.add("item");

  // Crear el HTML de un nuevo ítem con funcionalidad de desplegar/contraer y nombre dinámico en el botón
  nuevoItem.innerHTML = `
        <button type="button" class="toggleBtn">Nuevo Item</button>
        <div class="itemContent">
            <label>Item:</label>
            <input type="text" class="itemDesc">
            <label>Cantidad:</label>
            <input type="number" class="itemQty" step="1">
            <label>Precio Unidad:</label>
            <input type="number" class="itemPrice" step="0.01">
        </div>
    `;
  itemsDiv.appendChild(nuevoItem);

  // Contraer todos los demás ítems
  document.querySelectorAll(".itemContent").forEach((content) => {
    content.style.display = "none";
  });

  // Expandir el nuevo ítem
  nuevoItem.querySelector(".itemContent").style.display = "block";

  // Event listener para el botón de expandir/contraer
  const toggleBtn = nuevoItem.querySelector(".toggleBtn");
  const itemDescInput = nuevoItem.querySelector(".itemDesc");

  toggleBtn.addEventListener("click", () => {
    const content = nuevoItem.querySelector(".itemContent");
    content.style.display = content.style.display === "none" ? "block" : "none";
  });

  // Actualizar el texto del botón con el nombre del ítem en tiempo real
  itemDescInput.addEventListener("input", () => {
    toggleBtn.textContent = itemDescInput.value || "Nuevo Item";
  });
}

function generarPDF() {
  const nombreCliente =
    document.getElementById("nombreCliente").value || "Sin nombre";
  const items = document.querySelectorAll(".item");
  const fecha = new Date().toLocaleDateString();
  const tallerInfo = {
    nombre: "MECANICA ARGUELLO",
    cuit: "20-39689491-3",
    direccion: "ÁNGEL AVALOS 720, CORDOBA ARGENTINA",
    tel: "3516511743",
  };

  // Configurar jsPDF y cargar el logo
  const doc = new jsPDF();
  const logoPath = "logo.png"; // Ruta de la imagen del logo en la carpeta del proyecto

  // Añadir el logo con tamaño ajustado a 40x30 y posición en la esquina superior izquierda
  doc.addImage(logoPath, "PNG", 10, 10, 40, 30);

  // Desplazar la información del taller hacia la derecha
  doc.setFontSize(14);
  doc.text(tallerInfo.nombre, 60, 15); // Cambiado de 50 a 60 en X
  doc.setFontSize(10);
  doc.text(`CUIT: ${tallerInfo.cuit}`, 60, 20);
  doc.text(tallerInfo.direccion, 60, 25);
  doc.text(`TEL: ${tallerInfo.tel}`, 60, 30);
  doc.text(`FECHA: ${fecha}`, 150, 15);
  doc.text(`PARA: ${nombreCliente}`, 150, 25);

  doc.setFontSize(12);
  doc.text("NOMBRE", 10, 50);
  doc.text("CANTIDAD", 80, 50);
  doc.text("COSTO UNIDAD", 120, 50);
  doc.text("TOTAL", 170, 50);
  doc.setLineWidth(0.5);
  doc.line(10, 52, 200, 52);

  let y = 60;
  let total = 0;

  items.forEach((item) => {
    const desc = item.querySelector(".itemDesc").value || "Sin descripción";
    const qty = parseInt(item.querySelector(".itemQty").value) || 1;
    const unitPrice = parseFloat(item.querySelector(".itemPrice").value) || 0;
    const itemTotal = qty * unitPrice;

    doc.text(desc, 10, y);
    doc.text(String(qty), 85, y);
    doc.text(`$${unitPrice.toFixed(2)}`, 125, y);
    doc.text(`$${itemTotal.toFixed(2)}`, 175, y);
    y += 10;
    total += itemTotal;
  });

  doc.setFontSize(12);
  doc.text(`TOTAL: $${total.toFixed(2)}`, 150, y + 10);
  doc.setFontSize(10);

  doc.save(`Presupuesto_${nombreCliente}.pdf`);
}

document.getElementById("addItemBtn").addEventListener("click", agregarItem);
document.getElementById("generatePdfBtn").addEventListener("click", generarPDF);
