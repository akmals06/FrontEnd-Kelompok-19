const lampu   = document.querySelector('.lampu');
const statusEl= document.querySelector('.status');
const btnMulai= document.querySelector('.mulai');
const btnStop = document.querySelector('.berhenti');
const video   = document.querySelector('.videokamera');
const kanvas  = document.querySelector('.kanvas');
const ctx     = kanvas.getContext('2d');
const nilaiEl = document.querySelector('.nilaikecerahan');
const batasEl = document.querySelector('.nilaibatas');

let stream = null;
let loopId = null;
let jalan  = false;

let ambang = parseInt(batasEl.textContent || '60', 10) || 60;

function setLamp(on) {
  lampu.classList.toggle('on',  on);
  lampu.classList.toggle('off', !on);
}

function hitungKecerahan() {
  const w = kanvas.width;      
  const h = kanvas.height;    
  ctx.drawImage(video, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    sum += 0.2126*r + 0.7152*g + 0.0722*b; 
  }
  return sum / (data.length / 4);
}

function jalanLoop() {
  if (!jalan) return;
  const v = hitungKecerahan();
  nilaiEl.textContent = Math.round(v);

  const gelap = v < ambang;
  setLamp(gelap);
  statusEl.textContent = gelap ? 'Status pencahayaan skrg: gelap' : 'Status pencahayaan skrg: terang';

  loopId = setTimeout(jalanLoop, 200);
}

async function mulai() {
  if (jalan) return;
  statusEl.textContent = 'Status: minta izin kamera...';
  try {
    video.classList.remove('sembunyi'); 
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    jalan = true;
    statusEl.textContent = 'Status: berjalan';
    jalanLoop();
  } catch (e) {
    statusEl.textContent = 'Status: kamera ditolak / tidak tersedia';
    setLamp(false);
  }
}

function berhenti() {
  jalan = false;
  if (loopId) { clearTimeout(loopId); loopId = null; }
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  statusEl.textContent = 'Status: kamera telah dimatikan';
  nilaiEl.textContent = '—';
  setLamp(false);
}

btnMulai.addEventListener('click', mulai);
btnStop .addEventListener('click', berhenti);
window.addEventListener('beforeunload', berhenti);

setLamp(false);
statusEl.textContent = 'Status: belum aktif';
nilaiEl.textContent = '—';