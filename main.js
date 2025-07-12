const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const messageElement = document.getElementById('customMessage');
const resetSpeedBtn = document.getElementById('resetSpeedBtn');
const clearNotesBtn = document.getElementById('clearNotesBtn');


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

// Reiniciar la velocidad a 1.0x
resetSpeedBtn.addEventListener('click', () => {
  audioPlayer.playbackRate = 1;
  speedSlider.value = 1;
  speedLabel.textContent = "1.0x";
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
    alert('Recuerda escribir algo antes de guardar!');
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

// Guardar nota también al presionar Enter en el input
noteInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveNote();
  }
});

// Evento para borrar todas las notas (fuera de saveNote)
clearNotesBtn.addEventListener('click', () => {
  const key = getStorageKey();
  if (confirm("¿Estás seguro de que quieres borrar todas las notas de este ejercicio?")) {
    localStorage.removeItem(key);
    loadNotes();
  }
});

// Cada vez que se carga una pista, también cargamos las notas asociadas
function loadTrack(index) {
  audioPlayer.src = tracks[index].file;
  messageElement.textContent = trackMessages[tracks[index].file] || '¡Buena práctica! Recuerda usar el diafragma :)';
  trackSelect.value = tracks[index].file;

  loadNotes(); // ← carga notas al cambiar de pista

  try {
    audioPlayer.play();
  } catch (err) {
    console.warn("No se pudo reproducir automáticamente:", err);
  }
}


const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const playback = document.getElementById('playback');
const recordingIndicator = document.getElementById('recordingIndicator');


let mediaRecorder;
let audioChunks = [];

// Función para detectar iOS
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Oculta el grabador si es iOS
if (isIOS()) {
  // Muestra el mensaje dentro del grabador
  const iosWarning = document.getElementById('ios-warning');
  if (iosWarning) {
    iosWarning.style.display = 'block';
  }

  // Desactiva botones para evitar confusión
  if (startBtn) startBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;
} else {
  // Lógica de grabación solo si NO es iOS
  startBtn.addEventListener('click', async () => {
	  recordingIndicator.style.display = 'flex';
	  const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
	  recordingIndicator.style.display = 'none';
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);
      playback.src = audioUrl;

      // Mostrar botón de descarga
      const downloadBtn = document.getElementById('downloadBtn');
      downloadBtn.style.display = 'inline-block';
      downloadBtn.href = audioUrl;
      downloadBtn.download = `grabacion_${new Date().toISOString()}.webm`;
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}