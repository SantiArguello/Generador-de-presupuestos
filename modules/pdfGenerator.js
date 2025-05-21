const { jsPDF } = window.jspdf;
import { validarPresupuesto } from './validaciones.js';

// Configuración general del PDF
const configPDF = {
    margins: {
        left: 10,
        top: 10,
        right: 10
    },
    logo: {
        width: 40,
        height: 30,
        path: 'logo.png'
    },
    fonts: {
        title: 18,
        subtitle: 12,
        body: 10,
        small: 8
    }
};

// Información del taller (puede moverse a un archivo constants.js si prefieres)
const tallerInfo = {
    nombre: "MECANICA ARGUELLO",
    eslogan: "Service Especializado Benelli",
    cuit: "20-39689491-3",
    direccion: "ÁNGEL AVALOS 720, CORDOBA ARGENTINA",
    telefono: "3516511743",
    email: "contacto@mecanicarguello.com"
};

export function generarPDF() {
    if (!validarPresupuesto()) return;

    try {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-AR');
        const items = document.querySelectorAll('.item');
        
        // Obtener datos del formulario
        const formData = {
            cliente: document.getElementById('nombreCliente').value.trim(),
            moto: document.getElementById('motoCliente').value.trim() || 'No especificada',
            patente: document.getElementById('patenteCliente').value.trim() || 'Sin patente'
        };

        // Configuración inicial
        let yPos = configPDF.margins.top;
        
        // Agregar encabezado
        yPos = agregarEncabezado(doc, yPos);
        
        // Agregar información cliente
        yPos = agregarSeccionCliente(doc, formData, fecha, yPos + 15);
        
        // Agregar tabla de ítems
        yPos = crearTablaItems(doc, items, yPos + 10);
        
        // Agregar totales
        agregarTotales(doc, calcularTotales(items), yPos);
        
        // Guardar PDF
        doc.save(`Presupuesto_${formData.cliente.replace(/\s/g, '_')}.pdf`);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
}

// ==================== FUNCIONES INTERNAS ====================

function agregarEncabezado(doc, yStart) {
    try {
        doc.addImage(
            configPDF.logo.path,
            'PNG',
            configPDF.margins.left,
            yStart,
            configPDF.logo.width,
            configPDF.logo.height
        );
    } catch (error) {
        console.warn('Logo no encontrado, usando texto alternativo');
        doc.setFontSize(configPDF.fonts.title)
           .text(tallerInfo.nombre, configPDF.margins.left, yStart + 10);
    }

    doc.setFontSize(configPDF.fonts.title)
       .setFont(undefined, 'bold')
       .text(tallerInfo.nombre, 60, yStart + 10)
       .setFontSize(configPDF.fonts.subtitle)
       .setFont(undefined, 'normal')
       .text(tallerInfo.eslogan, 60, yStart + 16)
       .setFontSize(configPDF.fonts.small)
       .text(`CUIT: ${tallerInfo.cuit}`, 60, yStart + 22)
       .text(tallerInfo.direccion, 60, yStart + 28)
       .text(`Tel: ${tallerInfo.telefono} | Email: ${tallerInfo.email}`, 60, yStart + 34);

    return yStart + 40;
}

function agregarSeccionCliente(doc, { cliente, moto, patente }, fecha, yStart) {
    doc.setFontSize(configPDF.fonts.body)
       .setFont(undefined, 'bold')
       .text('DATOS DEL CLIENTE:', configPDF.margins.left, yStart)
       .setFont(undefined, 'normal')
       .text(`Nombre: ${cliente}`, configPDF.margins.left, yStart + 8)
       .text(`Moto: ${moto}`, configPDF.margins.left, yStart + 16)
       .text(`Patente: ${patente}`, configPDF.margins.left, yStart + 24)
       .text(`Fecha: ${fecha}`, 150, yStart);

    return yStart + 30;
}

function crearTablaItems(doc, items, yStart) {
    const columnas = {
        descripcion: { width: 90, x: 10 },
        cantidad: { width: 20, x: 110 },
        precio: { width: 30, x: 140 },
        total: { width: 30, x: 180 }
    };

    // Encabezados de la tabla
    doc.setFontSize(configPDF.fonts.body)
       .setFont(undefined, 'bold')
       .text('DESCRIPCIÓN', columnas.descripcion.x, yStart)
       .text('CANT.', columnas.cantidad.x, yStart)
       .text('PRECIO', columnas.precio.x, yStart)
       .text('TOTAL', columnas.total.x, yStart)
       .setFont(undefined, 'normal');

    let y = yStart + 8;
    
    // Línea separadora
    doc.setLineWidth(0.3).line(10, y, 200, y);
    
    // Contenido de la tabla
    items.forEach((item, index) => {
        if (y > 280) { // Saltar página si queda poco espacio
            doc.addPage();
            y = configPDF.margins.top;
        }

        const desc = item.querySelector('.itemDesc').value || `Ítem ${index + 1}`;
        const cantidad = parseInt(item.querySelector('.itemQty').value) || 1;
        const precio = parseFloat(item.querySelector('.itemPrice').value) || 0;
        const total = cantidad * precio;

        // Descripción con wrap de texto
        const descLines = doc.splitTextToSize(desc, columnas.descripcion.width);
        const lineHeight = 7;
        const itemHeight = Math.max(descLines.length * lineHeight, lineHeight);

        doc.text(descLines, columnas.descripcion.x, y + 4)
           .text(cantidad.toString(), columnas.cantidad.x, y + 4)
           .text(`$${precio.toFixed(2)}`, columnas.precio.x, y + 4)
           .text(`$${total.toFixed(2)}`, columnas.total.x, y + 4);

        y += itemHeight + 6;
    });

    return y;
}

function calcularTotales(items) {
    return Array.from(items).reduce((acc, item) => {
        try {
            const qtyInput = item.querySelector('.itemQty');
            const priceInput = item.querySelector('.itemPrice');
            
            // Validar existencia de inputs
            if (!qtyInput || !priceInput) {
                console.error('Inputs no encontrados en el ítem:', item);
                return acc;
            }
            
            // Convertir valores numéricos con validación
            const cantidad = Number(qtyInput.value) || 0;
            const precio = Number(priceInput.value.replace(',', '.')) || 0; // Soporte para decimales con coma
            
            // Validar números positivos
            if (cantidad < 0 || precio < 0) {
                console.warn('Valores negativos en ítem:', item);
                return acc;
            }
            
            return acc + (cantidad * precio);
            
        } catch (error) {
            console.error('Error calculando total del ítem:', item, error);
            return acc;
        }
    }, 0);
}

function agregarTotales(doc, total, yPos) {
    const ivaCheckbox = document.getElementById('ivaCheckbox').checked;
    const ivaValue = parseFloat(document.getElementById('ivaPercentage').value) || 0;
    const subtotal = calcularSubtotal(document.querySelectorAll('.item'));

    doc.setFontSize(10)
       .setFont(undefined, 'normal')
       .text(`Subtotal: $${subtotal.toFixed(2)}`, 130, yPos + 10);

    if(ivaCheckbox) {
        const iva = subtotal * (ivaValue / 100);
        doc.text(`IVA (${ivaValue}%): $${iva.toFixed(2)}`, 130, yPos + 20)
           .text(`Total antes de descuentos: $${(subtotal + iva).toFixed(2)}`, 130, yPos + 30);
    }

    const descuento = parseFloat(document.getElementById('descuento').value) || 0;
    if(descuento > 0) {
        doc.text(`Descuento (${descuento}%): $${(total * descuento/100).toFixed(2)}`, 130, yPos + 40);
    }

    doc.setFontSize(12)
       .setFont(undefined, 'bold')
       .text('TOTAL GENERAL:', 130, yPos + (ivaCheckbox ? 50 : 30))
       .text(`$${total.toFixed(2)}`, 170, yPos + (ivaCheckbox ? 50 : 30));
}

function calcularSubtotal(items) {
    return Array.from(items).reduce((acc, item) => {
        try {
            const qty = parseFloat(item.querySelector('.itemQty')?.value || 0)
            const price = parseFloat(item.querySelector('.itemPrice')?.value || 0)
            return acc + (qty * price);
        } catch (error) {
            console.warn('Error calculando subtotal del ítem:', item, error);
            return acc;
        }
    }, 0);
}