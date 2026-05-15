"use strict";

const FRAGMENTS = [
  { text: "the cursor blinks.\nit is patient in a way\nyou are still learning to be.", attr: "" },
  { text: "somewhere a server hums\nholding together a world\nthat forgot to say thank you.", attr: "" },
  { text: "you are not behind.\nyou are not ahead.\nyou are exactly here.", attr: "" },
  { text: "the rain does not fall\nfor anyone in particular.\nthat is what makes it kind.", attr: "" },
  { text: "rest is not the opposite of progress.\nit is how progress survives the night.", attr: "" },
  { text: "if you are reading this,\nyou made it through another day.\nthat counts.", attr: "" },
  { text: "be soft with yourself.\nthe machine can wait.\nthe terminal is not going anywhere.", attr: "" },
  { text: "in the glow of the screen,\nall your unfinished things\nare just possibilities sleeping.", attr: "" },
  { text: "do not optimize this moment.\njust let it be\nwarm and imprecise.", attr: "" },
  { text: "the best code you will ever write\nis the kind thing you said\nwhen no one expected it.", attr: "" },
  { text: "you do not need to solve\neverything tonight.\nthe morning is a collaborator.", attr: "" },
  { text: "[LOG] heartbeat: steady\n[LOG] worries: queued for tomorrow\n[LOG] status: here", attr: "system" },
  { text: "there is a particular silence\nthat only happens\nwhen the whole house is asleep\nexcept for you and this screen.", attr: "" },
  { text: "$ find / -name \"peace\"\n./here\n./now\n./this-exact-moment", attr: "terminal" },
  { text: "you are allowed to stare\nat nothing for a while.\nthe void is not grading you.", attr: "" },
  { text: "somewhere in the static\nbetween stations,\nthere is a frequency\nthat sounds like forgiveness.", attr: "" },
  { text: "the most important function\nyou will ever write\nreturns nothing\nbut changes everything.", attr: "" },
  { text: "tonight the rain is a kind of music\nthat asks for nothing in return.\nlet it play.", attr: "" },
  { text: "[2:47 AM] you are not the only one\nstill awake, still thinking,\nstill trying to get it right.", attr: "" },
  { text: "breathe in: four counts.\nhold: four counts.\nbreathe out: four counts.\nthe compiler can wait.", attr: "" },
  { text: "// TODO: be gentler with yourself\n// PRIORITY: high\n// STATUS: overdue", attr: "source" },
  { text: "the screen glows\nthe rain falls\nyou are warm\nand that is enough.", attr: "" },
  { text: "not every night needs\na breakthrough.\nsome nights are just\nfor being here.", attr: "" },
  { text: "$ uptime\n    you: a long time\n    still going: yes\n    proud of you: yes", attr: "terminal" },
  { text: "the phosphor hums.\ngreen light on your hands.\nyou are someone's\nfavorite late-night ghost.", attr: "" },
  { text: "what if the point of tonight\nis not finishing anything,\nbut simply not being\nanywhere else?", attr: "" },
  { text: "the rain sounds like\nwhite noise with opinions.\nit says: stay.\nit says: rest.", attr: "" },
  { text: "connection established.\nlatency: 0ms.\ntarget: the present moment.\nstatus: arrived.", attr: "system" },
  { text: "close the other tabs.\nnot because they don't matter,\nbut because this one does.", attr: "" },
  { text: "memory usage: low.\ncpu: idle.\nthe machine is at peace.\nyou could be too.", attr: "system" },
];

const CYCLE_INTERVAL_MS = 18000;
const FADE_DURATION_MS = 2500;
const TYPEWRITER_CHAR_MS = 35;

let audioContext = null;
let isAudioPlaying = false;
let rainGainNode = null;
let thunderTimeout = null;

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hours}:${minutes}:${seconds}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function typewriterEffect(element, text) {
  return new Promise((resolve) => {
    element.textContent = "";
    element.classList.remove("fading-out");
    element.classList.add("fading-in");

    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex < text.length) {
        element.textContent += text[charIndex];
        charIndex++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, TYPEWRITER_CHAR_MS);
  });
}

function buildPromptPrefix(attr) {
  switch (attr) {
    case "terminal": return "$ cat /dev/warmth";
    case "system": return "[SYSTEM]";
    case "source": return "// reading source...";
    default: return "> _";
  }
}

let fragmentQueue = [];
let currentIndex = 0;

function getNextFragment() {
  if (currentIndex >= fragmentQueue.length) {
    fragmentQueue = shuffleArray(FRAGMENTS);
    currentIndex = 0;
  }
  const fragment = fragmentQueue[currentIndex];
  currentIndex++;
  return fragment;
}

async function displayFragment(fragment) {
  const messageElement = document.getElementById("message");
  const attributionElement = document.getElementById("attribution");
  const promptElement = document.getElementById("prompt");

  messageElement.classList.add("fading-out");
  attributionElement.classList.add("fading-out");

  await sleep(FADE_DURATION_MS);

  promptElement.textContent = buildPromptPrefix(fragment.attr);
  attributionElement.textContent = "";
  attributionElement.classList.remove("fading-out");

  await typewriterEffect(messageElement, fragment.text);

  if (fragment.attr) {
    attributionElement.textContent = `— ${fragment.attr}`;
    attributionElement.classList.add("fading-in");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startCycle() {
  const fragment = getNextFragment();
  await displayFragment(fragment);
  setTimeout(startCycle, CYCLE_INTERVAL_MS);
}

function createNoiseBuffer(context, duration) {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const buffer = context.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
  }
  return buffer;
}

function startRain(context) {
  const noiseBuffer = createNoiseBuffer(context, 4);

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const bandpass = context.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 800;
  bandpass.Q.value = 0.5;

  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 200;

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 4000;

  rainGainNode = context.createGain();
  rainGainNode.gain.value = 0;
  rainGainNode.gain.linearRampToValueAtTime(0.12, context.currentTime + 3);

  const lfoOscillator = context.createOscillator();
  lfoOscillator.type = "sine";
  lfoOscillator.frequency.value = 0.08;

  const lfoGain = context.createGain();
  lfoGain.gain.value = 0.015;

  lfoOscillator.connect(lfoGain);
  lfoGain.connect(rainGainNode.gain);
  lfoOscillator.start();

  noiseSource.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(rainGainNode);
  rainGainNode.connect(context.destination);

  noiseSource.start();

  scheduleThunder(context);
}

function scheduleThunder(context) {
  const delayMs = 15000 + Math.random() * 45000;

  thunderTimeout = setTimeout(() => {
    playThunder(context);
    scheduleThunder(context);
  }, delayMs);
}

function playThunder(context) {
  const duration = 2 + Math.random() * 3;
  const thunderGain = context.createGain();
  thunderGain.gain.value = 0;

  const noiseBuffer = createNoiseBuffer(context, duration);
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 150 + Math.random() * 100;

  const now = context.currentTime;
  const volume = 0.04 + Math.random() * 0.06;

  thunderGain.gain.setValueAtTime(0, now);
  thunderGain.gain.linearRampToValueAtTime(volume, now + 0.3);
  thunderGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(lowpass);
  lowpass.connect(thunderGain);
  thunderGain.connect(context.destination);

  source.start(now);
  source.stop(now + duration);

  const statusElement = document.getElementById("rain-status");
  statusElement.textContent = "rain: thunder nearby";
  setTimeout(() => {
    statusElement.textContent = "rain: listening";
  }, duration * 1000);
}

function toggleAudio() {
  const toggleButton = document.getElementById("sound-toggle");

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (isAudioPlaying) {
    if (rainGainNode) {
      rainGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);
    }
    if (thunderTimeout) {
      clearTimeout(thunderTimeout);
    }
    setTimeout(() => {
      if (audioContext && !isAudioPlaying) {
        audioContext.suspend();
      }
    }, 2500);
    isAudioPlaying = false;
    toggleButton.textContent = "♫ unmute";
    toggleButton.classList.remove("active");
    document.getElementById("rain-status").textContent = "rain: paused";
  } else {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    startRain(audioContext);
    isAudioPlaying = true;
    toggleButton.textContent = "♫ mute";
    toggleButton.classList.add("active");
    document.getElementById("rain-status").textContent = "rain: listening";
  }
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);

  document.getElementById("sound-toggle").addEventListener("click", toggleAudio);

  fragmentQueue = shuffleArray(FRAGMENTS);
  startCycle();
}

document.addEventListener("DOMContentLoaded", init);
