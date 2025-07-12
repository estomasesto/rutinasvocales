const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const messageElement = document.getElementById('customMessage');

let currentTrackIndex = 0;
let tracks = [];
let trackMessages = {};

// Cargar la lista desde playlist.json
fetch('playlist.json')
  .then(response => response.json())
  .then(data => {
    // Soporte tanto para array como para objeto con 'tracks'
    tracks = Array.isArray(data) ? data : data.tracks;
    if (data.messages) {
      trackMessages = data.messages;
    }

    // Llenar el selector
    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.textContent = track.name;
      option.value = track.file;
      trackSelect.appendChild(option);
    });

    // Mostrar mensaje y reproducir la primera pista
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

const noteInput = document.getElementById('noteInput');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const notesList = document.getElementById('notesList');

// Usaremos esta clave para guardar las notas, la separaremos por alumno y por ejercicio
// Puedes usar una clave tipo: "rutinas_{alumno}_{ejercicio}"
// Por simplicidad, usaremos "rutinas_alejandro_ejercicioX" donde X es currentTrackIndex + 1

function getStorageKey() {
  // Reemplaza 'alejandro' por el nombre de la carpeta/alumno si haces esto para varios alumnos
  return `rutinas_alejandro_ejercicio${currentTrackIndex + 1}`;
}

function loadNotes() {
  const key = getStorageKey();
  const stored = localStorage.getItem(key);
  if (!stored) {
    notesList.innerHTML = '<li><i>No hay notas guardadas para este ejercicio.</i></li>';
    return;
  }
  const notes = JSON.parse(stored);
  notesList.innerHTML = '';
  notes.forEach(note => {
    const li = document.createElement('li');
    li.style.marginBottom = '0.8rem';
    li.style.borderBottom = '1px solid #ccc';
    li.style.paddingBottom = '0.5rem';
    li.innerHTML = `<strong>${note.date}</strong>:<br>${note.text}`;
    notesList.appendChild(li);
  });
}

function saveNote() {
  const text = noteInput.value.trim();
  if (text === '') {
    alert('Por favor escribe algo antes de guardar.');
    return;
  }

  const key = getStorageKey();
  let notes = JSON.parse(localStorage.getItem(key)) || [];

  const now = new Date();
  const dateString = now.toLocaleString();

  notes.push({
    date: dateString,
    text: text
  });

  localStorage.setItem(key, JSON.stringify(notes));
  noteInput.value = '';
  loadNotes();
}

// Evento para guardar la nota
saveNoteBtn.addEventListener('click', saveNote);

// Cada vez que se carga una pista, también cargamos las notas asociadas
function loadTrack(index) {
  audioPlayer.src = tracks[index].file;
  messageElement.textContent = trackMessages[tracks[index].file] || '';
  audioPlayer.play();
  trackSelect.value = tracks[index].file;

  loadNotes(); // ← carga notas al cambiar de pista
}
