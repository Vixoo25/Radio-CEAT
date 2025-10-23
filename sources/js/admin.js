import { openModal, closeModal } from './ui.js';
import { fetchProgramacion, syncCronogramas, manageCronograma, getNoticias, saveNoticia, deleteNoticia, getBoletin, saveBoletin, deleteBoletin, getMensajes, manageMensaje } from './api.js';
import { getFechaFormatoYMD, formatRelativeTime, formatFullDateTime } from './utils.js';
import { renderizarProgramacion, renderizarNoticiasEnPaginaPrincipal, updateBoletinViewer } from './schedule.js';

// --- Variables Globales del Módulo ---
let calendarioProgramacion = {}; // Caché para ediciones de cronograma
let currentEditingDate = null;
let currentEditingId = null;
let boletinSeleccionado = null;
let noticiaImagenSeleccionada = null;

// --- Inicialización del Módulo de Administración ---
export function initAdmin() {
    // --- Selectores de Elementos DOM ---
    const modalEditor = document.getElementById("modal-editor");
    const editorCancelButton = document.getElementById("editor-cancel-button");
    const editorSaveButton = document.getElementById("editor-save-button");
    const yearSelector = document.getElementById("year-selector");
    const monthSelector = document.getElementById("month-selector");

    const modalAddCronograma = document.getElementById("modal-add-cronograma");
    const closeAddCronogramaButton = modalAddCronograma.querySelector(".close-button");
    const listaCronogramasExistentes = document.getElementById("lista-cronogramas-existentes");
    const saveCronogramaButton = document.getElementById("save-cronograma-button");

    const modalEditorNoticias = document.getElementById("modal-editor-noticias");
    const closeEditorNoticiasButton = modalEditorNoticias.querySelector(".close-button");
    const dropZoneBoletin = document.getElementById("drop-zone-boletin");
    const fileInputBoletin = document.getElementById("file-input-boletin");
    const saveBoletinButton = document.getElementById("save-boletin-button");

    const dropZoneNoticia = document.getElementById("drop-zone-noticia");
    const fileInputNoticia = document.getElementById("file-input-noticia");
    const saveNoticiaButton = document.getElementById("save-noticia-button");
    const cancelEditNoticiaButton = document.getElementById("cancel-edit-noticia-button");

    const verMensajesButton = document.getElementById("ver-mensajes-button");
    const modalVerMensajes = document.getElementById("modal-ver-mensajes");
    const listaMensajesOyentes = document.getElementById("lista-mensajes-oyentes");
    const modalVerMensajeCompleto = document.getElementById("modal-ver-mensaje-completo");

    // --- Event Listeners ---

    // Editor de Cronogramas
    editorCancelButton.addEventListener("click", () => {
        if (confirm("¿Estás seguro de que quieres descartar todos los cambios no guardados?")) {
            calendarioProgramacion = {};
            closeModal(modalEditor);
        }
    });

    editorSaveButton.addEventListener("click", async () => {
        const result = await syncCronogramas(calendarioProgramacion);
        if (result.success) {
            alert(result.message);
            calendarioProgramacion = {};
            closeModal(modalEditor);
            const contenedorProgramacionDiaria = document.querySelector(".pruebas-de");
            renderizarProgramacion(getFechaFormatoYMD(new Date()), contenedorProgramacionDiaria);
        } else {
            alert(`Error al guardar: ${result.message}`);
        }
    });

    yearSelector.addEventListener("change", () => generateCalendar(yearSelector.value, monthSelector.value));
    monthSelector.addEventListener("change", () => generateCalendar(yearSelector.value, monthSelector.value));

    // Modal Añadir/Editar Cronograma
    closeAddCronogramaButton.addEventListener("click", () => closeAddCronogramaModal());
    saveCronogramaButton.addEventListener("click", handleSaveCronograma);
    listaCronogramasExistentes.addEventListener('click', handleCronogramaActions);

    // Editor de Noticias y Boletín
    closeEditorNoticiasButton.addEventListener("click", () => closeEditorNoticiasModal());
    setupDragAndDrop(dropZoneBoletin, fileInputBoletin, handleBoletinFile);
    saveBoletinButton.addEventListener("click", handleSaveBoletin);

    setupDragAndDrop(dropZoneNoticia, fileInputNoticia, handleNoticiaFile);
    saveNoticiaButton.addEventListener("click", handleSaveNoticia);
    cancelEditNoticiaButton.addEventListener("click", resetFormularioNoticia);
    document.getElementById("lista-noticias-existentes").addEventListener('click', handleNoticiaActions);

    // Mensajes de Oyentes
    verMensajesButton.addEventListener("click", () => {
        openModal(modalVerMensajes);
        renderizarMensajes();
    });
    listaMensajesOyentes.addEventListener("click", handleMensajeActions);
    modalVerMensajes.querySelector('.close-button').addEventListener('click', () => closeModal(modalVerMensajes));
    modalVerMensajeCompleto.querySelector('.close-button').addEventListener('click', () => closeModal(modalVerMensajeCompleto));

    // Contador de caracteres para la descripción del cronograma
    const cronogramaDescripcionInput = document.getElementById("cronograma-descripcion");
    const cronogramaCharCounter = document.getElementById("cronograma-char-counter");
    const maxCharsCronograma = 500;

    cronogramaDescripcionInput.addEventListener("input", () => {
        const currentLength = cronogramaDescripcionInput.value.length;
        cronogramaCharCounter.textContent = `${currentLength}/${maxCharsCronograma}`;
        cronogramaCharCounter.classList.toggle("warning", maxCharsCronograma - currentLength <= 20);
    });
}

// --- Lógica del Editor de Cronogramas (Calendario) ---

export function initializeEditor() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const yearSelector = document.getElementById("year-selector");
    const monthSelector = document.getElementById("month-selector");

    yearSelector.innerHTML = "";
    for (let i = currentYear - 1; i <= currentYear + 1; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        yearSelector.appendChild(option);
    }
    yearSelector.value = currentYear;

    monthSelector.innerHTML = "";
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    meses.forEach((mes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = mes;
        monthSelector.appendChild(option);
    });
    monthSelector.value = currentMonth;

    generateCalendar(currentYear, currentMonth);
}

function generateCalendar(year, month) {
    const holidays = [
        "01-01", // 1 de enero
        "04-18", // 18 de abril
        "04-19", // 19 de abril
        "05-01", // 1 de mayo
        "05-21", // 21 de mayo
        "06-20", // 20 de junio
        "06-29", // 29 de junio
        "07-16", // 16 de julio
        "08-15", // 15 de agosto
        "09-18", // 18 de septiembre
        "09-19", // 19 de septiembre
        "10-12", // 12 de octubre
        "10-31", // 31 de octubre
        "11-01", // 1 de noviembre
        "11-16", // 16 de noviembre
        "12-08", // 8 de diciembre
        "12-14", // 14 de diciembre
        "12-25"  // 25 de diciembre
    ];

    const calendarContainer = document.getElementById("calendar-container");
    calendarContainer.innerHTML = "";
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, parseInt(month) + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    let calendarHTML = '<div class="calendar-grid">';
    const diasHeader = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    diasHeader.forEach(dia => {
        calendarHTML += `<div class="calendar-header">${dia}</div>`;
    });

    for (let i = 0; i < startDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day not-current-month"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const fechaCompleta = getFechaFormatoYMD(currentDate);
        const isSunday = currentDate.getDay() === 0;
        const monthDay = `${String(parseInt(month) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isHoliday = holidays.includes(monthDay);
        calendarHTML += `<div class="calendar-day ${isSunday ? 'sunday' : ''} ${isHoliday ? 'holiday' : ''}" data-fecha="${fechaCompleta}">${day}</div>`;
    }

    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;

    document.querySelectorAll('.calendar-day:not(.not-current-month)').forEach(dayElement => {
        dayElement.addEventListener('click', () => {
            const fechaSeleccionada = dayElement.dataset.fecha;
            openAddCronogramaModal(fechaSeleccionada);
        });
    });
}

async function openAddCronogramaModal(fecha) {
    const modal = document.getElementById("modal-add-cronograma");
    const fechaSubtitulo = document.getElementById("cronograma-fecha-subtitulo");
    const saveButton = document.getElementById("save-cronograma-button");

    currentEditingDate = fecha;
    currentEditingId = null;
    saveButton.textContent = "Guardar";

    const [year, month, day] = fecha.split('-');
    fechaSubtitulo.textContent = `${day}/${month}/${year}`;
    
    calendarioProgramacion[fecha] = await fetchProgramacion(fecha);
    renderizarProgramacionEnModal(fecha);

    openModal(modal);
}

function closeAddCronogramaModal() {
    const modal = document.getElementById("modal-add-cronograma");
    closeModal(modal);
    document.getElementById("cronograma-nombre").value = "";
    document.getElementById("cronograma-inicio").value = "";
    document.getElementById("cronograma-fin").value = "";
    document.getElementById("cronograma-descripcion").value = "";
    // Reiniciar contador
    document.getElementById("cronograma-char-counter").textContent = "0/500";
    document.getElementById("cronograma-char-counter").classList.remove("warning");
    currentEditingId = null;
}

function renderizarProgramacionEnModal(fecha) {
    const contenedor = document.getElementById("lista-cronogramas-existentes");
    contenedor.innerHTML = "";
    const programas = calendarioProgramacion[fecha] || [];

    if (programas.length > 0) {
        programas.sort((a, b) => a.hora.localeCompare(b.hora));
        programas.forEach(programa => {
            const itemHTML = `
              <div class="hora-de-emisin" data-id="${programa.id}">
                <div class="programa-info">
                  <div class="text-wrapper-4">${programa.hora}</div>
                  <p class="text-wrapper-5">${programa.nombre}</p>
                </div>
                <div class="programa-actions">
                  <button class="action-btn edit" data-id="${programa.id}">✏️</button>
                  <button class="action-btn delete" data-id="${programa.id}">🗑️</button>
                </div>
              </div>
            `;
            contenedor.innerHTML += itemHTML;
        });
    } else {
        contenedor.innerHTML = '<p class="no-programacion">No hay programación para este día.</p>';
    }
}

async function handleSaveCronograma() {
    const nombre = document.getElementById("cronograma-nombre").value.trim();
    const inicio = document.getElementById("cronograma-inicio").value;
    const fin = document.getElementById("cronograma-fin").value;
    const descripcion = document.getElementById("cronograma-descripcion").value.trim();

    if (!nombre || !inicio || !fin || !currentEditingDate) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    if (currentEditingId) { // Actualizar
        try {
            if (!String(currentEditingId).startsWith('temp-')) {
                const result = await manageCronograma('POST', { id: currentEditingId, nombre, inicio, fin, descripcion });
                if (!result.success) throw new Error(result.message);
            }
            const programaIndex = calendarioProgramacion[currentEditingDate].findIndex(p => p.id == currentEditingId);
            if (programaIndex > -1) {
                calendarioProgramacion[currentEditingDate][programaIndex] = { id: currentEditingId, nombre, hora: `${inicio} - ${fin}`, descripcion };
            }
        } catch (error) {
            alert(`Error al actualizar el cronograma: ${error.message}`);
        }
    } else { // Crear
        const nuevoCronograma = {
            id: `temp-${Date.now()}`,
            hora: `${inicio} - ${fin}`,
            nombre,
            descripcion
        };
        if (!calendarioProgramacion[currentEditingDate]) {
            calendarioProgramacion[currentEditingDate] = [];
        }
        calendarioProgramacion[currentEditingDate].push(nuevoCronograma);
    }

    renderizarProgramacionEnModal(currentEditingDate);
    document.getElementById("cronograma-nombre").value = "";
    document.getElementById("cronograma-inicio").value = "";
    document.getElementById("cronograma-fin").value = "";
    document.getElementById("cronograma-descripcion").value = "";
    currentEditingId = null;
    document.getElementById("save-cronograma-button").textContent = "Guardar";
}

function handleCronogramaActions(e) {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('edit')) {
        const programa = calendarioProgramacion[currentEditingDate].find(p => p.id == id);
        if (programa) {
            const [inicio, fin] = programa.hora.split(' - ');
            document.getElementById("cronograma-nombre").value = programa.nombre;
            document.getElementById("cronograma-inicio").value = inicio;
            document.getElementById("cronograma-fin").value = fin;
            document.getElementById("cronograma-descripcion").value = programa.descripcion || "";
            currentEditingId = id;
            document.getElementById("save-cronograma-button").textContent = "Actualizar";
        }
    } else if (target.classList.contains('delete')) {
        if (confirm("¿Estás seguro de que quieres eliminar este cronograma?")) {
            if (String(id).startsWith('temp-')) {
                calendarioProgramacion[currentEditingDate] = calendarioProgramacion[currentEditingDate].filter(p => p.id != id);
                renderizarProgramacionEnModal(currentEditingDate);
            } else {
                manageCronograma('DELETE', { id }).then(result => {
                    if (result.success) {
                        calendarioProgramacion[currentEditingDate] = calendarioProgramacion[currentEditingDate].filter(p => p.id != id);
                        renderizarProgramacionEnModal(currentEditingDate);
                    } else {
                        alert(`Error al eliminar: ${result.message}`);
                    }
                });
            }
        }
    }
}

// --- Lógica del Editor de Noticias y Boletín ---

export function initializeEditorNoticias() {
    const modal = document.getElementById("modal-editor-noticias");
    openModal(modal);
    checkCurrentBoletin();
    renderizarNoticiasEnEditor();
}

function closeEditorNoticiasModal() {
    const modal = document.getElementById("modal-editor-noticias");
    closeModal(modal);
    boletinSeleccionado = null;
    document.getElementById("file-info-boletin").textContent = "";
    document.getElementById("save-boletin-button").disabled = true;
    resetFormularioNoticia();
}

function setupDragAndDrop(el, input, callback) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        el.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        el.addEventListener(eventName, () => el.classList.add('dragover'));
    });
    ['dragleave', 'drop'].forEach(eventName => {
        el.addEventListener(eventName, () => el.classList.remove('dragover'));
    });
    el.addEventListener('drop', (e) => callback(e.dataTransfer.files[0]));
    input.addEventListener('change', () => callback(input.files[0]));
    el.addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('file-select-link')) input.click() });
}

function handleBoletinFile(file) {
    if (file && file.type === "application/pdf") {
        boletinSeleccionado = file;
        document.getElementById("file-info-boletin").textContent = `Archivo: ${file.name}`;
        document.getElementById("save-boletin-button").disabled = false;
    } else {
        alert("Por favor, selecciona un archivo PDF.");
    }
}

async function handleSaveBoletin() {
    if (!boletinSeleccionado) return alert("No hay archivo seleccionado.");
    const result = await saveBoletin(boletinSeleccionado);
    alert(result.message);
    if (result.success) {
        boletinSeleccionado = null;
        document.getElementById("file-info-boletin").textContent = "";
        document.getElementById("save-boletin-button").disabled = true;
        checkCurrentBoletin();
        updateBoletinViewer();
    }
}

async function checkCurrentBoletin() {
    const container = document.getElementById("current-boletin-container");
    const infoDiv = document.getElementById("current-boletin-info");
    const result = await getBoletin();
    if (result.success && result.filename) {
        infoDiv.innerHTML = `<span>${result.filename}</span><button class="action-btn delete" id="delete-boletin-btn">🗑️</button>`;
        container.style.display = "block";
        document.getElementById("delete-boletin-btn").addEventListener("click", deleteCurrentBoletin);
    } else {
        container.style.display = "none";
    }
}

async function deleteCurrentBoletin() {
    if (!confirm("¿Eliminar el boletín actual?")) return;
    const result = await deleteBoletin();
    alert(result.message);
    checkCurrentBoletin();
    updateBoletinViewer();
}

function handleNoticiaFile(file) {
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
        noticiaImagenSeleccionada = file;
        document.getElementById("file-info-noticia").textContent = `Imagen: ${file.name}`;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById("noticia-preview");
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        alert("Por favor, selecciona una imagen (.png o .jpeg).");
    }
}

async function handleSaveNoticia() {
    const id = document.getElementById("noticia-id").value;
    const titulo = document.getElementById("noticia-titulo").value;
    const fecha = document.getElementById("noticia-fecha").value;
    const url = document.getElementById("noticia-url").value;

    if (!titulo || !fecha || !url) return alert("Completa todos los campos.");
    if (!id && !noticiaImagenSeleccionada) return alert("Selecciona una imagen para la nueva noticia.");

    const result = await saveNoticia({ id, titulo, fecha, url }, noticiaImagenSeleccionada);
    alert(result.message);
    if (result.success) {
        resetFormularioNoticia();
        renderizarNoticiasEnEditor();
        renderizarNoticiasEnPaginaPrincipal();
    }
}

async function renderizarNoticiasEnEditor() {
    const lista = document.getElementById("lista-noticias-existentes");
    lista.innerHTML = '<p class="no-programacion">Cargando...</p>';
    const noticias = await getNoticias();
    lista.innerHTML = "";
    if (noticias && noticias.length > 0) {
        noticias.forEach(noticia => {
            const item = document.createElement('div');
            item.className = 'hora-de-emisin';
            item.innerHTML = `<div class="programa-info"><p class="text-wrapper-5">${noticia.titulo} (${noticia.fecha})</p></div><div class="programa-actions"><button class="action-btn edit" data-id="${noticia.id}">✏️</button><button class="action-btn delete" data-id="${noticia.id}">🗑️</button></div>`;
            lista.appendChild(item);
        });
    } else {
        lista.innerHTML = '<p class="no-programacion">No hay noticias.</p>';
    }
}

function handleNoticiaActions(e) {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('edit')) editarNoticia(id);
    else if (e.target.classList.contains('delete')) eliminarNoticia(id);
}

async function editarNoticia(id) {
    const noticia = await getNoticias(id);
    document.getElementById("noticia-id").value = noticia.id;
    document.getElementById("noticia-titulo").value = noticia.titulo;
    document.getElementById("noticia-fecha").value = noticia.fecha;
    document.getElementById("noticia-url").value = noticia.url;
    const preview = document.getElementById("noticia-preview");
    preview.src = noticia.imagen_url + '?v=' + new Date().getTime();
    preview.style.display = 'block';
    document.getElementById("file-info-noticia").textContent = "Dejar vacío para no cambiar la imagen.";
    document.getElementById("save-noticia-button").textContent = "Actualizar Noticia";
    document.getElementById("cancel-edit-noticia-button").style.display = 'inline-block';
}

async function eliminarNoticia(id) {
    if (!confirm("¿Eliminar esta noticia?")) return;
    const result = await deleteNoticia(id);
    alert(result.message);
    if (result.success) {
        renderizarNoticiasEnEditor();
        renderizarNoticiasEnPaginaPrincipal();
    }
}

function resetFormularioNoticia() {
    document.getElementById("form-noticia").reset();
    document.getElementById("noticia-id").value = "";
    document.getElementById("file-info-noticia").textContent = "";
    const preview = document.getElementById("noticia-preview");
    preview.style.display = 'none';
    preview.src = "";
    noticiaImagenSeleccionada = null;
    document.getElementById("save-noticia-button").textContent = "Guardar Noticia";
    document.getElementById("cancel-edit-noticia-button").style.display = 'none';
}

// --- Lógica de Mensajes de Oyentes ---

async function renderizarMensajes() {
    const lista = document.getElementById("lista-mensajes-oyentes");
    lista.innerHTML = '<p class="no-programacion">Cargando mensajes...</p>';
    const mensajes = await getMensajes();
    lista.innerHTML = "";
    if (mensajes && mensajes.length > 0) {
        mensajes.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'mensaje-item';
            item.dataset.id = msg.id;
            item.dataset.nombre = msg.nombre;
            item.dataset.gmail = msg.gmail;
            item.dataset.mensaje = msg.mensaje;
            item.dataset.fecha = msg.fecha_envio;
            item.innerHTML = `<div class="mensaje-info"><span class="mensaje-nombre">${msg.nombre}</span><span class="mensaje-gmail">${msg.gmail}</span><span class="mensaje-gmail">Recibido: ${formatRelativeTime(msg.fecha_envio)}</span></div><div class="mensaje-actions"><button class="editor-button save open-msg">Abrir</button><button class="editor-button cancel delete-msg">Leído</button></div>`;
            lista.appendChild(item);
        });
    } else {
        lista.innerHTML = '<p class="no-programacion">No hay mensajes nuevos.</p>';
    }
}

async function handleMensajeActions(e) {
    const target = e.target;
    const mensajeItem = target.closest('.mensaje-item');
    if (!mensajeItem) return;
    const id = mensajeItem.dataset.id;

    if (target.classList.contains('open-msg')) {
        document.getElementById('mensaje-completo-nombre').textContent = mensajeItem.dataset.nombre;
        document.getElementById('mensaje-completo-gmail').textContent = `(${mensajeItem.dataset.gmail})`;
        document.getElementById('mensaje-completo-fecha').textContent = formatFullDateTime(mensajeItem.dataset.fecha);
        document.getElementById('mensaje-completo-texto').textContent = mensajeItem.dataset.mensaje;
        openModal(document.getElementById("modal-ver-mensaje-completo"));
    } else if (target.classList.contains('delete-msg')) {
        if (confirm("¿Marcar este mensaje como leído? Se eliminará de la lista.")) {
            const result = await manageMensaje('delete', id);
            if (result.success) {
                mensajeItem.remove();
            } else {
                alert(result.message);
            }
        }
    }
}
