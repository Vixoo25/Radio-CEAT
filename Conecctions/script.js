document.addEventListener("DOMContentLoaded", () => {
  // 1. Seleccionamos los elementos que necesitamos controlar
  const audioPlayer = document.getElementById("audio-player");
  const playButton = document.getElementById("play-button");
  const statusPlaying = document.getElementById("status-playing");
  const statusPaused = document.getElementById("status-paused");
  const playIcon = document.getElementById("play-icon");
  const playText = document.getElementById("play-text");
  const currentDateEl = document.getElementById("current-date");
  const contenedorProgramacionDiaria = document.querySelector(".pruebas-de");
 const modalProgramacion = document.getElementById("modal-programacion");
 const openModalProgramacion = document.getElementById("open-modal-programacion");
 const diasSemana = document.querySelectorAll(".dias-semana .dia");
 const contenidoDiaSemanal = document.querySelector(".contenido-dia-semanal");
 const modalContent = document.querySelector(".modal-content");
  const volumeSlider = document.getElementById("volume-slider");

  // 2. Creamos una variable para saber si el audio está sonando
  let isPlaying = false;

  // 3. Añadimos un "escuchador" al botón de reproducir
  playButton.addEventListener("click", () => {
    // 4. Comprobamos si está sonando o no
    if (isPlaying) {
      // Si está sonando, lo pausamos
      audioPlayer.pause();
      statusPlaying.style.display = "none";
      statusPaused.style.display = "inline";
      playIcon.textContent = "▶︎";
      playText.textContent = "Reproducir";
    } else {
      // Si está pausado, lo reproducimos
      audioPlayer.play();
      statusPlaying.style.display = "inline";
      statusPaused.style.display = "none";
      playIcon.textContent = "⏸︎";
      playText.textContent = "Pausar";
    }

    // 5. Invertimos el estado de la variable
    isPlaying = !isPlaying;
  });

  // 7. Añadimos un "escuchador" al slider de volumen
  volumeSlider.addEventListener("input", (e) => {
    // El valor del slider va de 0 a 100, el volumen del audio va de 0.0 a 1.0
    audioPlayer.volume = e.target.value / 100;
  });

  // 6. Función para establecer la fecha actual
  const setDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    currentDateEl.textContent = `${day}/${month}`;
  };
  setDate();

  // --- Lógica de Programación Centralizada (Calendario) ---

  // Esta es nuestra nueva fuente de datos única.
  // Las claves son fechas en formato "YYYY-MM-DD".
  const calendarioProgramacion = {
    "2024-10-28": [
      { hora: "08:00 - 09:30", nombre: "Música para Despertar" },
      { hora: "10:00 - 11:00", nombre: "Noticias CEAT" },
      { hora: "14:00 - 15:00", nombre: "Tardes de Rock" },
    ],
    "2024-10-29": [
      { hora: "09:00 - 10:00", nombre: "Clásicos de los 80" },
      { hora: "11:30 - 12:30", nombre: "Entrevistas Escolares" },
    ],
    "2024-10-30": [
      { hora: "08:30 - 09:30", nombre: "Podcast de Ciencias" },
      { hora: "13:00 - 14:00", nombre: "Música Pop Actual" },
      { hora: "16:00 - 17:00", nombre: "Debate Estudiantil" },
    ],
    "2024-10-31": [
      { hora: "10:00 - 11:00", nombre: "Especial de Bandas Sonoras" },
    ],
    "2024-11-01": [], // Viernes sin programación
  };

  // Función genérica para renderizar la programación en un contenedor
  const renderizarProgramacion = (fecha, contenedor) => {
    contenedor.innerHTML = ""; // Limpiamos el contenido anterior
    const programas = calendarioProgramacion[fecha];

    // Verificamos si hay programas para esa fecha
    if (programas && programas.length > 0) {
      programas.forEach(programa => {
        const itemHTML = `
          <div class="hora-de-emisin">
            <div class="text-wrapper-4">${programa.hora}</div>
            <p class="text-wrapper-5">${programa.nombre}</p>
          </div>
        `;
        contenedor.innerHTML += itemHTML;
      });
    } else {
      // Mostramos un mensaje si no hay programación
      contenedor.innerHTML = '<p class="no-programacion">No hay programación para este día.</p>';
    }
  };

  // Función para formatear una fecha a "YYYY-MM-DD"
  const getFechaFormatoYMD = (date) => {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  // Función para establecer las fechas en los botones de la semana
  const setSemanasFechas = () => {
    const hoy = new Date();
    // Obtenemos el día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    // Ajustamos para que la semana empiece en Lunes (1) y termine en Domingo (7)
    const diaSemanaHoy = hoy.getDay() === 0 ? 7 : hoy.getDay();

    diasSemana.forEach((botonDia, index) => {
      const diaBoton = index + 1; // 1 para Lunes, 2 para Martes, etc.
      const diferenciaDias = diaBoton - diaSemanaHoy;
      
      const fechaDia = new Date(hoy);
      fechaDia.setDate(hoy.getDate() + diferenciaDias);

      const dia = String(fechaDia.getDate()).padStart(2, '0');
      const mes = String(fechaDia.getMonth() + 1).padStart(2, '0');

      botonDia.querySelector('.dia-fecha').textContent = `(${dia}/${mes})`;
      botonDia.dataset.fecha = getFechaFormatoYMD(fechaDia); // Guardamos la fecha completa
    });
  };

   // Función para abrir la ventana modal
  openModalProgramacion.addEventListener("click", () => {
    modalProgramacion.style.display = "flex"; // Cambiado a flex para centrar
    // Aseguramos que la animación de entrada se ejecute
    modalContent.style.animation = "animatetop 0.4s";

    // --- Nueva lógica para seleccionar el día actual ---
    const hoy = new Date();
    // Obtenemos el día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    // y lo ajustamos para que el índice coincida con nuestros botones (0=Lunes, ..., 4=Viernes)
    const diaSemanaHoyIndex = hoy.getDay() - 1;

    // Verificamos si el día actual es un día hábil (Lunes a Viernes, índice 0-4)
    if (diaSemanaHoyIndex >= 0 && diaSemanaHoyIndex < 5) {
      diasSemana[diaSemanaHoyIndex].click(); // Hacemos clic en el día actual
    } else {
      diasSemana[0].click(); // Si es fin de semana, mostramos el Lunes por defecto
    }
    // Establecemos las fechas de la semana
    setSemanasFechas();
  });

  // Función para cerrar la ventana modal con animación
  const closeModal = () => {
    modalContent.style.animation = "animatebottom 0.4s";
    // Esperamos a que la animación termine para ocultar el modal
    setTimeout(() => {
      modalProgramacion.style.display = "none";
    }, 400); // 400ms es la duración de la animación
  };

  // Función para cerrar la ventana modal al hacer clic fuera de ella
  modalProgramacion.addEventListener("click", (event) => {
    if (event.target === modalProgramacion) {
      closeModal();
    }
  });

  // Añadimos un "escuchador" a cada botón de día
  diasSemana.forEach(botonDia => {
    botonDia.addEventListener("click", () => {
      // Quitamos la clase 'active' de todos los botones
      diasSemana.forEach(btn => btn.classList.remove("active"));
      // Añadimos la clase 'active' solo al botón clickeado
      botonDia.classList.add("active");
      // Renderizamos la programación del día correspondiente
      // Usamos la fecha completa guardada en data-fecha
      renderizarProgramacion(botonDia.dataset.fecha, contenidoDiaSemanal);
    });
  });

  // Renderizamos la programación del día actual en la sección "Programación diaria"
  const fechaHoyYMD = getFechaFormatoYMD(new Date());
  renderizarProgramacion(fechaHoyYMD, contenedorProgramacionDiaria);

  // --- Lógica para el Modal de Login ---

  const openLoginModal = document.getElementById("open-login-modal");
  const modalLogin = document.getElementById("modal-login");
  const loginContent = modalLogin.querySelector(".modal-content");
  const closeLoginButton = modalLogin.querySelector(".close-button");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const modalEditor = document.getElementById("modal-editor");
  const editorContent = modalEditor.querySelector(".modal-content");
  const yearSelector = document.getElementById("year-selector");
  const monthSelector = document.getElementById("month-selector");
  const calendarContainer = document.getElementById("calendar-container");
  const editorCancelButton = document.getElementById("editor-cancel-button");
  const editorSaveButton = document.getElementById("editor-save-button");

  // Función para abrir el modal de login
  openLoginModal.addEventListener("click", () => {
    modalLogin.style.display = "flex"; // Cambiado a flex para centrar
    loginContent.style.animation = "animatetop 0.4s";
  });

  // Función para cerrar el modal de login con animación
  const closeLoginModal = () => {
    loginContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
      modalLogin.style.display = "none";
      // Limpiamos los campos y mensajes al cerrar
      loginForm.reset();
      loginMessage.textContent = "";
      loginMessage.className = "";
    }, 400);
  };

  // Evento para cerrar con el botón X
  closeLoginButton.addEventListener("click", closeLoginModal);

  // Evento para manejar el envío del formulario
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Evita que la página se recargue

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Comparamos con las credenciales del archivo config.js
    if (username === adminCredentials.username && password === adminCredentials.password) {
      loginMessage.textContent = "Inicio de Sesión Exitoso";
      loginMessage.className = "success-message";
      
      // Esperamos 3 segundos y cambiamos al modal de edición
      setTimeout(() => {
        closeLoginModal();
        // Pequeña espera para que el modal de login se cierre antes de abrir el otro
        setTimeout(openEditorModal, 200);
      }, 3000);
    } else {
      loginMessage.textContent = "Usuario y/o Contraseña incorrectos, intente nuevamente";
      loginMessage.className = "error-message";
      usernameInput.value = "";
      passwordInput.value = "";
    }
  });

  // --- Lógica para el Modal del Editor ---

  const openEditorModal = () => {
    modalEditor.style.display = "flex";
    editorContent.style.animation = "animatetop 0.4s";
    initializeEditor();
  };

  const closeEditorModal = () => {
    editorContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
      modalEditor.style.display = "none";
    }, 400);
  };

  editorCancelButton.addEventListener("click", closeEditorModal);
  editorSaveButton.addEventListener("click", closeEditorModal);

  const initializeEditor = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Llenar selector de año (+/- 1 año)
    yearSelector.innerHTML = "";
    for (let i = currentYear - 1; i <= currentYear + 1; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      yearSelector.appendChild(option);
    }
    yearSelector.value = currentYear;

    // Llenar selector de mes
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

    yearSelector.addEventListener("change", () => generateCalendar(yearSelector.value, monthSelector.value));
    monthSelector.addEventListener("change", () => generateCalendar(yearSelector.value, monthSelector.value));
  };

  const generateCalendar = (year, month) => {
    calendarContainer.innerHTML = ""; // Limpiar calendario anterior
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, parseInt(month) + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Ajustamos para que la semana empiece en Lunes (0) y termine en Domingo (6)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; 

    let calendarHTML = '<div class="calendar-grid">';
    // Añadir cabeceras de días
    const diasHeader = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    diasHeader.forEach(dia => {
      calendarHTML += `<div class="calendar-header">${dia}</div>`;
    });

    // Añadir celdas vacías al principio
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarHTML += '<div class="calendar-day not-current-month"></div>';
    }

    // Añadir los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSunday = currentDate.getDay() === 0;
      calendarHTML += `<div class="calendar-day ${isSunday ? 'sunday' : ''}">${day}</div>`;
    }

    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;
  };
});