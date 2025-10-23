import { fetchProgramacion, getNoticias, getBoletin } from './api.js';
import { getFechaFormatoYMD } from './utils.js';
import { openModal } from './ui.js';

export function initSchedule() {
    const diasSemana = document.querySelectorAll(".dias-semana .dia");
    const contenidoDiaSemanal = document.querySelector(".contenido-dia-semanal");

    diasSemana.forEach(botonDia => {
        botonDia.addEventListener("click", () => {
            diasSemana.forEach(btn => btn.classList.remove("active"));
            botonDia.classList.add("active");
            renderizarProgramacion(botonDia.dataset.fecha, contenidoDiaSemanal);
        });
    });

    // Listener para los botones de "Ver descripción" (usando delegación de eventos)
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('ver-descripcion-btn')) {
            const cronogramaElement = e.target.closest('.hora-de-emisin');
            const nombre = cronogramaElement.dataset.nombre;
            const hora = cronogramaElement.dataset.hora;
            const descripcion = cronogramaElement.dataset.descripcion;
            openDescripcionModal(nombre, hora, descripcion);
        }
    });
}

export async function renderizarProgramacion(fecha, contenedor) {
    contenedor.innerHTML = '<p class="no-programacion">Cargando...</p>';
    const programas = await fetchProgramacion(fecha);
    contenedor.innerHTML = "";

    if (programas && programas.length > 0) {
        programas.sort((a, b) => a.hora.localeCompare(b.hora));
        programas.forEach(programa => {
            const itemHTML = `
              <div class="hora-de-emisin" data-nombre="${programa.nombre}" data-hora="${programa.hora}" data-descripcion="${programa.descripcion || ''}">
                <div class="programa-info">
                  <div class="text-wrapper-4">${programa.hora}</div>
                  <p class="text-wrapper-5">${programa.nombre}</p>
                </div>
                <div class="programa-actions">
                  <button class="editor-button save ver-descripcion-btn">Ver descripción</button>
                </div>
              </div>
            `;
            contenedor.innerHTML += itemHTML;
        });
    } else {
        contenedor.innerHTML = '<p class="no-programacion">No hay programación para este día.</p>';
    }
}

export function setSemanasFechas() {
    const diasSemana = document.querySelectorAll(".dias-semana .dia");
    const hoy = new Date();
    const diaSemanaHoy = hoy.getDay() === 0 ? 7 : hoy.getDay();

    diasSemana.forEach((botonDia, index) => {
        const diaBoton = index + 1;
        const diferenciaDias = diaBoton - diaSemanaHoy;
        const fechaDia = new Date(hoy);
        fechaDia.setDate(hoy.getDate() + diferenciaDias);
        const dia = String(fechaDia.getDate()).padStart(2, '0');
        const mes = String(fechaDia.getMonth() + 1).padStart(2, '0');
        botonDia.querySelector('.dia-fecha').textContent = `(${dia}/${mes})`;
        botonDia.dataset.fecha = getFechaFormatoYMD(fechaDia);
    });
}

function openDescripcionModal(nombre, hora, descripcion) {
    document.getElementById("descripcion-titulo").textContent = nombre;
    document.getElementById("descripcion-hora").textContent = `(${hora})`;
    document.getElementById("descripcion-texto").textContent = descripcion || "Cronograma sin descripción.";
    openModal(document.getElementById("modal-descripcion-cronograma"));
}

export async function renderizarNoticiasEnPaginaPrincipal() {
    const grid = document.querySelector(".noticias-grid");
    grid.innerHTML = "";
    const noticias = await getNoticias();
    if (noticias && noticias.length > 0) {
        noticias.forEach(noticia => {
            const [year, month, day] = noticia.fecha.split('-');
            const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const fechaFormateada = `${day} ${meses[parseInt(month) - 1]}, ${year}`;
            grid.innerHTML += `
              <div class="noticia-item">
                <a href="${noticia.url}" target="_blank" rel="noopener noreferrer">
                  <div class="noticia-imagen" style="background-image: url('${noticia.imagen_url}?v=${new Date().getTime()}');"></div>
                  <div class="noticia-texto-container">
                    <div class="t-ejemplo">${noticia.titulo}</div>
                    <div class="t-ejemplo noticia-fecha">${fechaFormateada}</div>
                  </div>
                </a>
              </div>
            `;
        });
    }
}

export async function updateBoletinViewer() {
    const pdfViewer = document.getElementById("boletin-pdf-viewer");
    const overlayLink = document.getElementById("boletin-overlay-link");
    const boletinTexto = document.getElementById("boletin-texto");
    const result = await getBoletin();

    if (result.success && result.filepath) {
        pdfViewer.src = result.filepath;
        overlayLink.href = result.filepath.replace('#toolbar=0', '');
        pdfViewer.style.display = 'block';
        overlayLink.style.display = 'block';
        boletinTexto.style.display = 'none';
    } else {
        pdfViewer.style.display = 'none';
        overlayLink.style.display = 'none';
        boletinTexto.style.display = 'block';
    }
}
