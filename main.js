const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');

const tracks = [
  { name: "Ejercicio 1 - Vocales", file: "audios/ejercicio1.mp3" },
  { name: "Ejercicio 2 - Sirenas", file: "audios/ejercicio2.mp3" }
];

tracks.forEach(track => {
  const option = document.createElement('option');
  option.textContent = track.name;
  option.value = track.file;
  trackSelect.appendChild(option);
});

trackSelect.addEventListener('change', () => {
  audioPlayer.src = trackSelect.value;
  audioPlayer.play();
});

speedSlider.addEventListener('input', () => {
  const speed = parseFloat(speedSlider.value);
  speedLabel.textContent = speed.toFixed(1) + "x";
  audioPlayer.playbackRate = speed;
});

trackSelect.value = tracks[0].file;
audioPlayer.src = trackSelect.value;
