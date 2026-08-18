const GISLayers = (() => {

  const PINK       = '#e8849a';
  const PINK_DARK  = '#b85c72';
  const PINK_LIGHT = '#fdeef1';
  const PINK_MID   = '#f7d9df';

  const state = {
    map: null, initialized: false,
    layers: {
      popularity: { leafletLayer:null, active:false, data:[] },
      crime:      { leafletLayer:null, active:false, data:[] },
      accidents:  { leafletLayer:null, active:false, data:[] }
    }
  };

  const HEAT = {
    crime:     { radius:55, blur:40, maxZoom:18, minOpacity:0.3,
                 gradient:{ 0.1:'#ffe0e0', 0.3:'#ff9999', 0.6:'#ff3333', 0.85:'#cc0000', 1.0:'#7f0000' } },
    accidents: { radius:55, blur:40, maxZoom:18, minOpacity:0.3,
                 gradient:{ 0.1:'#fff3e0', 0.3:'#ffcc80', 0.6:'#ff9800', 0.85:'#e65100', 1.0:'#7f3000' } }
  };

  function cap(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : '—'; }
  function popRadius(i) { return 10 + Math.round(i * 28); }
  function popColor(i) {
    if (i>=0.8) return { fill:'#00843d', stroke:'#005c2a' };
    if (i>=0.6) return { fill:'#33a85f', stroke:'#1d7a41' };
    if (i>=0.4) return { fill:'#7bc67a', stroke:'#4d9e4d' };
    return             { fill:'#b8e0b8', stroke:'#7ab87a' };
  }

  /* Reusable popup builder */
  function mkPopup(hdrBg, accent, emoji, title, rowsHtml, footer, extra) {
    return '<div style="font-family:Poppins,sans-serif;min-width:210px;padding:2px">' +
      '<div style="background:'+hdrBg+';border-left:4px solid '+accent+';border-radius:10px;padding:9px 12px;margin-bottom:9px">' +
      '<b style="font-size:13px;color:#1a1a1a">'+emoji+' '+title+'</b></div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse">'+rowsHtml+'</table>' +
      (extra||'') +
      (footer ? '<div style="margin-top:8px;font-size:11px;color:#888;border-top:1px solid '+PINK_MID+';padding-top:6px">'+footer+'</div>' : '') +
      '</div>';
  }
  function mkRow(lbl, val, badgeBg, badgeColor) {
    const v = badgeBg
      ? '<span style="background:'+badgeBg+';color:'+badgeColor+';padding:2px 8px;border-radius:10px;font-size:11px">'+val+'</span>'
      : val;
    return '<tr><td style="color:#666;padding:3px 0">'+lbl+'</td><td style="text-align:right;font-weight:600;color:#1a1a1a">'+v+'</td></tr>';
  }

  /* ── FETCH ── */
  async function fetchAllLayers() {
    const B = 'http://localhost:5000/api/gis';
    try {
      const [pR,cR,aR] = await Promise.all([
        fetch(B+'/popularity').then(r=>r.json()),
        fetch(B+'/crime').then(r=>r.json()),
        fetch(B+'/accidents').then(r=>r.json())
      ]);
      if (pR.success) state.layers.popularity.data = pR.data;
      if (cR.success) state.layers.crime.data      = cR.data;
      if (aR.success) state.layers.accidents.data  = aR.data;
    } catch(e) { console.error('[GIS] Fetch failed:',e); }
  }

  /* ── POPULARITY ── */
  function buildPopularityLayer() {
    const group = L.layerGroup();
    state.layers.popularity.data.forEach(pt => {
      const clr = popColor(pt.intensity);
      let lvl = 'Low';
      if (pt.intensity>=0.8) lvl='Very High';
      else if (pt.intensity>=0.6) lvl='High';
      else if (pt.intensity>=0.4) lvl='Medium';

      const circle = L.circleMarker([pt.lat,pt.lng],{
        radius:popRadius(pt.intensity), fillColor:clr.fill,
        color:clr.stroke, weight:2, opacity:1, fillOpacity:0.72
      });

      const key = pt.name.replace(/\s/g,'_');
      const nearbyHtml =
        '<div style="margin-top:9px;padding-top:8px;border-top:1px solid '+PINK_MID+'">' +
        '<div style="font-size:11px;font-weight:700;color:'+PINK_DARK+';margin-bottom:3px">🚨 Nearby Crime</div>' +
        '<div id="nc-'+key+'" style="font-size:11px;color:#888">Loading…</div>' +
        '<div style="font-size:11px;font-weight:700;color:#e65100;margin:6px 0 3px">⚠️ Nearby Accidents</div>' +
        '<div id="na-'+key+'" style="font-size:11px;color:#888">Loading…</div></div>';

      const rows =
        mkRow('Visits', Number(pt.visits).toLocaleString()) +
        mkRow('Score',  (pt.intensity*100).toFixed(0)+'%') +
        mkRow('Level',  lvl, '#fdeef1', PINK_DARK) +
        mkRow('Season', cap(pt.season));

      circle.bindPopup(mkPopup('#fdeef1', PINK, '🌟', pt.name, rows, null, nearbyHtml), {maxWidth:270});

      circle.on('popupopen', () => {
        const r = 0.5;
        const nc = state.layers.crime.data.filter(c=>Math.abs(c.lat-pt.lat)<r&&Math.abs(c.lng-pt.lng)<r);
        const na = state.layers.accidents.data.filter(a=>Math.abs(a.lat-pt.lat)<r&&Math.abs(a.lng-pt.lng)<r);
        const cel = document.getElementById('nc-'+key);
        const ael = document.getElementById('na-'+key);
        if (cel) cel.innerHTML = nc.length===0
          ? '<span style="color:#2e7d32">✅ No incidents nearby</span>'
          : nc.length+' nearby · Avg sev: <b>'+(nc.reduce((s,c)=>s+c.intensity,0)/nc.length*100).toFixed(0)+'%</b>';
        if (ael) ael.innerHTML = na.length===0
          ? '<span style="color:#2e7d32">✅ No accidents nearby</span>'
          : na.length+' nearby · Casualties: <b>'+na.reduce((s,a)=>s+a.casualties,0)+'</b>';
      });

      group.addLayer(circle);
    });
    return group;
  }

  /* ── CRIME ── */
  function buildCrimeLayer() {
    const group=L.layerGroup(), heat=[];
    state.layers.crime.data.forEach(pt => {
      heat.push([pt.lat,pt.lng,pt.intensity]);
      let lvl='Low Risk';
      if (pt.intensity>=0.7) lvl='High Risk';
      else if (pt.intensity>=0.4) lvl='Medium Risk';
      const dot = L.circleMarker([pt.lat,pt.lng],{radius:5,fillColor:'#cc0000',color:'#7f0000',weight:1,opacity:0.9,fillOpacity:0.85});
      const rows = mkRow('Area',pt.area||'Unknown')+mkRow('Type',cap(pt.type))+
        mkRow('Severity',(pt.intensity*100).toFixed(0)+'%')+mkRow('Risk',lvl,'#ffebee','#c62828')+mkRow('Date',pt.date);
      dot.bindPopup(mkPopup('#ffebee','#cc0000','🚨','Crime Incident',rows,pt.description));
      group.addLayer(dot);
    });
    if (heat.length && typeof L.heatLayer!=='undefined') group.addLayer(L.heatLayer(heat,HEAT.crime));
    return group;
  }

  /* ── ACCIDENTS ── */
  function buildAccidentsLayer() {
    const group=L.layerGroup(), heat=[];
    state.layers.accidents.data.forEach(pt => {
      heat.push([pt.lat,pt.lng,pt.intensity]);
      let lvl='Minor';
      if (pt.intensity>=0.7) lvl='Severe';
      else if (pt.intensity>=0.4) lvl='Moderate';
      const dot = L.circleMarker([pt.lat,pt.lng],{radius:5+Math.min(pt.casualties,5),fillColor:'#e65100',color:'#bf360c',weight:1,opacity:0.9,fillOpacity:0.85});
      const rows = mkRow('Area',pt.area||'Unknown')+mkRow('Type',cap(pt.type))+
        mkRow('Severity',(pt.intensity*100).toFixed(0)+'%')+mkRow('Casualties',pt.casualties)+
        mkRow('Class',lvl,'#fff3e0','#e65100')+mkRow('Date',pt.date);
      dot.bindPopup(mkPopup('#fff3e0','#e65100','⚠️','Accident Report',rows,pt.description));
      group.addLayer(dot);
    });
    if (heat.length && typeof L.heatLayer!=='undefined') group.addLayer(L.heatLayer(heat,HEAT.accidents));
    return group;
  }

  /* ── TOGGLE ── */
  function toggleLayer(name) {
    const info = state.layers[name];
    if (info.active) { state.map.removeLayer(info.leafletLayer); info.active=false; }
    else {
      if (!info.leafletLayer) {
        if (name==='popularity') info.leafletLayer=buildPopularityLayer();
        if (name==='crime')      info.leafletLayer=buildCrimeLayer();
        if (name==='accidents')  info.leafletLayer=buildAccidentsLayer();
      }
      info.leafletLayer.addTo(state.map);
      info.active=true;
    }
    refreshBtn(name);
    refreshLegend();
  }

  /* ── BUTTON STYLE ── */
  const BTN_META = {
    popularity:{ onBg:PINK,      icon:'🌟', label:'Popularity' },
    crime:     { onBg:'#cc0000', icon:'🚨', label:'Crime Risk'  },
    accidents: { onBg:'#e65100', icon:'⚠️', label:'Accidents'   }
  };
  function refreshBtn(name) {
    const btn = document.getElementById('gis-btn-'+name);
    if (!btn) return;
    const on = state.layers[name].active;
    const m  = BTN_META[name];
    btn.style.background  = on ? m.onBg : '#fff';
    btn.style.color       = on ? '#fff'  : m.onBg;
    btn.style.borderColor = on ? m.onBg  : PINK_MID;
    btn.style.boxShadow   = on ? '0 3px 12px rgba(184,92,114,0.3)' : 'none';
    btn.innerHTML = m.icon+' '+m.label+
      '<span style="float:right;font-size:10px;margin-top:1px;opacity:0.85">'+(on?'ON ●':'OFF ○')+'</span>';
  }

  /* ── LEGEND ── */
  function refreshLegend() {
    const el = document.getElementById('gis-legend');
    if (!el) return;
    const any = Object.values(state.layers).some(l=>l.active);
    if (!any) { el.style.display='none'; return; }
    el.style.display='block';

    let h = '<div style="font-weight:700;font-size:12px;color:'+PINK_DARK+';' +
      'border-bottom:2px solid '+PINK_MID+';padding-bottom:7px;margin-bottom:10px">Map Legend</div>';

    if (state.layers.popularity.active) {
      h += '<div style="font-size:11px;font-weight:600;color:'+PINK_DARK+';margin-bottom:6px">🌟 Popularity (circle size = visits)</div>';
      [['#00843d','Very High (≥ 80%)'],['#33a85f','High (60–79%)'],
       ['#7bc67a','Medium (40–59%)'],  ['#b8e0b8','Low (< 40%)']].forEach(([c,l]) => {
        h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">' +
          '<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="'+c+'" stroke="#ccc" stroke-width="1"/></svg>' +
          '<span style="font-size:11px;color:#333">'+l+'</span></div>';
      });
    }
    if (state.layers.crime.active) {
      h += '<div style="font-size:11px;font-weight:600;color:#cc0000;margin:9px 0 6px">🚨 Crime (heatmap)</div>';
      [['#7f0000','Very High (≥ 85%)'],['#cc0000','High (60–84%)'],
       ['#ff9999','Medium (30–59%)'],  ['#ffe0e0','Low (< 30%)']].forEach(([c,l]) => {
        h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">' +
          '<div style="width:20px;height:12px;background:'+c+';border-radius:3px;border:1px solid #eee;flex-shrink:0"></div>' +
          '<span style="font-size:11px;color:#333">'+l+'</span></div>';
      });
    }
    if (state.layers.accidents.active) {
      h += '<div style="font-size:11px;font-weight:600;color:#e65100;margin:9px 0 6px">⚠️ Accidents (heatmap)</div>';
      [['#7f3000','Severe (≥ 85%)'],   ['#e65100','Moderate (60–84%)'],
       ['#ffcc80','Minor (30–59%)'],   ['#fff3e0','Very Low (< 30%)']].forEach(([c,l]) => {
        h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">' +
          '<div style="width:20px;height:12px;background:'+c+';border-radius:3px;border:1px solid #eee;flex-shrink:0"></div>' +
          '<span style="font-size:11px;color:#333">'+l+'</span></div>';
      });
    }
    el.innerHTML = h;
  }

  /* ── INJECT UI ── */
  function injectUI() {
    const style=document.createElement('style');
    style.textContent=
      '#gis-panel{position:fixed;bottom:28px;left:18px;z-index:99999;display:none;' +
        'background:#fff;border:1.5px solid '+PINK_MID+';border-radius:18px;color:#1a1a1a;' +
        'font-family:Poppins,system-ui,sans-serif;font-size:13px;' +
        'box-shadow:0 8px 32px rgba(184,92,114,0.18);min-width:225px;overflow:hidden}'+
      '#gis-panel-head{display:flex;justify-content:space-between;align-items:center;' +
        'padding:12px 16px;background:'+PINK_LIGHT+';border-bottom:1.5px solid '+PINK_MID+'}'+
      '#gis-panel-body{padding:12px 12px 14px;display:flex;flex-direction:column;gap:8px}'+
      '.gis-lyr-btn{width:100%;padding:9px 14px;border-radius:20px;border:1.5px solid '+PINK_MID+';'+
        'cursor:pointer;font-size:12px;font-weight:600;transition:all 0.18s;text-align:left;'+
        'font-family:Poppins,sans-serif;background:#fff;color:'+PINK_DARK+'}'+
      '.gis-lyr-btn:hover{transform:translateX(3px);border-color:'+PINK+';box-shadow:0 2px 10px rgba(184,92,114,0.18)}'+
      '#gis-sep{border:none;border-top:1px solid '+PINK_MID+';margin:3px 0}'+
      '#gis-panel-counts{font-size:11px;color:#888;line-height:2.1;padding:0 2px}'+
      '#gis-collapse-x{background:none;border:none;color:'+PINK_DARK+';cursor:pointer;font-size:16px;padding:0 3px;font-weight:700}'+
      '#gis-legend{position:fixed;bottom:28px;right:18px;z-index:99999;display:none;'+
        'background:#fff;border:1.5px solid '+PINK_MID+';border-radius:18px;'+
        'padding:16px 18px;min-width:215px;font-family:Poppins,system-ui,sans-serif;'+
        'box-shadow:0 8px 32px rgba(184,92,114,0.18);max-height:75vh;overflow-y:auto}'+
      '';
    document.head.appendChild(style);

    const panel=document.createElement('div'); panel.id='gis-panel';
    panel.innerHTML=
      '<div id="gis-panel-head">'+
        '<span style="font-weight:700;font-size:12px;color:'+PINK_DARK+';letter-spacing:0.3px">🗺️ GIS Layers</span>'+
        '<button id="gis-collapse-x" onclick="var b=document.getElementById(\'gis-panel-body\');'+
          'b.style.display=b.style.display===\'none\'?\'flex\':\'none\';'+
          'this.textContent=this.textContent===\'▼\'?\'▲\':\'▼\'">▼</button>'+
      '</div>'+
      '<div id="gis-panel-body" style="display:none">'+
        '<button class="gis-lyr-btn" id="gis-btn-popularity" onclick="GISLayers.toggle(\'popularity\')">🌟 Popularity <span style="float:right;font-size:10px">OFF ○</span></button>'+
        '<button class="gis-lyr-btn" id="gis-btn-crime"      onclick="GISLayers.toggle(\'crime\')">🚨 Crime Risk <span style="float:right;font-size:10px">OFF ○</span></button>'+
        '<button class="gis-lyr-btn" id="gis-btn-accidents"  onclick="GISLayers.toggle(\'accidents\')">⚠️ Accidents <span style="float:right;font-size:10px">OFF ○</span></button>'+
        '<hr id="gis-sep">'+
        '<div id="gis-panel-counts">Loading…</div>'+
      '</div>';
    document.body.appendChild(panel);

    const legend=document.createElement('div'); legend.id='gis-legend';
    document.body.appendChild(legend);

    const mapEl=document.getElementById('map-section')||document.getElementById('map');
    if(mapEl) {
      new IntersectionObserver(entries=>{
        const vis=entries[0].isIntersecting;
        panel.style.display=vis?'block':'none';
        if(!vis) legend.style.display='none';
      },{threshold:0.1}).observe(mapEl);
    }

    ['popularity','crime','accidents'].forEach(refreshBtn);
    const counts=document.getElementById('gis-panel-counts');
    if(counts) counts.innerHTML=
      '🌟 '+state.layers.popularity.data.length+' destinations<br>'+
      '🚨 '+state.layers.crime.data.length+' crime reports<br>'+
      '⚠️ '+state.layers.accidents.data.length+' accident records';

  }

  async function init() {
    if(state.initialized) return;
    state.map=window.map;
    if(!state.map){console.error('[GIS] window.map not ready');return;}
    state.initialized=true;
    await fetchAllLayers();
    injectUI();
    console.log('[GIS] Ready ✓');
  }

  function toggle(name){if(state.layers[name])toggleLayer(name);}
  return {init,toggle};
})();

(function waitForMap(){
  if(window.map&&typeof L!=='undefined'&&typeof L.heatLayer!=='undefined') GISLayers.init();
  else setTimeout(waitForMap,300);
}());