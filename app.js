const PLAYER_NAMES = [
  'Benji P','Alex','Max M','Toby','Cameron A','Lucas A','Adam','Elliot','Cameron H','Cade','James','Joshua','Lucas R','Liam','Hugh','Max G'
];

const playersContainer = document.getElementById('players');
const playerTpl = document.getElementById('playerTpl');
const pitch = document.getElementById('pitch');
const gkZone = document.getElementById('slot-gk');


function makePlayer(name){
  const el = playerTpl.content.firstElementChild.cloneNode(true);
  el.querySelector('.name').textContent = name;
  el.dataset.name = name;
  const img = el.querySelector('.icon');
  if(img) img.src = 'assets/playerIcon.png';
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragend', onDragEnd);
  return el;
}

function populatePlayers(){
  playersContainer.innerHTML = '';
  PLAYER_NAMES.forEach(name=>{
    playersContainer.appendChild(makePlayer(name));
  });
}

let dragged=null;
function onDragStart(e){
  dragged = this;
  e.dataTransfer.setData('text/plain', this.dataset.name);
  setTimeout(()=>this.classList.add('dragging'), 0);
}
function onDragEnd(){
  dragged && dragged.classList.remove('dragging');
  dragged = null;
}

function allowDrop(e){ e.preventDefault(); }

function onDragEnter(e){ e.currentTarget.classList.add('drag-over'); }
function onDragLeave(e){ e.currentTarget.classList.remove('drag-over'); }

function setupSlots(){
  const subs = document.getElementById('players');
  subs.addEventListener('dragover', allowDrop);
  subs.addEventListener('drop', onDropToSubs);

  // pitch accepts drops anywhere for free placement
  pitch.addEventListener('dragover', allowDrop);
  pitch.addEventListener('drop', onDropToPitch);

  // allow GK zone styling on enter/leave
  gkZone.addEventListener('dragenter', onDragEnter);
  gkZone.addEventListener('dragleave', onDragLeave);
  gkZone.addEventListener('drop', onDropToPitch);
}

function onDropToSubs(e){
  e.preventDefault();
  if(!dragged) return;
  // remove on-pitch positioning
  dragged.classList.remove('on-pitch');
  dragged.style.left = '';
  dragged.style.top = '';
  delete dragged.dataset.role;
  playersContainer.appendChild(dragged);
  saveFormation();
}

function onDropToPitch(e){
  e.preventDefault();
  if(!dragged) return;
  const rect = pitch.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  // ensure max 11 players on pitch
  const onPitchCount = pitch.querySelectorAll('.player').length;
  // if dragging a player already on pitch, don't count them twice
  const isAlreadyOnPitch = dragged.parentElement === pitch;
  const totalIfPlaced = onPitchCount + (isAlreadyOnPitch ? 0 : 1);
  if(totalIfPlaced > 11){ alert('Only 11 players allowed on the pitch (10 outfield + 1 GK).'); return; }

  // if dropping into GK zone, assign role
  const gkRect = gkZone.getBoundingClientRect();
  const inGk = (e.clientX >= gkRect.left && e.clientX <= gkRect.right && e.clientY >= gkRect.top && e.clientY <= gkRect.bottom);
  if(inGk){
    // enforce single GK: move existing GK (if any) to subs
    const existingGK = pitch.querySelector('.player[data-role="gk"]');
    if(existingGK && existingGK !== dragged){ playersContainer.appendChild(existingGK); existingGK.classList.remove('on-pitch'); existingGK.style.left=''; existingGK.style.top=''; delete existingGK.dataset.role; }
    dragged.dataset.role = 'gk';
  } else {
    delete dragged.dataset.role;
  }

  // place on pitch, then compute snapping/clamping based on element size
  dragged.classList.add('on-pitch');
  pitch.appendChild(dragged);

  // compute element half-size for clamping
  const elRect = dragged.getBoundingClientRect();
  const halfW = elRect.width/2;
  const halfH = elRect.height/2;

  // if dropped in GK zone, center in GK area
  let targetX = rawX;
  let targetY = rawY;
  if(inGk){
    targetX = (gkRect.left + gkRect.right)/2 - rect.left;
    targetY = (gkRect.top + gkRect.bottom)/2 - rect.top;
  }

  // snap to grid
  const GRID = 40;
  let snappedX = Math.round(targetX / GRID) * GRID;
  let snappedY = Math.round(targetY / GRID) * GRID;

  // clamp so player remains inside pitch boundaries
  snappedX = Math.max(halfW, Math.min(rect.width - halfW, snappedX));
  snappedY = Math.max(halfH, Math.min(rect.height - halfH, snappedY));

  dragged.style.left = snappedX + 'px';
  dragged.style.top = snappedY + 'px';
  saveFormation();
}

function resetFormation(){
  // move all players back to substitutes and clear positioning
  const pitchPlayers = Array.from(pitch.querySelectorAll('.player'));
  pitchPlayers.forEach(p=>{
    p.classList.remove('on-pitch');
    p.style.left=''; p.style.top=''; delete p.dataset.role;
    playersContainer.appendChild(p);
  });
  localStorage.removeItem('formation');
}

function saveFormation(){
  const placed = Array.from(pitch.querySelectorAll('.player')).map(p=>({
    name: p.dataset.name,
    left: p.style.left,
    top: p.style.top,
    role: p.dataset.role || null
  }));
  const subs = Array.from(playersContainer.querySelectorAll('.player')).map(p=>p.dataset.name);
  localStorage.setItem('formation', JSON.stringify({placed, subs}));
}

function loadFormation(){
  const raw = localStorage.getItem('formation');
  if(!raw) return false;
  const mapping = JSON.parse(raw);
  populatePlayers();
  // place players on pitch
  if(Array.isArray(mapping.placed)){
    mapping.placed.forEach(item=>{
      const p = Array.from(document.querySelectorAll('.player')).find(x=>x.dataset.name===item.name);
      if(p){
        p.classList.add('on-pitch');
        p.style.left = item.left || '';
        p.style.top = item.top || '';
        if(item.role) p.dataset.role = item.role;
        pitch.appendChild(p);
      }
    });
  }
  // arrange substitutes order
  if(Array.isArray(mapping.subs)){
    mapping.subs.forEach(name=>{
      const p = Array.from(document.querySelectorAll('.player')).find(x=>x.dataset.name===name);
      if(p) playersContainer.appendChild(p);
    });
  }
  return true;
}

// formation-specific behaviour removed: placements are now free-form on the pitch

document.getElementById('resetBtn').addEventListener('click', ()=>{ if(confirm('Reset formation?')) resetFormation(); });
document.getElementById('saveBtn').addEventListener('click', ()=>{ saveFormation(); alert('Saved'); });

// initialization
populatePlayers();
setupSlots();
loadFormation();
