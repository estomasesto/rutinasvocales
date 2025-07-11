const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');

// Cargar la lista desde playlist.json
fetch('playlist.json')
  .then(response => response.json())
  .then(tracks => {
    tracks.forEach(track => {
      const option = document.createElement('option');
      option.textContent = track.name;
      option.value = track.file;
      trackSelect.appendChild(option);
    });

    if (tracks.length > 0) {
      trackSelect.value = tracks[0].file;
      audioPlayer.src = tracks[0].file;
    }
  });

// Cambiar de pista
trackSelect.addEventListener('change', () => {
  audioPlayer.src = trackSelect.value;
  audioPlayer.play();
});

// Cambiar velocidad
speedSlider.addEventListener('input', () => {
  const speed = parseFloat(speedSlider.value);
  speedLabel.textContent = speed.toFixed(1) + "x";
  audioPlayer.playbackRate = speed;
});
