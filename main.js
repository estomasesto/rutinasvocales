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

// *** NUEVA REFERENCIA AL ELEMENTO DE DURACIÓN ***
const duracionTexto = document.getElementById('duracion');


// Variables para manejar la lista de pistas y mensajes
let currentTrackIndex = 0;
let tracks = [];

// Carga la lista de pistas desde 'playlist.json'
fetch('playlist.json')
  .then(response => response.json())
  .then(data => {
    tracks = data; // ya es un array directamente

    // Llena el <select> con las opciones de pistas
    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.textContent = track.nombre;  // antes era track.name, ahora 'nombre'
      option.value = track.archivo;        // antes era track.file, ahora 'archivo'
      trackSelect.appendChild(option);
    });

    // Carga la primera pista automáticamente
    if (tracks.length > 0) {
      currentTrackIndex = 0;
      loadTrack(currentTrackIndex);
    }
  });
  
// Función para cargar una pista según índice
function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;

  const track = tracks[index];
  audioPlayer.src = `audios/${track.archivo}`;
  audioPlayer.load();

  messageElement.innerHTML = track.mensaje || '¡Buena práctica! Recuerda usar el diafragma :)';

  trackSelect.value = track.archivo;

  loadNotes();

  try {
    audioPlayer.play();
  } catch (err) {
    console.warn("No se pudo reproducir automáticamente:", err);
  }
}


// Cambiar pista cuando se selecciona otra del <select>
trackSelect.addEventListener('change', () => {
  const selectedIndex = tracks.findIndex(t => t.archivo === trackSelect.value);
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
  return `rutinas_alejandro_ejercicio_${currentTrackIndex + 1}`; // Corregido: Plantilla literal
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
    li.innerHTML = `<strong>${note.date}</strong>:<br>${note.text}`; // Corregido: Plantilla literal
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

// Elementos para grabación
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const playback = document.getElementById('playback');
const recordingIndicator = document.getElementById('recordingIndicator');

let mediaRecorder;
let audioChunks = [];

// Detectar iOS para deshabilitar grabación (por problemas conocidos)
function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && 'ontouchend' in document)
  );
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
    // *** Borrar cualquier mensaje de duración anterior al iniciar una nueva grabación ***
    if (duracionTexto) {
	  duracionTexto.textContent = '';
	  duracionTexto.style.display = 'none';
	}
	if (playback) {
	  playback.removeAttribute('src'); // Limpia fuente anterior
	  playback.load(); // Reinicia el audio
	}
	const downloadBtn = document.getElementById('downloadBtn');
	if (downloadBtn) {
	  downloadBtn.style.display = 'none';
	  downloadBtn.removeAttribute('href');
	  downloadBtn.removeAttribute('download');
	}


    recordingIndicator.style.display = 'flex'; // Mostrar indicador de grabando
    try { // Agregamos un try-catch para manejar permisos de micrófono
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
		
		playback.onloadedmetadata = () => {
		  playback.addEventListener('durationchange', () => {
			const duracion = playback.duration;
			if (!isNaN(duracion) && isFinite(duracion)) {
			  const minutos = Math.floor(duracion / 60);
			  const segundos = Math.floor(duracion % 60).toString().padStart(2, '0');

			  if (duracionTexto) {
				duracionTexto.textContent = `⏱️ Duración de la grabación: ${minutos}:${segundos}`;
				duracionTexto.style.display = 'block';
			  }
			}
		  }, { once: true });
		};


        // *** ASEGURARSE DE QUE ESTE EVENTO SE DISPARE Y ACTUALICE EL MENSAJE ***
        // Esperar hasta que la duración esté disponible
		function esperarDuracion(callback, intentos = 10) {
  const check = (intentosRestantes) => {
    const duracion = playback.duration;
    if (!isNaN(duracion) && isFinite(duracion)) {
      callback(duracion);
    } else if (intentosRestantes > 0) {
      setTimeout(() => check(intentosRestantes - 1), 300);
    } else {
      callback(null); // Falló
    }
  };
  check(intentos);
}

esperarDuracion((duracion) => {
  if (duracionTexto) {
    if (duracion) {
      const minutos = Math.floor(duracion / 60);
      const segundos = Math.floor(duracion % 60).toString().padStart(2, '0');
      duracionTexto.textContent = `⏱️ Duración de la grabación: ${minutos}:${segundos}`;
    } else {
      duracionTexto.textContent = 'Grabación lista!';
    }
    duracionTexto.style.display = 'block';
  }
});

// Si por alguna razón loadedmetadata no se dispara (ej. archivo muy corto),
// asegúrate de que el mensaje de duración se oculte o reinicie.
if (audioChunks.length === 0 && duracionTexto) {
  duracionTexto.textContent = 'No se grabó audio.';
  duracionTexto.style.display = 'block';
}



        // Preparar nombre para descargar la grabación
        const trackName = tracks[currentTrackIndex]?.nombre || 'Ejercicio';
        const now = new Date();
        const safeName = trackName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `${safeName}_${dateStr}_${timeStr}.webm`; // Corregido: Plantilla literal

        // Mostrar y preparar botón de descarga
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.style.display = 'inline-block';
        downloadBtn.href = audioUrl;
        downloadBtn.download = filename;
      };

      mediaRecorder.start();
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      recordingIndicator.style.display = 'none';
      alert('No se pudo acceder al micrófono. Asegúrate de haber dado permiso.');
      startBtn.disabled = false; // Re-habilitar el botón de inicio si falla
      stopBtn.disabled = true;
      if (duracionTexto) {
        duracionTexto.textContent = 'Error al iniciar la grabación: Permiso de micrófono denegado.';
        duracionTexto.style.display = 'block';
      }
    }
  });

  // Detener grabación
  stopBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  // *** Limpiar el mensaje de duración cuando se carga una nueva pista principal ***
  audioPlayer.addEventListener('play', () => {
    if (duracionTexto) {
      duracionTexto.textContent = '';
      duracionTexto.style.display = 'none';
    }
  });
}