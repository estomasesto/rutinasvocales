const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');

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
    tracks = data;

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

// Cargar mensaje personalizado desde config.json
fetch('config.json')
  .then(response => response.json())
  .then(config => {
    const messageElement = document.getElementById('customMessage');
    if (messageElement && config.message) {
      messageElement.innerHTML = config.message;
    }
  });

