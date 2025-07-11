const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const messageElement = document.getElementById('customMessage');

let currentTrackIndex = 0;
let tracks = [];

// Función para cargar una pista por su índice
function loadTrack(index) {
  audioPlayer.src = tracks[index].file;
  audioPlayer.play();
  trackSelect.value = tracks[index].file;
}

// Cargar la lista desde playlist.json
fetch('playlist.json')
  .then(response => response.json())
  .then(data => {
    // Si el JSON tiene mensaje y el elemento existe, lo mostramos
    if (data.message && messageElement) {
      messageElement.textContent = data.message;
    }

    // Soporte tanto para array como para objeto con 'tracks'
    tracks = Array.isArray(data) ? data : data.tracks;

    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.textContent = track.name;
      option.value = track.file;
      trackSelect.appendChild(option);
    });

    if (tracks.length > 0) {
      currentTrackIndex = 0;
      loadTrack(currentTrackIndex);
    }
  });

// Cambiar de pista manualmente
trackSelect.addEventListener('change', () => {
  const selectedIndex = tracks.findIndex(t => t.file === trackSelect.value);
  if (selectedIndex !== -1) {
    currentTrackIndex = selectedIndex;
    loadTrack(currentTrackIndex);
  }
});

// Cambiar velocidad
speedSlider.addEventListener('input', () => {
  const speed = parseFloat(speedSlider.value);
  speedLabel.textContent = speed.toFixed(1) + "x";
  audioPlayer.playbackRate = speed;
});

// Reproducir siguiente automáticamente cuando termina
audioPlayer.addEventListener('ended', () => {
  currentTrackIndex++;
  if (currentTrackIndex < tracks.length) {
    loadTrack(currentTrackIndex);
  }
});

// Avanzar y retroceder 5 segundos
if (rewindBtn && forwardBtn) {
  rewindBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
  });

  forwardBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 5);
  });
}
