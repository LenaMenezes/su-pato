/* main.js - lógica do site, comentada em português
   - Entrada, áudio ambiente, cursor estrela, confetti,
     puzzle (3x3), blocos secretos, lightbox da galeria e helpers.
*/

/* ----------------- Referências a elementos ----------------- */
const overlay = document.getElementById('overlay');
const enterBtn = document.getElementById('enterBtn');
const siteContent = document.getElementById('siteContent');

/* Iframes de Spotify - estão vazios até o usuário clicar 'Entrar' */
const spIframes = [
  document.getElementById('sp1'),
  document.getElementById('sp2'),
  document.getElementById('sp3'),
  document.getElementById('sp4'),
];

/* ----------------- Spotify: conversor de links ----------------- */
/* Use spotifyLinks para listar URLs normais (como você enviar).
   A função toSpotifyEmbed extrai o ID da track e monta a URL de embed.
   Troque os valores em spotifyLinks pelos links que quiser testar. */
function toSpotifyEmbed(url){
  if(!url) return '';
  const m = url.match(/track\/([a-zA-Z0-9]+)(\?|$)/);
  if(m && m[1]) return 'https://open.spotify.com/embed/track/' + m[1];
  return url;
}

// Exemplos: substitua esses links pelos que você preferir
const spotifyLinks = [
  'https://open.spotify.com/embed/track/5DqdesEfbRyOlSS3Tf6c29?utm_source=generator',
  'https://open.spotify.com/embed/track/62HKW77nt6tudsIHXT2A0M?utm_source=generator',
  'https://open.spotify.com/embed/track/3r8RuvgbX9s7ammBn07D3W?utm_source=generator&theme=0',
  'https://open.spotify.com/embed/track/7JIuqL4ZqkpfGKQhYlrirs?utm_source=generator',
  'https://open.spotify.com/embed/track/41P6Tnd8KIHqON0QIydx6a?utm_source=generator'
];

// Converte todos para URLs de embed (usadas nos iframes)
const spotifyEmbeds = spotifyLinks.map(l => toSpotifyEmbed(l));

/* ----------------- Comportamento ao clicar "Entrar" ----------------- */
enterBtn.addEventListener('click', async () => {
  // 1) Preenche iframes com os embeds do Spotify (ajuda permissões)
  spIframes.forEach((ifrm, i) => {
    ifrm.src = spotifyEmbeds[i] ? spotifyEmbeds[i] + '?utm_source=generator' : '';
  });

  // 2) Esconde o overlay com animação simples
  overlay.style.opacity = 0;
  overlay.style.transform = 'scale(0.995)';
  overlay.setAttribute('aria-hidden','true');
  siteContent.setAttribute('aria-hidden','false');
  setTimeout(()=>overlay.style.display='none',650);

  // 3) Inicia áudio ambiente via WebAudio (o usuário já interagiu, então deve ser permitido)
  try{ startAmbient(); }catch(e){ console.warn('Ambient audio blocked', e); }

  // 4) pequena explosão de confetti de boas-vindas
  runConfetti(80);
});

/* ----------------- Áudio ambiente (pad suave) ----------------- */
/* NOTE: usamos `audioCtx` aqui apenas para o som ambiente.
   Para os sons de clique usamos outro contexto `clickCtx` (evita conflitos). */
let audioCtx, padGain, padOsc1, padOsc2;

function startAmbient(){
  // cria contexto de áudio (WebAudio)
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // ganho (volume) inicial muito baixo para evitar estouro
  padGain = audioCtx.createGain();
  padGain.gain.value = 0.0001;
  padGain.connect(audioCtx.destination);

  // dois osciladores para criar um som pad suave
  padOsc1 = audioCtx.createOscillator();
  padOsc2 = audioCtx.createOscillator();
  padOsc1.type = 'sine'; padOsc2.type = 'sine';
  padOsc1.frequency.setValueAtTime(220, audioCtx.currentTime);
  padOsc2.frequency.setValueAtTime(330, audioCtx.currentTime);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(900, audioCtx.currentTime);

  padOsc1.connect(filter); padOsc2.connect(filter); filter.connect(padGain);
  padOsc1.start(); padOsc2.start();

  // fade-in suave do volume
  padGain.gain.exponentialRampToValueAtTime(0.012, audioCtx.currentTime + 0.6);
}

// função para parar o som ambiente (caso queira oferecer botão "pausar")
function stopAmbient(){
  if(!audioCtx) return;
  padGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
  setTimeout(()=>{ try{ padOsc1.stop(); padOsc2.stop(); audioCtx.close(); }catch(e){} },600);
}

/* ----------------- Cursor estrela ----------------- */
const star = document.getElementById('starCursor');
let cursorOn = false;
document.getElementById('toggleCursor').addEventListener('click', () => {
  cursorOn = !cursorOn;
  star.style.display = cursorOn ? 'block' : 'none';
  document.getElementById('toggleCursor').setAttribute('aria-pressed', String(cursorOn));
});
document.addEventListener('mousemove',(e)=>{
  if(!cursorOn) return;
  star.style.left = e.clientX + 'px';
  star.style.top = e.clientY + 'px';
});

/* ----------------- Confetti simples em canvas ----------------- */
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiPieces = [];
function resizeCanvas(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
resizeCanvas(); window.addEventListener('resize', resizeCanvas);

function runConfetti(count=120){
  confettiCanvas.style.display='block';
  for(let i=0;i<count;i++){
    confettiPieces.push({
      x: Math.random()*confettiCanvas.width,
      y: -Math.random()*confettiCanvas.height,
      vx: (Math.random()-0.5)*2,
      vy: 2 + Math.random()*4,
      size: 6 + Math.random()*8,
      col: ['#b8d8ff','#c6a6ff','#ffd4e6','#fff7c2'][Math.floor(Math.random()*4)]
    });
  }
  requestAnimationFrame(confettiLoop);
  setTimeout(()=>{ confettiPieces=[]; confettiCanvas.style.display='none'; },2400);
}
function confettiLoop(){
  confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiPieces.forEach(p=>{
    p.x += p.vx; p.y += p.vy; p.vy += 0.03;
    confettiCtx.fillStyle = p.col;
    confettiCtx.fillRect(p.x,p.y,p.size,p.size*0.6);
  });
  if(confettiPieces.length) requestAnimationFrame(confettiLoop);
}
document.getElementById('confettiBtn').addEventListener('click', ()=>runConfetti(100));
document.getElementById('miniConfetti').addEventListener('click', ()=>runConfetti(40));

/* ----------------- Puzzle 3x3 (sliding puzzle) ----------------- */
/* Explicação:
   - O puzzle é um grid 3x3 onde a última peça é o "vazio".
   - Clicando em peças adjacentes ao vazio, essas peças se movem.
   - Para trocar a imagem do puzzle, coloque sua imagem em assets/ e
     defina o caminho em imgUrl (ex: 'assets/puzzle.jpg').
*/
const puzzleEl = document.getElementById('puzzleGrid');
const SIZE = 3;
let board = [];

// USO: para teste usamos o arquivo enviado "assets/image.png"
// Se quiser usar outra imagem, substitua o nome do arquivo aqui.
const imgUrl = 'assets/imagegame.png';

function initBoard(){
  board = [];
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      board.push({r,c,index:r*SIZE+c});
    }
  }
  // marca a última peça como vazia
  board[board.length-1].empty = true;
}
function render(){
  puzzleEl.innerHTML = '';
  board.forEach((cell,i)=>{
    const piece = document.createElement('div');
    piece.className = 'piece';
    piece.dataset.index = cell.index;
    // peça vazia
    if(cell.empty){
      piece.style.background = 'transparent';
    } else {
      const row = Math.floor(cell.index / SIZE);
      const col = cell.index % SIZE;
      piece.style.backgroundImage = `url("${imgUrl}")`;
      piece.style.backgroundSize = `${SIZE*100}% ${SIZE*100}%`;
      piece.style.backgroundPosition = `${(col/(SIZE-1))*100}% ${(row/(SIZE-1))*100}%`;
    }
    piece.addEventListener('click', ()=>onPieceClick(i));
    puzzleEl.appendChild(piece);
  });
}
function getNeighbors(idx){
  const r = Math.floor(idx/SIZE), c = idx%SIZE;
  const nbrs = [];
  if(r>0) nbrs.push(idx-SIZE);
  if(r<SIZE-1) nbrs.push(idx+SIZE);
  if(c>0) nbrs.push(idx-1);
  if(c<SIZE-1) nbrs.push(idx+1);
  return nbrs;
}
function swap(a,b){ [board[a],board[b]] = [board[b],board[a]]; }
function onPieceClick(i){
  const emptyIndex = board.findIndex(p=>p.empty);
  const nbrs = getNeighbors(emptyIndex);
  if(nbrs.includes(i)){
    swap(emptyIndex,i);
    render();
    playClickTone(); // som ao mover
    if(isSolved()){ document.getElementById('puzzleToast').style.display='block'; runConfetti(60); }
  }
}
function isSolved(){ for(let i=0;i<board.length;i++){ if(board[i].index !== i) return false; } return true; }

function shuffle(times=120){
  for(let t=0;t<times;t++){
    const emptyIndex = board.findIndex(p=>p.empty);
    const neighbors = getNeighbors(emptyIndex);
    const pick = neighbors[Math.floor(Math.random()*neighbors.length)];
    swap(emptyIndex,pick);
  }
  render();
}

document.getElementById('shuffleBtn').addEventListener('click', ()=>shuffle(80));
document.getElementById('resetBtn').addEventListener('click', ()=>{ initBoard(); render(); });
document.addEventListener('keydown',(e)=>{ if(e.key==='s') shuffle(100); });

initBoard(); render(); shuffle(60);

/* ----------------- Som de clique (usar contexto separado) ----------------- */
/* Motivo: evita erro de "Cannot redeclare variable audioCtx" quando
   já existe um contexto para o ambiente. */
let clickCtx;
function playClickTone(){
  try{
    // cria contexto somente quando necessário
    if(!clickCtx) clickCtx = new (window.AudioContext||window.webkitAudioContext)();
    const o = clickCtx.createOscillator(); const g = clickCtx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(880, clickCtx.currentTime);
    g.gain.setValueAtTime(0.0001, clickCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.04, clickCtx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, clickCtx.currentTime+0.25);
    o.connect(g); g.connect(clickCtx.destination);
    o.start(); o.stop(clickCtx.currentTime+0.26);
  }catch(e){}
}

/* ----------------- Bloques secretos ----------------- */
/* Mensagens aparecem aleatoriamente ao clicar nos blocos.
   Para editar mensagens: altere o array `mensajes`.
*/
const mensajes = [
  "Te quiero<3",
  "Eres especial 🌙",
  "Gracias por existir 💕",
  "Tienes una energía mágica ✨",
  "Nunca dejes de brillar 🌟",
  "Tu sonrisa vale mil galaxias 💫",
  "Siempre hay un lugar para ti aquí 💌",
  "El mundo se siente mejor contigo 💖",
  "Eres arte en movimiento 🎨",
  "Me inspiras sin darte cuenta 🌸",
  "Tu presencia calma las tormentas 🌧️💫",
  "Eres ese tipo de persona que deja huellas bonitas 🐾",
  "Cada día mereces cosas lindas 🌷",
  "Tu forma de ser ilumina todo ✨",
  "No necesitas hacer mucho para brillar 🌠",
  "El universo sonríe cuando tú lo haces 🌌",
  "Tu corazón es un lugar seguro 💞",
  "Tienes un alma preciosa 🕊️",
  "Pequeñas cosas, grandes significados 🌻",
  "Lo haces todo con un toque de magia 🪄",
  "Nunca cambies, solo crece 💫",
  "A veces el silencio también dice te quiero 🤍",
  "Tu forma de mirar es poesía 🌙",
  "Hay paz en lo que haces 🌷",
  "Eres como un abrazo sin brazos 🤗",
  "Hay algo muy bonito en ti y no es solo tu sonrisa 🌸",
  "Tu energía se siente incluso en la distancia 🌎",
  "Eres el tipo de persona que hace bien al alma 💫",
  "No hay nadie como tú, y eso está perfecto 💕",
  "Tu luz no compite, inspira ✨",
  "El universo te mira con cariño 🌠",
  "Eres la calma en medio del caos 🌊",
  "Tu forma de hablar tiene música 🎶",
  "Hay días en que solo tú puedes hacerlos mejores 🌞",
  "Tienes un brillo que no se apaga 💫",
  "El mundo necesita más de tu bondad 💖",
  "Eres constelación y ternura 🌌",
  "Cada pequeño detalle tuyo importa 🌷",
  "Me encanta cómo ves el mundo 🪞",
  "Tu forma de existir es arte 🎨",
  "Eres mi pensamiento bonito del día 💭✨"
];
const bloquesEl = document.getElementById('bloques');
for(let i=0;i<25;i++){
  const b = document.createElement('div');
  b.className = 'bloque';
  b.addEventListener('click', ()=>{
    b.textContent = mensajes[Math.floor(Math.random()*mensajes.length)];
    b.style.background = 'linear-gradient(180deg,#a8d8ff,#cdb6ff)';
    b.style.color = '#041224';
    runConfetti(8);
  });
  bloquesEl.appendChild(b);
}

/* ----------------- Lightbox da galeria ----------------- */
document.getElementById('gallery').addEventListener('click',(e)=>{
  const a = e.target.closest('a'); if(!a) return; e.preventDefault();
  const alt = a.dataset.alt || 'Imagen';
  openLightbox(a.innerHTML,alt);
});
function openLightbox(content,alt){
  const layer = document.createElement('div');
  layer.style.position='fixed'; layer.style.inset=0; layer.style.background='rgba(2,6,23,0.75)'; layer.style.display='grid'; layer.style.placeItems='center'; layer.style.zIndex=99999;
  const box = document.createElement('div'); box.style.width='86vw'; box.style.maxWidth='520px'; box.style.borderRadius='12px'; box.style.overflow='hidden'; box.style.background='#071127'; box.innerHTML = `<div style="padding:14px 18px"><strong style="color:#b8d8ff">${alt}</strong></div><div style='width:100%;height:100%'>${content}</div>`;
  layer.appendChild(box);
  layer.addEventListener('click',()=>layer.remove());
  document.body.appendChild(layer);
}

/* ----------------- Helpers / UX ----------------- */
function showToast(msg){
  const t=document.createElement('div');
  t.textContent=msg;
  t.style.position='fixed';
  t.style.left='50%';
  t.style.transform='translateX(-50%)';
  t.style.bottom='28px';
  t.style.padding='10px 16px';
  t.style.background='linear-gradient(90deg,#fff,#fff)';
  t.style.borderRadius='10px';
  t.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';
  document.body.appendChild(t);
  setTimeout(()=>t.style.opacity=0,1800);
  setTimeout(()=>t.remove(),2300);
}

/* Smooth scroll para nav (one-page) */
document.querySelectorAll('nav a').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
  });
});

/* FIM do main.js */
