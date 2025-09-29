document.addEventListener("DOMContentLoaded", () => {
  // 1. Seleccionamos los elementos que necesitamos controlar
  const audioPlayer = document.getElementById("audio-player");
  const playButton = document.getElementById("play-button");
  const statusPlaying = document.getElementById("status-playing");
  const statusPaused = document.getElementById("status-paused");
  const playIcon = document.getElementById("play-icon");
  const playText = document.getElementById("play-text");
  const currentDateEl = document.getElementById("current-date");
 const modalProgramacion = document.getElementById("modal-programacion");
 const openModalProgramacion = document.getElementById("open-modal-programacion");
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
   // Función para abrir la ventana modal
  openModalProgramacion.addEventListener("click", () => {
    modalProgramacion.style.display = "block";
  });
});