import { initUI, openModal } from './ui.js';
import { initPlayer } from './player.js';
import { initSchedule, renderizarProgramacion, setSemanasFechas, renderizarNoticiasEnPaginaPrincipal, updateBoletinViewer } from './schedule.js';
import { initAuth } from './auth.js';
import { initAdmin } from './admin.js';
import { getFechaFormatoYMD } from './utils.js';
import { enviarMensaje } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
  // --- INICIALIZACIÓN DE MÓDULOS ---
  initUI();
  initPlayer();
  initAuth();
  initAdmin();
  initSchedule();

  // --- LÓGICA DE LA PÁGINA PRINCIPAL ---
  const currentDateEl = document.getElementById("current-date");
  const contenedorProgramacionDiaria = document.querySelector(".pruebas-de");
  const openModalProgramacion = document.getElementById("open-modal-programacion");

  const setDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    currentDateEl.textContent = `${day}/${month}`;
  };
  setDate();

  openModalProgramacion.addEventListener("click", () => {
    const modal = document.getElementById("modal-programacion");
    openModal(modal);
    setSemanasFechas();
    const diasSemana = document.querySelectorAll(".dias-semana .dia");
    const hoy = new Date();
    const diaSemanaHoyIndex = hoy.getDay() - 1;
    if (diaSemanaHoyIndex >= 0 && diaSemanaHoyIndex < 5) {
      diasSemana[diaSemanaHoyIndex].click();
    } else {
      diasSemana[0].click();
    }
  });

  // Carga inicial de contenido
  renderizarProgramacion(getFechaFormatoYMD(new Date()), contenedorProgramacionDiaria);
  updateBoletinViewer();
  renderizarNoticiasEnPaginaPrincipal();

  // --- Lógica para el Formulario de Mensajes de Oyentes ---
  const formMensajeOyente = document.getElementById("form-mensaje-oyente");
  const mensajeTexto = document.getElementById("mensaje-texto");
  const charCounter = document.getElementById("char-counter");
  const mensajeStatus = document.getElementById("mensaje-oyente-status");
  const maxChars = 300;

  mensajeTexto.addEventListener("input", () => {
    const currentLength = mensajeTexto.value.length;
    charCounter.textContent = `${currentLength}/${maxChars}`;
    charCounter.classList.toggle("warning", maxChars - currentLength <= 10);
  });

  formMensajeOyente.addEventListener("submit", async (event) => {
    event.preventDefault();
    mensajeStatus.textContent = "Enviando...";
    const formData = new FormData(formMensajeOyente);
    const data = Object.fromEntries(formData.entries());
    const result = await enviarMensaje(data);
    mensajeStatus.textContent = result.message;
    mensajeStatus.className = result.success ? "success-message" : "error-message";
    if (result.success) {
      formMensajeOyente.reset();
      charCounter.textContent = `0/${maxChars}`;
      charCounter.classList.remove("warning");
    }
  });
});
