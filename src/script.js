const display = document.getElementById('display');
const startStopBtn = document.getElementById('startStopBtn');
const bpmInput = document.getElementById('bpm');
const timeSignatureInput = document.getElementById('time-signature');
const tickSound = document.getElementById('tick-sound');
const tempoTapperBtn = document.getElementById('tempoTapperBtn');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const worker = new Worker('src/worker.js');

let isPlaying = false;
let previousTapTime = 0;
let taps = [];
let strongBeatSound;
let weakerBeatSound;
let strongBeatPath;
let weakerBeatPath;

tickSound.addEventListener('change', () => {
  if (isPlaying) {
    startStop();
  }
});

function loadMetronomeSounds() {
  strongBeatPath = document.getElementById('strongBeat').getAttribute('src');
  weakerBeatPath = document.getElementById('weakerBeat').getAttribute('src');
  strongBeatSound = audioCtx.createBufferSource();
  weakerBeatSound = audioCtx.createBufferSource();
  unloadMetronomeSounds()
  const loadSound = (url) => {
    return fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .catch(error => console.log(error));
  }
  loadSound(strongBeatPath)
    .then(buffer => {
      if (strongBeatSound.buffer === null) {
      strongBeatSound.buffer = buffer;
      strongBeatSound.connect(audioCtx.destination);
      }
    })
  loadSound(weakerBeatPath)
    .then(buffer => {
      if (weakerBeatSound.buffer === null) {
      weakerBeatSound.buffer = buffer;
      weakerBeatSound.connect(audioCtx.destination);
      }
    })
}

function unloadMetronomeSounds() {
  if (strongBeatSound && strongBeatSound.buffer !== null) {
    strongBeatSound.disconnect();
    strongBeatSound.buffer = null;
  }
  if (weakerBeatSound && weakerBeatSound.buffer !== null) {
    weakerBeatSound.disconnect();
    weakerBeatSound.buffer = null;
  }
}

function calculateIntervalTime(bpm) {
  return 60000 / bpm;
}

function playSound(bufferSource) {
  const source = audioCtx.createBufferSource();
  source.buffer = bufferSource.buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

function startStop() {
  if (isPlaying) {
    isPlaying = false;
    worker.postMessage({ type: 'stop' });
    startStopBtn.innerText = 'Start';
  } else {
    const bpm = parseInt(bpmInput.value);
    const beatsPerMeasure = parseInt(timeSignatureInput.value.split('/')[0]);
    if (bpm >= 30 && bpm <= 250) {
      var tickSound = document.getElementById("tick-sound").value;
      var tickSoundArr = tickSound.split("|");
      document.getElementById("strongBeat").src = tickSoundArr[0];
      document.getElementById("weakerBeat").src = tickSoundArr[1];
      loadMetronomeSounds();
      worker.postMessage({
        type: 'start',
        beatsPerMeasure: beatsPerMeasure,
        bpm: bpm,
      });
    }
    startStopBtn.innerText = 'Stop';
    beatsPerBar = beatsPerMeasure;
  }
}


worker.onmessage = function(event) {
  if(!isPlaying) {
    isPlaying = true;
  }
  if (event.data.sound === 'weaker-beat') {
    playSound(weakerBeatSound);
  } else if (event.data.sound === 'strong-beat') {
    playSound(strongBeatSound);
  }
}

function handleInputChangeRestart() {
  if (!isPlaying) {
    startStop();
  } else {
    startStop();
    startStop();
  }
};

function handleInputChangeStop() {
  if (isPlaying) {
    startStop();
  }
};

tempoTapperBtn.addEventListener('click', () => {
  const currentTime = Date.now();
  if (previousTapTime !== 0) {
    const timeDifference = currentTime - previousTapTime;
    const bpm = Math.round(60000 / timeDifference);
    taps.push(bpm);
    if (taps.length > 5) {
      taps.shift();
    }
    const averageBpm = Math.min(Math.round(taps.reduce((a, b) => a + b) / taps.length), 250);
    bpmInput.value = averageBpm;
  }
  previousTapTime = currentTime;
});

bpmInput.addEventListener('input', handleInputChangeRestart);
timeSignatureInput.addEventListener('input', handleInputChangeRestart);
tempoTapperBtn.addEventListener('click', handleInputChangeStop);
startStopBtn.addEventListener('click', startStop);