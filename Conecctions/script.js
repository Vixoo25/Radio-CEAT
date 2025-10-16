document.addEventListener("DOMContentLoaded", () => {
  // --- Variables Globales ---
  // Variable para almacenar el archivo PDF seleccionado para el boletín
  let boletinSeleccionado = null;
  // Variable para almacenar el archivo de imagen de la noticia
  let noticiaImagenSeleccionada = null;

  // --- Funciones de Utilidad ---
  const getFechaFormatoYMD = (date) => {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  // --- Lógica para ajustar el padding superior dinámicamente ---
  const topBar = document.querySelector(".top-bar");
  const mainPage = document.querySelector(".pgina-principal");

  const adjustTopPadding = () => {
    // 1. Obtenemos la altura actual de la barra superior
    const topBarHeight = topBar.offsetHeight;
    // 2. Aplicamos esa altura + un margen de 30px al padding-top del contenido principal
    // Usamos una variable CSS (--top-bar-height) para que sea fácil de actualizar.
    mainPage.style.setProperty('--top-bar-height', `${topBarHeight + 30}px`);
  };

  // Ejecutamos la función al cargar la página
  adjustTopPadding();
  // Y también cada vez que se redimensione la ventana (importante para móviles al girar la pantalla)
  window.addEventListener('resize', adjustTopPadding);

  // --- Lógica del Reproductor de Audio ---
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
      const response = await fetch(`Conecctions/php/obtener_cronogramas.php?fecha=${fecha}`);
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
        // Añadimos el botón y el data-attribute con la descripción
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
      // Mostramos un mensaje si no hay programación
      contenedor.innerHTML = '<p class="no-programacion">No hay programación para este día.</p>';
    }

    // Añadimos los listeners a los nuevos botones de "Ver descripción"
    addEventListenersToVerDescripcion();
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
  // (Este es para el CRONOGRAMA)

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
  const modalEditorNoticias = document.getElementById("modal-editor-noticias");
  const editorNoticiasContent = modalEditorNoticias.querySelector(".modal-content");
  const closeEditorNoticiasButton = modalEditorNoticias.querySelector(".close-button");

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

  // --- Nuevos Elementos para Mensajes de Oyentes ---
  const verMensajesButton = document.getElementById("ver-mensajes-button");
  const modalVerMensajes = document.getElementById("modal-ver-mensajes");
  const closeVerMensajesButton = modalVerMensajes.querySelector(".close-button");
  const listaMensajesOyentes = document.getElementById("lista-mensajes-oyentes");

  const cronogramaDescripcionInput = document.getElementById("cronograma-descripcion");
  let currentEditingId = null; // Variable para guardar el ID del cronograma que se está editando
  let currentEditingDate = null; // Variable para guardar la fecha que se está editando

  // Función para abrir el modal de login
  openLoginModal.addEventListener("click", async () => {
    // 1. Comprobar si ya hay una sesión activa
    try {
      const response = await fetch('Conecctions/php/check_session.php');
      const session = await response.json();

      // 2. Si hay sesión y el rol es correcto, abrir el editor directamente
      if (session.success && (session.role === 'cronograma' || session.role === 'admin_total')) {
        openEditorModal();
      } else {
        // 3. Si no, mostrar el modal de login
        modalLogin.style.display = "flex";
        loginContent.style.animation = "animatetop 0.4s";
      }
    } catch (error) {
      // En caso de error de red, mostrar el login como fallback
      console.error("Error al verificar la sesión:", error);
      modalLogin.style.display = "flex";
      loginContent.style.animation = "animatetop 0.4s";
    }
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
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evita que la página se recargue

    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
      const response = await fetch('Conecctions/php/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();

      loginMessage.textContent = result.message;
      if (result.success && (result.role === 'cronograma' || result.role === 'admin_total')) {
        loginMessage.className = "success-message";
        setTimeout(() => {
          closeLoginModal();
          setTimeout(openEditorModal, 200);
        }, 1000);
      } else {
        loginMessage.className = "error-message";
        if (!result.success) passwordInput.value = ""; // Limpiar solo la contraseña si falla
      }
    } catch (error) {
      loginMessage.textContent = "Error de conexión con el servidor.";
      loginMessage.className = "error-message";
    }
  });

  // --- Lógica para el Modal de Login de NOTICIAS ---

  const openLoginNoticiasModal = document.getElementById("open-login-noticias-modal");
  const modalLoginNoticias = document.getElementById("modal-login-noticias");
  const loginNoticiasContent = modalLoginNoticias.querySelector(".modal-content");
  const closeLoginNoticiasButton = modalLoginNoticias.querySelector(".close-button");
  const loginNoticiasForm = document.getElementById("login-form-noticias");
  const loginNoticiasMessage = document.getElementById("login-message-noticias");

  // Función para abrir el modal de login de noticias
  openLoginNoticiasModal.addEventListener("click", async () => {
    // 1. Comprobar si ya hay una sesión activa
    try {
      const response = await fetch('Conecctions/php/check_session.php');
      const session = await response.json();

      // 2. Si hay sesión y el rol es correcto, abrir el editor directamente
      if (session.success && (session.role === 'noticias' || session.role === 'admin_total')) {
        openEditorNoticiasModal();
      } else {
        // 3. Si no, mostrar el modal de login
        modalLoginNoticias.style.display = "flex";
        loginNoticiasContent.style.animation = "animatetop 0.4s";
      }
    } catch (error) {
      console.error("Error al verificar la sesión:", error);
      modalLoginNoticias.style.display = "flex";
      loginNoticiasContent.style.animation = "animatetop 0.4s";
    }
  });

  // Función para cerrar el modal de login de noticias
  const closeLoginNoticiasModal = () => {
    loginNoticiasContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
      modalLoginNoticias.style.display = "none";
      loginNoticiasForm.reset();
      loginNoticiasMessage.textContent = "";
      loginNoticiasMessage.className = "";
    }, 400);
  };

  closeLoginNoticiasButton.addEventListener("click", closeLoginNoticiasModal);

  // --- Lógica para Cerrar Sesión ---
  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que quieres cerrar la sesión?")) {
      try {
        await fetch('Conecctions/php/logout.php');
        alert("Sesión cerrada. Serás redirigido a la página principal.");
        window.location.reload(); // Recarga la página para limpiar todo estado
      } catch (error) {
        alert("Error al intentar cerrar la sesión.");
      }
    }
  };

  document.getElementById("logout-noticias-button").addEventListener("click", handleLogout);
  document.getElementById("logout-cronograma-button").addEventListener("click", handleLogout);

  // Evento para manejar el envío del formulario de noticias
  loginNoticiasForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username-noticias").value;
    const password = document.getElementById("password-noticias").value;

    try {
      const response = await fetch('Conecctions/php/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();

      loginNoticiasMessage.textContent = result.message;
      if (result.success && (result.role === 'noticias' || result.role === 'admin_total')) {
        loginNoticiasMessage.className = "success-message";
        setTimeout(() => {
          closeLoginNoticiasModal();
          setTimeout(openEditorNoticiasModal, 200);
        }, 1000);
      } else {
        loginNoticiasMessage.className = "error-message";
        if (!result.success) document.getElementById("password-noticias").value = "";
      }
    } catch (error) {
      loginNoticiasMessage.textContent = "Error de conexión con el servidor.";
      loginNoticiasMessage.className = "error-message";
    }
  });

  // --- Lógica para el Modal del Editor de Boletín y Noticias ---

  const openEditorNoticiasModal = () => {
    modalEditorNoticias.style.display = "flex";
    editorNoticiasContent.style.animation = "animatetop 0.4s";
    // Al abrir, cargamos los datos del boletín y las noticias
    checkCurrentBoletin();
    renderizarNoticiasEnEditor();
  };
  
  const closeEditorNoticiasModal = () => {
    editorNoticiasContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
      modalEditorNoticias.style.display = "none";
      // Limpiamos la selección al cerrar
      boletinSeleccionado = null;
      document.getElementById("file-info-boletin").textContent = "";
      document.getElementById("save-boletin-button").disabled = true;
      resetFormularioNoticia();
    }, 400);
  };

  closeEditorNoticiasButton.addEventListener("click", closeEditorNoticiasModal);

  // Lógica para el área de "arrastrar y soltar" del boletín
  const dropZoneBoletin = document.getElementById("drop-zone-boletin");
  const fileInputBoletin = document.getElementById("file-input-boletin");
  const fileInfoBoletin = document.getElementById("file-info-boletin");
  const saveBoletinButton = document.getElementById("save-boletin-button");

  // Prevenir comportamiento por defecto del navegador
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZoneBoletin.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  // Resaltar el área al arrastrar un archivo sobre ella
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZoneBoletin.addEventListener(eventName, () => {
      dropZoneBoletin.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZoneBoletin.addEventListener(eventName, () => {
      dropZoneBoletin.classList.remove('dragover');
    }, false);
  });

  // Manejar el archivo soltado
  dropZoneBoletin.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      boletinSeleccionado = files[0];
      fileInfoBoletin.textContent = `Archivo seleccionado: ${boletinSeleccionado.name}`;
      saveBoletinButton.disabled = false;
    } else {
      alert("Por favor, selecciona un archivo PDF.");
    }
  }, false);

  // Abrir selector de archivos al hacer clic
  dropZoneBoletin.addEventListener('click', () => {
    fileInputBoletin.click();
  });

  fileInputBoletin.addEventListener('change', () => {
    if (fileInputBoletin.files.length > 0) {
      boletinSeleccionado = fileInputBoletin.files[0];
      fileInfoBoletin.textContent = `Archivo seleccionado: ${boletinSeleccionado.name}`;
      saveBoletinButton.disabled = false;
    }
  });

  // Lógica para guardar el boletín
  saveBoletinButton.addEventListener("click", async () => {
    if (!boletinSeleccionado) {
      alert("No hay ningún archivo PDF seleccionado.");
      return;
    }

    const formData = new FormData();
    formData.append('boletin_pdf', boletinSeleccionado);

    try {
      const response = await fetch('Conecctions/php/gestionar_boletin.php?action=save', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      alert(result.message);

      if (result.success) {
        // No cerramos el modal, solo actualizamos su estado
        boletinSeleccionado = null;
        document.getElementById("file-info-boletin").textContent = "";
        saveBoletinButton.disabled = true;
        checkCurrentBoletin(); // Actualiza la sección "Boletín Actual" en el modal
        updateBoletinViewer(); // Actualiza la vista principal
      }
    } catch (error) {
      alert("Error al subir el archivo. Revisa la consola para más detalles.");
      console.error("Error en la subida:", error);
    }
  });

  // Función para comprobar y mostrar el boletín actual
  const checkCurrentBoletin = async () => {
    const container = document.getElementById("current-boletin-container");
    const infoDiv = document.getElementById("current-boletin-info");
    try {
      const response = await fetch('Conecctions/php/gestionar_boletin.php?action=get');
      const result = await response.json();

      if (result.success && result.filename) {
        infoDiv.innerHTML = `
          <span>${result.filename}</span>
          <button class="action-btn delete" id="delete-boletin-btn">🗑️</button>
        `;
        container.style.display = "block";

        // Añadir evento al nuevo botón de eliminar
        document.getElementById("delete-boletin-btn").addEventListener("click", deleteCurrentBoletin);
      } else {
        container.style.display = "none";
      }
    } catch (error) {
      console.error("Error al obtener el boletín actual:", error);
      container.style.display = "none";
    }
  };

  // Función para eliminar el boletín actual
  const deleteCurrentBoletin = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar el boletín actual?")) return;
    const response = await fetch('Conecctions/php/gestionar_boletin.php?action=delete', { method: 'POST' });
    const result = await response.json();
    alert(result.message);
    checkCurrentBoletin(); // Re-verificamos para actualizar la UI
    updateBoletinViewer(); // Actualizamos la vista principal
  };

  // --- Lógica para el Editor de Noticias ---

  const dropZoneNoticia = document.getElementById("drop-zone-noticia");
  const fileInputNoticia = document.getElementById("file-input-noticia");
  const fileInfoNoticia = document.getElementById("file-info-noticia");
  const noticiaPreview = document.getElementById("noticia-preview");
  const saveNoticiaButton = document.getElementById("save-noticia-button");
  const cancelEditNoticiaButton = document.getElementById("cancel-edit-noticia-button");
  const formNoticia = document.getElementById("form-noticia");

  // Lógica de Drag & Drop para la imagen de la noticia
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZoneNoticia.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
  });
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZoneNoticia.addEventListener(eventName, () => dropZoneNoticia.classList.add('dragover'), false);
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropZoneNoticia.addEventListener(eventName, () => dropZoneNoticia.classList.remove('dragover'), false);
  });

  const handleNoticiaFile = (file) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      noticiaImagenSeleccionada = file;
      fileInfoNoticia.textContent = `Imagen: ${file.name}`;
      // Previsualización de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        noticiaPreview.src = e.target.result;
        noticiaPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      alert("Por favor, selecciona un archivo de imagen (.png o .jpeg).");
    }
  };

  dropZoneNoticia.addEventListener('drop', (e) => handleNoticiaFile(e.dataTransfer.files[0]), false);
  dropZoneNoticia.addEventListener('click', () => fileInputNoticia.click());
  fileInputNoticia.addEventListener('change', () => handleNoticiaFile(fileInputNoticia.files[0]));

  // Lógica para guardar/actualizar noticia
  saveNoticiaButton.addEventListener("click", async () => {
    const id = document.getElementById("noticia-id").value;
    const titulo = document.getElementById("noticia-titulo").value;
    const fecha = document.getElementById("noticia-fecha").value;
    const url = document.getElementById("noticia-url").value;

    if (!titulo || !fecha || !url) {
      alert("Por favor, completa todos los campos: título, fecha y URL.");
      return;
    }
    // Si es una noticia nueva, la imagen es obligatoria
    if (!id && !noticiaImagenSeleccionada) {
      alert("Por favor, selecciona una imagen para la nueva noticia.");
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('fecha', fecha);
    formData.append('url', url);
    if (id) formData.append('id', id);
    if (noticiaImagenSeleccionada) formData.append('imagen', noticiaImagenSeleccionada);

    try {
      const response = await fetch('Conecctions/php/gestionar_noticias.php', { method: 'POST', body: formData });
      const result = await response.json();
      alert(result.message);

      if (result.success) {
        resetFormularioNoticia();
        renderizarNoticiasEnEditor();
        renderizarNoticiasEnPaginaPrincipal();
      }
    } catch (error) {
      alert("Error al guardar la noticia. Revisa la consola.");
      console.error("Error al guardar noticia:", error);
    }
  });

  // Función para renderizar las noticias en el editor
  const renderizarNoticiasEnEditor = async () => {
    const lista = document.getElementById("lista-noticias-existentes");
    lista.innerHTML = '<p class="no-programacion">Cargando noticias...</p>';
    const response = await fetch('Conecctions/php/gestionar_noticias.php?action=get');
    const noticias = await response.json();

    lista.innerHTML = "";
    // Usamos un fragmento de documento para mejorar el rendimiento
    const fragment = document.createDocumentFragment();

    if (noticias.length > 0) {
      noticias.forEach(noticia => {
        const item = document.createElement('div');
        item.className = 'hora-de-emisin';
        item.dataset.id = noticia.id;
        item.innerHTML = `
            <div class="programa-info">
              <p class="text-wrapper-5">${noticia.titulo} (${noticia.fecha})</p>
            </div>
            <div class="programa-actions">
              <button class="action-btn edit" data-id="${noticia.id}">✏️</button>
              <button class="action-btn delete" data-id="${noticia.id}">🗑️</button>
            </div>
        `;
        fragment.appendChild(item);
      });
      lista.appendChild(fragment);
    } else {
      lista.innerHTML = '<p class="no-programacion">No hay noticias publicadas.</p>';
    }
  };

  // --- Event Delegation para editar y eliminar noticias ---
  document.getElementById("lista-noticias-existentes").addEventListener('click', (e) => {
    const target = e.target;
    const id = target.dataset.id;

    if (target.classList.contains('edit')) {
      editarNoticia(id);
    } else if (target.classList.contains('delete')) {
      eliminarNoticia(id);
    }
  });

  const editarNoticia = async (id) => {
    const response = await fetch(`Conecctions/php/gestionar_noticias.php?action=get&id=${id}`);
    const noticia = await response.json();

    document.getElementById("noticia-id").value = noticia.id;
    document.getElementById("noticia-titulo").value = noticia.titulo;
    document.getElementById("noticia-fecha").value = noticia.fecha;
    document.getElementById("noticia-url").value = noticia.url;
    
    noticiaPreview.src = noticia.imagen_url + '?v=' + new Date().getTime(); // Forzar recarga de imagen
    noticiaPreview.style.display = 'block';
    fileInfoNoticia.textContent = "Dejar vacío para no cambiar la imagen actual.";

    saveNoticiaButton.textContent = "Actualizar Noticia";
    cancelEditNoticiaButton.style.display = 'inline-block';
  };

  const eliminarNoticia = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta noticia?")) return;
    const formData = new FormData();
    formData.append('id', id);
    formData.append('action', 'delete');
    const response = await fetch('Conecctions/php/gestionar_noticias.php', { method: 'POST', body: formData });
    const result = await response.json();
    alert(result.message);
    if (result.success) {
      renderizarNoticiasEnEditor();
      renderizarNoticiasEnPaginaPrincipal();
    }
  };

  // Función para limpiar el formulario de noticias
  const resetFormularioNoticia = () => {
    formNoticia.reset();
    document.getElementById("noticia-id").value = "";
    fileInfoNoticia.textContent = "";
    noticiaPreview.style.display = 'none';
    noticiaPreview.src = "";
    noticiaImagenSeleccionada = null;
    saveNoticiaButton.textContent = "Guardar Noticia";
    cancelEditNoticiaButton.style.display = 'none';
  };

  cancelEditNoticiaButton.addEventListener("click", resetFormularioNoticia);

  // --- Lógica para el Modal del Editor de Cronogramas ---
  
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
      const response = await fetch('Conecctions/php/sincronizar_cronogramas.php', {
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
      cronogramaDescripcionInput.value = "";
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
        // Guardamos la descripción en un data-attribute para fácil acceso
        const itemHTML = `
          <div class="hora-de-emisin" data-id="${programa.id}">
            <div class="programa-info">
              <div class="text-wrapper-4">${programa.hora}</div>
              <p class="text-wrapper-5">${programa.nombre}</p>
              <!-- La descripción no se muestra aquí, pero se podría añadir un tooltip si se quisiera -->
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
    const descripcion = cronogramaDescripcionInput.value.trim();

    // Validamos que los campos no estén vacíos
    if (!nombre || !inicio || !fin || !currentEditingDate) { // La descripción es opcional
      alert("Por favor, complete todos los campos.");
      return;
    }

    // Si estamos editando (currentEditingId tiene un valor)
    if (currentEditingId) {
      // Lógica para ACTUALIZAR: Enviar el cambio al servidor inmediatamente.
      // Esto asegura que la descripción se guarde en la BD en el momento.
      try {
        // Solo intentamos la petición si el ID no es temporal
        if (!String(currentEditingId).startsWith('temp-')) {
          const response = await fetch('Conecctions/php/gestionar_cronograma.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentEditingId, nombre, inicio, fin, descripcion })
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.message);
        }

        // Actualizamos también la caché local para mantener la consistencia visual
        const programaIndex = calendarioProgramacion[currentEditingDate].findIndex(p => p.id == currentEditingId);
        if (programaIndex > -1) {
          calendarioProgramacion[currentEditingDate][programaIndex] = { id: currentEditingId, nombre, hora: `${inicio} - ${fin}`, descripcion: descripcion };
        }
      } catch (error) {
        alert(`Error al actualizar el cronograma: ${error.message}`);
      }
    } else {
      // Lógica para CREAR (la que ya teníamos, pero ahora en la caché)
      const nuevoCronograma = {
        // Asignamos un ID temporal negativo para diferenciarlo de los de la BD
        id: `temp-${Date.now()}`, 
        hora: `${inicio} - ${fin}`,
        nombre: nombre,
        descripcion: descripcion
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
    cronogramaDescripcionInput.value = "";
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
          cronogramaDescripcionInput.value = programa.descripcion || ""; // Rellenamos la descripción
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
            const response = await fetch('Conecctions/php/gestionar_cronograma.php', {
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

  // --- Lógica para el Modal de Descripción de Cronograma ---

  const modalDescripcion = document.getElementById("modal-descripcion-cronograma");
  const descripcionContent = modalDescripcion.querySelector(".modal-content");
  const closeDescripcionButton = modalDescripcion.querySelector(".close-button");
  const descripcionTitulo = document.getElementById("descripcion-titulo");
  const descripcionHora = document.getElementById("descripcion-hora");
  const descripcionTexto = document.getElementById("descripcion-texto");

  const openDescripcionModal = (nombre, hora, descripcion) => {
    descripcionTitulo.textContent = nombre;
    descripcionHora.textContent = `(${hora})`;
    descripcionTexto.textContent = descripcion || "Cronograma sin descripción.";

    modalDescripcion.style.display = "flex";
    descripcionContent.style.animation = "animatetop 0.4s";
  };

  const closeDescripcionModal = () => {
    descripcionContent.style.animation = "animatebottom 0.4s";
    setTimeout(() => {
      modalDescripcion.style.display = "none";
    }, 400);
  };

  closeDescripcionButton.addEventListener("click", closeDescripcionModal);
  modalDescripcion.addEventListener("click", (event) => {
    if (event.target === modalDescripcion) {
      closeDescripcionModal();
    }
  });

  // --- Funciones de Utilidad de Tiempo para Mensajes ---
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    // Aseguramos que la fecha del servidor (UTC) se interprete correctamente
    const past = new Date(timestamp.replace(' ', 'T') + 'Z');
    const diffInSeconds = Math.floor((now - past) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 1) return "hace unos segundos";
    if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;

    const days = Math.floor(hours / 24);
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const formatFullDateTime = (timestamp) => {
    const date = new Date(timestamp.replace(' ', 'T') + 'Z');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // La hora 0 debe ser 12
    const strTime = `${hours}:${minutes} ${ampm}`;

    return `${day}/${month}/${year} - ${strTime}`;
  };

  // --- Lógica para el Modal de Mensajes de Oyentes ---

  const modalVerMensajeCompleto = document.getElementById("modal-ver-mensaje-completo");
  const closeVerMensajeCompletoButton = modalVerMensajeCompleto.querySelector(".close-button");

  // Abrir modal de lista de mensajes
  verMensajesButton.addEventListener("click", () => {
    modalVerMensajes.style.display = "flex";
    renderizarMensajes();
  });

  // Cerrar modal de lista de mensajes
  closeVerMensajesButton.addEventListener("click", () => {
    modalVerMensajes.style.display = "none";
  });

  // Cerrar modal de mensaje completo
  closeVerMensajeCompletoButton.addEventListener("click", () => {
    modalVerMensajeCompleto.style.display = "none";
  });

  // Función para obtener y mostrar los mensajes
  const renderizarMensajes = async () => {
    listaMensajesOyentes.innerHTML = '<p class="no-programacion">Cargando mensajes...</p>';
    try {
      const response = await fetch('Conecctions/php/obtener_mensajes.php');
      const mensajes = await response.json();

      listaMensajesOyentes.innerHTML = "";
      if (mensajes.length > 0) {
        mensajes.forEach(msg => {
          const item = document.createElement('div');
          item.className = 'mensaje-item';
          item.dataset.id = msg.id;
          item.dataset.nombre = msg.nombre;
          item.dataset.gmail = msg.gmail;
          item.dataset.mensaje = msg.mensaje;
          item.dataset.fecha = msg.fecha_envio; // Guardamos la fecha completa

          item.innerHTML = `
            <div class="mensaje-info">
              <span class="mensaje-nombre">${msg.nombre}</span>
              <span class="mensaje-gmail">${msg.gmail}</span>
              <span class="mensaje-gmail">Recibido: ${formatRelativeTime(msg.fecha_envio)}</span>
            </div>
            <div class="mensaje-actions">
              <button class="editor-button save open-msg">Abrir</button>
              <button class="editor-button cancel delete-msg">Leído</button>
            </div>
          `;
          listaMensajesOyentes.appendChild(item);
        });
      } else {
        listaMensajesOyentes.innerHTML = '<p class="no-programacion">No hay mensajes nuevos.</p>';
      }
    } catch (error) {
      listaMensajesOyentes.innerHTML = '<p class="no-programacion">Error al cargar los mensajes.</p>';
      console.error("Error al obtener mensajes:", error);
    }
  };

  // Usar delegación de eventos para manejar los clics en los botones de los mensajes
  listaMensajesOyentes.addEventListener("click", async (e) => {
    const target = e.target;
    const mensajeItem = target.closest('.mensaje-item');
    if (!mensajeItem) return;

    const id = mensajeItem.dataset.id;

    // Si se hace clic en "Abrir"
    if (target.classList.contains('open-msg')) {
      document.getElementById('mensaje-completo-nombre').textContent = mensajeItem.dataset.nombre;
      document.getElementById('mensaje-completo-gmail').textContent = `(${mensajeItem.dataset.gmail})`;
      document.getElementById('mensaje-completo-fecha').textContent = formatFullDateTime(mensajeItem.dataset.fecha);
      document.getElementById('mensaje-completo-texto').textContent = mensajeItem.dataset.mensaje;
      modalVerMensajeCompleto.style.display = "flex";
    }

    // Si se hace clic en "Leído" (eliminar)
    if (target.classList.contains('delete-msg')) {
      if (confirm("¿Marcar este mensaje como leído? Se eliminará de la lista.")) {
        try {
          const response = await fetch('Conecctions/php/gestionar_mensajes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
          });
          const result = await response.json();
          if (result.success) {
            mensajeItem.remove(); // Elimina el elemento del DOM
          } else {
            alert(result.message);
          }
        } catch (error) {
          alert("Error de conexión al eliminar el mensaje.");
        }
      }
    }
  });

  // Función para añadir listeners a los botones "Ver descripción"
  const addEventListenersToVerDescripcion = () => {
    document.querySelectorAll('.ver-descripcion-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const cronogramaElement = e.currentTarget.closest('.hora-de-emisin');
        const nombre = cronogramaElement.dataset.nombre;
        const hora = cronogramaElement.dataset.hora;
        const descripcion = cronogramaElement.dataset.descripcion;

        openDescripcionModal(nombre, hora, descripcion);
      });
    });
  };

  // --- Lógica para las Noticias en la página principal ---
  const renderizarNoticiasEnPaginaPrincipal = async () => {
    const grid = document.querySelector(".noticias-grid");
    grid.innerHTML = ""; // Limpiamos
    const response = await fetch('Conecctions/php/gestionar_noticias.php?action=get');
    const noticias = await response.json();

    if (noticias.length > 0) {
      noticias.forEach(noticia => {
        const [year, month, day] = noticia.fecha.split('-');
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const fechaFormateada = `${day} ${meses[parseInt(month) - 1]}, ${year}`;
        grid.innerHTML += `
          <div class="noticia-item">
            <a href="${noticia.url}" target="_blank" rel="noopener noreferrer">
              <div class="noticia-imagen" style="background-image: url('${noticia.imagen_url}?v=${new Date().getTime()}'); background-size: cover; background-position: center;"></div>
              <div class="noticia-texto-container">
                <div class="t-ejemplo">${noticia.titulo}</div>
                <div class="t-ejemplo noticia-fecha">${fechaFormateada}</div>
              </div>
            </a>
          </div>
        `;
      });
    }
  };

  // --- Lógica para el Boletín en la página principal ---
  const updateBoletinViewer = async () => {
    const pdfViewer = document.getElementById("boletin-pdf-viewer");
    const overlayLink = document.getElementById("boletin-overlay-link");
    const boletinCuerpo = document.getElementById("boletin-cuerpo");
    const boletinTexto = document.getElementById("boletin-texto");

    try {
      const response = await fetch('Conecctions/php/gestionar_boletin.php?action=get');
      const result = await response.json();

      if (result.success && result.filepath) {
        const pdfPathForLink = result.filepath.replace('#toolbar=0', ''); // Sin toolbar para la nueva pestaña
        const pdfPathForIframe = result.filepath; // Con #toolbar=0 para el iframe
        
        pdfViewer.src = pdfPathForIframe;
        overlayLink.href = pdfPathForLink;
        pdfViewer.style.display = 'block';
        overlayLink.style.display = 'block'; // Aseguramos que el enlace esté visible
        boletinTexto.style.display = 'none';
        boletinCuerpo.classList.remove('no-boletin'); // Habilitamos la interacción
      } else {
        pdfViewer.style.display = 'none';
        overlayLink.style.display = 'none'; // Ocultamos el enlace para que no sea clickeable
        boletinTexto.style.display = 'block';
        boletinCuerpo.classList.add('no-boletin'); // Deshabilitamos la interacción
      }
    } catch (error) {
      console.error("Error al actualizar el visor de PDF:", error);
      pdfViewer.style.display = 'none';
      overlayLink.style.display = 'none';
      boletinTexto.style.display = 'block';
      boletinTexto.textContent = "Error al cargar el boletín.";
      boletinCuerpo.classList.add('no-boletin');
    }
  };

  // --- Lógica para el Formulario de Mensajes de Oyentes ---
  const formMensajeOyente = document.getElementById("form-mensaje-oyente");
  const mensajeTexto = document.getElementById("mensaje-texto");
  const charCounter = document.getElementById("char-counter");
  const mensajeStatus = document.getElementById("mensaje-oyente-status");
  const maxChars = 300;

  // Actualizar contador de caracteres
  mensajeTexto.addEventListener("input", () => {
    const currentLength = mensajeTexto.value.length;
    charCounter.textContent = `${currentLength}/${maxChars}`;

    // Cambiar a color rojo si quedan 10 o menos caracteres
    if (maxChars - currentLength <= 10) {
      charCounter.classList.add("warning");
    } else {
      charCounter.classList.remove("warning");
    }
  });

  // Enviar formulario
  formMensajeOyente.addEventListener("submit", async (event) => {
    event.preventDefault();
    mensajeStatus.textContent = "Enviando...";
    mensajeStatus.className = "";

    const formData = new FormData(formMensajeOyente);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('Conecctions/php/enviar_mensaje.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      mensajeStatus.textContent = result.message;
      mensajeStatus.className = result.success ? "success-message" : "error-message";

      if (result.success) {
        formMensajeOyente.reset();
        charCounter.textContent = `0/${maxChars}`;
        charCounter.classList.remove("warning");
      }
    } catch (error) {
      mensajeStatus.textContent = "Error de conexión al enviar el mensaje.";
      mensajeStatus.className = "error-message";
    }
  });

  // Cargar el boletín al iniciar la página
  updateBoletinViewer();
  // Cargar las noticias al iniciar la página
  renderizarNoticiasEnPaginaPrincipal();

  // --- Lógica para Animación al Hacer Scroll ---
  const sectionsToAnimate = document.querySelectorAll('.fade-in-section');

  const observerOptions = {
    root: null, // Observa en relación al viewport
    rootMargin: '0px',
    threshold: 0.1 // La animación se activa cuando el 10% del elemento es visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Dejamos de observar el elemento una vez animado
      }
    });
  }, observerOptions);

  sectionsToAnimate.forEach(section => observer.observe(section));
});
