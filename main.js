// Referencias a elementos del DOM
const audioPlayer = document.getElementById('audioPlayer');
const trackSelect = document.getElementById('trackSelect');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const messageElement = document.getElementById('customMessage');
const resetSpeedBtn = document.getElementById('resetSpeedBtn');
const clearNotesBtn = document.getElementById('clearNotesBtn');

// Variables para manejar la lista de pistas y mensajes
let currentTrackIndex = 0;
let tracks = [];
let trackMessages = {};

// Carga la lista de pistas desde 'playlist.json'
fetch('playlist.json')
  .then(response => response.json())
  .then(data => {
    // El archivo puede tener un array o un objeto con 'tracks' y 'messages'
    tracks = Array.isArray(data) ? data : data.tracks;
    if (data.messages) {
      trackMessages = data.messages;
    }

    // Llena el <select> con las opciones de pistas
    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.textContent = track.name;
      option.value = track.file;
      trackSelect.appendChild(option);
    });

    // Carga la primera pista automáticamente
    if (tracks.length > 0) {
      currentTrackIndex = 0;
      loadTrack(currentTrackIndex);
    }
  });

// Cambiar pista cuando se selecciona otra del <select>
trackSelect.addEventListener('change', () => {
  const selectedIndex = tracks.findIndex(t => t.file === trackSelect.value);
  if (selectedIndex !== -1) {
    currentTrackIndex = selectedIndex;
    loadTrack(currentTrackIndex);
  }
});

// Cambiar la velocidad de reproducción con el slider
speedSlider.addEventListener('input', () => {
  const speed = parseFloat(speedSlider.value);
  speedLabel.textContent = speed.toFixed(1) + "x";
  audioPlayer.playbackRate = speed;
});

// Botón para resetear la velocidad a 1x
resetSpeedBtn.addEventListener('click', () => {
  audioPlayer.playbackRate = 1;
  speedSlider.value = 1;
  speedLabel.textContent = "1.0x";
});

// Al terminar una pista, reproducir la siguiente automáticamente si existe
audioPlayer.addEventListener('ended', () => {
  currentTrackIndex++;
  if (currentTrackIndex < tracks.length) {
    loadTrack(currentTrackIndex);
  }
});

// Botones para avanzar o retroceder 5 segundos en la pista actual
if (rewindBtn && forwardBtn) {
  rewindBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
  });

  forwardBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 5);
  });
}

// Elementos para notas
const noteInput = document.getElementById('noteInput');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const notesList = document.getElementById('notesList');

// Clave de almacenamiento local basada en el número de ejercicio/pista actual
function getStorageKey() {
  return `rutinas_alejandro_ejercicio${currentTrackIndex + 1}`;
}

// Cargar notas guardadas desde localStorage y mostrarlas
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

// Guardar una nota nueva en localStorage
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

// Listener para el botón de guardar nota
saveNoteBtn.addEventListener('click', saveNote);

// Permitir guardar nota presionando Enter
noteInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveNote();
  }
});

// Botón para borrar todas las notas del ejercicio actual
clearNotesBtn.addEventListener('click', () => {
  const key = getStorageKey();
  if (confirm("¿Estás seguro de que quieres borrar todas las notas de este ejercicio?")) {
    localStorage.removeItem(key);
    loadNotes();
  }
});

// Función para cargar una pista en el reproductor
function loadTrack(index) {
  audioPlayer.src = tracks[index].file;
  // Mostrar mensaje personalizado o uno por defecto
  messageElement.textContent = trackMessages[tracks[index].file] || '¡Buena práctica! Recuerda usar el diafragma :)';
  trackSelect.value = tracks[index].file;
  loadNotes();

  // Intentar reproducir automáticamente
  try {
    audioPlayer.play();
  } catch (err) {
    console.warn("No se pudo reproducir automáticamente:", err);
  }
}

// Elementos para grabación
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const playback = document.getElementById('playback');
const recordingIndicator = document.getElementById('recordingIndicator');

let mediaRecorder;
let audioChunks = [];

// Detectar iOS para deshabilitar grabación (por problemas conocidos)
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

if (isIOS()) {
  // Mostrar advertencia y deshabilitar botones de grabación en iOS
  const iosWarning = document.getElementById('ios-warning');
  if (iosWarning) iosWarning.style.display = 'block';
  if (startBtn) startBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;
} else {
  // Iniciar grabación al hacer click en "start"
  startBtn.addEventListener('click', async () => {
    recordingIndicator.style.display = 'flex'; // Mostrar indicador de grabando
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    // Guardar datos cuando estén disponibles
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    // Cuando se detiene la grabación
    mediaRecorder.onstop = () => {
      recordingIndicator.style.display = 'none'; // Ocultar indicador
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);
      playback.src = audioUrl;

      playback.load();

      // Mostrar duración de la grabación en el DOM
      playback.onloadedmetadata = () => {
        const duracion = playback.duration;
        if (!isNaN(duracion) && isFinite(duracion)) {
          const minutos = Math.floor(duracion / 60);
          const segundos = Math.floor(duracion % 60).toString().padStart(2, '0');
          const duracionTexto = document.getElementById('duracion');
          duracionTexto.textContent = `⏱️ Duración de la grabación: ${minutos}:${segundos}`;
        }
      };

      // Preparar nombre para descargar la grabación
      const trackName = tracks[currentTrackIndex]?.name || 'Ejercicio';
      const now = new Date();
      const safeName = trackName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
      const filename = `${safeName}_${dateStr}_${timeStr}.webm`;

      // Mostrar y preparar botón de descarga
      const downloadBtn = document.getElementById('downloadBtn');
      downloadBtn.style.display = 'inline-block';
      downloadBtn.href = audioUrl;
      downloadBtn.download = filename;
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  // Detener grabación
  stopBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}
