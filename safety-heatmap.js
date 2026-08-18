/**
 * safety-heatmap.js  (v2 — fixed card badges + info modal)
 * ─────────────────────────────────────────────────────────
 * - Scores every destination 0-100 (higher = safer)
 * - Adds coloured pins + heatmap on the map
 * - Adds a clean 🛡️ badge in the top-left of each card IMAGE (not over buttons)
 * - Clicking the badge opens a detailed Safety Info modal
 * - Safety Rankings side-panel on the map
 * - Toggle button inside existing GIS Layers panel
 */

const SafetyHeatmap = (() => {

  const PINK       = '#e8849a';
  const PINK_DARK  = '#b85c72';
  const PINK_LIGHT = '#fdeef1';
  const PINK_MID   = '#f7d9df';

  const W      = { crime: 0.55, accident: 0.45 };
  const RADIUS = 0.38;  // ~40 km in decimal degrees

  const state = {
    ready       : false,
    visible     : false,
    accidents   : [],
    crime       : [],
    destMarkers : [],   // {score, name, lat, lng, data}
    heatLayer   : null,
    safeLayer   : null,
  };

  /* ─── colour ramp ─── */
  function scoreColor(s) {
    if (s >= 80) return { fill:'#2e7d32', stroke:'#1b5e20', label:'Safe',        bg:'#e8f5e9', text:'#1b5e20', emoji:'🟢' };
    if (s >= 60) return { fill:'#689f38', stroke:'#33691e', label:'Mostly Safe', bg:'#f1f8e9', text:'#33691e', emoji:'🟡' };
    if (s >= 40) return { fill:'#f9a825', stroke:'#f57f17', label:'Caution',     bg:'#fff8e1', text:'#e65100', emoji:'🟠' };
    if (s >= 20) return { fill:'#e64a19', stroke:'#bf360c', label:'High Risk',   bg:'#fbe9e7', text:'#bf360c', emoji:'🔴' };
    return              { fill:'#b71c1c', stroke:'#7f0000', label:'Danger',      bg:'#ffebee', text:'#7f0000', emoji:'⛔' };
  }

  /* ─── score calculation ─── */
  function computeScore(lat, lng) {
    const nearbyAcc = state.accidents.filter(
      p => Math.abs(p.lat - lat) < RADIUS && Math.abs(p.lng - lng) < RADIUS
    );
    const nearbyCri = state.crime.filter(
      p => Math.abs(p.lat - lat) < RADIUS && Math.abs(p.lng - lng) < RADIUS
    );
    const avgAcc = nearbyAcc.length
      ? nearbyAcc.reduce((s, p) => s + p.intensity, 0) / nearbyAcc.length : 0;
    const avgCri = nearbyCri.length
      ? nearbyCri.reduce((s, p) => s + p.intensity, 0) / nearbyCri.length : 0;
    const densityPenalty = Math.min(
      (nearbyAcc.length * 1.8 + nearbyCri.length * 2.2) / 100, 0.35
    );
    const risk  = W.accident * avgAcc + W.crime * avgCri + densityPenalty;
    const score = Math.round(Math.max(0, Math.min(1, 1 - risk)) * 100);
    return {
      score,
      accCount  : nearbyAcc.length,
      criCount  : nearbyCri.length,
      avgAccSev : (avgAcc * 100).toFixed(0),
      avgCriSev : (avgCri * 100).toFixed(0),
    };
  }

  /* ─── SAFETY INFO MODAL ─── */
  function openSafetyModal(name, data) {
    const c = scoreColor(data.score);
    const old = document.getElementById('sh-modal-overlay');
    if (old) old.remove();

    const tipMap = {
      'Safe'        : ['Generally very safe for tourists', 'Low crime and accident history', 'Suitable for solo travel and families'],
      'Mostly Safe' : ['Exercise normal precautions', 'Stay on marked trails if trekking', 'Avoid travelling alone after dark'],
      'Caution'     : ['Stay aware of your surroundings', 'Travel in groups when possible', 'Check local advisories before visiting'],
      'High Risk'   : ['Only visit with an experienced local guide', 'Avoid peak risk seasons', 'Register your travel plan with authorities'],
      'Danger'      : ['Travel strongly discouraged', 'Consult government travel advisories', 'Pre-arrange emergency contacts'],
    };
    const tips = tipMap[c.label] || tipMap['Caution'];

    const overlay = document.createElement('div');
    overlay.id = 'sh-modal-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:999999;
      background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);
      display:flex;align-items:center;justify-content:center;padding:16px;`;
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:22px;max-width:420px;width:100%;
           font-family:Poppins,sans-serif;overflow:hidden;
           box-shadow:0 24px 60px rgba(0,0,0,0.25);animation:shPop 0.22s ease">

        <div style="background:${c.bg};padding:20px 22px 16px;border-bottom:2px solid ${c.fill}30">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:11px;font-weight:700;color:${c.fill};
                   letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">
                Safety Report
              </div>
              <div style="font-size:18px;font-weight:800;color:#1a1a1a">${name}</div>
            </div>
            <button onclick="document.getElementById('sh-modal-overlay').remove()"
                    style="background:${c.fill}22;border:none;color:${c.fill};
                           width:34px;height:34px;border-radius:50%;cursor:pointer;
                           font-size:20px;font-weight:700;line-height:1;
                           display:flex;align-items:center;justify-content:center">×</button>
          </div>
        </div>

        <div style="padding:20px 22px">

          <div style="margin-bottom:18px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:13px;font-weight:600;color:#555">Overall Safety Score</span>
              <span style="font-size:22px;font-weight:800;color:${c.fill}">
                ${data.score}<span style="font-size:13px;color:#aaa">/100</span>
              </span>
            </div>
            <div style="background:#f0f0f0;border-radius:99px;height:10px;overflow:hidden">
              <div style="width:${data.score}%;height:100%;
                   background:linear-gradient(90deg,${c.stroke},${c.fill});
                   border-radius:99px"></div>
            </div>
            <div style="text-align:center;margin-top:10px">
              <span style="background:${c.fill};color:#fff;padding:4px 18px;
                    border-radius:99px;font-size:13px;font-weight:700">
                ${c.emoji} ${c.label}
              </span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
            <div style="background:#fff8f0;border:1.5px solid #ffe0b2;
                 border-radius:14px;padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:800;color:#e65100">${data.accCount}</div>
              <div style="font-size:11px;color:#888;margin-top:2px">⚠️ Accidents nearby</div>
              <div style="font-size:10px;color:#bbb;margin-top:2px">avg severity ${data.avgAccSev}%</div>
            </div>
            <div style="background:#fff5f5;border:1.5px solid #ffd0d0;
                 border-radius:14px;padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:800;color:#cc0000">${data.criCount}</div>
              <div style="font-size:11px;color:#888;margin-top:2px">🚨 Crime incidents</div>
              <div style="font-size:10px;color:#bbb;margin-top:2px">avg severity ${data.avgCriSev}%</div>
            </div>
          </div>

          <div style="background:${c.bg};border-radius:14px;padding:14px 16px;margin-bottom:16px">
            <div style="font-size:12px;font-weight:700;color:${c.text};margin-bottom:8px">
              🧭 Travel Advice
            </div>
            ${tips.map(t => `
              <div style="display:flex;gap:8px;margin-bottom:6px;font-size:12px;color:#444">
                <span style="color:${c.fill};flex-shrink:0;font-weight:700">•</span>
                <span>${t}</span>
              </div>`).join('')}
          </div>

          <div style="font-size:10px;color:#bbb;text-align:center;
               border-top:1px solid #f0f0f0;padding-top:12px">
            Score based on incident data within ~40 km radius
          </div>

        </div>
      </div>`;

    document.body.appendChild(overlay);
  }

  /* ─── map popup HTML ─── */
  function mapPopupHTML(name, data) {
    const c = scoreColor(data.score);
    return `
      <div style="font-family:Poppins,sans-serif;min-width:220px;padding:2px">
        <div style="background:${c.bg};border-left:4px solid ${c.fill};
             border-radius:10px;padding:9px 12px;margin-bottom:8px">
          <b style="font-size:13px;color:#1a1a1a">🛡️ ${name}</b>
          <span style="float:right;background:${c.fill};color:#fff;
                padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700">
            ${c.label}
          </span>
        </div>
        <div style="margin:8px 0">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:4px">
            <span>Safety Score</span>
            <span style="font-weight:700;color:${c.fill}">${data.score}/100</span>
          </div>
          <div style="background:#eee;border-radius:99px;height:7px;overflow:hidden">
            <div style="width:${data.score}%;height:100%;background:${c.fill};border-radius:99px"></div>
          </div>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr>
            <td style="color:#666;padding:3px 0">⚠️ Accidents nearby</td>
            <td style="text-align:right;font-weight:600">${data.accCount}
              <span style="color:#aaa;font-size:10px">(${data.avgAccSev}% avg)</span>
            </td>
          </tr>
          <tr>
            <td style="color:#666;padding:3px 0">🚨 Crime nearby</td>
            <td style="text-align:right;font-weight:600">${data.criCount}
              <span style="color:#aaa;font-size:10px">(${data.avgCriSev}% avg)</span>
            </td>
          </tr>
        </table>
        <div style="margin-top:8px;font-size:11px;color:#888;
             border-top:1px solid #f0f0f0;padding-top:6px;text-align:center">
          ~40 km radius · click 🛡️ badge on card for full report
        </div>
      </div>`;
  }

  /* ─── fetch data ─── */
  async function fetchData() {
    try {
      const [aRes, cRes] = await Promise.all([
        fetch('http://localhost:5000/api/gis/accidents').then(r => r.json()),
        fetch('http://localhost:5000/api/gis/crime').then(r => r.json()),
      ]);
      if (aRes.success) state.accidents = aRes.data;
      if (cRes.success) state.crime     = cRes.data;
    } catch (e) {
      console.warn('[SafetyHeatmap] Backend offline — using demo data');
      _demoData();
    }
  }

  function _demoData() {
    const dests = window.destinations || [];
    state.accidents = dests.flatMap(d =>
      Array.from({ length: Math.floor(Math.random() * 6) }, () => ({
        lat: d.latitude  + (Math.random() - 0.5) * 0.5,
        lng: d.longitude + (Math.random() - 0.5) * 0.5,
        intensity: Math.random() * 0.8 + 0.05,
      }))
    );
    state.crime = dests.flatMap(d =>
      Array.from({ length: Math.floor(Math.random() * 5) }, () => ({
        lat: d.latitude  + (Math.random() - 0.5) * 0.6,
        lng: d.longitude + (Math.random() - 0.5) * 0.6,
        intensity: Math.random() * 0.7 + 0.05,
      }))
    );
  }

  /* ─── build map layers ─── */
  function buildLayers() {
    const dests = window.destinations || [];
    if (!dests.length) return;

    state.safeLayer = L.layerGroup();
    const heatPoints = [];

    dests.forEach(dest => {
      const lat = parseFloat(dest.latitude);
      const lng = parseFloat(dest.longitude);
      if (!lat || !lng) return;

      const data = computeScore(lat, lng);
      const c    = scoreColor(data.score);

      const circle = L.circleMarker([lat, lng], {
        radius: 14, fillColor: c.fill, color: c.stroke,
        weight: 2.5, opacity: 1, fillOpacity: 0.82,
      });

      const labelIcon = L.divIcon({
        className: '', iconSize: [26, 16], iconAnchor: [13, 8],
        html: `<div style="background:${c.fill};color:#fff;font-family:Poppins,sans-serif;
               font-size:10px;font-weight:700;border-radius:99px;padding:2px 5px;
               text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.25)">${data.score}</div>`,
      });

      circle.bindPopup(mapPopupHTML(dest.name, data), { maxWidth: 280 });
      circle.on('mouseover', function () { this.openPopup(); });

      state.safeLayer.addLayer(circle);
      state.safeLayer.addLayer(L.marker([lat, lng], { icon: labelIcon, interactive: false }));

      heatPoints.push([lat, lng, (100 - data.score) / 100]);
      state.destMarkers.push({ score: data.score, name: dest.name, lat, lng, data });
    });

    if (typeof L.heatLayer !== 'undefined') {
      state.heatLayer = L.heatLayer(heatPoints, {
        radius: 60, blur: 45, maxZoom: 18, minOpacity: 0.25,
        gradient: { 0.0: '#00c853', 0.25: '#76ff03', 0.5: '#ffea00', 0.75: '#ff6d00', 1.0: '#d50000' },
      });
    }
  }

  /* ─── show / hide ─── */
  function show() {
    if (!state.safeLayer) return;
    state.heatLayer && state.heatLayer.addTo(window.map);
    state.safeLayer.addTo(window.map);
    state.visible = true;
    _refreshBtn(true);
    _showLegend(true);
    _showRanking();
  }
  function hide() {
    state.heatLayer && window.map.removeLayer(state.heatLayer);
    state.safeLayer && window.map.removeLayer(state.safeLayer);
    state.visible = false;
    _refreshBtn(false);
    _showLegend(false);
    const rp = document.getElementById('sh-ranking');
    if (rp) rp.style.display = 'none';
  }
  function toggle() { state.visible ? hide() : show(); }
  window.SafetyHeatmap = { toggle, show, hide };

  /* ─── card badges ─── */
  function injectCardBadges() {
    const cards = document.querySelectorAll('#dest-grid .card[data-name]');
    cards.forEach(card => {
      if (card.dataset.shBadged) return;
      card.dataset.shBadged = '1';

      const name = card.dataset.name || '';
      const entry = state.destMarkers.find(
        m => m.name.toLowerCase() === name.toLowerCase() ||
             m.name.toLowerCase().includes(name.toLowerCase()) ||
             name.toLowerCase().includes(m.name.toLowerCase())
      );
      if (!entry) return;

      const c = scoreColor(entry.score);

      // Position badge inside the img wrapper (top-left of image, NOT over buttons)
      const img = card.querySelector('img');
      if (!img) return;
      const imgParent = img.parentElement;
      if (getComputedStyle(imgParent).position === 'static') {
        imgParent.style.position = 'relative';
      }

      const badge = document.createElement('div');
      badge.style.cssText = `
        position:absolute;top:10px;left:10px;z-index:10;
        background:${c.fill};color:#fff;
        font-family:Poppins,sans-serif;font-size:11px;font-weight:700;
        padding:5px 10px;border-radius:99px;
        box-shadow:0 2px 8px rgba(0,0,0,0.30);
        display:flex;align-items:center;gap:5px;
        cursor:pointer;
        transition:transform 0.15s,box-shadow 0.15s;`;
      badge.innerHTML = `🛡️ ${entry.score}`;
      badge.title = `Click to see safety details for ${entry.name}`;

      badge.onmouseover = () => {
        badge.style.transform = 'scale(1.1)';
        badge.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
      };
      badge.onmouseout = () => {
        badge.style.transform = 'scale(1)';
        badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.30)';
      };
      badge.onclick = e => {
        e.stopPropagation();
        openSafetyModal(entry.name, entry.data);
      };

      imgParent.appendChild(badge);
    });
  }

  /* ─── UI helpers ─── */
  function _refreshBtn(on) {
    const btn = document.getElementById('sh-toggle-btn');
    if (!btn) return;
    btn.style.background  = on ? '#2e7d32' : '#fff';
    btn.style.color       = on ? '#fff'     : '#2e7d32';
    btn.style.borderColor = on ? '#2e7d32'  : PINK_MID;
    btn.innerHTML = `🛡️ Safety Heatmap <span style="float:right;font-size:10px">${on ? 'ON ●' : 'OFF ○'}</span>`;
  }

  function _showLegend(on) {
    const el = document.getElementById('sh-legend');
    if (el) el.style.display = on ? 'block' : 'none';
  }

  function _showRanking() {
    const existing = document.getElementById('sh-ranking');
    if (existing) { existing.style.display = 'block'; return; }

    const sorted = [...state.destMarkers].sort((a, b) => b.score - a.score);
    const rows = sorted.map(d => {
      const c = scoreColor(d.score);
      return `
        <div onclick="window.map&&window.map.flyTo([${d.lat},${d.lng}],10,{animate:true,duration:1})"
             style="display:flex;align-items:center;gap:10px;padding:7px 10px;
                    border-radius:10px;cursor:pointer;transition:background 0.15s"
             onmouseover="this.style.background='${PINK_LIGHT}'"
             onmouseout="this.style.background='transparent'">
          <div style="width:34px;height:34px;border-radius:50%;background:${c.fill};
               display:flex;align-items:center;justify-content:center;
               color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${d.score}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:#1a1a1a;
                 white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</div>
            <div style="font-size:10px;color:${c.fill};font-weight:600">${c.emoji} ${c.label}</div>
          </div>
        </div>`;
    }).join('');

    const panel = document.createElement('div');
    panel.id = 'sh-ranking';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;
           padding:12px 14px;background:${PINK_LIGHT};border-bottom:1.5px solid ${PINK_MID};
           border-radius:18px 18px 0 0">
        <span style="font-weight:700;font-size:12px;color:${PINK_DARK}">🏆 Safety Rankings</span>
        <button onclick="document.getElementById('sh-ranking').style.display='none'"
                style="background:none;border:none;color:${PINK_DARK};cursor:pointer;
                       font-size:18px;font-weight:700;padding:0 3px">×</button>
      </div>
      <div style="padding:8px 4px;max-height:320px;overflow-y:auto">${rows}</div>
      <div style="padding:8px 14px;font-size:10px;color:#aaa;
           border-top:1px solid ${PINK_MID};text-align:center">
        Click any row to fly to it on the map
      </div>`;

    Object.assign(panel.style, {
      position: 'fixed', top: '50%', right: '18px',
      transform: 'translateY(-50%)', zIndex: '99998',
      background: '#fff', border: `1.5px solid ${PINK_MID}`,
      borderRadius: '18px', minWidth: '210px', maxWidth: '240px',
      boxShadow: '0 8px 32px rgba(184,92,114,0.18)',
      fontFamily: 'Poppins,sans-serif',
    });
    document.body.appendChild(panel);

    const mapEl = document.getElementById('map-section') || document.getElementById('map');
    if (mapEl) {
      new IntersectionObserver(entries => {
        panel.style.display = entries[0].isIntersecting ? 'block' : 'none';
      }, { threshold: 0.1 }).observe(mapEl);
    }
  }

  /* ─── inject button + legend ─── */
  function _injectUI() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shPop {
        from { opacity:0; transform:scale(0.92) translateY(10px); }
        to   { opacity:1; transform:scale(1)    translateY(0);    }
      }
      #sh-toggle-btn {
        width:100%;padding:9px 14px;border-radius:20px;
        border:1.5px solid ${PINK_MID};cursor:pointer;
        font-size:12px;font-weight:600;transition:all 0.18s;
        text-align:left;font-family:Poppins,sans-serif;
        background:#fff;color:#2e7d32;
      }
      #sh-toggle-btn:hover {
        transform:translateX(3px);border-color:#2e7d32;
        box-shadow:0 2px 10px rgba(46,125,50,0.22);
      }
      #sh-legend {
        position:fixed;bottom:28px;right:18px;z-index:99997;
        display:none;background:#fff;border:1.5px solid ${PINK_MID};
        border-radius:18px;padding:16px 18px;min-width:210px;
        font-family:Poppins,system-ui,sans-serif;
        box-shadow:0 8px 32px rgba(184,92,114,0.18);
      }`;
    document.head.appendChild(style);

    const gisBody = document.getElementById('gis-panel-body');
    if (gisBody) {
      const btn = document.createElement('button');
      btn.id = 'sh-toggle-btn';
      btn.className = 'gis-lyr-btn';
      btn.onclick = () => SafetyHeatmap.toggle();
      btn.innerHTML = `🛡️ Safety Heatmap <span style="float:right;font-size:10px">OFF ○</span>`;
      // Insert before the <hr> so Safety sits with the other layer buttons, not below counts
      const sep = document.getElementById('gis-sep');
      if (sep) gisBody.insertBefore(btn, sep);
      else gisBody.appendChild(btn);
    }

    const legend = document.createElement('div');
    legend.id = 'sh-legend';
    legend.innerHTML = `
      <div style="font-weight:700;font-size:12px;color:${PINK_DARK};
           border-bottom:2px solid ${PINK_MID};padding-bottom:7px;margin-bottom:10px">
        🛡️ Safety Score
      </div>
      ${[['#2e7d32','80–100','Safe'],['#689f38','60–79','Mostly Safe'],
         ['#f9a825','40–59','Caution'],['#e64a19','20–39','High Risk'],
         ['#b71c1c','0–19','Danger']].map(([col, range, lbl]) => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="width:28px;height:14px;background:${col};border-radius:4px;flex-shrink:0"></div>
          <span style="font-size:11px;color:#333">
            <b style="color:${col}">${lbl}</b>
            <span style="color:#aaa"> · ${range}</span>
          </span>
        </div>`).join('')}
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid ${PINK_MID};
           font-size:10px;color:#aaa">
        Numbers on map pins = score<br>
        Click 🛡️ badge on a card for full report
      </div>`;
    document.body.appendChild(legend);
  }

  /* ─── main init ─── */
  async function init() {
    if (state.ready) return;

    await new Promise(resolve => {
      const check = () => {
        if (window.map && typeof L !== 'undefined' && typeof L.heatLayer !== 'undefined'
            && window.destinations && window.destinations.length > 0) resolve();
        else setTimeout(check, 300);
      };
      check();
      window.addEventListener('apiDataLoaded', () => setTimeout(check, 200));
    });

    await fetchData();
    buildLayers();
    _injectUI();

    injectCardBadges();
    window.addEventListener('destinationsRendered', () => setTimeout(injectCardBadges, 100));

    state.ready = true;
    console.log('[SafetyHeatmap] Ready ✓ scored:', state.destMarkers.length);
  }

  init();
  return { toggle, show, hide };
})();