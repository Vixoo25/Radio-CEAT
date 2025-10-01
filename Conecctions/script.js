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

  // Este objeto ahora funcionará como una caché temporal para las ediciones.
  let calendarioProgramacion = {};

  // Función para obtener la programación desde la base de datos
  const fetchProgramacion = async (fecha) => {
    try {
      const response = await fetch(`obtener_cronogramas.php?fecha=${fecha}`);
      if (!response.ok) throw new Error('Error en la respuesta del servidor.');
      return await response.json();
    } catch (error) {
      console.error("Error al obtener la programación:", error);
      return []; // Devuelve un array vacío en caso de error
    }
  };

  // Función genérica para renderizar la programación en un contenedor
  const renderizarProgramacion = async (fecha, contenedor) => {
    contenedor.innerHTML = ""; // Limpiamos el contenido anterior
    const programas = calendarioProgramacion[fecha] || await fetchProgramacion(fecha);

    // Verificamos si hay programas para esa fecha
    if (programas && programas.length > 0) {
      // Ordenamos por hora de inicio
      programas.sort((a, b) => a.hora.localeCompare(b.hora));
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
  const modalAddCronograma = document.getElementById("modal-add-cronograma");
  const addCronogramaContent = modalAddCronograma.querySelector(".modal-content");
  const closeAddCronogramaButton = modalAddCronograma.querySelector(".close-button");
  const cronogramaFechaSubtitulo = document.getElementById("cronograma-fecha-subtitulo");
  const listaCronogramasExistentes = document.getElementById("lista-cronogramas-existentes");
  const saveCronogramaButton = document.getElementById("save-cronograma-button");
  const cronogramaNombreInput = document.getElementById("cronograma-nombre");
  const cronogramaInicioInput = document.getElementById("cronograma-inicio");
  const cronogramaFinInput = document.getElementById("cronograma-fin");

  let currentEditingId = null; // Variable para guardar el ID del cronograma que se está editando
  let currentEditingDate = null; // Variable para guardar la fecha que se está editando

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
      
      // Esperamos 1 segundo y cambiamos al modal de edición
      setTimeout(() => {
        closeLoginModal();
        // Pequeña espera para que el modal de login se cierre antes de abrir el otro
        setTimeout(openEditorModal, 200);
      }, 1000);
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

  // Botón rojo: Descarta los cambios y cierra
  editorCancelButton.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que quieres descartar todos los cambios no guardados?")) {
      calendarioProgramacion = {}; // Limpia la caché de ediciones
      closeEditorModal();
    }
  });

  // Botón verde: Guarda los cambios en la BD y cierra
  editorSaveButton.addEventListener("click", async () => {
    try {
      const response = await fetch('sincronizar_cronogramas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendario: calendarioProgramacion })
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
        calendarioProgramacion = {}; // Limpia la caché
        closeEditorModal();
        // Actualiza la vista principal por si cambió el día de hoy
        renderizarProgramacion(getFechaFormatoYMD(new Date()), contenedorProgramacionDiaria);
      } else {
        alert(`Error al guardar: ${result.message}`);
      }
    } catch (error) {
      alert("Error de conexión al intentar guardar los cambios.");
    }
  });

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
      const fechaCompleta = getFechaFormatoYMD(currentDate);
      const isSunday = currentDate.getDay() === 0;
      calendarHTML += `<div class="calendar-day ${isSunday ? 'sunday' : ''}" data-fecha="${fechaCompleta}">${day}</div>`;
    }

    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;

    // --- Nueva Lógica: Añadir eventos de clic a los días del calendario ---
    document.querySelectorAll('.calendar-day:not(.not-current-month)').forEach(dayElement => {
      dayElement.addEventListener('click', () => {
        const fechaSeleccionada = dayElement.dataset.fecha;
        openAddCronogramaModal(fechaSeleccionada);
      });
    });
  };

  // --- Lógica para el Modal de Añadir Cronograma ---

  const openAddCronogramaModal = async (fecha) => {
    // Guardamos la fecha actual que se está editando
    currentEditingDate = fecha;
    currentEditingId = null; // Reseteamos el ID de edición
    saveCronogramaButton.textContent = "Guardar"; // Reseteamos el texto del botón

    // Formateamos la fecha para mostrarla en el subtítulo
    const [year, month, day] = fecha.split('-');
    cronogramaFechaSubtitulo.textContent = `${day}/${month}/${year}`;
    // Forzamos la carga desde la BD al abrir el modal
    calendarioProgramacion[fecha] = await fetchProgramacion(fecha);

    // --- Nueva Lógica: Renderizar cronogramas existentes ---
    // Usamos la misma función 'renderizarProgramacion' pero en el nuevo contenedor
    renderizarProgramacionEnModal(fecha, listaCronogramasExistentes);

    modalAddCronograma.style.display = "flex";
    addCronogramaContent.style.animation = "animatetop 0.4s";
  };

  const closeAddCronogramaModal = () => {
    addCronogramaContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
      modalAddCronograma.style.display = "none";
      // Limpiamos los campos al cerrar
      cronogramaNombreInput.value = "";
      cronogramaInicioInput.value = "";
      cronogramaFinInput.value = "";
      currentEditingId = null; // Limpiamos el ID de edición
    }, 400);
  };

  closeAddCronogramaButton.addEventListener("click", closeAddCronogramaModal);

  // Función específica para renderizar en el modal de añadir, usando la caché
  const renderizarProgramacionEnModal = (fecha, contenedor) => {
    contenedor.innerHTML = ""; // Limpiamos
    const programas = calendarioProgramacion[fecha] || []; // Usamos la caché local

    if (programas.length > 0) {
      programas.sort((a, b) => a.hora.localeCompare(b.hora));
      programas.forEach(programa => {
        // Creamos los botones de acción para cada programa
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

    // Añadimos los event listeners a los nuevos botones después de renderizar
    addEventListenersToActions();
  };

  // Evento para el botón de guardar en el modal de añadir cronograma
  saveCronogramaButton.addEventListener("click", async () => {
    const nombre = cronogramaNombreInput.value.trim();
    const inicio = cronogramaInicioInput.value;
    const fin = cronogramaFinInput.value;

    // Validamos que los campos no estén vacíos
    if (!nombre || !inicio || !fin || !currentEditingDate) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    // Si estamos editando (currentEditingId tiene un valor)
    if (currentEditingId) {
      // Lógica para ACTUALIZAR
      try {
        const response = await fetch('gestionar_cronograma.php', {
          method: 'POST', // Usamos POST para actualizar
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentEditingId, nombre, inicio, fin })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        // Actualizamos la caché local
        const programaIndex = calendarioProgramacion[currentEditingDate].findIndex(p => p.id === currentEditingId);
        if (programaIndex > -1) {
          calendarioProgramacion[currentEditingDate][programaIndex] = { id: currentEditingId, nombre, hora: `${inicio} - ${fin}` };
        }

      } catch (error) {
        alert(`Error al actualizar: ${error.message}`);
      }
    } else {
      // Lógica para CREAR (la que ya teníamos, pero ahora en la caché)
      const nuevoCronograma = {
        // Asignamos un ID temporal negativo para diferenciarlo de los de la BD
        id: `temp-${Date.now()}`, 
        hora: `${inicio} - ${fin}`,
        nombre: nombre
      };
      if (!calendarioProgramacion[currentEditingDate]) {
        calendarioProgramacion[currentEditingDate] = [];
      }
      calendarioProgramacion[currentEditingDate].push(nuevoCronograma);
    }

    // Refrescamos la lista y limpiamos el formulario
    renderizarProgramacionEnModal(currentEditingDate, listaCronogramasExistentes);
    cronogramaNombreInput.value = "";
    cronogramaInicioInput.value = "";
    cronogramaFinInput.value = "";
    currentEditingId = null; // Reseteamos el ID
    saveCronogramaButton.textContent = "Guardar"; // Reseteamos el botón
  });

  // Función para añadir los listeners a los botones de editar/borrar
  const addEventListenersToActions = () => {
    // Botones de Editar
    document.querySelectorAll('.action-btn.edit').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const programa = calendarioProgramacion[currentEditingDate].find(p => p.id == id);
        if (programa) {
          const [inicio, fin] = programa.hora.split(' - ');
          cronogramaNombreInput.value = programa.nombre;
          cronogramaInicioInput.value = inicio;
          cronogramaFinInput.value = fin;
          currentEditingId = id; // Guardamos el ID que estamos editando
          saveCronogramaButton.textContent = "Actualizar"; // Cambiamos el texto del botón
        }
      });
    });

    // Botones de Borrar
    document.querySelectorAll('.action-btn.delete').forEach(button => {
      button.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("¿Estás seguro de que quieres eliminar este cronograma?")) {
          // Si el ID es temporal, solo lo borramos de la caché
          if (String(id).startsWith('temp-')) {
            calendarioProgramacion[currentEditingDate] = calendarioProgramacion[currentEditingDate].filter(p => p.id != id);
            renderizarProgramacionEnModal(currentEditingDate, listaCronogramasExistentes);
            return;
          }

          // Si el ID es de la BD, hacemos la petición DELETE
          try {
            const response = await fetch('gestionar_cronograma.php', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            // Eliminamos de la caché local y volvemos a renderizar
            calendarioProgramacion[currentEditingDate] = calendarioProgramacion[currentEditingDate].filter(p => p.id != id);
            renderizarProgramacionEnModal(currentEditingDate, listaCronogramasExistentes);

          } catch (error) {
            alert(`Error al eliminar: ${error.message}`);
          }
        }
      });
    });
  };
});