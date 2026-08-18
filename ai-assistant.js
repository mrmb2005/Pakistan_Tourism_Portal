/**
 * ai-assistant.js — Explore Pakistan
 * Pink/White/Black theme — Groq AI powered chatbot
 *
 * Flow:
 *   FAB click → Mode Picker (Chat | Recommend | Plan)
 *   Mode click → Opens that panel (with back arrow to return)
 */

const AIAssistant = (() => {

  const PINK       = '#e8849a';
  const PINK_DARK  = '#b85c72';
  const PINK_LIGHT = '#fdeef1';
  const PINK_MID   = '#f7d9df';

  let chatHistory = [];
  let isOpen      = false;
  let currentMode = null; // null = picker screen

  function renderMd(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');
  }

  /* ─────────────────── STYLES ─────────────────── */
  function injectStyles() {
    if (document.getElementById('ai-styles')) return;
    const s = document.createElement('style');
    s.id = 'ai-styles';
    s.textContent = `
      /* FAB */
      #ai-fab {
        position:fixed; bottom:88px; right:20px; z-index:99996;
        width:54px; height:54px; border-radius:50%;
        background:linear-gradient(135deg,${PINK},${PINK_DARK});
        border:none; cursor:pointer;
        box-shadow:0 6px 24px rgba(184,92,114,0.45);
        font-size:24px; display:flex; align-items:center; justify-content:center;
        transition:all 0.2s; color:#fff;
      }
      #ai-fab:hover { transform:scale(1.1); box-shadow:0 8px 30px rgba(184,92,114,0.6); }
      #ai-fab-badge {
        position:absolute; top:-4px; right:-4px;
        background:#1a1a1a; color:#fff; border-radius:50%;
        width:19px; height:19px; font-size:9px; font-weight:700;
        display:flex; align-items:center; justify-content:center;
        font-family:Poppins,sans-serif; border:2px solid #fff;
      }

      /* WINDOW */
      #ai-window {
        position:fixed; bottom:154px; right:20px; z-index:99996;
        width:360px;
        background:#fff; border:1.5px solid ${PINK_MID};
        border-radius:22px;
        box-shadow:0 12px 48px rgba(184,92,114,0.22);
        font-family:Poppins,system-ui,sans-serif;
        display:none; flex-direction:column; overflow:hidden;
        transition: height 0.25s ease;
      }
      #ai-window.open { display:flex; }

      /* HEADER */
      #ai-header {
        background:${PINK_LIGHT}; border-bottom:1.5px solid ${PINK_MID};
        padding:13px 16px 13px; flex-shrink:0;
        display:flex; align-items:center; justify-content:space-between;
        gap:8px;
      }
      #ai-header-left { display:flex; align-items:center; gap:7px; flex:1; }
      #ai-back-btn {
        background:none; border:none; cursor:pointer;
        color:${PINK_DARK}; font-size:18px; font-weight:700;
        width:26px; height:26px; border-radius:50%;
        display:none; align-items:center; justify-content:center;
        transition:background 0.15s; line-height:1; flex-shrink:0;
      }
      #ai-back-btn:hover { background:${PINK_MID}; }
      #ai-back-btn.visible { display:flex; }
      #ai-live-dot {
        width:8px; height:8px; border-radius:50%; background:#22c55e;
        box-shadow:0 0 6px rgba(34,197,94,0.6); flex-shrink:0;
      }
      #ai-title {
        font-size:13px; font-weight:700; color:${PINK_DARK};
      }
      #ai-subtitle {
        font-size:9px; font-weight:400; color:#aaa; margin-left:2px;
      }
      #ai-close {
        background:none; border:none; cursor:pointer;
        color:${PINK_DARK}; font-size:20px; font-weight:700;
        width:28px; height:28px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        transition:background 0.15s; line-height:1; flex-shrink:0;
      }
      #ai-close:hover { background:${PINK_MID}; }

      /* ── MODE PICKER ── */
      #ai-picker {
        padding:20px 16px 24px;
        display:flex; flex-direction:column; gap:12px;
      }
      #ai-picker-intro {
        font-size:12.5px; color:#555; line-height:1.6;
        background:${PINK_LIGHT}; border:1px solid ${PINK_MID};
        border-radius:14px; padding:12px 14px;
      }
      .ai-mode-btn {
        display:flex; align-items:center; gap:13px;
        padding:14px 16px; border-radius:16px;
        border:1.5px solid ${PINK_MID};
        background:#fff; cursor:pointer;
        transition:all 0.18s; text-align:left;
        font-family:Poppins,sans-serif;
      }
      .ai-mode-btn:hover {
        background:${PINK_LIGHT}; border-color:${PINK};
        transform:translateY(-2px);
        box-shadow:0 6px 18px rgba(184,92,114,0.12);
      }
      .ai-mode-icon {
        font-size:22px; width:40px; height:40px;
        background:${PINK_LIGHT}; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        flex-shrink:0;
      }
      .ai-mode-text h4 {
        font-size:13px; font-weight:700; color:${PINK_DARK}; margin:0 0 2px;
      }
      .ai-mode-text p {
        font-size:11px; color:#888; margin:0; line-height:1.4;
      }
      .ai-mode-arrow {
        margin-left:auto; color:${PINK}; font-size:16px; flex-shrink:0;
      }

      /* ── CHAT PANEL ── */
      #ai-panel-chat {
        display:none; flex-direction:column; height:460px; max-height:460px;
      }
      #ai-panel-chat.active { display:flex; }

      #ai-msgs {
        flex:1; overflow-y:auto; padding:13px 13px 8px;
        display:flex; flex-direction:column; gap:9px;
        scroll-behavior:smooth; min-height:0;
      }
      #ai-msgs::-webkit-scrollbar { width:4px; }
      #ai-msgs::-webkit-scrollbar-thumb { background:${PINK_MID}; border-radius:4px; }

      .ai-msg {
        max-width:86%; font-size:12.5px; line-height:1.65;
        padding:9px 13px; border-radius:16px; word-break:break-word;
      }
      .ai-msg.user {
        align-self:flex-end;
        background:linear-gradient(135deg,${PINK},${PINK_DARK});
        color:#fff; border-bottom-right-radius:4px;
      }
      .ai-msg.bot {
        align-self:flex-start;
        background:${PINK_LIGHT}; color:#1a1a1a;
        border:1px solid ${PINK_MID}; border-bottom-left-radius:4px;
      }
      .ai-msg.typing {
        align-self:flex-start; background:${PINK_LIGHT};
        border:1px solid ${PINK_MID}; color:${PINK};
        font-style:italic; font-size:12px;
      }

      #ai-chips {
        padding:0 13px 9px; display:flex; flex-wrap:wrap; gap:6px; flex-shrink:0;
      }
      .ai-chip {
        background:#fff; border:1.5px solid ${PINK_MID};
        border-radius:16px; padding:5px 11px;
        font-size:11px; color:${PINK_DARK}; font-weight:600;
        cursor:pointer; transition:all 0.15s; font-family:Poppins,sans-serif;
      }
      .ai-chip:hover { background:${PINK_LIGHT}; border-color:${PINK}; }

      #ai-input-row {
        display:flex; gap:7px; padding:9px 11px 12px;
        border-top:1px solid ${PINK_MID}; flex-shrink:0;
      }
      #ai-input {
        flex:1; padding:9px 12px; border-radius:20px;
        border:1.5px solid ${PINK_MID}; font-size:12px;
        font-family:Poppins,sans-serif; outline:none;
        color:#1a1a1a; transition:border-color 0.15s;
      }
      #ai-input:focus { border-color:${PINK}; }
      #ai-send {
        width:38px; height:38px; border-radius:50%;
        background:linear-gradient(135deg,${PINK},${PINK_DARK});
        border:none; cursor:pointer; color:#fff; font-size:15px;
        display:flex; align-items:center; justify-content:center;
        transition:all 0.15s; flex-shrink:0;
      }
      #ai-send:hover { transform:scale(1.08); opacity:0.9; }
      #ai-send:disabled { opacity:0.4; cursor:default; transform:none; }

      /* ── RECOMMEND / PLAN PANELS ── */
      #ai-panel-recommend, #ai-panel-plan {
        display:none; flex-direction:column; height:460px; max-height:460px;
      }
      #ai-panel-recommend.active, #ai-panel-plan.active { display:flex; }

      .ai-scroll {
        padding:13px; overflow-y:auto;
        display:flex; flex-direction:column; gap:9px;
        flex:1; min-height:0;
      }
      .ai-scroll::-webkit-scrollbar { width:4px; }
      .ai-scroll::-webkit-scrollbar-thumb { background:${PINK_MID}; border-radius:4px; }
      .ai-lbl {
        font-size:11px; font-weight:700; color:${PINK_DARK};
        margin-bottom:3px; display:block;
      }
      .ai-inp, .ai-sel {
        width:100%; padding:8px 11px; border-radius:12px;
        border:1.5px solid ${PINK_MID}; font-size:12px;
        font-family:Poppins,sans-serif; outline:none; color:#1a1a1a;
        transition:border-color 0.15s; box-sizing:border-box;
      }
      .ai-inp:focus, .ai-sel:focus { border-color:${PINK}; }
      .ai-go {
        width:100%; padding:10px; border-radius:20px;
        background:linear-gradient(135deg,${PINK},${PINK_DARK});
        border:none; color:#fff; font-size:12px; font-weight:700;
        cursor:pointer; font-family:Poppins,sans-serif;
        transition:opacity 0.15s; margin-top:2px;
      }
      .ai-go:hover { opacity:0.88; }
      .ai-go:disabled { opacity:0.4; cursor:default; }
      .ai-result {
        background:${PINK_LIGHT}; border:1px solid ${PINK_MID};
        border-radius:14px; padding:12px 14px;
        font-size:12px; line-height:1.75; color:#1a1a1a;
        display:none;
      }
      .ai-result.show { display:block; }
      .ai-err {
        background:#fff5f5; border:1px solid #ffd0d0;
        border-radius:12px; padding:9px 13px;
        font-size:12px; color:#cc0000; display:none;
      }
      .ai-err.show { display:block; }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────── BUILD UI ─────────────────── */
  function buildUI() {
    // FAB
    const fab = document.createElement('button');
    fab.id = 'ai-fab';
    fab.title = 'AI Travel Assistant';
    fab.onclick = toggle;
    fab.innerHTML = '🤖<span id="ai-fab-badge">AI</span>';
    document.body.appendChild(fab);

    // Window
    const win = document.createElement('div');
    win.id = 'ai-window';
    win.innerHTML = `
      <!-- HEADER -->
      <div id="ai-header">
        <div id="ai-header-left">
          <button id="ai-back-btn" onclick="AIAssistant.showPicker()" title="Back">‹</button>
          <span id="ai-live-dot"></span>
          <span id="ai-title">AI Travel Assistant</span>
          <span id="ai-subtitle">Gemini</span>
        </div>
        <button id="ai-close" onclick="AIAssistant.close()">×</button>
      </div>

      <!-- MODE PICKER -->
      <div id="ai-picker">
        <div id="ai-picker-intro">
          👋 Hi! I'm your AI travel guide for Pakistan, powered by Google Gemini!<br><br>
          What would you like to do?
        </div>

        <button class="ai-mode-btn" onclick="AIAssistant.openMode('chat')">
          <div class="ai-mode-icon">💬</div>
          <div class="ai-mode-text">
            <h4>Chat</h4>
            <p>Ask anything about Pakistan travel, safety, food &amp; more</p>
          </div>
          <span class="ai-mode-arrow">›</span>
        </button>

        <button class="ai-mode-btn" onclick="AIAssistant.openMode('recommend')">
          <div class="ai-mode-icon">🌟</div>
          <div class="ai-mode-text">
            <h4>Recommendations</h4>
            <p>Get personalised destination suggestions for your trip</p>
          </div>
          <span class="ai-mode-arrow">›</span>
        </button>

        <button class="ai-mode-btn" onclick="AIAssistant.openMode('plan')">
          <div class="ai-mode-icon">📅</div>
          <div class="ai-mode-text">
            <h4>Plan a Trip</h4>
            <p>Generate a full day-by-day itinerary for your destinations</p>
          </div>
          <span class="ai-mode-arrow">›</span>
        </button>
      </div>

      <!-- CHAT PANEL -->
      <div id="ai-panel-chat">
        <div id="ai-msgs">
          <div class="ai-msg bot">
            👋 Hi! I'm your AI travel guide for Pakistan, powered by Google Gemini!<br><br>
            Ask me about destinations, safety, packing, food, or let me plan your whole trip! 🏔️
          </div>
        </div>
        <div id="ai-chips">
          <span class="ai-chip" onclick="AIAssistant.chip('Best places to visit in summer?')">☀️ Summer spots</span>
          <span class="ai-chip" onclick="AIAssistant.chip('Is Swat Valley safe to visit?')">🛡️ Safety</span>
          <span class="ai-chip" onclick="AIAssistant.chip('What to pack for Hunza?')">🎒 Packing</span>
          <span class="ai-chip" onclick="AIAssistant.chip('Budget travel tips for Pakistan')">💰 Budget</span>
        </div>
        <div id="ai-input-row">
          <input id="ai-input" type="text" placeholder="Ask anything about Pakistan travel…"
            onkeydown="if(event.key==='Enter')AIAssistant.send()">
          <button id="ai-send" onclick="AIAssistant.send()">➤</button>
        </div>
      </div>

      <!-- RECOMMEND PANEL -->
      <div id="ai-panel-recommend">
        <div class="ai-scroll">
          <div>
            <label class="ai-lbl">Your interests</label>
            <input class="ai-inp" id="rec-interests" placeholder="e.g. hiking, culture, food, photography">
          </div>
          <div>
            <label class="ai-lbl">Budget level</label>
            <select class="ai-sel" id="rec-budget">
              <option value="low">💰 Low (backpacker)</option>
              <option value="medium" selected>💳 Medium (comfortable)</option>
              <option value="high">💎 High (luxury)</option>
            </select>
          </div>
          <div>
            <label class="ai-lbl">Trip duration</label>
            <input class="ai-inp" id="rec-duration" placeholder="e.g. 5 days, 2 weeks" value="7 days">
          </div>
          <div>
            <label class="ai-lbl">Travel season</label>
            <select class="ai-sel" id="rec-season">
              <option value="spring">🌸 Spring (Mar–May)</option>
              <option value="summer" selected>☀️ Summer (Jun–Aug)</option>
              <option value="autumn">🍂 Autumn (Sep–Nov)</option>
              <option value="winter">❄️ Winter (Dec–Feb)</option>
            </select>
          </div>
          <button class="ai-go" id="rec-btn" onclick="AIAssistant.recommend()">🌟 Get Recommendations</button>
          <div class="ai-result" id="rec-result"></div>
          <div class="ai-err"    id="rec-err"></div>
        </div>
      </div>

      <!-- PLAN PANEL -->
      <div id="ai-panel-plan">
        <div class="ai-scroll">
          <div>
            <label class="ai-lbl">Destinations (comma separated)</label>
            <input class="ai-inp" id="plan-dests" placeholder="e.g. Hunza, Skardu, Islamabad">
          </div>
          <div>
            <label class="ai-lbl">Number of days</label>
            <input class="ai-inp" id="plan-days" type="number" value="7" min="1" max="30">
          </div>
          <div>
            <label class="ai-lbl">Interests</label>
            <input class="ai-inp" id="plan-interests" placeholder="e.g. trekking, photography, food">
          </div>
          <div>
            <label class="ai-lbl">Budget level</label>
            <select class="ai-sel" id="plan-budget">
              <option value="low">💰 Low</option>
              <option value="medium" selected>💳 Medium</option>
              <option value="high">💎 High</option>
            </select>
          </div>
          <button class="ai-go" id="plan-btn" onclick="AIAssistant.plan()">📅 Generate Itinerary</button>
          <div class="ai-result" id="plan-result"></div>
          <div class="ai-err"    id="plan-err"></div>
        </div>
      </div>
    `;
    document.body.appendChild(win);
  }

  /* ─────────────────── SHOW / HIDE ─────────────────── */
  function toggle() {
    isOpen = !isOpen;
    const win = document.getElementById('ai-window');
    win.classList.toggle('open', isOpen);
    if (isOpen) showPicker();
  }

  function closeWin() {
    isOpen = false;
    document.getElementById('ai-window').classList.remove('open');
    currentMode = null;
  }

  /* Show the mode picker screen */
  function showPicker() {
    currentMode = null;
    _hideAllPanels();
    document.getElementById('ai-picker').style.display = 'flex';
    document.getElementById('ai-back-btn').classList.remove('visible');
  }

  /* Open a specific mode panel */
  function openMode(mode) {
    currentMode = mode;
    document.getElementById('ai-picker').style.display = 'none';
    _hideAllPanels();
    const panel = document.getElementById('ai-panel-' + mode);
    if (panel) panel.classList.add('active');
    document.getElementById('ai-back-btn').classList.add('visible');
    if (mode === 'chat') {
      setTimeout(() => document.getElementById('ai-input').focus(), 50);
    }
  }

  function _hideAllPanels() {
    ['chat','recommend','plan'].forEach(m => {
      const p = document.getElementById('ai-panel-' + m);
      if (p) p.classList.remove('active');
    });
  }

  /* ─────────────────── CHAT ─────────────────── */
  function addMsg(role, html) {
    const c   = document.getElementById('ai-msgs');
    const div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    div.innerHTML = html;
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
    return div;
  }
  function showTyping() {
    const c   = document.getElementById('ai-msgs');
    const div = document.createElement('div');
    div.className = 'ai-msg typing'; div.id = 'ai-typing';
    div.textContent = '✦ Thinking…';
    c.appendChild(div); c.scrollTop = c.scrollHeight;
  }
  function hideTyping() {
    const el = document.getElementById('ai-typing');
    if (el) el.remove();
  }

  async function send() {
    const input = document.getElementById('ai-input');
    const btn   = document.getElementById('ai-send');
    const msg   = input.value.trim();
    if (!msg) return;

    input.value = ''; input.disabled = true; btn.disabled = true;
    addMsg('user', msg);
    chatHistory.push({ role:'user', content:msg });
    showTyping();

    try {
      const res = await API.aiChat(msg, chatHistory.slice(0,-1));
      hideTyping();
      if (res.success) {
        addMsg('bot', renderMd(res.reply));
        chatHistory.push({ role:'assistant', content:res.reply });
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      } else {
        addMsg('bot', '⚠️ ' + (res.error || 'Something went wrong. Try again.'));
      }
    } catch(e) {
      hideTyping();
      addMsg('bot', '⚠️ Cannot reach server. Make sure Flask is running.');
    }
    input.disabled = false; btn.disabled = false; input.focus();
  }

  function chip(text) {
    document.getElementById('ai-input').value = text;
    send();
  }

  /* ─────────────────── RECOMMEND ─────────────────── */
  async function recommend() {
    const btn = document.getElementById('rec-btn');
    const res = document.getElementById('rec-result');
    const err = document.getElementById('rec-err');
    res.classList.remove('show'); err.classList.remove('show');
    btn.disabled = true; btn.textContent = '⏳ Asking AI…';

    try {
      const data = await API.aiRecommend({
        interests: document.getElementById('rec-interests').value || 'sightseeing',
        budget:    document.getElementById('rec-budget').value,
        duration:  document.getElementById('rec-duration').value || '7 days',
        season:    document.getElementById('rec-season').value
      });
      if (data.success) {
        res.innerHTML = renderMd(data.reply);
        res.classList.add('show');
      } else {
        err.textContent = '⚠️ ' + (data.error || 'Something went wrong.');
        err.classList.add('show');
      }
    } catch(e) {
      err.textContent = '⚠️ Cannot reach server. Check Flask is running.';
      err.classList.add('show');
    }
    btn.disabled = false; btn.textContent = '🌟 Get Recommendations';
  }

  /* ─────────────────── PLAN ─────────────────── */
  async function plan() {
    const btn   = document.getElementById('plan-btn');
    const res   = document.getElementById('plan-result');
    const err   = document.getElementById('plan-err');
    const dests = document.getElementById('plan-dests').value.trim();
    res.classList.remove('show'); err.classList.remove('show');

    if (!dests) {
      err.textContent = '⚠️ Please enter at least one destination.';
      err.classList.add('show'); return;
    }

    btn.disabled = true; btn.textContent = '⏳ Building itinerary…';

    try {
      const data = await API.aiPlan({
        destinations: dests.split(',').map(d=>d.trim()).filter(Boolean),
        days:         parseInt(document.getElementById('plan-days').value) || 7,
        interests:    document.getElementById('plan-interests').value || 'sightseeing',
        budget:       document.getElementById('plan-budget').value
      });
      if (data.success) {
        res.innerHTML = renderMd(data.reply);
        res.classList.add('show');
      } else {
        err.textContent = '⚠️ ' + (data.error || 'Something went wrong.');
        err.classList.add('show');
      }
    } catch(e) {
      err.textContent = '⚠️ Cannot reach server. Check Flask is running.';
      err.classList.add('show');
    }
    btn.disabled = false; btn.textContent = '📅 Generate Itinerary';
  }

  /* ─────────────────── INIT ─────────────────── */
  function init() {
    injectStyles();
    buildUI();
    console.log('[AI Assistant] Groq powered — ready ✓');
  }

  return { init, toggle, close:closeWin, showPicker, openMode, send, chip, recommend, plan };
})();

(function waitForDOM() {
  if (document.body) AIAssistant.init();
  else setTimeout(waitForDOM, 100);
}());