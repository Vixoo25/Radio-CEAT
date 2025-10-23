export function initPlayer() {
    const audioPlayer = document.getElementById("audio-player");
    const playButton = document.getElementById("play-button");
    const statusPlaying = document.getElementById("status-playing");
    const statusPaused = document.getElementById("status-paused");
    const playIcon = document.getElementById("play-icon");
    const playText = document.getElementById("play-text");
    const volumeSlider = document.getElementById("volume-slider");

    let isPlaying = false;

    const togglePlay = () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
        isPlaying = !isPlaying;
    };

    const playAudio = () => {
        audioPlayer.play();
        statusPlaying.style.display = "inline";
        statusPaused.style.display = "none";
        playIcon.textContent = "⏸︎";
        playText.textContent = "Pausar";
    };

    const pauseAudio = () => {
        audioPlayer.pause();
        statusPlaying.style.display = "none";
        statusPaused.style.display = "inline";
        playIcon.textContent = "▶︎";
        playText.textContent = "Reproducir";
    };

    playButton.addEventListener("click", togglePlay);
    volumeSlider.addEventListener("input", (e) => {
        audioPlayer.volume = e.target.value / 100;
    });
}
