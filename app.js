'use strict';
/* Shared Garden · Hauora Whānau — V4 prototype
   Flow: Home → Choose a song → Move (standing + seated demos, word cards) → Ka pai! → Add to garden / Our Garden
   No ranking, no scores of how well anyone moves; the camera is optional and only notices movement. */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

// ---------- Songs & tokens ----------
const SONGS = [
  // Each song has its own set and order of movements (roughly 25–30 s per movement).
  {id: 'tutira', title: 'Tūtira Mai Ngā Iwi', src: 'assets/audio/tutira-mai-nga-iwi.mp3', seconds: 76, moves: ['kereru', 'tui', 'ponga']},
  {id: 'po-atarau', title: 'Pō Atarau', src: 'assets/audio/po-atarau.mp3', seconds: 120, moves: ['ponga', 'kowhai', 'harakeke', 'tui']},
  {id: 'blue-smoke', title: 'Blue Smoke', src: 'assets/audio/blue-smoke.mp3', seconds: 146, moves: ['harakeke', 'tui', 'kereru', 'kowhai', 'ponga']},
  {id: 'pokarekare', title: 'Pōkarekare Ana', src: 'assets/audio/pokarekare-ana.mp3', seconds: 160, moves: ['tui', 'piwakawaka', 'kowhai', 'harakeke', 'ponga']}
];
// 5 tokens for every 15 seconds of moving, so a longer song earns more and stopping early still counts.
const tokensFor = seconds => Math.round(seconds / 15) * 5;
const FIRST_TODAY_BONUS = 10;

// ---------- Movements ----------
const IMG = name => `assets/instructor/${name}.jpg`;
// Each movement loops through 4 illustrated frames (":flip" mirrors a frame for the other side),
// cross-fading slowly so the demonstrators move steadily from one pose to the next.
const MOVES = [
  {id: 'tui', name: 'Tūī Wing Reach', say: 'Open your arms wide, like wings.', word: 'Tūī', meaning: 'native songbird',
    standing: ['standing-heart', 'standing-receive', 'standing-share', 'standing-receive'],
    seated: ['seated-rest', 'seated-reach', 'seated-wide', 'seated-reach']},
  {id: 'kowhai', name: 'Kōwhai Sky Reach', say: 'Reach forward, then back.', word: 'Kōwhai', meaning: 'yellow-flowered tree',
    standing: ['standing-heart', 'standing-receive', 'standing-heart', 'standing-receive'],
    seated: ['seated-rest', 'seated-reach', 'seated-heart-reach', 'seated-reach']},
  {id: 'piwakawaka', name: 'Pīwakawaka Turn', say: 'Hand on heart, reach and turn.', word: 'Pīwakawaka', meaning: 'fantail bird',
    standing: ['standing-heart', 'standing-step-left', 'standing-heart', 'standing-transition'],
    seated: ['seated-rest', 'seated-heart-reach', 'seated-rest', 'seated-heart-reach:flip']},
  {id: 'ponga', name: 'Ponga Breathe', say: 'Rest and breathe slowly.', word: 'Ponga', meaning: 'silver fern',
    standing: ['standing-heart', 'standing-listen', 'standing-heart', 'standing-listen'],
    seated: ['seated-rest', 'seated-rest', 'seated-heart-reach', 'seated-rest']},
  {id: 'harakeke', name: 'Harakeke Sway', say: 'Sway gently side to side.', word: 'Harakeke', meaning: 'flax plant',
    standing: ['standing-step-left', 'standing-heart', 'standing-transition', 'standing-heart'],
    seated: ['seated-heart-reach', 'seated-rest', 'seated-heart-reach:flip', 'seated-rest']},
  {id: 'kereru', name: 'Kererū Listen', say: 'Hand to your ear, then your heart.', word: 'Kererū', meaning: 'wood pigeon',
    standing: ['standing-heart', 'standing-listen', 'standing-listen', 'standing-heart'],
    seated: ['seated-rest', 'seated-heart-reach', 'seated-heart-reach', 'seated-rest']}
];
const MOVE_BY_ID = Object.fromEntries(MOVES.map(move => [move.id, move]));
// Smooth video clips (see kling-inputs/README.md) replace the illustrated frames once their files exist.
const CLIP = (id, way) => `assets/instructor/clips/${id}-${way}.mp4`;
// clips/index.json lists the clips that exist (tools/prepare_clip.py keeps it up to date).
const clips = new Set();
fetch('assets/instructor/clips/index.json').then(response => response.ok ? response.json() : [])
  .then(names => names.forEach(name => clips.add(name))).catch(() => {});
const READY = {standing: ['standing-heart'], seated: ['seated-rest']};

// ---------- Garden items: each season is its own place with its own things ----------
const ITEM_IMG = id => `assets/garden/items/${id}.png`;
const SEASONS = {
  // Summer: a sunny lawn that fills up with plants and flowers.
  summer: {bg: 'assets/garden/garden-world-v51.png', ratio: 1586 / 992, items: [
    {id: 'pohutukawa', name: 'Pōhutukawa', cost: 60, x: 86, y: 66, w: 24, grows: true},
    {id: 'harakeke', name: 'Harakeke', cost: 40, x: 64, y: 51, w: 12, grows: true},
    {id: 'lavender', asset: 'manuka', name: 'Mānuka', cost: 30, x: 45, y: 52, w: 12, grows: true},
    {id: 'birdbath', asset: 'tui', name: 'Tūī', cost: 45, x: 29, y: 39, w: 6.5, flying: true},
    {id: 'sunflower', asset: 'southern-rata', name: 'Southern rātā', cost: 30, x: 14, y: 64, w: 15, grows: true},
    {id: 'kumara', name: 'Kūmara', cost: 25, x: 24, y: 76, w: 13, grows: true},
    {id: 'flower-pot', name: 'Flower pot', cost: 20, x: 49, y: 71, w: 9},
    {id: 'roses', asset: 'kakabeak', name: 'Kākābeak', cost: 35, x: 68, y: 76, w: 13, grows: true},
    {id: 'daisies', asset: 'mount-cook-buttercup', name: 'Mount Cook buttercup', cost: 20, x: 14, y: 95, w: 15, grows: true},
    {id: 'tomatoes', name: 'Tomatoes', cost: 30, x: 38, y: 90, w: 13, grows: true},
    {id: 'wildflowers', asset: 'koromiko', name: 'Koromiko', cost: 25, x: 60, y: 94, w: 17, grows: true},
    {id: 'butterfly', asset: 'kahukura', name: 'Kahukura butterfly', cost: 15, x: 52, y: 30, w: 4.5, flying: true},
    {id: 'ti-kouka', name: 'Tī kōuka', cost: 50, x: 8, y: 58, w: 18, grows: true},
    {id: 'nikau', name: 'Nīkau palm', cost: 55, x: 77, y: 65, w: 19, grows: true},
    {id: 'kauri', name: 'Kauri', cost: 60, x: 91, y: 49, w: 21, grows: true},
    {id: 'rengarenga', name: 'Rengarenga', cost: 25, x: 31, y: 93, w: 12, grows: true},
    {id: 'kereru', name: 'Kererū', cost: 40, x: 73, y: 31, w: 6, flying: true},
    {id: 'korimako', name: 'Korimako', cost: 35, x: 39, y: 36, w: 5, flying: true},
    {id: 'monarch', name: 'Monarch butterfly', cost: 15, x: 63, y: 27, w: 4, flying: true},
    {id: 'puriri-moth', name: 'Pūriri moth', cost: 15, x: 18, y: 34, w: 4, flying: true}
  ]},
  // Winter: a frosty backyard made cosy with a fire, seats and warm light.
  winter: {bg: 'assets/garden/garden-winter-v1.jpg', ratio: 1672 / 941, items: [
    {id: 'fire-pit', name: 'Fire pit', cost: 60, x: 52, y: 80, w: 15},
    {id: 'armchairs', name: 'Armchairs', cost: 50, x: 34, y: 68, w: 19},
    {id: 'bench', name: 'Bench', cost: 45, x: 67, y: 60, w: 14},
    {id: 'lantern', name: 'Lantern', cost: 25, x: 79, y: 80, w: 6},
    {id: 'firewood', name: 'Firewood', cost: 20, x: 17, y: 60, w: 12},
    {id: 'kowhai', name: 'Kōwhai', cost: 55, x: 89, y: 54, w: 19, grows: true},
    {id: 'ponga', name: 'Ponga / silver fern', cost: 45, x: 8, y: 74, w: 16, grows: true},
    {id: 'winter-shrub', asset: 'mount-cook-buttercup', name: 'Mount Cook buttercup', cost: 30, x: 76, y: 46, w: 10, grows: true},
    {id: 'tussock', name: 'Tussock', cost: 20, x: 27, y: 94, w: 12, grows: true},
    {id: 'carrots', name: 'Carrots', cost: 20, x: 42, y: 98, w: 11, grows: true},
    {id: 'stones', name: 'River stones', cost: 15, x: 64, y: 95, w: 12},
    {id: 'piwakawaka', name: 'Pīwakawaka', cost: 35, x: 47, y: 37, w: 5, flying: true},
    {id: 'snowman', name: 'Snowman', cost: 35, x: 88, y: 96, w: 15},
    {id: 'snow-angel', name: 'Snow angel', cost: 20, x: 52, y: 99, w: 18},
    {id: 'snowflake', name: 'Snowflake', cost: 15, x: 22, y: 36, w: 8, flying: true},
    {id: 'snowballs', name: 'Snowballs', cost: 15, x: 76, y: 99, w: 11},
    {id: 'rimu', name: 'Rimu', cost: 60, x: 93, y: 50, w: 20, grows: true},
    {id: 'totara', name: 'Tōtara', cost: 55, x: 7, y: 59, w: 18, grows: true},
    {id: 'toetoe', name: 'Toetoe', cost: 30, x: 19, y: 94, w: 13, grows: true},
    {id: 'coprosma', name: 'Karamū / coprosma', cost: 30, x: 84, y: 90, w: 12, grows: true}
  ]}
};

// ---------- Saved progress ----------
const STORE_KEY = 'sharedGardenV4';
const today = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
function loadSave() {
  // camera: null = not asked yet, 'on' | 'off'; places: where the player moved each garden item
  const fresh = {tokens: 40, unlocked: [], lastDay: null, camera: null, places: {}, gardenItems: [], nextGardenId: 1, movedOnce: false};
  let loaded;
  try { loaded = {...fresh, ...JSON.parse(localStorage.getItem(STORE_KEY))}; } catch { return fresh; }
  if (!Array.isArray(loaded.gardenItems)) loaded.gardenItems = [];
  // Bring existing one-of-each gardens into the new repeatable-item format without losing anything.
  if (!loaded.gardenItems.length && Array.isArray(loaded.unlocked)) {
    Object.entries(SEASONS).forEach(([savedSeason, details]) => {
      details.items.filter(item => loaded.unlocked.includes(item.id)).forEach(item => {
        const oldPlace = loaded.places?.[item.id] || {};
        loaded.gardenItems.push({instanceId: `garden-${loaded.nextGardenId++}`, itemId: item.id, season: savedSeason,
          x: oldPlace.x ?? item.x, y: oldPlace.y ?? item.y, rotation: 0});
      });
    });
    // Clear the retired fields so an intentionally emptied garden stays empty on the next visit.
    loaded.unlocked = [];
    loaded.places = {};
  }
  return loaded;
}
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(save)); } catch { /* keep in memory only */ }
}
let save = loadSave();
persist(); // also saves any one-time upgrade from the earlier one-of-each garden format
const firstToday = () => save.lastDay !== today();
function renderTokens() { $$('.token-count').forEach(el => { el.textContent = save.tokens; }); }

// ---------- Navigation ----------
const state = {screen: 'home', history: []};
const backButton = $('#backButton'), helpButton = $('#helpButton');

function showScreen(name, push = true) {
  if (name === state.screen) return;
  if (push) state.history.push(state.screen);
  state.screen = name;
  $$('.screen').forEach(screen => screen.classList.toggle('active', screen.dataset.screen === name));
  backButton.hidden = ['home', 'session', 'celebrate'].includes(name);
  helpButton.hidden = name === 'help';
  renderTokens();
  if (name === 'song') renderSongs();
  if (name === 'garden') renderGarden();
  if (name === 'shop') renderShop();
}
function goBack() {
  let previous = state.history.pop();
  while (previous === 'celebrate' || (previous === 'session' && !session.active)) previous = state.history.pop();
  showScreen(previous || 'home', false);
  if (previous === 'session') $('#pauseLayer').hidden = false; // back from Help mid-song
}
document.addEventListener('click', event => {
  const go = event.target.closest('[data-go]');
  if (!go) return;
  event.preventDefault();
  if (go.dataset.go === 'home') { state.history = []; if (session.active) abandonSession(); }
  showScreen(go.dataset.go);
});
backButton.addEventListener('click', goBack);
helpButton.addEventListener('click', () => { if (session.active) pauseSession(); showScreen('help'); });

const toastEl = $('#toast');
function toast(message) {
  toastEl.textContent = message; toastEl.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

// ---------- Choose a song ----------
function renderSongs() {
  $('#songGrid').innerHTML = SONGS.map(song => `
    <button class="btn btn-secondary song-card" data-song="${song.id}">
      <span class="btn-icon" aria-hidden="true">▶</span>
      <span class="btn-label"><b>${song.title}</b><small>${clock(song.seconds)}</small></span>
      <span class="token-pill small">🌱 ${tokensFor(song.seconds)}</span>
    </button>`).join('');
  $('#bonusLine').hidden = !firstToday();
}
$('#songGrid').addEventListener('click', event => {
  const card = event.target.closest('[data-song]');
  if (card) playSong(SONGS.find(song => song.id === card.dataset.song));
});
// The first time, ask about the camera before the music starts; after that, remember the answer.
let askedSong = null;
function playSong(song) {
  if (save.camera === null && cameraSupported) { askedSong = song; $('#cameraAsk').hidden = false; $('#askCamera').focus(); return; }
  startSession(song);
  if (save.camera === 'on') startCamera();
}
function answerCameraAsk(useCamera) {
  $('#cameraAsk').hidden = true;
  save.camera = useCamera ? 'on' : 'off'; persist();
  if (askedSong) playSong(askedSong);
  askedSong = null;
}
$('#askCamera').addEventListener('click', () => answerCameraAsk(true));
$('#askPlay').addEventListener('click', () => answerCameraAsk(false));

// ---------- Move ----------
const INTRO = 5, FRAME_SECONDS = 1.8;
const session = {active: false, song: null, audio: null, duration: 0, round: -2, clock: 0, poseTimer: 0, frame: 0, moves: []};
const demoFrames = {standing: $('[data-demo="standing"] .demo-frame'), seated: $('[data-demo="seated"] .demo-frame')};
// Load every pose once so frame changes never flash.
[...new Set(MOVES.flatMap(move => [...move.standing, ...move.seated]).map(pose => pose.split(':')[0]))].forEach(pose => { new Image().src = IMG(pose); });

const roundLength = () => (session.duration - INTRO) / session.moves.length;
const roundAt = time => time < INTRO ? -1 : Math.min(session.moves.length - 1, Math.floor((time - INTRO) / roundLength()));

// A soft three-note chime for Ka pai! (made with Web Audio, so no extra sound file).
let chimeContext = null;
function playChime() {
  if (!chimeContext) return;
  const now = chimeContext.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, i) => {
    const tone = chimeContext.createOscillator(), gain = chimeContext.createGain();
    tone.type = 'sine'; tone.frequency.value = frequency;
    const start = now + i * .18;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.18, start + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, start + 1.1);
    tone.connect(gain).connect(chimeContext.destination);
    tone.start(start); tone.stop(start + 1.2);
  });
}
const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function countUp(element, total) {
  if (calmMotion.matches || total <= 0) { element.textContent = `+${total} 🌱`; return; }
  const started = performance.now();
  const step = () => {
    const progress = Math.min(1, (performance.now() - started) / 1200);
    element.textContent = `+${Math.round(total * (1 - Math.pow(1 - progress, 3)))} 🌱`;
    if (progress < 1) setTimeout(step, 40);
  };
  step();
}

function startSession(song) {
  stopAudio();
  // Created inside the tap that starts the song, so the browser allows the chime later.
  try { chimeContext ??= new AudioContext(); chimeContext.resume(); } catch { chimeContext = null; }
  const audio = new Audio(song.src);
  audio.preload = 'auto';
  Object.assign(session, {active: true, song, audio, duration: song.seconds, round: -2, moves: song.moves.map(id => MOVE_BY_ID[id]), leaves: 0});
  Object.assign(camera, {movingTime: 0, quietTime: 0, nudged: false});
  $('#leafCount').textContent = '0';
  audio.addEventListener('loadedmetadata', () => { if (Number.isFinite(audio.duration)) session.duration = audio.duration; });
  audio.addEventListener('ended', () => finishSession());
  $('#progressFill').style.width = '0%';
  $('#pauseLayer').hidden = true;
  clips.forEach(name => fetch(`assets/instructor/clips/${name}.mp4`).catch(() => {})); // warm the cache before rounds begin
  showScreen('session');
  tick();
  audio.play().catch(() => pauseSession());
  // Timers (not requestAnimationFrame) keep the song and rounds in step even in a background tab.
  session.clock = setInterval(tick, 200);
  session.poseTimer = setInterval(nextFrame, FRAME_SECONDS * 1000);
}

function tick() {
  if (!session.active) return;
  const time = session.audio.currentTime;
  $('#progressFill').style.width = `${Math.min(100, time / session.duration * 100)}%`;
  const round = roundAt(time);
  if (round !== session.round) showRound(round);
}

function showRound(round) {
  session.round = round;
  const move = session.moves[round];
  $('#moveTitle').textContent = move ? move.name : 'Get ready';
  $('#moveInstruction').textContent = move ? move.say : 'Find a comfortable position.';
  const poses = move || READY;
  ['standing', 'seated'].forEach(way => {
    if (move && clips.has(`${move.id}-${way}`)) {
      // The clip's first pose doubles as its poster, so there is never a blank frame while it loads.
      demoFrames[way].innerHTML = `<video class="active" src="${CLIP(move.id, way)}" poster="${IMG(move[way][0].split(':')[0])}" muted loop playsinline autoplay preload="auto"></video>`;
      if (!session.audio?.paused) demoFrames[way].firstChild.play().catch(() => {});
      return;
    }
    demoFrames[way].innerHTML = poses[way].map((pose, i) => {
      const [name, flip] = pose.split(':');
      return `<img src="${IMG(name)}" alt="" class="${i === 0 ? 'active' : ''}${flip ? ' mirrored' : ''}">`;
    }).join('');
  });
  session.frame = 0;
  if (move) { $('#wordMaori').textContent = move.word; $('#wordMeaning').textContent = move.meaning; }
  $('#wordCard').hidden = !move;
}
function nextFrame() {
  session.frame += 1;
  Object.values(demoFrames).forEach(frame => {
    const imgs = frame.children;
    [...imgs].forEach((img, i) => img.classList.toggle('active', i === session.frame % imgs.length));
  });
}

function pauseSession() {
  if (!session.active) return;
  session.audio.pause();
  $$('.demo-frame video').forEach(video => video.pause());
  $('#pauseLayer').hidden = false;
}
function resumeSession() {
  $('#pauseLayer').hidden = true;
  session.audio.play().catch(() => toast('Please tap Continue again.'));
  $$('.demo-frame video').forEach(video => video.play().catch(() => {}));
}
// Browsers pause silent videos in background tabs; pick the demonstrators back up when the page is visible again.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && session.active && !session.audio.paused) $$('.demo-frame video').forEach(video => video.play().catch(() => {}));
});
$('#pauseButton').addEventListener('click', pauseSession);
$('#resumeButton').addEventListener('click', resumeSession);
$('#finishButton').addEventListener('click', () => finishSession());

function stopAudio(fade = false) {
  clearInterval(session.clock);
  clearInterval(session.poseTimer);
  const audio = session.audio;
  if (!audio) return;
  const release = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); };
  if (!fade || audio.paused) { release(); return; }
  // Let the song fade out gently instead of cutting off.
  const fader = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - .08);
    if (audio.volume === 0) { clearInterval(fader); release(); }
  }, 50);
}
function abandonSession(fade = false) { session.active = false; stopAudio(fade); endCamera(); }

function finishSession() {
  if (!session.active) return;
  const moved = Math.min(session.audio.currentTime, session.duration);
  const earned = moved >= session.duration - 1 ? tokensFor(session.duration) : tokensFor(moved);
  const bonus = moved >= 20 && firstToday() ? FIRST_TODAY_BONUS : 0;
  const leaves = camera.stream ? session.leaves : 0; // leaves are only a picture of moving; tokens never depend on the camera
  abandonSession(true);
  save.tokens += earned + bonus;
  if (moved >= 20) save.lastDay = today();
  persist();
  $('#celebrateTitle').textContent = earned + bonus > 0 ? 'Ka pai!' : 'Thank you!';
  $('#tokenEarned').hidden = earned + bonus === 0;
  $('#celebrateBonus').hidden = !bonus;
  $('#celebrateGrew').textContent = `Your garden grew ${'🍃'.repeat(Math.min(leaves, 8))}${leaves > 8 ? ` ×${leaves}` : ''}`;
  $('#celebrateGrew').hidden = !leaves;
  const canAdd = SEASONS[season].items.filter(item => item.cost <= save.tokens).length;
  $('#celebrateCanAdd').textContent = canAdd ? `You can add ${canAdd} new thing${canAdd > 1 ? 's' : ''} to the garden` : '';
  $('#celebrateCanAdd').hidden = !canAdd;
  state.history = ['home'];
  showScreen('celebrate');
  countUp($('#tokenEarned'), earned + bonus);
  if (earned + bonus > 0) playChime();
}

// ---------- Camera: only notices that you are moving; stays on this device ----------
// Moving grows leaves on the sprout (a picture of effort for the player and whānau watching).
// It never changes tokens, never judges how well anyone moves, and nothing is recorded.
const SAMPLE_MS = 200, MOVING_LEVEL = 2.5, LEAF_SECONDS = 5, QUIET_SECONDS = 20;
const camera = {stream: null, timer: 0, previous: null, level: 0, movingTime: 0, quietTime: 0, nudged: false};
const cameraVideo = $('#cameraVideo'), cameraToggle = $('#cameraToggle');
// Browsers only open the camera on https:// or localhost pages.
const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext;
const probe = Object.assign(document.createElement('canvas'), {width: 48, height: 36});
const probeContext = probe.getContext('2d', {willReadFrequently: true});

async function startCamera() {
  if (!cameraSupported) { toast('The camera needs a secure (https) link. Keep moving!'); return; }
  try {
    camera.stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user', width: {ideal: 320}}, audio: false});
  } catch { save.camera = 'off'; persist(); toast('No camera — that is fine, keep moving!'); return; }
  if (!session.active) { endCamera(); return; } // the song ended while the browser was asking
  cameraVideo.srcObject = camera.stream; cameraVideo.play().catch(() => {});
  $('#youDemo').hidden = false;
  $('#leafPill').hidden = false;
  cameraToggle.setAttribute('aria-pressed', 'true'); $('#cameraLabel').textContent = 'Camera on';
  camera.previous = null; camera.level = 0;
  camera.timer = setInterval(senseMotion, SAMPLE_MS);
}
function senseMotion() {
  if (cameraVideo.readyState < 2) return;
  probeContext.drawImage(cameraVideo, 0, 0, probe.width, probe.height);
  const pixels = probeContext.getImageData(0, 0, probe.width, probe.height).data;
  const gray = new Float32Array(pixels.length / 4);
  for (let i = 0; i < gray.length; i++) gray[i] = pixels[i * 4] * .3 + pixels[i * 4 + 1] * .59 + pixels[i * 4 + 2] * .11;
  if (camera.previous) {
    let change = 0;
    for (let i = 0; i < gray.length; i++) change += Math.abs(gray[i] - camera.previous[i]);
    camera.level = camera.level * .6 + (change / gray.length) * .4;
    const moving = camera.level >= MOVING_LEVEL;
    $('#movingBadge').hidden = !moving;
    $('#youDemo').classList.toggle('moving', moving);
    if (session.active && !session.audio.paused) countMovement(moving);
  }
  camera.previous = gray;
}
function countMovement(moving) {
  const step = SAMPLE_MS / 1000;
  if (!moving) {
    camera.quietTime += step;
    // A long still spell is fine: offer rest, never a warning. Once per still spell.
    if (camera.quietTime >= QUIET_SECONDS && !camera.nudged) { camera.nudged = true; toast('Rest if you need 💚'); }
    return;
  }
  camera.quietTime = 0; camera.nudged = false;
  camera.movingTime += step;
  if (camera.movingTime < LEAF_SECONDS) return;
  camera.movingTime -= LEAF_SECONDS;
  session.leaves += 1;
  $('#leafCount').textContent = session.leaves;
  [$('#progressSprout'), $('#leafPill')].forEach(el => { el.classList.remove('grow'); void el.offsetWidth; el.classList.add('grow'); });
}
function endCamera() {
  clearInterval(camera.timer);
  camera.stream?.getTracks().forEach(track => track.stop());
  camera.stream = null; cameraVideo.srcObject = null;
  $('#youDemo').hidden = true; $('#youDemo').classList.remove('moving');
  $('#movingBadge').hidden = true; $('#leafPill').hidden = true;
  cameraToggle.setAttribute('aria-pressed', 'false'); $('#cameraLabel').textContent = 'Use camera';
}
// The button in the game is the player's standing choice too: turning it off here means it stays off next time.
cameraToggle.addEventListener('click', () => {
  if (!cameraSupported) { startCamera(); return; } // explains why, changes nothing
  if (camera.stream) { endCamera(); save.camera = 'off'; } else { save.camera = 'on'; startCamera(); }
  persist();
});

// ---------- Our garden ----------
const currentSeason = () => { const month = new Date().getMonth(); return month >= 3 && month <= 8 ? 'winter' : 'summer'; };
let season = currentSeason(), justAdded = null, selectedGardenItem = null;
let growthEffect = {instanceId: null, type: null, timer: 0};

const itemDefinition = instance => SEASONS[instance.season]?.items.find(item => item.id === instance.itemId);
const gardenItem = instanceId => save.gardenItems.find(item => item.instanceId === instanceId);

function showItemTools() {
  const instance = gardenItem(selectedGardenItem);
  const definition = instance && itemDefinition(instance);
  const visible = definition && instance.season === season;
  $('#itemTools').hidden = !visible;
  $('#growthTools').hidden = !visible || !definition.grows;
  if (definition) {
    $('#itemToolsName').textContent = definition.name;
    $('#itemSizeLabel').textContent = `${Math.round((instance.size || 1) * 100)}%`;
    if (definition.grows) {
      const stage = instance.growthStage || 'grown';
      const step = {
        seed: ['Step 1 of 3', 'Your seed is ready', '🌱 Plant'],
        planted: ['Step 2 of 3', 'Give it a gentle drink', '💧 Water'],
        watered: ['Step 3 of 3', 'See what you grew', '🌿 Watch it Grow'],
        grown: ['Fully grown', 'A little water makes it happy', '💧 Water']
      }[stage];
      $('#growthStep').textContent = step[0];
      $('#growthPrompt').textContent = step[1];
      $('#growthAction').textContent = step[2];
    }
  }
}

function selectGardenItem(instanceId) {
  selectedGardenItem = instanceId;
  $$('.garden-item').forEach(element => element.classList.toggle('selected', element.dataset.instance === instanceId));
  showItemTools();
}

function renderGardenItem(item) {
  const stage = item.grows ? (item.growthStage || 'grown') : null;
  const effect = growthEffect.instanceId === item.instanceId ? growthEffect.type : null;
  const selected = item.instanceId === selectedGardenItem ? ' selected' : '';
  let itemMarkup;
  if (item.grows && stage !== 'grown') {
    itemMarkup = `<div class="garden-item garden-seed-stage stage-${stage}${item.instanceId === justAdded ? ' new' : ''}${selected}${effect === 'planting' ? ' just-planted' : ''}" role="button" aria-label="${item.name}, ${stage === 'seed' ? 'seed ready to plant' : stage === 'planted' ? 'planted seed ready for water' : 'sprout ready to grow'}"
      data-instance="${item.instanceId}" tabindex="0" style="left:${item.x}%;top:${item.y}%;width:${Math.min(item.w, 9)}%;transform:rotate(${item.rotation || 0}deg) scale(${item.size || 1})"><span class="garden-soil"></span><span class="garden-seed"></span><span class="garden-sprout"></span></div>`;
  } else {
    itemMarkup = `<img class="garden-item${item.flying ? ' flying' : ''}${item.instanceId === justAdded ? ' new' : ''}${selected}${effect === 'growing' ? ' just-grown' : ''}${effect === 'happy' ? ' water-happy' : ''}" src="${ITEM_IMG(item.asset || item.itemId)}" alt="${item.name}"
      data-instance="${item.instanceId}" tabindex="0" draggable="false" style="left:${item.x}%;top:${item.y}%;width:${item.w}%;transform:rotate(${item.rotation || 0}deg) scale(${item.size || 1})">`;
  }
  const effectWidth = item.grows && stage !== 'grown' ? Math.min(item.w, 10) : item.w;
  const effectMarkup = effect ? `<span class="garden-effect effect-${effect}" aria-hidden="true" style="left:${item.x}%;top:${item.y}%;width:${effectWidth}%"></span>` : '';
  const groundWidth = item.w * (item.size || 1) * .62;
  const groundMarkup = !item.flying && (!item.grows || stage === 'grown')
    ? `<span class="garden-ground" aria-hidden="true" style="left:${item.x}%;top:${item.y}%;width:${groundWidth}%"></span>` : '';
  return groundMarkup + itemMarkup + effectMarkup;
}

function renderGarden() {
  const scene = $('#gardenScene');
  scene.dataset.season = season;
  $('#gardenBg').src = SEASONS[season].bg;
  scene.style.setProperty('--ratio', SEASONS[season].ratio);
  $$('[data-season]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === season)));
  const owned = save.gardenItems.filter(instance => instance.season === season).map(instance => ({...itemDefinition(instance), ...instance}));
  $('#gardenItems').innerHTML = owned
    .sort((a, b) => a.y - b.y) // things lower in the picture sit in front
    .map(renderGardenItem).join('');
  $('#gardenEmpty').hidden = owned.length > 0;
  $('#dragHint').hidden = !owned.length || save.movedOnce;
  if (!owned.some(item => item.instanceId === selectedGardenItem)) selectedGardenItem = null;
  showItemTools();
  justAdded = null;
}
$$('[data-season]').forEach(button => button.addEventListener('click', () => { season = button.dataset.season; selectedGardenItem = null; renderGarden(); }));

// Players arrange their own garden: press on anything and drag it. Positions are kept (as % of the picture, so they fit any screen).
// x is the item's centre, y is where it touches the ground.
const clampPlace = (x, y) => ({x: Math.round(Math.min(97, Math.max(3, x)) * 10) / 10, y: Math.round(Math.min(100, Math.max(12, y)) * 10) / 10});
function placeItem(element, x, y) {
  const place = clampPlace(x, y);
  element.style.left = `${place.x}%`; element.style.top = `${place.y}%`;
  return place;
}
function matchBeside(instanceId, place) {
  const instance = gardenItem(instanceId);
  const definition = itemDefinition(instance);
  const peers = save.gardenItems.filter(other => other.instanceId !== instanceId && other.season === season && other.itemId === instance.itemId);
  let best = null;
  peers.forEach(peer => [-1, 1].forEach(side => {
    const spacing = definition.w * .82 * (((instance.size || 1) + (peer.size || 1)) / 2);
    const target = clampPlace(peer.x + side * spacing, peer.y);
    const distance = Math.hypot(place.x - target.x, (place.y - target.y) * 1.5);
    if (distance <= 6 && (!best || distance < best.distance)) best = {place: target, rotation: peer.rotation || 0, distance};
  }));
  return best;
}
function keepPlace(instanceId, place) {
  const instance = gardenItem(instanceId);
  const match = matchBeside(instanceId, place);
  Object.assign(instance, match?.place || place);
  if (match) instance.rotation = match.rotation;
  save.movedOnce = true; persist();
  renderGarden(); // re-sort so whatever is lower stands in front
  if (match) toast('Matched neatly beside the other one.');
}
let dragging = null, pinch = null;
const touchPoints = new Map();
const clampSize = size => Math.round(Math.min(2, Math.max(.4, size)) * 10) / 10;
const distanceBetween = ([a, b]) => Math.hypot(a.x - b.x, a.y - b.y);
function displaySize(instance, element) {
  element.style.transform = `rotate(${instance.rotation || 0}deg) scale(${instance.size || 1})`;
  $('#itemSizeLabel').textContent = `${Math.round((instance.size || 1) * 100)}%`;
}
$('#gardenItems').addEventListener('pointerdown', event => {
  const element = event.target.closest('.garden-item');
  if (!element) return;
  event.preventDefault();
  selectGardenItem(element.dataset.instance);
  const box = $('#gardenScene').getBoundingClientRect();
  dragging = {element, box, pointer: event.pointerId,
    // keep the grab point under the finger instead of jumping the item's foot to it
    dx: parseFloat(element.style.left) - (event.clientX - box.left) / box.width * 100,
    dy: parseFloat(element.style.top) - (event.clientY - box.top) / box.height * 100};
  element.setPointerCapture(event.pointerId);
  element.classList.add('lifted');
  if (event.pointerType === 'touch') {
    touchPoints.set(event.pointerId, {x: event.clientX, y: event.clientY, instanceId: element.dataset.instance});
    const points = [...touchPoints.values()].filter(point => point.instanceId === element.dataset.instance);
    if (points.length === 2) {
      const instance = gardenItem(element.dataset.instance);
      pinch = {instanceId: element.dataset.instance, distance: distanceBetween(points), size: instance.size || 1, element};
      dragging = null;
    }
  }
});
$('#gardenItems').addEventListener('pointermove', event => {
  if (touchPoints.has(event.pointerId)) {
    const point = touchPoints.get(event.pointerId);
    Object.assign(point, {x: event.clientX, y: event.clientY});
    if (pinch && point.instanceId === pinch.instanceId) {
      const points = [...touchPoints.values()].filter(other => other.instanceId === pinch.instanceId);
      if (points.length >= 2) {
        const instance = gardenItem(pinch.instanceId);
        instance.size = clampSize(pinch.size * distanceBetween(points.slice(0, 2)) / pinch.distance);
        displaySize(instance, pinch.element);
      }
      return;
    }
  }
  if (!dragging || event.pointerId !== dragging.pointer) return;
  const {element, box, dx, dy} = dragging;
  dragging.place = placeItem(element, (event.clientX - box.left) / box.width * 100 + dx, (event.clientY - box.top) / box.height * 100 + dy);
});
function dropItem(event) {
  if (touchPoints.has(event.pointerId)) touchPoints.delete(event.pointerId);
  if (pinch) {
    pinch.element.classList.remove('lifted');
    pinch = null; dragging = null; touchPoints.clear();
    save.movedOnce = true; persist(); renderGarden();
    return;
  }
  if (!dragging || event.pointerId !== dragging.pointer) return;
  const {element, place} = dragging;
  dragging = null;
  element.classList.remove('lifted');
  if (place) keepPlace(element.dataset.instance, place);
}
$('#gardenItems').addEventListener('pointerup', dropItem);
$('#gardenItems').addEventListener('pointercancel', dropItem);
$('#gardenScene').addEventListener('pointerdown', event => {
  if (!event.target.closest('.garden-item, .item-tools, .growth-tools')) selectGardenItem(null);
});
$('#gardenItems').addEventListener('focusin', event => {
  const element = event.target.closest('.garden-item');
  if (element) selectGardenItem(element.dataset.instance);
});
// Keyboard: focus an item and nudge it with the arrow keys.
$('#gardenItems').addEventListener('keydown', event => {
  const element = event.target.closest('.garden-item');
  if (!element) return;
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault(); selectGardenItem(element.dataset.instance); $('#rotateItem').click(); return;
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault(); selectGardenItem(element.dataset.instance); $('#largerItem').click(); return;
  }
  if (event.key === '-' || event.key === '_') {
    event.preventDefault(); selectGardenItem(element.dataset.instance); $('#smallerItem').click(); return;
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault(); selectGardenItem(element.dataset.instance); $('#deleteItem').click(); return;
  }
  const step = {ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2]}[event.key];
  if (!step) return;
  event.preventDefault();
  const place = placeItem(element, parseFloat(element.style.left) + step[0], parseFloat(element.style.top) + step[1]);
  keepPlace(element.dataset.instance, place);
  $(`.garden-item[data-instance="${element.dataset.instance}"]`)?.focus();
});

$('#rotateItem').addEventListener('click', () => {
  const instance = gardenItem(selectedGardenItem);
  if (!instance) return;
  instance.rotation = ((instance.rotation || 0) + 45) % 360;
  persist(); renderGarden();
  $(`.garden-item[data-instance="${instance.instanceId}"]`)?.focus();
});
function resizeSelected(change) {
  const instance = gardenItem(selectedGardenItem);
  if (!instance) return;
  instance.size = clampSize((instance.size || 1) + change);
  persist(); renderGarden();
  $(`.garden-item[data-instance="${instance.instanceId}"]`)?.focus();
}
$('#smallerItem').addEventListener('click', () => resizeSelected(-.1));
$('#largerItem').addEventListener('click', () => resizeSelected(.1));
function showGrowthEffect(instanceId, type, duration = 1100) {
  clearTimeout(growthEffect.timer);
  growthEffect = {instanceId, type, timer: 0};
  renderGarden();
  growthEffect.timer = setTimeout(() => {
    if (growthEffect.instanceId === instanceId) {
      growthEffect = {instanceId: null, type: null, timer: 0};
      renderGarden();
    }
  }, duration);
}
$('#growthAction').addEventListener('click', () => {
  const instance = gardenItem(selectedGardenItem);
  const definition = instance && itemDefinition(instance);
  if (!definition?.grows) return;
  const stage = instance.growthStage || 'grown';
  if (stage === 'seed') {
    instance.growthStage = 'planted'; persist(); showGrowthEffect(instance.instanceId, 'planting');
    toast('Seed planted.');
  } else if (stage === 'planted') {
    instance.growthStage = 'watered'; persist(); showGrowthEffect(instance.instanceId, 'watering');
    toast('Gently watered.');
  } else if (stage === 'watered') {
    instance.growthStage = 'grown'; persist(); showGrowthEffect(instance.instanceId, 'growing', 1400);
    toast(`${definition.name} grew!`);
  } else {
    showGrowthEffect(instance.instanceId, 'happy');
  }
});
$('#deleteItem').addEventListener('click', () => {
  const index = save.gardenItems.findIndex(item => item.instanceId === selectedGardenItem);
  if (index < 0) return;
  const [removed] = save.gardenItems.splice(index, 1);
  const definition = itemDefinition(removed);
  save.tokens += definition.cost; // deletion is fully reversible: buying it again costs the same amount
  selectedGardenItem = null;
  persist(); renderTokens(); renderGarden();
  toast(`${definition.name} removed — ${definition.cost} 🌱 returned.`);
});

// ---------- Add to garden (token page) ----------
function renderShop() {
  $('#shopGrid').innerHTML = SEASONS[season].items.map(item => {
    const count = save.gardenItems.filter(instance => instance.season === season && instance.itemId === item.id).length;
    const short = save.tokens < item.cost;
    return `<button class="btn btn-secondary shop-item${count ? ' owned' : ''}${short ? ' locked' : ''}" data-item="${item.id}">
      <img class="shop-art" src="${ITEM_IMG(item.asset || item.id)}" alt="" loading="lazy" decoding="async">
      <b>${item.name}</b>
      <span class="shop-cost">${short ? '🔒' : '🌱'} ${item.cost}${count ? ` · ${count} in garden` : ''}</span>
    </button>`;
  }).join('');
}
$('#shopGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-item]');
  if (!button) return;
  const item = SEASONS[season].items.find(entry => entry.id === button.dataset.item);
  if (save.tokens < item.cost) { toast(`${item.cost - save.tokens} more 🌱 needed — play a song!`); return; }
  save.tokens -= item.cost;
  const same = save.gardenItems.filter(instance => instance.season === season && instance.itemId === item.id);
  // A small repeat pattern avoids rows of identical clones while keeping every new item easy to find and move.
  const variations = [[0, 0, 1], [.82, -1.5, .9], [-.76, 2, 1.1], [.34, 5, 1.1], [-.28, -5, .9], [1.24, 3, 1], [-1.18, -2.5, 1.1], [.66, 7, .9]];
  const [xFactor, dy, size] = variations[same.length % variations.length];
  const dx = item.w * xFactor;
  const place = clampPlace(item.x + dx, item.y + dy);
  const instance = {instanceId: `garden-${save.nextGardenId++}`, itemId: item.id, season, ...place, rotation: 0, size,
    ...(item.grows ? {growthStage: 'seed'} : {})};
  save.gardenItems.push(instance);
  persist();
  justAdded = instance.instanceId;
  selectedGardenItem = instance.instanceId;
  state.history = state.history.filter(name => name !== 'garden');
  showScreen('garden');
  toast(`${item.name} added!`);
});

renderTokens();
