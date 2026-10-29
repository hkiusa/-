/* 엔진 — 수정하지 않아도 돼요. 이야기는 story.js 에서 바꾸세요. */
(function () {
  "use strict";

  const S = STORY;
  const SPEED = S.speed > 0 ? S.speed : 1;
  const LIFE = S.playTime > 0 ? S.playTime : (S.life > 0 ? S.life : 300);
  const START_BAT = S.battery != null ? S.battery : 100;
  const $phone = document.getElementById("phone");
  const $status = document.getElementById("statusbar");
  const $screen = document.getElementById("screen");
  const $homebar = document.getElementById("homebar");

  if (S.dark) $phone.classList.add("dark");
  document.title = (S.owner || "") + " 휴대폰";

  let dead = false;
  let unlockAt = 0;

  /* ================= 도우미 ================= */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;       // textContent → 글이 안전하게 표시돼요
    return e;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(() => { if (!dead) r(); }, ms));   // 폰이 꺼지면 모든 진행이 멈춤
  const T = (sec) => (sec * 1000) / SPEED;
  const wait = (sec) => sleep(T(sec));
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  /* ---------- 이야기 속 시계 ---------- */
  const t0 = Date.now();
  const base = (function () {
    const m = /^(\d{1,2}):(\d{2})$/.exec((S.time && S.time.start) || "");
    if (!m) return null;
    const d = new Date();
    d.setHours(+m[1], +m[2], 0, 0);
    return d.getTime();
  })();
  function nowDate() { return base == null ? new Date() : new Date(base + (Date.now() - t0) * SPEED); }
  function clock12(d) { const h = d.getHours(); return (h >= 12 ? "오후 " : "오전 ") + ((h % 12) || 12) + ":" + pad(d.getMinutes()); }
  function clockShort(d) { return ((d.getHours() % 12) || 12) + ":" + pad(d.getMinutes()); }
  function dateLabel() {
    if (S.time && S.time.date) return S.time.date;
    const d = nowDate();
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + "일월화수목금토".charAt(d.getDay()) + "요일";
  }
  function dayNumber() {
    const m = /(\d{1,2})\s*일/.exec((S.time && S.time.date) || "");
    return m ? m[1] : String(nowDate().getDate());
  }

  /* ---------- 소리와 진동 ---------- */
  let ac = null;
  function audio() {
    if (!S.sound || dead) return null;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, vol) {
    const a = audio();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + start;
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function chime() { tone(1175, 0, 0.35, 0.1); tone(1568, 0.13, 0.55, 0.1); }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* 무시 */ } }
  function effects() { chime(); vibrate([40, 70, 40]); }
  let ringStopper = null;
  function startRing() {
    function once() { [660, 880, 660, 880].forEach((f, i) => tone(f, i * 0.2, 0.17, 0.12)); vibrate([400, 200, 400]); }
    once();
    const id = setInterval(once, 2400);
    const stop = function () { clearInterval(id); vibrate(0); ringStopper = null; };
    ringStopper = stop;
    return stop;
  }

  /* ================= 아이콘 (직접 그린 그림) ================= */
  const APPS = {
    messages: { name: "메시지", g: ["#6cea85", "#17b83c"],
      glyph: '<path fill="#fff" d="M12 3.2c-5.3 0-9.6 3.3-9.6 7.5 0 2.3 1.2 4.3 3.200 5.600-.2 1.300-.8 2.500-1.800 3.500 2.300-.1 4.200-.9 5.500-1.900.9.2 1.800.3 2.700.3 5.300 0 9.600-3.300 9.600-7.500S17.300 3.200 12 3.200z"/>' },
    phone: { name: "전화", g: ["#5ee27b", "#1ea34a"],
      glyph: '<path fill="#fff" d="M6.620 10.790c1.440 2.830 3.760 5.140 6.590 6.590l2.200-2.200c.27-.27.67-.36 1.020-.24 1.120.37 2.330.57 3.570.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.390 0-17-7.610-17-17 0-.55.45-1 1-1h3.500c.55 0 1 .45 1 1 0 1.250.2 2.450.57 3.570.11.35.03.74-.25 1.020l-2.200 2.200z"/>' },
    photos: { name: "사진", g: ["#ffd76e", "#ff7a59"],
      glyph: '<circle cx="8.200" cy="8.300" r="2.400" fill="#fff"/><path fill="#fff" d="M3 19.500l5.600-7.200 3.600 4.400 2.600-3.200 5.200 6z"/>' },
    notes: { name: "메모", g: ["#ffe58a", "#f6b81a"],
      glyph: '<rect x="5" y="5" width="14" height="2.200" rx="1.100" fill="#7a5600"/><rect x="5" y="10.900" width="14" height="2.200" rx="1.100" fill="#7a5600"/><rect x="5" y="16.800" width="9" height="2.200" rx="1.100" fill="#7a5600"/>' },
    internet: { name: "인터넷", g: ["#72c8ff", "#2a78e0"],
      glyph: '<circle cx="12" cy="12" r="8.500" fill="none" stroke="#fff" stroke-width="1.800"/><path fill="#fff" d="M15.800 8.200l-2.300 5.300-5.300 2.300 2.300-5.300z"/>' },
    music: { name: "음악", g: ["#ff7a9a", "#e0245e"],
      glyph: '<path d="M9.500 4.800l9-1.700v11.500" fill="none" stroke="#fff" stroke-width="1.800"/><path d="M9.500 4.800v12.500" stroke="#fff" stroke-width="1.800"/><circle cx="7.500" cy="17.500" r="2.700" fill="#fff"/><circle cx="16.500" cy="14.800" r="2.700" fill="#fff"/>' },
    calendar: { name: "캘린더", g: ["#ffffff", "#f1f1f4"], glyph: "" },
    battery: { name: "배터리", g: ["#ff6a5c", "#e0261b"],
      glyph: '<rect x="3" y="8" width="16" height="9" rx="2.500" fill="none" stroke="#fff" stroke-width="1.800"/><rect x="5" y="10" width="4" height="5" rx="1" fill="#fff"/><rect x="20" y="10.500" width="2" height="4" rx="1" fill="#fff"/>' },
    camera: { name: "카메라", g: ["#a3a8b0", "#5b616b"], decor: true,
      glyph: '<rect x="3" y="7" width="18" height="12" rx="3" fill="#fff"/><circle cx="12" cy="13" r="3.600" fill="#5b616b"/><rect x="8" y="4.500" width="5" height="3" rx="1" fill="#fff"/>' },
    settings: { name: "설정", g: ["#a3a8b0", "#5b616b"], decor: true,
      glyph: '<circle cx="12" cy="12" r="7" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2.700 2.700"/><circle cx="12" cy="12" r="3.800" fill="#fff"/>' },
    maps: { name: "지도", g: ["#7be3a0", "#2bb673"], decor: true,
      glyph: '<path fill="#fff" d="M12 3c-3.500 0-6 2.600-6 6 0 4.500 6 12 6 12s6-7.500 6-12c0-3.400-2.500-6-6-6z"/><circle cx="12" cy="9" r="2.300" fill="#2bb673"/>' },
    weather: { name: "날씨", g: ["#5ab6ff", "#2f6fe0"], decor: true,
      glyph: '<circle cx="9" cy="9" r="4" fill="#ffd54a"/><path fill="#fff" d="M8 19a4 4 0 010-8 5 5 0 019.400 1.200A3.400 3.400 0 0117 19z"/>' },
    clock: { name: "시계", g: ["#3a3a40", "#0d0d10"],
      glyph: '<circle cx="12" cy="12" r="8.500" fill="none" stroke="#fff" stroke-width="1.800"/><path d="M12 7v5l3.500 2" stroke="#fff" stroke-width="1.800" fill="none" stroke-linecap="round"/>' },
    calculator: { name: "계산기", g: ["#ffb347", "#ff7a00"], decor: true,
      glyph: '<rect x="5" y="3" width="14" height="18" rx="3" fill="#fff"/><rect x="7.500" y="5.500" width="9" height="4" rx="1" fill="#ff7a00"/><circle cx="8.800" cy="13" r="1.100" fill="#999"/><circle cx="12" cy="13" r="1.100" fill="#999"/><circle cx="15.200" cy="13" r="1.100" fill="#999"/><circle cx="8.800" cy="17" r="1.100" fill="#999"/><circle cx="12" cy="17" r="1.100" fill="#999"/><circle cx="15.200" cy="17" r="1.100" fill="#ff7a00"/>' }
  };
  APPS.web = APPS.internet;
  const HANDSET = APPS.phone.glyph;

  function iconEl(id, size) {
    const a = APPS[id];
    const d = el("div", "appicon");
    d.style.width = d.style.height = size + "px";
    d.style.borderRadius = size * 0.225 + "px";
    d.style.background = "linear-gradient(180deg," + a.g[0] + "," + a.g[1] + ")";
    let glyph = a.glyph;
    if (id === "calendar") {
      glyph = '<rect x="2" y="2" width="20" height="6" fill="#ff3b30"/><text x="12" y="19.500" text-anchor="middle" font-size="11" font-weight="700" fill="#222" font-family="sans-serif">' + dayNumber() + "</text>";
    }
    d.innerHTML = '<svg viewBox="0 0 24 24" width="' + size * (id === "calendar" ? 1 : 0.58) + '" height="' + size * (id === "calendar" ? 1 : 0.58) + '">' + glyph + "</svg>";
    if (id === "calendar") d.style.overflow = "hidden";
    return d;
  }
  function avatar(c, size) {
    const a = el("div", "avatar", (c.name || "?").trim().charAt(0));
    a.style.width = a.style.height = size + "px";
    a.style.fontSize = Math.round(size * 0.42) + "px";
    a.style.background = c.color || "#9a9aa3";
    return a;
  }
  const SIGNAL = '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.500" width="3" height="6.500" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>';
  function batterySvg(p) {
    const low = p <= 20;
    const w = Math.max(2, Math.round((19 * Math.min(100, Math.max(0, p))) / 100));
    return '<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.500" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="' + w + '" height="9" rx="2" fill="' + (low ? "#ff3b30" : "currentColor") + '"/><path d="M24.200 4.300v4.400c.9-.4 1.500-1.200 1.500-2.200s-.6-1.800-1.500-2.200z" fill="currentColor" opacity=".5"/></svg>';
  }
  const CHEVRON = '<svg width="12" height="20" viewBox="0 0 12 20"><path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ARROW = '<svg width="16" height="18" viewBox="0 0 16 18"><path d="M8 16V3M2.500 8.500L8 3l5.500 5.500" fill="none" stroke="#fff" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const GLOBE = '<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.800"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.600"/></svg>';
  const MAG = '<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="10.500" cy="10.500" r="6" fill="none" stroke="currentColor" stroke-width="2.200"/><path d="M15.200 15.200L20 20" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/></svg>';
  const LOCKSM = '<svg width="11" height="13" viewBox="0 0 18 24"><rect x="1" y="10" width="16" height="13" rx="3" fill="currentColor"/><path d="M4.500 10V7a4.500 4.500 0 019 0v3" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
  const HEART = '<svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8-5.300-8-11a4.500 4.500 0 018-2.800A4.500 4.500 0 0120 10c0 5.700-8 11-8 11z"/></svg>';
  const P_PLAY = '<svg width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4.500v15l12-7.500z"/></svg>';
  const P_PAUSE = '<svg width="30" height="30" viewBox="0 0 24 24"><rect x="6" y="4.500" width="4.200" height="15" rx="1.200" fill="currentColor"/><rect x="13.800" y="4.500" width="4.200" height="15" rx="1.200" fill="currentColor"/></svg>';
  const P_NEXT = '<svg width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" d="M5 5.500v13l9-6.500zM15.500 5.500h3v13h-3z"/></svg>';
  const P_PREV = '<svg width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" d="M19 5.500v13l-9-6.500zM5.500 5.500h3v13h-3z"/></svg>';
  const TB = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fwd: '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 15V4M8 8l4-4 4 4M6 12v7h12v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book: '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 5.500C7 4 10 4.500 12 6c2-1.500 5-2 8-.5v13c-3-1.500-6-1-8 .5-2-1.500-5-2-8-.5z" fill="none" stroke="currentColor" stroke-width="1.900" stroke-linejoin="round"/></svg>',
    tabs: '<svg width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="7" width="13" height="13" rx="2.500" fill="none" stroke="currentColor" stroke-width="1.900"/><path d="M8 4h11a1 1 0 011 1v11" fill="none" stroke="currentColor" stroke-width="1.900" stroke-linecap="round"/></svg>',
    reload: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M19 12a7 7 0 11-2.200-5.100M19 4v4.500h-4.500" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const NOTE_GLYPH = '<svg viewBox="0 0 24 24" width="40%" height="40%"><path d="M9.500 4.800l9-1.700v11.500" fill="none" stroke="currentColor" stroke-width="1.600"/><path d="M9.500 4.800v12.500" stroke="currentColor" stroke-width="1.600"/><circle cx="7.500" cy="17.500" r="2.700" fill="currentColor"/><circle cx="16.500" cy="14.800" r="2.700" fill="currentColor"/></svg>';

  /* ================= 상태 ================= */
  const threads = {};
  let seqCounter = 0;
  const typing = {};
  const done = {};
  let openChatId = null;
  let chatRef = null;
  let lockOn = true;
  let callOn = false;
  let current = null;       // 열려 있는 앱 {id, root, stack}
  let appDark = false;
  let missed = 0;
  let phoneTab = "recents";
  let photoTab = "all";
  const callLog = (S.callLog || []).map((x) => Object.assign({}, x));
  const voicemails = (S.voicemails || []).map((x) => Object.assign({}, x));
  (S.events || []).forEach((e, i) => { if (!e.id) e.id = "ev" + i; });

  Object.keys(S.contacts || {}).forEach((cid) => {
    const c = S.contacts[cid];
    if (c.history && c.history.length) {
      threads[cid] = { msgs: c.history.map((m) => Object.assign({}, m)), unread: c.unread || 0, seq: ++seqCounter };
    }
  });

  /* ================= 레이어 ================= */
  function layer(id) { const d = el("div", "layer"); d.id = id; $screen.appendChild(d); return d; }
  const $home = layer("home");
  const $appLayer = layer("apps");
  const $callLayer = layer("call");
  const $bannerLayer = layer("banners");
  const $lockLayer = layer("lock");
  const $off = el("div", "off");
  $phone.appendChild($off);
  const WALL = S.wallpaper || "linear-gradient(160deg,#2a2e6a,#12142b)";
  $home.style.background = WALL;

  /* ================= 상태바 / 배터리 ================= */
  const clockEl = el("span", "sb-clock");
  const pctEl = el("span", "sb-pct");
  const batEl = el("span", "sb-bat");
  const alertedLevels = {};
  function batteryPct() {
    if (!unlockAt) return START_BAT;
    const elapsed = ((Date.now() - unlockAt) / 1000) * SPEED;
    return Math.max(0, START_BAT * (1 - elapsed / LIFE));
  }
  function buildStatus() {
    const right = el("div", "sb-right");
    right.innerHTML = SIGNAL;
    if (S.network) right.appendChild(el("span", "sb-net", S.network));
    right.append(pctEl, batEl);
    $status.append(clockEl, right);
    refreshStatus();
    setInterval(refreshStatus, 1000);
  }
  function refreshStatus() {
    if (dead) return;
    clockEl.textContent = clockShort(nowDate());
    const p = batteryPct();
    const shown = Math.max(1, Math.ceil(p - 0.0001));
    batEl.innerHTML = batterySvg(shown);
    pctEl.textContent = shown + "%";
    pctEl.classList.toggle("low", shown <= 20);
    if (unlockAt) {
      (S.lowBatteryAlerts || [5, 2]).forEach((lv) => {
        if (!alertedLevels[lv] && lv < START_BAT && shown <= lv) {
          alertedLevels[lv] = true;
          banner({ icon: "battery", app: "배터리", title: "배터리 부족", body: shown + "% 남았어요. 충전기를 연결하세요." });
          vibrate([120, 60, 120]);
          tone(500, 0, 0.3, 0.08);
        }
      });
    }
  }
  function updateStatus() {
    const light = lockOn || callOn || !current || appDark || !!S.dark;
    $status.classList.toggle("light", light);
    $homebar.classList.toggle("light", light);
  }

  /* ================= 전원이 꺼질 때 ================= */
  function powerOff() {
    if (dead) return;
    dead = true;
    if (ringStopper) ringStopper();
    vibrate(0);
    haltSound();
    $off.classList.add("on");
    $off.innerHTML = "";
    const end = S.ending || {};
    if (end.title || end.text) {
      const card = el("div", "end-card");
      if (end.title) card.appendChild(el("div", "end-t", end.title));
      if (end.text) card.appendChild(el("div", "end-x", end.text));
      const rb = el("button", "end-b", end.button || "처음부터 다시");
      rb.onclick = (e) => { e.stopPropagation(); location.reload(); };
      card.appendChild(rb);
      $off.appendChild(card);
      setTimeout(() => card.classList.add("show"), Math.max(1, end.delay != null ? end.delay : 6) * 1000);
    }
    $off.onclick = function () {
      if ($off.querySelector(".dead-bat")) return;
      const b = el("div", "dead-bat");
      b.innerHTML = '<svg width="64" height="30" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.500" fill="none" stroke="#ff3b30" stroke-width="1.100"/><path d="M24.200 4.300v4.400c.9-.4 1.500-1.200 1.500-2.200s-.6-1.800-1.500-2.200z" fill="#ff3b30"/></svg>';
      $off.appendChild(b);
      setTimeout(() => b.remove(), 2200);
    };
  }

  /* ================= 홈 화면 ================= */
  function homeIcon(id, size, label) {
    const b = el("button", "hicon");
    const wrap = el("div", "hicon-wrap");
    wrap.appendChild(iconEl(id, size));
    const badge = el("span", "badge");
    badge.dataset.badge = id;
    badge.hidden = true;
    wrap.appendChild(badge);
    b.appendChild(wrap);
    if (label) b.appendChild(el("span", "hlabel", APPS[id].name));
    b.onclick = () => {
      if (APPS[id].decor) { b.classList.remove("wiggle"); void b.offsetWidth; b.classList.add("wiggle"); return; }
      openApp(id);
    };
    return b;
  }
  function buildHome() {
    const grid = el("div", "home-grid");
    ((S.layout && S.layout.grid) || ["photos", "notes", "calendar"]).forEach((id) => { if (APPS[id]) grid.appendChild(homeIcon(id, 60, true)); });
    const dots = el("div", "pgdots");
    dots.innerHTML = "<i class='on'></i><i></i>";
    const dock = el("div", "dock");
    ((S.layout && S.layout.dock) || ["phone", "messages", "internet", "music"]).forEach((id) => { if (APPS[id]) dock.appendChild(homeIcon(id, 58, false)); });
    $home.append(grid, dots, dock);
  }
  function updateBadges() {
    const msgCount = Object.keys(threads).reduce((s, k) => s + threads[k].unread, 0);
    const counts = { messages: msgCount, phone: missed };
    document.querySelectorAll("[data-badge]").forEach((b) => {
      const n = counts[b.dataset.badge] || 0;
      b.hidden = !n;
      b.textContent = n > 99 ? "99+" : String(n);
    });
  }

  /* ================= 앱 틀 ================= */
  function openApp(id) {
    if (lockOn || callOn || dead) return;
    if (current) closeApp();
    const root = el("div", "app");
    $appLayer.appendChild(root);
    current = { id: id, root: root, stack: [] };
    const first = {
      messages: screenThreads, phone: screenPhone, photos: screenPhotos, notes: screenNotes,
      web: screenWeb, internet: screenWeb, music: screenMusic, calendar: screenCalendar, clock: screenClock
    }[id];
    if (id === "phone") { missed = 0; updateBadges(); }
    pushScreen(first);
    requestAnimationFrame(() => root.classList.add("in"));
  }
  function closeApp() {
    if (!current) return;
    const r = current.root;
    current = null; openChatId = null; chatRef = null; appDark = false; npRefs = null;
    r.classList.remove("in");
    setTimeout(() => r.remove(), 240);
    updateStatus();
  }
  function renderTop() {
    if (!current) return;
    const fn = current.stack[current.stack.length - 1];
    current.root.innerHTML = "";
    npRefs = null;
    const n = fn();
    current.root.appendChild(n);
    if (n._after) n._after();
    updateStatus();
  }
  function pushScreen(fn) { if (!current) return; current.stack.push(fn); renderTop(); }
  function back() {
    if (!current || current.stack.length < 2) return;
    current.stack.pop();
    openChatId = null; chatRef = null; appDark = false;
    renderTop();
  }
  function navbar(backLabel, middle, rightNode) {
    const n = el("div", "navbar");
    const l = el("button", "nb-back");
    l.innerHTML = CHEVRON;
    l.appendChild(document.createTextNode(backLabel || "뒤로"));
    l.onclick = back;
    const r = el("div", "nb-right");
    if (rightNode) r.appendChild(rightNode);
    n.append(l, middle, r);
    return n;
  }
  function emptyNote(text) { return el("div", "empty", text); }
  function tabbar(items, active, onPick) {
    const tb = el("div", "tabbar");
    items.forEach((k) => {
      const b = el("button", "tab" + (k[0] === active ? " on" : ""), k[1]);
      b.onclick = () => onPick(k[0]);
      tb.appendChild(b);
    });
    return tb;
  }

  /* ================= 메시지 앱 ================= */
  function msgPreview(m) { return m.text ? m.text.replace(/\n/g, " ") : (m.img ? "사진" : ""); }
  function lastText(t) {
    for (let i = t.msgs.length - 1; i >= 0; i--) if (t.msgs[i].text || t.msgs[i].img) return t.msgs[i];
    return null;
  }
  function screenThreads() {
    const v = el("div", "screen");
    v.appendChild(el("div", "large-title", "메시지"));
    const list = el("div", "scroll");
    const ids = Object.keys(threads).filter((id) => lastText(threads[id])).sort((a, b) => threads[b].seq - threads[a].seq);
    if (!ids.length) list.appendChild(emptyNote("대화가 없어요"));
    ids.forEach((id) => {
      const c = S.contacts[id], t = threads[id], last = lastText(t);
      const row = el("button", "row thread");
      row.appendChild(el("span", "dot" + (t.unread ? " on" : "")));
      row.appendChild(avatar(c, 46));
      const info = el("div", "info");
      const top = el("div", "top");
      top.appendChild(el("div", "name", c.name));
      top.appendChild(el("div", "meta", last.time || ""));
      info.appendChild(top);
      info.appendChild(el("div", "preview", msgPreview(last)));
      row.appendChild(info);
      row.onclick = () => pushScreen(() => screenChat(id));
      list.appendChild(row);
    });
    v.appendChild(list);
    return v;
  }
  function screenChat(id) {
    const c = S.contacts[id], t = threads[id];
    t.unread = 0; openChatId = id; updateBadges();
    const v = el("div", "screen chat");
    const mid = el("div", "nb-contact");
    mid.append(avatar(c, 34), el("div", "nb-name", c.name));
    v.appendChild(navbar("메시지", mid));
    const box = el("div", "chat-box");
    v.appendChild(box);
    chatRef = { id: id, box: box };
    const bar = el("div", "inputbar");
    const inp = el("input", "inp");
    inp.type = "text"; inp.placeholder = "메시지"; inp.autocomplete = "off";
    const send = el("button", "send");
    send.innerHTML = ARROW; send.disabled = true;
    send.setAttribute("aria-label", "보내기");
    inp.oninput = () => { send.disabled = !inp.value.trim(); };
    function go() {
      const tx = inp.value.trim();
      if (!tx) return;
      inp.value = ""; send.disabled = true;
      sendFromUser(id, tx);
    }
    send.onclick = go;
    inp.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); go(); } };
    bar.append(inp, send);
    v.appendChild(bar);
    v._after = () => { renderChat(id); };
    return v;
  }
  function bubbleFor(m, side, tail) {
    const b = el("div", "msg " + side + (tail ? " tail" : ""));
    if (m.img) {
      b.classList.add("hasimg");
      const im = el("div", "msg-img");
      im.style.backgroundColor = m.img.color || "#9aa5c4";
      if (m.img.src) im.style.backgroundImage = "url('" + m.img.src + "')";
      b.appendChild(im);
      if (m.text) b.appendChild(el("div", "msg-cap", m.text));
    } else {
      b.textContent = m.text;
    }
    return b;
  }
  function renderChat(id) {
    if (!chatRef || chatRef.id !== id) return;
    const box = chatRef.box;
    box.innerHTML = "";
    const msgs = threads[id].msgs;
    let lastLabel = null, lastTs = null;
    msgs.forEach((m, i) => {
      if (m.day) { box.appendChild(el("div", "stamp", m.day)); lastLabel = null; lastTs = null; return; }
      const first = lastLabel === null;
      const showStamp = m.time && (first
        || (m.ts != null && lastTs != null && m.ts - lastTs >= 300000)
        || (m.ts != null && lastTs == null && m.time !== lastLabel));
      if (showStamp) {
        box.appendChild(el("div", "stamp", m.time));
        lastLabel = m.time; lastTs = m.ts != null ? m.ts : null;
      }
      const next = msgs[i + 1];
      const groupNext = next && !next.day && next.from === m.from;
      const side = m.from === "me" ? "me" : "them";
      const row = el("div", "brow " + side);
      row.appendChild(bubbleFor(m, side, !groupNext));
      box.appendChild(row);
      if (m.from === "me" && m.read && (!next || next.from !== "me")) box.appendChild(el("div", "readmark", "읽음"));
    });
    if (typing[id]) {
      const row = el("div", "brow them");
      const b = el("div", "msg them tail typing");
      b.innerHTML = "<i></i><i></i><i></i>";
      row.appendChild(b); box.appendChild(row);
    }
    box.scrollTop = box.scrollHeight;
  }
  function refreshThreadsIfOpen() {
    if (current && current.id === "messages" && current.stack.length === 1) renderTop();
  }

  /* ---------- 문자 보내기/받기 ---------- */
  function sendFromUser(id, text) {
    const t = threads[id], d = nowDate();
    const m = { from: "me", text: text, time: clock12(d), ts: d.getTime() };
    t.msgs.push(m); t.seq = ++seqCounter;
    renderChat(id);
    tone(900, 0, 0.09, 0.05);
    (async () => {
      await wait(0.9);
      m.read = true; renderChat(id);
      await respond(id, text);
    })();
  }
  function findRule(c, text) {
    const low = text.toLowerCase();
    const rules = c.replies || [];
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (r._used && r.once) continue;
      if (r.after && !done[r.after]) continue;
      const hit = (r.match || []).some((k) => (k instanceof RegExp ? k.test(text) : low.indexOf(String(k).toLowerCase()) !== -1));
      if (hit) return r;
    }
    return null;
  }
  async function respond(id, text) {
    const c = S.contacts[id];
    if (!c) return;
    const rule = findRule(c, text);
    if (rule) {
      if (rule.once) rule._used = true;
      if (rule.set) [].concat(rule.set).forEach((k) => { done[k] = true; });
      await wait(rule.delay != null ? rule.delay : 1.2);
      await sendSequence(id, [].concat(rule.say || []), { gap: rule.gap });
      if (rule.then) { await wait(rule.thenDelay != null ? rule.thenDelay : 1.5); runEvent(rule.then); }
      return;
    }
    const fb = c.fallback || [];
    if (!fb.length) return;
    c._fb = c._fb || 0;
    const line = fb[c._fb++ % fb.length];
    await wait(1.4);
    await sendSequence(id, [line]);
  }
  function itemText(it) { return typeof it === "string" ? it : (it.text || ""); }
  async function sendSequence(id, items, opts) {
    const gap = opts && opts.gap != null ? opts.gap : 0.9;
    for (const it of items) {
      typing[id] = true; renderChat(id);
      await wait(it && it.img ? 1.2 : Math.min(3, 0.7 + itemText(it).length * 0.07));
      typing[id] = false;
      deliver(id, it);
      await wait(gap);
    }
  }
  function deliver(id, item) {
    const t = threads[id] || (threads[id] = { msgs: [], unread: 0, seq: 0 });
    const d = nowDate();
    const m = { from: "them", time: clock12(d), ts: d.getTime() };
    if (typeof item === "string") m.text = item; else { m.text = item.text; m.img = item.img; }
    t.msgs.push(m);
    t.seq = ++seqCounter;
    const viewing = openChatId === id && current && current.id === "messages" && !lockOn && !callOn;
    if (viewing) {
      renderChat(id);
      tone(1500, 0, 0.12, 0.05);
    } else {
      t.unread++;
      updateBadges();
      if (!callOn) banner({ icon: "messages", app: "메시지", title: S.contacts[id] ? S.contacts[id].name : id, body: m.text || "사진", onTap: () => openChatFromBanner(id) });
      effects();
      refreshThreadsIfOpen();
    }
  }
  function openChatFromBanner(id) {
    if (lockOn || callOn) return;
    openApp("messages");
    pushScreen(() => screenChat(id));
  }

  /* ================= 알림 배너 ================= */
  function banner(o) {
    if (dead) return;
    $bannerLayer.innerHTML = "";
    const b = el("div", "banner");
    b.appendChild(iconEl(o.icon || "messages", 38));
    const tx = el("div", "btext");
    const top = el("div", "btop");
    top.append(el("span", "bapp", o.app || ""), el("span", "btime", "지금"));
    tx.append(top, el("div", "btitle", o.title || ""), el("div", "bbody", o.body || ""));
    b.appendChild(tx);
    b.onclick = () => { b.remove(); if (o.onTap) o.onTap(); };
    $bannerLayer.appendChild(b);
    requestAnimationFrame(() => b.classList.add("show"));
    setTimeout(() => { b.classList.remove("show"); setTimeout(() => b.remove(), 400); }, 5000);
  }

  /* ================= 전화 앱 ================= */
  function groupLog(list) {
    const out = [];
    list.forEach((x) => {
      const prev = out[out.length - 1];
      if (prev && prev.name === x.name && prev.kind === x.kind) prev.count++;
      else out.push(Object.assign({ count: 1 }, x));
    });
    return out;
  }
  function screenPhone() {
    const tab = phoneTab;
    const v = el("div", "screen");
    const unreadVm = voicemails.filter((x) => x.unread).length;
    v.appendChild(el("div", "large-title", tab === "recents" ? "최근 기록" : tab === "contacts" ? "연락처" : "음성 사서함"));
    const list = el("div", "scroll");
    if (tab === "recents") {
      const rows = groupLog(callLog);
      if (!rows.length) list.appendChild(emptyNote("통화 기록이 없어요"));
      rows.forEach((x) => {
        const row = el("button", "row" + (x.kind === "부재중" ? " missed" : ""));
        const info = el("div", "info");
        info.appendChild(el("div", "name", x.name + (x.count > 1 ? " (" + x.count + ")" : "")));
        info.appendChild(el("div", "preview", x.kind + " 전화"));
        row.appendChild(info);
        row.appendChild(el("div", "meta", x.time || ""));
        row.onclick = () => { const c = S.contacts[x.cid]; if (c && c.onCall) runEvent(c.onCall); };
        list.appendChild(row);
      });
    } else if (tab === "contacts") {
      const ids = Object.keys(S.contacts).filter((k) => !S.contacts[k].hidden).sort((a, b) => S.contacts[a].name.localeCompare(S.contacts[b].name, "ko"));
      ids.forEach((k) => {
        const c = S.contacts[k];
        const row = el("button", "row");
        row.appendChild(avatar(c, 40));
        const info = el("div", "info");
        info.appendChild(el("div", "name", c.name));
        row.appendChild(info);
        row.onclick = () => { if (c.onCall) runEvent(c.onCall); };
        list.appendChild(row);
      });
    } else {
      if (!voicemails.length) list.appendChild(emptyNote("음성 메시지가 없어요"));
      voicemails.forEach((x) => {
        const row = el("button", "row vm");
        row.appendChild(el("span", "dot" + (x.unread ? " on" : "")));
        const info = el("div", "info");
        const top = el("div", "top");
        top.appendChild(el("div", "name", x.name));
        top.appendChild(el("div", "meta", x.time || ""));
        info.appendChild(top);
        info.appendChild(el("div", "preview", (x.len ? x.len + " · " : "") + (x.text || "").replace(/\n/g, " ")));
        row.appendChild(info);
        row.onclick = () => { x.unread = false; pushScreen(() => screenVoicemail(x)); };
        list.appendChild(row);
      });
    }
    v.appendChild(list);
    v.appendChild(tabbar([["recents", "최근 기록"], ["contacts", "연락처"], ["voicemail", "음성 사서함" + (unreadVm ? " (" + unreadVm + ")" : "")]], tab, (k) => { phoneTab = k; current.stack[0] = screenPhone; renderTop(); }));
    return v;
  }
  function screenVoicemail(x) {
    const v = el("div", "screen");
    v.appendChild(navbar("음성 사서함", el("div", "nb-title", "")));
    const sc = el("div", "scroll vm-page");
    sc.appendChild(el("div", "vm-name", x.name));
    sc.appendChild(el("div", "vm-time", (x.time || "") + (x.len ? " · " + x.len : "")));
    const bar = el("div", "vm-bar");
    const fill = el("i");
    bar.appendChild(fill);
    sc.appendChild(bar);
    sc.appendChild(el("div", "vm-h", "음성 메시지 내용 (자동 받아쓰기)"));
    sc.appendChild(el("div", "vm-text", x.text || ""));
    v.appendChild(sc);
    return v;
  }
  function pushLog(cid, name, kind) {
    callLog.unshift({ cid: cid, name: name, kind: kind, time: clock12(nowDate()) });
    if (current && current.id === "phone" && current.stack.length === 1) renderTop();
  }
  function addVoicemail(ev, c) {
    const vm = typeof ev.voicemail === "string" ? { text: ev.voicemail } : ev.voicemail;
    voicemails.unshift({ cid: ev.from, name: c.name, time: clock12(nowDate()), len: vm.len || "0:" + pad(Math.min(59, 8 + Math.round((vm.text || "").length / 3))), text: vm.text, unread: true });
  }

  /* ================= 통화 ================= */
  let cancelCall = null;
  let priorityActive = false;
  function cbtn(kind, label) {
    const wrap = el("div", "cb");
    const btn = el("button", "cbtn " + kind);
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34" style="' + (kind === "red" ? "transform:rotate(135deg)" : "") + '">' + HANDSET + "</svg>";
    btn.setAttribute("aria-label", label);
    wrap.append(btn, el("span", "", label));
    return { wrap: wrap, btn: btn };
  }
  function incomingScreen(ev, c) {
    return new Promise((resolve) => {
      const L = $callLayer;
      L.innerHTML = "";
      const bg = el("div", "call-bg");
      bg.style.backgroundImage = WALL;
      const top = el("div", "call-top");
      top.append(el("div", "call-sub", ev.label || "휴대전화"), el("div", "call-name", c.callName || c.name));
      const act = el("div", "call-actions");
      const dec = cbtn("red", "거절"), acc = cbtn("green", "수락");
      act.append(dec.wrap, acc.wrap);
      L.append(bg, top, act);
      L.classList.add("on");
      const stop = startRing();
      const timer = setTimeout(() => fin("miss"), T(ev.ring != null ? ev.ring : 20));
      function fin(r) { clearTimeout(timer); stop(); cancelCall = null; resolve(r); }
      cancelCall = () => fin("cancel");
      dec.btn.onclick = () => fin("decline");
      acc.btn.onclick = () => fin("accept");
    });
  }
  function outgoingScreen(ev, c) {
    return new Promise((resolve) => {
      const L = $callLayer;
      L.innerHTML = "";
      const bg = el("div", "call-bg");
      bg.style.backgroundImage = WALL;
      const top = el("div", "call-top");
      const sub = el("div", "call-sub", "통화 연결 중…");
      top.append(sub, el("div", "call-name", c.name));
      const act = el("div", "call-actions single");
      const end = cbtn("red", "끊기");
      act.appendChild(end.wrap);
      L.append(bg, top, act);
      L.classList.add("on");
      let finished = false;
      const timer = setTimeout(() => { if (ev.answer === false) { sub.textContent = "연결할 수 없어요"; setTimeout(() => fin("noanswer"), 1500); } else fin("accept"); }, T(2.6));
      function fin(r) { if (finished) return; finished = true; clearTimeout(timer); cancelCall = null; resolve(r); }
      cancelCall = () => fin("hangup");
      end.btn.onclick = () => fin("hangup");
    });
  }
  async function talk(ev, c) {
    const L = $callLayer;
    L.innerHTML = "";
    const bg = el("div", "call-bg dim");
    bg.style.backgroundImage = WALL;
    const top = el("div", "call-top compact");
    const tm = el("div", "call-sub", "00:00");
    top.append(el("div", "call-name small", c.callName || c.name), tm);
    const cap = el("div", "captions");
    cap.appendChild(el("div", "cap-hint", "화면을 누르면 다음 대사로 넘어가요"));
    const grid = el("div", "call-grid");
    ["소리 끔", "키패드", "스피커"].forEach((n) => {
      const g = el("div", "cg");
      g.append(el("div", "cgc"), el("span", "", n));
      grid.appendChild(g);
    });
    const act = el("div", "call-actions single low");
    const end = cbtn("red", "종료");
    act.appendChild(end.wrap);
    L.append(bg, top, cap, grid, act);
    L.classList.add("on");
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const s = Math.floor(((Date.now() - startedAt) / 1000) * SPEED);
      tm.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60);
    }, 400);
    let hung = false, wake = null;
    function pause(sec) {
      return new Promise((res) => {
        const t = setTimeout(finish, T(sec));
        wake = finish;
        function finish() { clearTimeout(t); wake = null; res(); }
      });
    }
    cap.onclick = () => { if (wake) wake(); };
    end.btn.onclick = () => { hung = true; if (wake) wake(); };
    cancelCall = () => { hung = true; if (wake) wake(); };

    await pause(1.0);
    const lines = ev.lines || [];
    for (let i = 0; i < lines.length && !hung; i++) {
      const ln = lines[i];
      const hint = cap.querySelector(".cap-hint");
      if (hint) hint.remove();
      const card = el("div", "cline " + (ln.who === "me" ? "me" : "them"));
      card.appendChild(el("div", "who", ln.who === "me" ? "나" : (c.callName || c.name)));
      card.appendChild(el("div", "say", ln.text));
      cap.appendChild(card);
      cap.scrollTop = cap.scrollHeight;
      vibrate(25);
      if (ln.cut) { await pause(ln.wait != null ? ln.wait : 2.4); clearInterval(tick); powerOff(); return { hung: true }; }
      await pause(ln.wait != null ? ln.wait : 0.9 + String(ln.text || "").length * 0.08);
    }
    if (!hung) await pause(1.8);
    clearInterval(tick);
    cancelCall = null;
    tm.textContent = "통화 종료";
    await sleep(700);
    return { hung: hung };
  }
  function closeCallLayer() {
    const L = $callLayer;
    L.classList.remove("on");
    setTimeout(() => { if (!callOn) L.innerHTML = ""; }, 320);
    callOn = false;
    updateStatus();
  }
  async function runCall(ev, attempt) {
    attempt = attempt || 0;
    const prio = !!(ev.priority || ev.final);
    const retryN = ev.final ? 0 : (ev.retry && typeof ev.retry === "object" ? (ev.retry.times || 0) : (ev.retry || 0));
    const retryGap = ev.retry && typeof ev.retry === "object" ? (ev.retry.every != null ? ev.retry.every : 6) : (ev.retryGap != null ? ev.retryGap : 6);
    if (prio) {
      priorityActive = true;
      if (callOn && cancelCall) cancelCall();
      while (callOn) await sleep(150);
    } else {
      while (callOn) await sleep(400);
      if (priorityActive) return;
    }
    const c = (S.contacts && S.contacts[ev.from]) || { name: ev.from || "알 수 없음" };
    callOn = true;
    $bannerLayer.innerHTML = "";
    updateStatus();
    const out = ev.direction === "out";
    const result = out ? await outgoingScreen(ev, c) : await incomingScreen(ev, c);

    if (result === "accept") {
      const r = await talk(ev, c);
      closeCallLayer();
      pushLog(ev.from, c.name, out ? "발신" : "수신");
      if (ev.final) { await wait(1.6); powerOff(); return; }
      if (priorityActive && !prio) return;
      if (r.hung && ev.onHangup) { await wait(1.5); runEvent(ev.onHangup); }
      else if (ev.then) { await wait(ev.thenDelay != null ? ev.thenDelay : 2); runEvent(ev.then); }
      return;
    }
    closeCallLayer();
    if (out) { pushLog(ev.from, c.name, "발신"); return; }
    pushLog(ev.from, c.name, "부재중");
    missed++; updateBadges();
    const abort = result === "cancel" || (priorityActive && !prio);
    const lastTry = attempt >= retryN || abort;
    if (lastTry && ev.voicemail && !abort) addVoicemail(ev, c);
    banner({ icon: "phone", app: "전화", title: "부재중 전화", body: c.callName || c.name, onTap: () => openApp("phone") });
    if (abort) return;
    if (ev.final) { await wait(2.4); powerOff(); return; }
    if (!lastTry) {
      await wait(retryGap);
      return runCall(ev, attempt + 1);
    }
    const follow = result === "decline" ? ev.onDecline : ev.onMiss;
    if (follow) { await wait(2); runEvent(follow); }
  }

  /* ================= 사건 실행 ================= */
  async function runEvent(id) {
    if (dead) return;
    const ev = (S.events || []).find((e) => e.id === id);
    if (!ev) { console.warn("없는 사건 id:", id); return; }
    if (done[id] && !ev.repeat) return;
    done[id] = true;
    if (ev.type === "call") { await runCall(ev); return; }
    if (ev.type === "notify") {
      banner({ icon: ev.app && APPS[ev.app] ? ev.app : "messages", app: (APPS[ev.app] && APPS[ev.app].name) || ev.app || "알림", title: ev.title, body: ev.body });
      effects();
    } else {
      await sendSequence(ev.from, ev.texts || [], { gap: ev.gap });
    }
    if (ev.then) { await wait(ev.thenDelay != null ? ev.thenDelay : 1.5); runEvent(ev.then); }
  }
  function startStory() {
    unlockAt = Date.now();
    setTimeout(powerOff, T(LIFE));
    (S.events || []).forEach((ev) => {
      let at = null;
      if (typeof ev.at === "number") at = ev.at;
      else if (typeof ev.at === "string" && /^end-\s*\d+(\.\d+)?$/.test(ev.at.trim())) at = Math.max(0, LIFE - parseFloat(ev.at.replace(/[^\d.]/g, "")));
      else if (typeof ev.atEnd === "number") at = Math.max(0, LIFE - ev.atEnd);
      if (at != null) setTimeout(() => { runEvent(ev.id); }, T(at));
    });
  }

  /* ================= 사진 앱 ================= */
  function photoList(tab) {
    const all = S.photos || [];
    if (tab === "fav") return all.filter((p) => p.favorite && !p.deleted);
    if (tab === "del") return all.filter((p) => p.deleted);
    return all.filter((p) => !p.deleted);
  }
  function screenPhotos() {
    const v = el("div", "screen");
    v.appendChild(el("div", "large-title", photoTab === "all" ? "보관함" : photoTab === "fav" ? "즐겨찾기" : "최근 삭제된 항목"));
    const sc = el("div", "scroll");
    const list = photoList(photoTab);
    if (!list.length) sc.appendChild(emptyNote("사진이 없어요"));
    const grid = el("div", "photos");
    list.forEach((p, i) => {
      const b = el("button", "photo");
      b.style.backgroundColor = p.color || "#ccc";
      if (p.src) b.style.backgroundImage = "url('" + p.src + "')";
      if (p.favorite) { const h = el("span", "pfav"); h.innerHTML = HEART; b.appendChild(h); }
      b.onclick = () => pushScreen(() => screenPhoto(list, i));
      grid.appendChild(b);
    });
    sc.appendChild(grid);
    if (photoTab === "del" && list.length) sc.appendChild(el("div", "pnote", "삭제된 항목은 30일 후 완전히 삭제돼요."));
    v.appendChild(sc);
    if ((S.photos || []).some((p) => p.favorite || p.deleted)) {
      v.appendChild(tabbar([["all", "보관함"], ["fav", "즐겨찾기"], ["del", "삭제됨"]], photoTab, (k) => { photoTab = k; current.stack[0] = screenPhotos; renderTop(); }));
    }
    return v;
  }
  function screenPhoto(list, i) {
    appDark = true;
    const p = list[i];
    const v = el("div", "screen photo-view");
    v.appendChild(navbar("보관함", el("div", "nb-title", p.date || "")));
    const stage = el("div", "stage");
    const big = el("div", "big");
    big.style.backgroundColor = p.color || "#222";
    if (p.src) big.style.backgroundImage = "url('" + p.src + "')";
    stage.appendChild(big);
    if (i > 0) { const pv = el("button", "pv left"); pv.innerHTML = CHEVRON; pv.onclick = () => { current.stack[current.stack.length - 1] = () => screenPhoto(list, i - 1); renderTop(); }; stage.appendChild(pv); }
    if (i < list.length - 1) { const nx = el("button", "pv right"); nx.innerHTML = CHEVRON; nx.onclick = () => { current.stack[current.stack.length - 1] = () => screenPhoto(list, i + 1); renderTop(); }; stage.appendChild(nx); }
    v.appendChild(stage);
    const info = el("div", "pinfo");
    if (p.deleted) info.appendChild(el("div", "pdel", (p.daysLeft != null ? p.daysLeft : 12) + "일 후 완전히 삭제"));
    if (p.caption) info.appendChild(el("div", "cap", p.caption));
    info.appendChild(el("div", "pidx", (i + 1) + " / " + list.length));
    v.appendChild(info);
    return v;
  }

  /* ================= 메모 앱 ================= */
  function screenNotes() {
    const v = el("div", "screen");
    v.appendChild(el("div", "large-title", "메모"));
    const sc = el("div", "scroll");
    const list = S.notes || [];
    if (!list.length) sc.appendChild(emptyNote("메모가 없어요"));
    list.forEach((n) => {
      const row = el("button", "row note");
      const info = el("div", "info");
      const nm = el("div", "name", n.title);
      if (n.lock) { const lk = el("span", "nlk"); lk.innerHTML = LOCKSM; nm.appendChild(lk); }
      info.appendChild(nm);
      info.appendChild(el("div", "preview", (n.date || "") + "  " + (n.lock && !n._open ? "잠긴 메모" : String(n.body || "").replace(/\n/g, " "))));
      row.appendChild(info);
      row.onclick = () => pushScreen(() => (n.lock && !n._open ? screenNoteLock(n) : screenNote(n)));
      sc.appendChild(row);
    });
    v.appendChild(sc);
    return v;
  }
  function screenNote(n) {
    const v = el("div", "screen");
    v.appendChild(navbar("메모", el("div", "nb-title", "")));
    const page = el("div", "scroll note-page");
    page.appendChild(el("div", "note-date", n.date || ""));
    page.appendChild(el("h2", "", n.title));
    page.appendChild(el("div", "note-body", n.body || ""));
    v.appendChild(page);
    return v;
  }
  function screenNoteLock(n) {
    const v = el("div", "screen");
    v.appendChild(navbar("메모", el("div", "nb-title", "")));
    const box = el("div", "nlock");
    const ic = el("div", "nlock-ic"); ic.innerHTML = LOCKSM.replace('width="11" height="13"', 'width="34" height="44"');
    box.append(ic, el("div", "nlock-t", "이 메모는 잠겨 있어요"));
    if (n.hint) box.appendChild(el("div", "nlock-h", "힌트: " + n.hint));
    const inp = el("input", "nlock-in");
    inp.type = "password"; inp.inputMode = "numeric"; inp.placeholder = "암호"; inp.autocomplete = "off";
    const err = el("div", "nlock-e");
    const ok = el("button", "nlock-b", "메모 보기");
    function check() {
      if (inp.value === String(n.lock)) {
        n._open = true;
        current.stack[current.stack.length - 1] = () => screenNote(n);
        renderTop();
      } else { err.textContent = "암호가 맞지 않아요"; inp.value = ""; vibrate(120); }
    }
    ok.onclick = check;
    inp.onkeydown = (e) => { if (e.key === "Enter") check(); };
    box.append(inp, err, ok);
    v.appendChild(box);
    return v;
  }

  /* ================= 캘린더 ================= */
  let calSel = null;
  function screenCalendar() {
    const C = S.calendar || {};
    const nd = nowDate();
    const y = C.year || nd.getFullYear(), mo = C.month || nd.getMonth() + 1, today = C.today || nd.getDate();
    if (calSel == null) calSel = today;
    const events = C.events || [];
    const v = el("div", "screen");
    v.appendChild(el("div", "large-title", y + "년 " + mo + "월"));
    const sc = el("div", "scroll");
    const wd = el("div", "cal-wd");
    "일월화수목금토".split("").forEach((d, i) => wd.appendChild(el("span", i === 0 ? "sun" : "", d)));
    sc.appendChild(wd);
    const grid = el("div", "cal-grid");
    const first = new Date(y, mo - 1, 1).getDay();
    const days = new Date(y, mo, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(el("span", "cal-blank"));
    for (let d = 1; d <= days; d++) {
      const b = el("button", "cal-d" + (d === today ? " today" : "") + (d === calSel ? " sel" : ""));
      b.appendChild(el("span", "", String(d)));
      if (events.some((e) => e.day === d)) b.appendChild(el("i"));
      b.onclick = () => { calSel = d; renderTop(); };
      grid.appendChild(b);
    }
    sc.appendChild(grid);
    sc.appendChild(el("div", "cal-date", mo + "월 " + calSel + "일"));
    const list = events.filter((e) => e.day === calSel);
    if (!list.length) sc.appendChild(el("div", "cal-none", "일정 없음"));
    list.forEach((e) => {
      const row = el("div", "cal-ev");
      const bar = el("i"); bar.style.background = e.color || "#0a84ff";
      const info = el("div", "info");
      info.appendChild(el("div", "name", e.title));
      if (e.place) info.appendChild(el("div", "preview", e.place));
      if (e.note) info.appendChild(el("div", "preview", e.note));
      row.append(el("div", "cal-time", e.time || ""), bar, info);
      sc.appendChild(row);
    });
    v.appendChild(sc);
    return v;
  }

  /* ================= 시계(알람) 앱 ================= */
  function screenClock() {
    const v = el("div", "screen");
    v.appendChild(el("div", "large-title", "알람"));
    const sc = el("div", "scroll");
    const list = S.alarms || [];
    if (!list.length) sc.appendChild(emptyNote("알람이 없어요"));
    list.forEach((a) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(a.time || "");
      const h = m ? +m[1] : 0, mm = m ? m[2] : "00";
      const row = el("div", "alarm" + (a.on ? "" : " muted"));
      const left = el("div", "al-l");
      const t = el("div", "al-t");
      t.append(el("small", "", h >= 12 ? "오후" : "오전"), document.createTextNode(" " + ((h % 12) || 12) + ":" + mm));
      left.append(t, el("div", "al-s", (a.label || "알람") + (a.repeat ? ", " + a.repeat : "")));
      const sw = el("button", "sw" + (a.on ? " on" : ""));
      sw.appendChild(el("i"));
      sw.onclick = () => { a.on = !a.on; row.classList.toggle("muted", !a.on); sw.classList.toggle("on", a.on); };
      row.append(left, sw);
      sc.appendChild(row);
    });
    v.appendChild(sc);
    return v;
  }

  /* ================= 인터넷 앱 ================= */
  const WEB = S.web || {};
  const BM_COLORS = ["#d9534f", "#5b8def", "#8e5bd9", "#2bb673", "#e8912d", "#e0549a"];
  function hostOf(url) { return String(url || "").replace(/^https?:\/\//, "").split("/")[0]; }
  function findPage(id) { return (WEB.pages || []).find((p) => p.id === id); }
  function plainBody(p) { return (p.body || []).map((b) => (typeof b === "string" ? b : (b.quote || b.h || b.caption || ""))).join(" "); }
  function snippet(p) {
    const f = (p.body || []).find((b) => typeof b === "string") || "";
    return f.length > 90 ? f.slice(0, 90) + "…" : f;
  }
  function searchPages(q) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const whole = q.toLowerCase();
    return (WEB.pages || []).map((p) => {
      const hay = [p.title, (p.tags || []).join(" "), p.site, plainBody(p)].join(" ").toLowerCase();
      let score = tokens.filter((t) => hay.indexOf(t) !== -1).length;
      if (hay.indexOf(whole) !== -1) score += 2;
      return { p: p, score: score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.p);
  }
  function screenWeb() {
    const v = el("div", "screen web-home");
    const sc = el("div", "scroll");
    const bms = WEB.bookmarks || [];
    if (bms.length) {
      sc.appendChild(el("div", "web-h", "즐겨찾기"));
      const grid = el("div", "bm-grid");
      bms.forEach((b, i) => {
        const btn = el("button", "bm");
        const sq = el("div", "bm-ico", (b.name || "?").charAt(0));
        sq.style.background = b.color || BM_COLORS[i % BM_COLORS.length];
        btn.append(sq, el("span", "", b.name));
        btn.onclick = () => openPage(b.page);
        grid.appendChild(btn);
      });
      sc.appendChild(grid);
    }
    const visited = (WEB.pages || []).filter((p) => p.visited);
    if (visited.length) {
      sc.appendChild(el("div", "web-h", "최근 방문"));
      visited.forEach((p) => sc.appendChild(histRow(GLOBE, p.title, hostOf(p.url), p.time, () => openPage(p.id))));
    }
    const hist = S.history || [];
    sc.appendChild(el("div", "web-h", "최근 검색"));
    if (!hist.length) sc.appendChild(emptyNote("검색 기록이 없어요"));
    hist.forEach((h) => sc.appendChild(histRow(MAG, h.text, "", h.time, () => { if (h.page && findPage(h.page)) openPage(h.page); else searchFor(h.text); })));
    v.appendChild(sc);
    const bar = el("div", "addr-bar");
    const inp = el("input", "addr");
    inp.type = "text"; inp.placeholder = "검색 또는 웹 사이트 이름 입력"; inp.autocomplete = "off";
    inp.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing && inp.value.trim()) searchFor(inp.value.trim()); };
    bar.appendChild(inp);
    v.appendChild(bar);
    return v;
  }
  function histRow(icon, title, sub, time, onTap) {
    const row = el("button", "row hist");
    const ic = el("span", "hist-ic"); ic.innerHTML = icon;
    const info = el("div", "info");
    info.appendChild(el("div", "name", title));
    if (sub) info.appendChild(el("div", "preview", sub));
    row.append(ic, info, el("div", "meta", time || ""));
    row.onclick = onTap;
    return row;
  }
  function openPage(id) { const p = findPage(id); if (p) pushScreen(() => screenPage(p)); }
  function searchFor(q) { pushScreen(() => screenSearch(q)); }
  function webBar(label) {
    const top = el("div", "webbar");
    const bk = el("button", "wb-back"); bk.innerHTML = CHEVRON; bk.onclick = back; bk.setAttribute("aria-label", "뒤로");
    const pill = el("div", "pill");
    const lk = el("span", "pill-lk"); lk.innerHTML = LOCKSM;
    pill.append(lk, el("span", "pill-t", label));
    const rl = el("span", "pill-rl"); rl.innerHTML = TB.reload; pill.appendChild(rl);
    top.append(bk, pill);
    return top;
  }
  function webTools() {
    const tb = el("div", "webtools");
    [["back", back], ["fwd", null], ["share", null], ["book", null], ["tabs", null]].forEach((k) => {
      const b = el("button", "wt"); b.innerHTML = TB[k[0]];
      if (k[1]) b.onclick = k[1]; else b.classList.add("dim");
      tb.appendChild(b);
    });
    return tb;
  }
  function screenSearch(q) {
    const v = el("div", "screen webpage");
    v.appendChild(webBar("검색"));
    const sc = el("div", "scroll page");
    sc.appendChild(el("div", "sq", q));
    const res = searchPages(q);
    if (!res.length) sc.appendChild(emptyNote("검색 결과가 없어요"));
    res.forEach((p) => {
      const it = el("button", "sr");
      it.appendChild(el("div", "sr-u", p.url || p.site || ""));
      it.appendChild(el("div", "sr-t", p.title || ""));
      it.appendChild(el("div", "sr-s", snippet(p)));
      it.onclick = () => openPage(p.id);
      sc.appendChild(it);
    });
    v.appendChild(sc);
    v.appendChild(webTools());
    return v;
  }
  function screenPage(p) {
    const v = el("div", "screen webpage");
    v.appendChild(webBar(hostOf(p.url) || p.site || ""));
    const sc = el("div", "scroll page");
    sc.appendChild(el("div", "ar-site", p.site || ""));
    sc.appendChild(el("h1", "ar-title", p.title || ""));
    sc.appendChild(el("div", "ar-meta", [p.author, p.time].filter(Boolean).join(" · ")));
    (p.body || []).forEach((b) => {
      if (typeof b === "string") { sc.appendChild(el("p", "ar-p", b)); return; }
      if (b.h) { sc.appendChild(el("h2", "ar-h", b.h)); return; }
      if (b.quote) { sc.appendChild(el("blockquote", "ar-q", b.quote)); return; }
      if (b.img) {
        const h = el("div", "ar-hero");
        if (String(b.img).charAt(0) === "#") h.style.backgroundColor = b.img;
        else { h.style.backgroundColor = "#8a8a90"; h.style.backgroundImage = "url('" + b.img + "')"; }
        sc.appendChild(h);
        if (b.caption) sc.appendChild(el("div", "ar-cap", b.caption));
      }
    });
    const cm = p.comments || [];
    if (cm.length) {
      sc.appendChild(el("div", "cm-h", "댓글 " + cm.length));
      cm.forEach((c) => {
        const row = el("div", "cm");
        const top2 = el("div", "cm-top");
        top2.append(el("span", "cm-u", c.name || "익명"), el("span", "cm-t", c.time || ""));
        row.appendChild(top2);
        row.appendChild(el("div", "cm-x", c.text || ""));
        const lk2 = el("div", "cm-l");
        lk2.innerHTML = HEART;
        lk2.appendChild(document.createTextNode(" " + (c.likes != null ? c.likes : 0)));
        row.appendChild(lk2);
        sc.appendChild(row);
      });
    }
    v.appendChild(sc);
    v.appendChild(webTools());
    return v;
  }

  /* ================= 음악 앱 ================= */
  const MUSIC = S.music || {};
  const songs = MUSIC.songs || [];
  const music = { index: -1, track: null, playing: false, pos: 0, audio: null, amb: null };
  let npRefs = null;
  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + pad(s % 60); }
  function durOf() {
    if (music.audio && isFinite(music.audio.duration) && music.audio.duration > 0) return music.audio.duration;
    return (music.track && +music.track.duration) || 200;
  }
  function stopAmbient() {
    if (!music.amb) return;
    const a = music.amb; music.amb = null;
    try { a.stop(); } catch (e) { /* 무시 */ }
  }
  function startAmbient(i) {
    stopAmbient();
    if (MUSIC.ambient === false) return;
    const a = audio();
    if (!a) return;
    const chords = [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [207.65, 261.63, 311.13]];
    const ch = chords[((i % chords.length) + chords.length) % chords.length];
    const master = a.createGain();
    master.gain.value = 0.0001;
    master.connect(a.destination);
    master.gain.linearRampToValueAtTime(0.04, a.currentTime + 1.5);
    const oscs = ch.map((f, k) => { const o = a.createOscillator(); o.type = k === 0 ? "triangle" : "sine"; o.frequency.value = f; const g = a.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(master); o.start(); return o; });
    const lfo = a.createOscillator(); lfo.frequency.value = 0.15;
    const lg = a.createGain(); lg.gain.value = 0.015;
    lfo.connect(lg); lg.connect(master.gain); lfo.start();
    music.amb = { stop: function () {
      try { master.gain.cancelScheduledValues(a.currentTime); master.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.25); } catch (e) { /* 무시 */ }
      setTimeout(() => { oscs.forEach((o) => { try { o.stop(); } catch (e) { /* 무시 */ } }); try { lfo.stop(); } catch (e) { /* 무시 */ } }, 350);
    } };
  }
  function haltSound() {
    if (music.audio) { try { music.audio.pause(); } catch (e) { /* 무시 */ } }
    stopAmbient();
  }
  function playSong(i) {
    haltSound();
    music.audio = null;
    music.index = i; music.track = songs[i]; music.pos = 0; music.playing = true;
    if (music.track.src && S.sound !== false) {
      try {
        const a = new Audio(music.track.src);
        a.onerror = () => { if (music.audio === a) { music.audio = null; startAmbient(i); } };
        music.audio = a;
        const pr = a.play();
        if (pr && pr.catch) pr.catch(() => { if (music.audio === a) music.audio = null; });
      } catch (e) { music.audio = null; }
    } else {
      startAmbient(i);
    }
  }
  function stepTrack(dir) {
    if (!songs.length) return;
    playSong((music.index + dir + songs.length) % songs.length);
    if (current && current.id === "music") renderTop();
  }
  function togglePlay() {
    if (!music.track) return;
    music.playing = !music.playing;
    if (music.audio) { try { if (music.playing) music.audio.play(); else music.audio.pause(); } catch (e) { /* 무시 */ } }
    else if (music.playing) startAmbient(music.index);
    else stopAmbient();
    if (current && current.id === "music") renderTop();
  }
  setInterval(function () {
    if (dead || !music.playing || !music.track) return;
    if (music.audio) { music.pos = music.audio.currentTime; if (music.audio.ended) { stepTrack(1); return; } }
    else music.pos += 0.5;
    if (music.pos >= durOf()) { stepTrack(1); return; }
    if (npRefs && npRefs.root.isConnected) {
      npRefs.fill.style.width = Math.min(100, (music.pos / durOf()) * 100) + "%";
      npRefs.cur.textContent = fmt(music.pos);
      npRefs.left.textContent = "-" + fmt(durOf() - music.pos);
      markLyric();
    }
  }, 500);
  function artBox(song, cls) {
    const a = el("div", cls || "art");
    a.style.background = "linear-gradient(140deg," + ((song && song.color) || "#5e5ce6") + ",#16161f)";
    if (song && song.cover) { a.style.backgroundImage = "url('" + song.cover + "')"; a.style.backgroundSize = "cover"; a.style.backgroundPosition = "center"; }
    else a.innerHTML = NOTE_GLYPH;
    return a;
  }
  function miniPlayer() {
    if (!music.track) return null;
    const m = el("div", "mini");
    m.appendChild(artBox(music.track, "art sm"));
    const info = el("div", "info");
    info.append(el("div", "name", music.track.title), el("div", "preview", music.track.artist || ""));
    const pb = el("button", "mini-b"); pb.innerHTML = music.playing ? P_PAUSE : P_PLAY;
    pb.onclick = (e) => { e.stopPropagation(); togglePlay(); };
    const nb = el("button", "mini-b"); nb.innerHTML = P_NEXT;
    nb.onclick = (e) => { e.stopPropagation(); stepTrack(1); };
    m.append(info, pb, nb);
    m.onclick = () => pushScreen(screenNow);
    return m;
  }
  function screenMusic() {
    const v = el("div", "screen");
    v.appendChild(el("div", "large-title", "보관함"));
    const sc = el("div", "scroll");
    if (!songs.length) sc.appendChild(emptyNote("곡이 없어요"));
    songs.forEach((s, i) => {
      const row = el("button", "row pl" + (music.track === s ? " cur" : ""));
      row.appendChild(artBox(s, "art md"));
      const info = el("div", "info");
      info.append(el("div", "name", s.title), el("div", "preview", [s.artist, s.album].filter(Boolean).join(" · ")));
      row.append(info, el("div", "meta", fmt(+s.duration || 0)));
      row.onclick = () => { if (music.track !== s) playSong(i); pushScreen(screenNow); };
      sc.appendChild(row);
    });
    v.appendChild(sc);
    const mp = miniPlayer(); if (mp) v.appendChild(mp);
    return v;
  }
  function markLyric() {
    if (!npRefs || !npRefs.lines.length) return;
    const idx = Math.min(npRefs.lines.length - 1, Math.floor((music.pos / durOf()) * npRefs.lines.length));
    if (idx === npRefs.idx) return;
    npRefs.idx = idx;
    npRefs.lines.forEach((l, i) => l.classList.toggle("on", i === idx));
    const L = npRefs.lines[idx], box = npRefs.lyr;
    box.scrollTop = L.offsetTop - box.clientHeight / 2 + L.clientHeight / 2;
  }
  function screenNow() {
    const t = music.track;
    const v = el("div", "screen now");
    v.appendChild(navbar("보관함", el("div", "nb-title", "재생 중")));
    if (!t) { v.appendChild(emptyNote("재생 중인 곡이 없어요")); return v; }
    const art = artBox(t, "art xl");
    if (!music.playing) art.classList.add("paused");
    v.appendChild(art);
    const meta = el("div", "np-meta");
    meta.append(el("div", "np-t", t.title), el("div", "np-a", [t.artist, t.album].filter(Boolean).join(" — ")));
    v.appendChild(meta);
    const bar = el("div", "np-bar"), fill = el("i");
    bar.appendChild(fill);
    const times = el("div", "np-times");
    const cur = el("span", "", fmt(music.pos)), left = el("span", "", "-" + fmt(durOf() - music.pos));
    times.append(cur, left);
    v.append(bar, times);
    fill.style.width = Math.min(100, (music.pos / durOf()) * 100) + "%";
    bar.onclick = (e) => {
      const r = bar.getBoundingClientRect();
      music.pos = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * durOf();
      if (music.audio) { try { music.audio.currentTime = music.pos; } catch (er) { /* 무시 */ } }
      fill.style.width = (music.pos / durOf()) * 100 + "%";
    };
    const ctr = el("div", "np-ctrl");
    const pv = el("button", "np-b"); pv.innerHTML = P_PREV; pv.onclick = () => stepTrack(-1);
    const pp = el("button", "np-b big"); pp.innerHTML = music.playing ? P_PAUSE : P_PLAY; pp.onclick = togglePlay;
    const nx = el("button", "np-b"); nx.innerHTML = P_NEXT; nx.onclick = () => stepTrack(1);
    ctr.append(pv, pp, nx);
    v.appendChild(ctr);
    const lyr = el("div", "lyrics");
    const lines = (t.lyrics || []).map((tx) => { const l = el("div", "ly", tx || " "); lyr.appendChild(l); return l; });
    v.appendChild(lyr);
    npRefs = { root: v, fill: fill, cur: cur, left: left, lines: lines, lyr: lyr, idx: -1 };
    v._after = markLyric;
    return v;
  }

  /* ================= 잠금 화면 ================= */
  const LOCK_ICON = '<svg width="18" height="24" viewBox="0 0 18 24"><rect x="1" y="10" width="16" height="13" rx="3" fill="currentColor"/><path d="M4.500 10V7a4.500 4.500 0 019 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const FLASH = '<svg width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M9 2h6l-1 6h-4zM8.500 9.500h7L14.500 22h-5z"/></svg>';
  const CAM = '<svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="3" fill="currentColor"/><circle cx="12" cy="13" r="3.200" fill="#222"/></svg>';
  const LETTERS = { 2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ" };
  function buildLock() {
    const L = $lockLayer;
    const bg = el("div", "lock-bg");
    bg.style.background = WALL;
    const main = el("div", "lock-main");
    const ic = el("div", "lock-ic"); ic.innerHTML = LOCK_ICON;
    const date = el("div", "lock-date", dateLabel());
    const time = el("div", "lock-time", clockShort(nowDate()));
    const notes = el("div", "lock-notes");
    (S.lockNotifications || []).forEach((n) => {
      const card = el("div", "lock-note");
      const top = el("div", "btop");
      top.append(el("span", "bapp", n.app || ""), el("span", "btime", n.time || "방금"));
      card.append(top, el("div", "btitle", n.title || ""), el("div", "bbody", n.body || ""));
      notes.appendChild(card);
    });
    const hint = el("div", "lock-hint", "화면을 눌러 잠금 해제");
    const qL = el("div", "lock-q left"); qL.innerHTML = FLASH;
    const qR = el("div", "lock-q right"); qR.innerHTML = CAM;
    main.append(ic, date, time, notes, hint, qL, qR);
    L.append(bg, main);
    setInterval(() => { if (!dead) time.textContent = clockShort(nowDate()); }, 3000);
    main.onclick = showPad;
  }
  function showPad() {
    audio();
    const L = $lockLayer;
    if (L.querySelector(".pad")) return;
    const pw = String(S.passcode || "0000");
    let input = "", wrong = 0;
    const pad_ = el("div", "pad");
    const title = el("div", "pad-title", "암호 입력");
    const dots = el("div", "dots");
    for (let i = 0; i < pw.length; i++) dots.appendChild(el("i"));
    const keys = el("div", "keys");
    const cancel = el("button", "pad-link", "취소");
    function draw() {
      [].forEach.call(dots.children, (d, i) => d.classList.toggle("on", i < input.length));
      cancel.textContent = input.length ? "삭제" : "취소";
    }
    function press(d) {
      if (input.length >= pw.length) return;
      tone(700, 0, 0.05, 0.04);
      input += d; draw();
      if (input.length === pw.length) setTimeout(check, 140);
    }
    function check() {
      if (input === pw) { unlock(); return; }
      wrong++;
      vibrate(200);
      dots.classList.add("shake");
      setTimeout(() => {
        dots.classList.remove("shake");
        input = ""; draw();
        title.textContent = wrong >= 2 && S.hint ? "힌트: " + S.hint : "암호가 틀렸어요";
      }, 460);
    }
    for (let n = 1; n <= 9; n++) keys.appendChild(keyBtn(String(n), LETTERS[n] || "", press));
    keys.appendChild(el("span"));
    keys.appendChild(keyBtn("0", "", press));
    cancel.onclick = () => {
      if (input.length) { input = input.slice(0, -1); draw(); }
      else { pad_.remove(); }
    };
    keys.appendChild(cancel);
    pad_.append(title, dots, keys);
    L.appendChild(pad_);
    draw();
  }
  function keyBtn(n, letters, press) {
    const b = el("button", "key");
    b.appendChild(el("b", "", n));
    b.appendChild(el("small", "", letters));
    b.onclick = (e) => { e.stopPropagation(); press(n); };
    return b;
  }
  function unlock() {
    lockOn = false;
    $lockLayer.classList.add("gone");
    updateStatus();
    setTimeout(() => { $lockLayer.innerHTML = ""; }, 700);
    startStory();
  }

  /* ================= 시작 ================= */
  $homebar.onclick = () => { if (!lockOn && !callOn && !dead) closeApp(); };
  buildStatus();
  buildHome();
  buildLock();
  updateBadges();
  updateStatus();
})();
