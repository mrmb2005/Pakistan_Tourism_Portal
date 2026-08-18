const StoryMode = (() => {

  const PINK       = '#e8849a';
  const PINK_DARK  = '#b85c72';
  const PINK_LIGHT = '#fdeef1';
  const PINK_MID   = '#f7d9df';

  const state = {
    active:false, currentStep:0, stops:[],
    markers:[], polyline:null, animPolyline:null, map:null
  };

  /* ── STYLES ── */
  function injectStyles() {
    if (document.getElementById('story-mode-styles')) return;
    const s = document.createElement('style');
    s.id = 'story-mode-styles';
    s.textContent = `
      @keyframes pulse-ring {
        0%   { transform:scale(0.8); opacity:1; }
        100% { transform:scale(2.8); opacity:0; }
      }
      .pulse-marker { border-radius:50%; position:relative; }
      .pulse-marker::after {
        content:''; position:absolute; inset:0; border-radius:50%;
        background:inherit; animation:pulse-ring 1.4s ease-out infinite;
      }

      /* ── Vertical right panel ── */
      #story-panel {
        position:fixed; top:50%; right:16px; transform:translateY(-50%);
        z-index:99999; display:none; flex-direction:column;
        align-items:center; gap:8px;
        font-family:Poppins,system-ui,sans-serif;
      }

      /* Name badge */
      #story-name-badge {
        background:#fff;
        border:1.5px solid ${PINK_MID};
        border-radius:14px;
        color:#1a1a1a;
        font-size:11px; font-weight:700;
        padding:8px 13px; text-align:center;
        max-width:118px; line-height:1.4;
        box-shadow:0 4px 20px rgba(184,92,114,0.18);
      }

      /* Progress dots */
      #story-dots { display:flex; flex-direction:column; gap:5px; align-items:center; }
      .story-dot {
        width:8px; height:8px; border-radius:50%;
        background:${PINK_MID}; transition:all 0.3s;
      }
      .story-dot.active {
        background:${PINK}; box-shadow:0 0 8px ${PINK};
        width:11px; height:11px;
      }
      .story-dot.done { background:rgba(232,132,154,0.4); }

      /* Stat cards */
      .story-stat-card {
        background:#fff;
        border:1.5px solid ${PINK_MID};
        border-radius:14px;
        padding:11px 12px; text-align:center;
        cursor:pointer; transition:all 0.2s;
        box-shadow:0 4px 18px rgba(184,92,114,0.13);
        width:90px; position:relative;
      }
      .story-stat-card:hover {
        border-color:${PINK};
        transform:scale(1.04);
        box-shadow:0 6px 22px rgba(184,92,114,0.25);
      }
      .story-stat-card .s-icon { font-size:16px; margin-bottom:3px; }
      .story-stat-card .s-val {
        font-size:13px; font-weight:700;
        color:${PINK_DARK}; line-height:1.2;
      }
      .story-stat-card .s-lbl {
        font-size:9px; color:#aaa; margin-top:2px;
        text-transform:uppercase; letter-spacing:0.5px;
      }

      /* Expandable detail — pops LEFT */
      .story-card-detail {
        display:none; position:absolute;
        right:106px; top:50%; transform:translateY(-50%);
        background:#fff;
        border:1.5px solid ${PINK_MID};
        border-radius:14px; padding:13px 15px;
        width:210px; font-size:11.5px; color:#555;
        line-height:1.8;
        box-shadow:0 8px 28px rgba(184,92,114,0.22);
        z-index:2; text-align:left; white-space:normal;
      }
      .story-card-detail.open { display:block; }
      .story-card-detail b { color:#1a1a1a; }
      .story-card-detail .detail-title {
        font-size:11px; font-weight:700; color:${PINK_DARK};
        margin-bottom:7px; text-transform:uppercase; letter-spacing:0.5px;
        border-bottom:1px solid ${PINK_MID}; padding-bottom:5px;
      }

      /* Nav buttons */
      .story-nav-btn {
        width:36px; height:36px; border-radius:50%;
        border:1.5px solid ${PINK_MID};
        background:#fff; color:${PINK_DARK};
        font-size:14px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition:all 0.15s;
        box-shadow:0 3px 12px rgba(184,92,114,0.15);
      }
      .story-nav-btn:hover:not(:disabled) {
        background:${PINK}; border-color:${PINK};
        color:#fff; transform:scale(1.1);
        box-shadow:0 5px 18px rgba(184,92,114,0.35);
      }
      .story-nav-btn:disabled { opacity:0.25; cursor:default; }
      .story-nav-btn.finish {
        background:linear-gradient(135deg,${PINK},${PINK_DARK});
        border-color:transparent; color:#fff;
        width:auto; border-radius:20px;
        padding:0 14px; font-size:10px; font-weight:700; height:30px;
      }

      /* Step counter */
      #story-counter {
        font-size:9px; color:${PINK_MID};
        font-family:Poppins,sans-serif; letter-spacing:0.5px;
      }

      /* Exit button */
      #story-exit-btn {
        background:${PINK_LIGHT};
        border:1.5px solid ${PINK_MID};
        border-radius:10px; color:${PINK_DARK};
        font-size:10px; font-weight:700;
        padding:5px 11px; cursor:pointer;
        font-family:Poppins,sans-serif; transition:all 0.15s;
      }
      #story-exit-btn:hover {
        background:${PINK}; color:#fff; border-color:${PINK};
      }

      /* ── Tour Launch Button — vertical pill ── */
      #story-launch-btn {
        position:fixed; top:50%; right:16px; transform:translateY(-50%);
        z-index:99998;
        background:linear-gradient(180deg,${PINK} 0%,${PINK_DARK} 100%);
        color:#fff; border:none; border-radius:50px;
        padding:16px 10px;
        font-family:Poppins,sans-serif; font-size:11px; font-weight:700;
        cursor:pointer;
        box-shadow:0 6px 24px rgba(184,92,114,0.45);
        display:none; writing-mode:vertical-rl;
        letter-spacing:1.5px; transition:all 0.2s;
      }
      #story-launch-btn:hover {
        transform:translateY(-50%) scale(1.07);
        box-shadow:0 8px 30px rgba(184,92,114,0.6);
      }

      /* ── Selector Modal ── */
      #story-selector {
        position:fixed; inset:0; z-index:100000;
        background:rgba(20,5,10,0.55);
        backdrop-filter:blur(6px);
        display:none; align-items:center; justify-content:center;
      }
      #story-selector-box {
        background:#fff;
        border:1.5px solid ${PINK_MID};
        border-radius:22px; padding:26px 28px;
        width:410px; max-width:94vw; max-height:82vh; overflow-y:auto;
        box-shadow:0 20px 60px rgba(184,92,114,0.25);
        font-family:Poppins,sans-serif;
      }
      #story-selector-box h3 { color:#1a1a1a; font-size:15px; margin-bottom:5px; }
      #story-selector-box p  { color:#aaa; font-size:11px; margin-bottom:14px; }

      .story-dest-chip {
        display:flex; align-items:center; gap:10px;
        padding:10px 13px; margin-bottom:7px;
        background:#fff;
        border:1.5px solid ${PINK_MID};
        border-radius:12px; cursor:pointer;
        transition:all 0.15s; color:#555; font-size:12px;
      }
      .story-dest-chip:hover { background:${PINK_LIGHT}; border-color:${PINK}; }
      .story-dest-chip.selected {
        background:${PINK_LIGHT}; border-color:${PINK}; color:#1a1a1a;
      }
      .chip-num {
        background:${PINK_MID}; color:${PINK_DARK};
        border-radius:50%; width:20px; height:20px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        font-size:10px; font-weight:700;
      }
      .story-dest-chip.selected .chip-num {
        background:${PINK}; color:#fff;
      }

      #story-selector-actions { display:flex; gap:10px; margin-top:16px; }
      .sel-btn {
        flex:1; padding:11px 0; border-radius:30px;
        border:1.5px solid ${PINK_MID};
        background:#fff; color:#888;
        font-family:Poppins,sans-serif; font-size:12px; font-weight:600;
        cursor:pointer; transition:all 0.15s;
      }
      .sel-btn:hover { background:${PINK_LIGHT}; color:${PINK_DARK}; border-color:${PINK}; }
      .sel-btn.primary {
        background:linear-gradient(135deg,${PINK},${PINK_DARK});
        border-color:transparent; color:#fff;
      }
      .sel-btn.primary:hover { opacity:0.88; }

      /* Tooltip on map markers */
      .story-tooltip {
        background:#fff !important;
        border:1.5px solid ${PINK_MID} !important;
        color:#1a1a1a !important;
        font-family:Poppins,sans-serif !important;
        font-size:11px !important; font-weight:600 !important;
        border-radius:8px !important;
        padding:3px 9px !important;
        box-shadow:0 4px 14px rgba(184,92,114,0.2) !important;
      }
      .story-tooltip::before { display:none !important; }
    `;
    document.head.appendChild(s);
  }

  /* ── HELPERS ── */
  function haversineKm(lat1,lng1,lat2,lng2) {
    const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function formatTime(hours) {
    if (hours<1)  return Math.round(hours*60)+' min';
    if (hours<24) { const h=Math.floor(hours),m=Math.round((hours-h)*60); return m>0?h+'h '+m+'m':h+'h'; }
    const d=Math.floor(hours/24),r=Math.round(hours%24); return r>0?d+'d '+r+'h':d+'d';
  }

  /* ── POLYLINES ── */
  function drawPolylines(stops) {
    if (state.polyline)     state.map.removeLayer(state.polyline);
    if (state.animPolyline) state.map.removeLayer(state.animPolyline);
    const ll = stops.map(s=>[s.lat,s.lng]);
    state.polyline = L.polyline(ll,{color:PINK_MID,weight:2.5,dashArray:'8,8'}).addTo(state.map);
    state.animPolyline = L.polyline([],{color:PINK,weight:4,opacity:0.9,lineJoin:'round'}).addTo(state.map);
  }
  function extendPolylineTo(idx) {
    if (state.animPolyline)
      state.animPolyline.setLatLngs(state.stops.slice(0,idx+1).map(s=>[s.lat,s.lng]));
  }
  function animatePolylineSegment(from,to,onDone) {
    if (!state.animPolyline) return;
    const steps=40; let i=0;
    const base=state.animPolyline.getLatLngs();
    const iv=setInterval(()=>{
      i++; const t=i/steps;
      state.animPolyline.setLatLngs([...base,[from.lat+(to.lat-from.lat)*t, from.lng+(to.lng-from.lng)*t]]);
      if(i>=steps){ clearInterval(iv); state.animPolyline.setLatLngs([...base,[to.lat,to.lng]]); if(onDone)onDone(); }
    },60);
  }

  /* ── MARKERS ── */
  function refreshPulseMarkers(activeIdx) {
    state.markers.forEach(m=>state.map.removeLayer(m)); state.markers=[];
    state.stops.forEach((stop,i)=>{
      const active=i===activeIdx;
      const color = active ? PINK : (i<activeIdx ? 'rgba(232,132,154,0.4)' : PINK_MID);
      const size  = active ? 18 : 10;
      const icon  = L.divIcon({
        html:`<div class="pulse-marker" style="width:${size}px;height:${size}px;background:${color}"></div>`,
        className:'', iconSize:[size,size], iconAnchor:[size/2,size/2]
      });
      state.markers.push(L.marker([stop.lat,stop.lng],{icon,zIndexOffset:active?1000:0}).addTo(state.map));
    });
  }

  /* ── DOTS ── */
  function updateDots(activeIdx) {
    const c=document.getElementById('story-dots'); if(!c) return; c.innerHTML='';
    state.stops.forEach((_,i)=>{
      const d=document.createElement('div');
      d.className='story-dot'+(i===activeIdx?' active':i<activeIdx?' done':'');
      c.appendChild(d);
    });
  }

  /* ── DETAIL TOGGLE ── */
  const openDetail={dist:false,time:false};
  function toggleDetail(key) {
    openDetail[key]=!openDetail[key];
    document.getElementById('detail-'+key).classList.toggle('open',openDetail[key]);
    const other=key==='dist'?'time':'dist';
    openDetail[other]=false;
    document.getElementById('detail-'+other).classList.remove('open');
  }

  /* ── GO TO STEP ── */
  function goToStep(index) {
    if (index<0||index>=state.stops.length) return;
    state.currentStep=index;
    const stop=state.stops[index];
    state.map.flyTo([stop.lat,stop.lng],11,{animate:true,duration:3.2});
    if (index>0) {
      animatePolylineSegment(state.stops[index-1],stop,()=>refreshPulseMarkers(index));
    } else {
      refreshPulseMarkers(index); extendPolylineTo(index);
    }
    updateDots(index);
    document.getElementById('story-name-badge').textContent='📍 '+stop.name;

    let totalKm=0;
    for(let j=0;j<index;j++)
      totalKm+=haversineKm(state.stops[j].lat,state.stops[j].lng,state.stops[j+1].lat,state.stops[j+1].lng);
    const totalTimeStr=formatTime(totalKm/65);

    document.getElementById('sv-dist').textContent=totalKm.toFixed(0)+' km';
    document.getElementById('sv-time').textContent=totalTimeStr;
    document.getElementById('detail-dist-body').innerHTML=
      'Total covered: <b>'+totalKm.toFixed(0)+' km</b><br>Avg speed: <b>65 km/h</b><br>Stops: <b>'+(index+1)+' / '+state.stops.length+'</b>';
    document.getElementById('detail-time-body').innerHTML=
      'Total time: <b>'+totalTimeStr+'</b><br>Distance: <b>'+totalKm.toFixed(0)+' km</b><br>Stop: <b>'+(index+1)+' of '+state.stops.length+'</b>';

    ['dist','time'].forEach(k=>{ openDetail[k]=false; const el=document.getElementById('detail-'+k); if(el)el.classList.remove('open'); });
    document.getElementById('story-counter').textContent=(index+1)+' / '+state.stops.length;

    const prev=document.getElementById('story-btn-prev');
    const next=document.getElementById('story-btn-next');
    prev.disabled=index===0;
    if(index===state.stops.length-1){next.className='story-nav-btn finish';next.textContent='✅ Done';}
    else{next.className='story-nav-btn';next.textContent='▶';}
  }

  /* ── OVERVIEW ── */
  function showOverview() {
    const bounds=L.latLngBounds(state.stops.map(s=>[s.lat,s.lng]));
    state.map.flyToBounds(bounds.pad(0.3),{animate:true,duration:2.5});
    state.markers.forEach(m=>state.map.removeLayer(m)); state.markers=[];
    state.stops.forEach((stop,i)=>{
      const icon=L.divIcon({
        html:'<div style="background:'+PINK+';color:#fff;font-family:Poppins,sans-serif;'+
          'font-size:12px;font-weight:700;width:26px;height:26px;border-radius:50%;'+
          'display:flex;align-items:center;justify-content:center;'+
          'box-shadow:0 3px 12px rgba(184,92,114,0.4);border:2px solid #fff">'+(i+1)+'</div>',
        className:'', iconSize:[26,26], iconAnchor:[13,13]
      });
      state.markers.push(L.marker([stop.lat,stop.lng],{icon})
        .addTo(state.map)
        .bindTooltip(stop.name,{permanent:true,direction:'top',offset:[0,-16],className:'story-tooltip'}));
    });
    document.getElementById('story-name-badge').textContent='🗺️ Tour Overview';
    document.getElementById('sv-dist').textContent='—';
    document.getElementById('sv-time').textContent='—';
    document.getElementById('story-counter').textContent='Overview';
    const prev=document.getElementById('story-btn-prev');
    const next=document.getElementById('story-btn-next');
    prev.disabled=false;
    next.className='story-nav-btn finish'; next.textContent='✅ Done';
    next.onclick=()=>stopTour();
    prev.onclick=()=>{ next.onclick=()=>StoryMode.next(); prev.onclick=()=>StoryMode.prev(); goToStep(state.stops.length-1); };
  }

  /* ── START / STOP ── */
  function startTour(stops) {
    if(stops.length<2){alert('Select at least 2 destinations.');return;}
    state.stops=stops; state.active=true;
    closeSelector(); drawPolylines(stops);
    document.getElementById('story-panel').style.display='flex';
    document.getElementById('story-launch-btn').style.display='none';
    goToStep(0);
  }
  function stopTour() {
    state.active=false;
    if(state.polyline)     state.map.removeLayer(state.polyline);
    if(state.animPolyline) state.map.removeLayer(state.animPolyline);
    state.markers.forEach(m=>state.map.removeLayer(m)); state.markers=[];
    document.getElementById('story-panel').style.display='none';
    document.getElementById('story-launch-btn').style.display='block';
    state.map.flyTo([30.3753,69.3451],5,{animate:true,duration:2});
  }

  /* ── PANEL ── */
  function buildPanel() {
    const panel=document.createElement('div'); panel.id='story-panel';
    panel.innerHTML=`
      <button id="story-exit-btn" onclick="StoryMode.stop()">✕ EXIT</button>
      <div id="story-name-badge">—</div>
      <div id="story-dots"></div>

      <div class="story-stat-card" onclick="StoryMode.toggleDetail('dist')">
        <div class="s-icon">📏</div>
        <div class="s-val" id="sv-dist">—</div>
        <div class="s-lbl">Distance</div>
        <div class="story-card-detail" id="detail-dist">
          <div class="detail-title">📏 Distance</div>
          <div id="detail-dist-body">—</div>
        </div>
      </div>

      <div class="story-stat-card" onclick="StoryMode.toggleDetail('time')">
        <div class="s-icon">⏱️</div>
        <div class="s-val" id="sv-time">—</div>
        <div class="s-lbl">Drive Time</div>
        <div class="story-card-detail" id="detail-time">
          <div class="detail-title">⏱️ Time Estimate</div>
          <div id="detail-time-body">—</div>
        </div>
      </div>

      <button class="story-nav-btn" id="story-btn-prev" onclick="StoryMode.prev()">◀</button>
      <button class="story-nav-btn" id="story-btn-next" onclick="StoryMode.next()">▶</button>
      <div id="story-counter">1 / 1</div>
    `;
    document.body.appendChild(panel);
  }

  /* ── LAUNCH BUTTON ── */
  function buildLaunchButton() {
    const btn=document.createElement('button'); btn.id='story-launch-btn';
    btn.textContent='🎬 Tour'; btn.onclick=openSelector;
    document.body.appendChild(btn);
    const mapEl=document.getElementById('map-section');
    if(mapEl) new IntersectionObserver(entries=>{
      if(!state.active) btn.style.display=entries[0].isIntersecting?'block':'none';
    },{threshold:0.1}).observe(mapEl);
  }

  /* ── SELECTOR ── */
  let selectionOrder=[];
  function buildSelectorModal(destinations) {
    const old=document.getElementById('story-selector'); if(old) old.remove();
    const modal=document.createElement('div'); modal.id='story-selector';
    modal.innerHTML=`
      <div id="story-selector-box">
        <h3>🗺️ Start Guided Tour</h3>
        <p>Tap destinations in the order you want to visit them. Min 2 required.</p>
        <div id="story-dest-list"></div>
        <div id="story-selector-actions">
          <button class="sel-btn" onclick="StoryMode.closeSelector()">Cancel</button>
          <button class="sel-btn primary" onclick="StoryMode.startFromSelection()">🚀 Start Tour</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const list=document.getElementById('story-dest-list');
    destinations.forEach(dest=>{
      if(!dest.latitude||!dest.longitude) return;
      const chip=document.createElement('div');
      chip.className='story-dest-chip';
      chip.dataset.destId=dest.destination_id||dest.name;
      chip.dataset.lat=dest.latitude; chip.dataset.lng=dest.longitude;
      chip.dataset.name=dest.name; chip.dataset.desc=dest.description||'';
      chip.innerHTML='<div class="chip-num">–</div><span>📍 '+dest.name+'</span>';
      chip.addEventListener('click',()=>toggleChip(chip));
      list.appendChild(chip);
    });
  }

  function toggleChip(chip) {
    const id=chip.dataset.destId, idx=selectionOrder.indexOf(id);
    if(idx===-1){selectionOrder.push(id);chip.classList.add('selected');}
    else{selectionOrder.splice(idx,1);chip.classList.remove('selected');}
    document.querySelectorAll('.story-dest-chip').forEach(c=>{
      const i=selectionOrder.indexOf(c.dataset.destId);
      c.querySelector('.chip-num').textContent=i===-1?'–':(i+1);
    });
  }
  function openSelector() {
    selectionOrder=[];
    document.querySelectorAll('.story-dest-chip').forEach(c=>{
      c.classList.remove('selected'); c.querySelector('.chip-num').textContent='–';
    });
    document.getElementById('story-selector').style.display='flex';
  }
  function closeSelector() { const el=document.getElementById('story-selector'); if(el)el.style.display='none'; }
  function startFromSelection() {
    if(selectionOrder.length<2){alert('Please select at least 2 destinations.');return;}
    const stopMap={};
    document.querySelectorAll('.story-dest-chip').forEach(c=>{stopMap[c.dataset.destId]=c;});
    startTour(selectionOrder.map(id=>{
      const c=stopMap[id];
      return{name:c.dataset.name,lat:parseFloat(c.dataset.lat),lng:parseFloat(c.dataset.lng),description:c.dataset.desc};
    }));
  }

  /* ── INIT ── */
  function init() {
    state.map=window.map;
    if(!state.map){console.error('[StoryMode] window.map not ready');return;}
    injectStyles(); buildPanel(); buildLaunchButton();
    const setup=dests=>{buildSelectorModal(dests);console.log('[StoryMode] Ready —',dests.length,'destinations');};
    if(window.destinations&&window.destinations.length>0) setup(window.destinations);
    else window.addEventListener('apiDataLoaded',()=>setup(window.destinations||[]));
  }

  return {
    init, stop:stopTour,
    next(){if(state.currentStep<state.stops.length-1)goToStep(state.currentStep+1);else stopTour();},
    prev(){if(state.currentStep>0)goToStep(state.currentStep-1);},
    toggleDetail, openSelector, closeSelector, startFromSelection
  };
})();

(function waitForMap(){
  if(window.map&&typeof L!=='undefined') StoryMode.init();
  else setTimeout(waitForMap,300);
}());