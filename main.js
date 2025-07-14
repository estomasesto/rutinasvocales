// main.js

// Variables globales para la grabación
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

// Referencias a elementos del DOM
const trackSelect = document.getElementById('trackSelect');
const audioPlayer = document.getElementById('audioPlayer');

const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');

const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const resetSpeedBtn = document.getElementById('resetSpeedBtn');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const playback = document.getElementById('playback');

const recordingIndicator = document.getElementById('recordingIndicator');
const recordingDot = document.getElementById('recordingDot');
const iosWarning = document.getElementById('ios-warning');

const customMessage = document.getElementById('customMessage');

const noteInput = document.getElementById('noteInput');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const clearNotesBtn = document.getElementById('clearNotesBtn');
const notesList = document.getElementById('notesList');

const duracion = document.getElementById('duracion');

// --- Datos de las pistas disponibles ---
// Puedes editar o agregar más aquí según tus archivos
const tracks = [
  { title: "Ejercicio 1 - Calentamiento", src: "../../audio/ejercicio1.mp3" },
  { title: "Ejercicio 2 - Respiración", src: "../../audio/ejercicio2.mp3" },
  { title: "Ejercicio 3 - Vocalización", src: "../../audio/ejercicio3.mp3" }
];

// Función para detectar iOS (grabación no soportada)
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
  // Mostrar advertencia para iOS si es el caso
  if (isIOS()) {
    iosWarning.style.display = 'block';
    startBtn.disabled = true;
  }

  // Cargar las pistas en el <select>
  loadTrackOptions();

  // Cargar notas guardadas en localStorage
  loadNotes();

  // Ocultar indicador de grabación inicialmente
  recordingIndicator.style.display = 'none';

  // Mostrar mensaje personalizado si quieres (ejemplo)
  customMessage.textContent = "¡Bienvenido! Elige un ejercicio para comenzar.";

  // Eventos
  addEventListeners();
});

// Carga las opciones del select con las pistas
function loadTrackOptions() {
  tracks.forEach((track, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = track.title;
    trackSelect.appendChild(option);
  });

  // Cargar la primera pista por defecto
  if (tracks.length > 0) {
    setTrack(0);
  }
}

// Cambia la pista de audio según selección
function setTrack(index) {
  const track = tracks[index];
  if (track) {
    audioPlayer.src = track.src;
    audioPlayer.load();
    audioPlayer.playbackRate = parseFloat(speedSlider.value);
  }
}

// Maneja los eventos de la UI
function addEventListeners() {
  // Cambio de pista
  trackSelect.addEventListener('change', (e) => {
    setTrack(parseInt(e.target.value));
  });

  // Botón rebobinar -5s
  rewindBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
  });

  // Botón avanzar +5s
  forwardBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 5);
  });

  // Control velocidad con slider
  speedSlider.addEventListener('input', () => {
    const speed = parseFloat(speedSlider.value);
    audioPlayer.playbackRate = speed;
    speedLabel.textContent = speed.toFixed(1) + 'x';
  });

  // Resetear velocidad a 1.0
  resetSpeedBtn.addEventListener('click', () => {
    speedSlider.value = 1;
    audioPlayer.playbackRate = 1;
    speedLabel.textContent = '1.0x';
  });

  // Botón iniciar grabación
  startBtn.addEventListener('click', startRecording);

  // Botón detener grabación
  stopBtn.addEventListener('click', stopRecording);

  // Guardar nota
  saveNoteBtn.addEventListener('click', saveNote);

  // Borrar todas las notas
  clearNotesBtn.addEventListener('click', clearNotes);
}

// --- Grabación ---
// Iniciar grabación con MediaRecorder
function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Tu navegador no soporta grabación de audio.");
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstart = () => {
        isRecording = true;
        updateRecordingUI(true);
        duracion.style.display = 'none';
        recordedChunks = [];
      };

      mediaRecorder.onstop = () => {
        isRecording = false;
        updateRecordingUI(false);
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        playback.src = url;
        playback.style.display = 'block';

        // Preparar descarga
        downloadBtn.href = url;
        downloadBtn.download = 'grabacion_' + new Date().toISOString().replace(/[:.]/g, '-') + '.webm';
        downloadBtn.style.display = 'inline';

        // Mostrar duración
        const audioForDuration = new Audio(url);
        audioForDuration.onloadedmetadata = () => {
          const dur = audioForDuration.duration;
          duracion.textContent = `Duración de la grabación: ${formatTime(dur)}`;
          duracion.style.display = 'block';
        };
      };

      mediaRecorder.start();
    })
    .catch(err => {
      alert("Error al acceder al micrófono: " + err.message);
    });
}

// Detener grabación
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
}

// Actualiza UI de grabación (botones e indicador)
function updateRecordingUI(recording) {
  if (recording) {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    recordingIndicator.style.display = 'inline-flex';
    recordingDot.style.animation = 'blink 1s steps(1, start) infinite';
  } else {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    recordingIndicator.style.display = 'none';
    recordingDot.style.animation = 'none';
  }
}

// Formatea segundos a mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// --- Notas ---
// Cargar notas guardadas desde localStorage
function loadNotes() {
  const savedNotes = JSON.parse(localStorage.getItem('rutinasNotas') || '[]');
  notesList.innerHTML = '';
  savedNotes.forEach((note, idx) => {
    addNoteToDOM(note, idx);
  });
}

// Guardar una nota nueva
function saveNote() {
  const text = noteInput.value.trim();
  if (text === '') {
    alert("Escribe algo antes de guardar la nota.");
    return;
  }
  const savedNotes = JSON.parse(localStorage.getItem('rutinasNotas') || '[]');
  savedNotes.push(text);
  localStorage.setItem('rutinasNotas', JSON.stringify(savedNotes));
  addNoteToDOM(text, savedNotes.length - 1);
  noteInput.value = '';
}

// Agrega una nota a la lista en pantalla
function addNoteToDOM(noteText, index) {
  const li = document.createElement('li');
  li.textContent = noteText;
  li.style.background = '#444';
  li.style.marginBottom = '0.5rem';
  li.style.padding = '0.5rem';
  li.style.borderRadius = '5px';
  li.style.position = 'relative';

  // Botón para borrar nota individual
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.title = 'Borrar nota';
  deleteBtn.style.position = 'absolute';
  deleteBtn.style.right = '5px';
  deleteBtn.style.top = '5px';
  deleteBtn.style.background = 'transparent';
  deleteBtn.style.border = 'none';
  deleteBtn.style.color = '#f88';
  deleteBtn.style.cursor = 'pointer';

  deleteBtn.addEventListener('click', () => {
    deleteNote(index);
  });

  li.appendChild(deleteBtn);
  notesList.appendChild(li);
}

// Eliminar nota por índice
function deleteNote(index) {
  let savedNotes = JSON.parse(localStorage.getItem('rutinasNotas') || '[]');
  savedNotes.splice(index, 1);
  localStorage.setItem('rutinasNotas', JSON.stringify(savedNotes));
  loadNotes(); // Recarga la lista
}

// Borrar todas las notas
function clearNotes() {
  if (confirm("¿Seguro que quieres borrar todas las notas?")) {
    localStorage.removeItem('rutinasNotas');
    notesList.innerHTML = '';
  }
}

/* Animación CSS para el punto rojo de grabación (debe ir en CSS, pero aquí la dejo para que sepas que existe):

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}
*/

