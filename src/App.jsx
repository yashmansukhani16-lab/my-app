import { useState, useEffect, useRef } from "react";

const XP_EASY   = 30;
const XP_MEDIUM = 50;
const XP_HARD   = 80;

// mode → which difficulties are allowed
const DIFFICULTY_MODES = {
  easy:   { label:"Easy",          allowed:["Easy"],                      desc:"Easy tasks only. Perfect to build a habit." },
  mixed:  { label:"Easy + Medium", allowed:["Easy","Medium"],             desc:"A gentle mix. Good for daily consistency." },
  hard:   { label:"Medium + Hard", allowed:["Medium","Hard"],             desc:"Focused and challenging. Push yourself." },
  all:    { label:"All Levels",    allowed:["Easy","Medium","Hard"],      desc:"Full mix. Something from every difficulty." },
};

const CATEGORY_COLORS = {
  Health:       { border:"rgba(0,200,120,0.45)",  bg:"rgba(0,160,90,0.1)",   text:"rgba(0,220,140,0.85)"  },
  Productivity: { border:"rgba(0,160,255,0.45)",  bg:"rgba(0,100,200,0.1)",  text:"rgba(60,190,255,0.85)" },
  Discipline:   { border:"rgba(180,80,255,0.45)", bg:"rgba(120,40,200,0.1)", text:"rgba(200,120,255,0.85)" },
  Routine:      { border:"rgba(255,180,0,0.45)",  bg:"rgba(180,110,0,0.1)",  text:"rgba(255,200,60,0.85)" },
  Study:        { border:"rgba(0,210,200,0.45)",  bg:"rgba(0,150,140,0.1)",  text:"rgba(0,230,220,0.85)"  },
  Fitness:      { border:"rgba(255,80,120,0.45)", bg:"rgba(180,30,70,0.1)",  text:"rgba(255,110,150,0.85)" },
  Social:       { border:"rgba(255,160,50,0.45)", bg:"rgba(180,100,0,0.1)",  text:"rgba(255,185,80,0.85)" },
};

const TASK_POOL = {
  Health: [
    { text:"Drink 3–4 liters of water",             difficulty:"Easy"   },
    { text:"Do 20 push-ups",                         difficulty:"Medium" },
    { text:"Do 20 squats",                           difficulty:"Medium" },
    { text:"Go for a 10–15 minute walk",             difficulty:"Easy"   },
    { text:"Stretch for 5–10 minutes",               difficulty:"Easy"   },
    { text:"Run 3km without stopping",               difficulty:"Hard"   },
    { text:"Do 100 push-ups across the day",         difficulty:"Hard"   },
    { text:"Complete a 30-min workout",              difficulty:"Hard"   },
  ],
  Productivity: [
    { text:"Read 20 pages of a book",                difficulty:"Medium" },
    { text:"Focus work or study for 30 min",         difficulty:"Medium" },
    { text:"Plan your day (5–10 min)",               difficulty:"Easy"   },
    { text:"Review what you learned today",          difficulty:"Easy"   },
    { text:"Deep work for 2 hours, no distractions", difficulty:"Hard"   },
    { text:"Finish one task you've been avoiding",   difficulty:"Hard"   },
  ],
  Discipline: [
    { text:"Avoid social media for 1 hour",          difficulty:"Medium" },
    { text:"No social media 1 hr after waking up",   difficulty:"Medium" },
    { text:"Wake up without snoozing the alarm",     difficulty:"Medium" },
    { text:"Spend 10 minutes in silence",            difficulty:"Easy"   },
    { text:"Wake up on time",                        difficulty:"Easy"   },
    { text:"Sleep on time",                          difficulty:"Easy"   },
    { text:"Zero social media for the entire day",   difficulty:"Hard"   },
    { text:"Cold shower, no hesitation",             difficulty:"Hard"   },
    { text:"Wake up 1 hour earlier than usual",      difficulty:"Hard"   },
  ],
  Routine: [
    { text:"Take a shower",                          difficulty:"Easy"   },
    { text:"Clean your workspace",                   difficulty:"Easy"   },
    { text:"Tidy up your room",                      difficulty:"Easy"   },
    { text:"Prepare clothes for tomorrow",           difficulty:"Easy"   },
    { text:"Deep clean one area of your home",       difficulty:"Hard"   },
    { text:"Cook a proper meal instead of ordering", difficulty:"Medium" },
  ],
  Study: [
    { text:"Study for 45 minutes",                   difficulty:"Medium" },
    { text:"Revise your notes",                      difficulty:"Easy"   },
    { text:"Practice problems or exercises",         difficulty:"Medium" },
    { text:"Watch one educational video",            difficulty:"Easy"   },
    { text:"Write a summary of today's topic",       difficulty:"Easy"   },
    { text:"Study for 2 hours straight",             difficulty:"Hard"   },
    { text:"Teach a concept to someone else",        difficulty:"Hard"   },
    { text:"Complete a mock test or quiz",           difficulty:"Hard"   },
  ],
  Fitness: [
    { text:"Go to the gym",                          difficulty:"Medium" },
    { text:"10-minute cardio session",               difficulty:"Medium" },
    { text:"Do 30 push-ups",                         difficulty:"Medium" },
    { text:"10-minute home workout",                 difficulty:"Easy"   },
    { text:"Hold a plank for 60 seconds",            difficulty:"Medium" },
    { text:"1-hour gym session, full effort",        difficulty:"Hard"   },
    { text:"Run 5km",                                difficulty:"Hard"   },
    { text:"100 squats across the day",              difficulty:"Hard"   },
  ],
  Social: [
    { text:"Call or text a friend",                  difficulty:"Easy"   },
    { text:"Spend quality time with family",         difficulty:"Easy"   },
    { text:"Compliment someone today",               difficulty:"Easy"   },
    { text:"Reply to a message you've ignored",      difficulty:"Easy"   },
    { text:"Start a conversation with someone new",  difficulty:"Medium" },
    { text:"Resolve a conflict or clear the air",    difficulty:"Hard"   },
  ],
};

// Simple deterministic seed from date string + offset
function dateSeed(dateStr, offset = 0) {
  let s = offset * 999983;
  for (let i = 0; i < dateStr.length; i++) s = (s * 31 + dateStr.charCodeAt(i)) >>> 0;
  return s;
}

function xpForDifficulty(d) {
  if (d === "Hard")   return XP_HARD;
  if (d === "Medium") return XP_MEDIUM;
  return XP_EASY;
}

function pickDailyTasks(dateStr, offset = 0, mode = "mixed", count = 5) {
  const allowed = DIFFICULTY_MODES[mode]?.allowed ?? ["Easy","Medium"];
  let s = dateSeed(dateStr, offset);
  const lcg = () => { s = (s * 1664525 + 1013904223) >>> 0; return s; };

  const categories = Object.keys(TASK_POOL);
  const picked = [];
  const usedTexts = new Set();

  // 1 per category first (up to count)
  const shuffledCats = [...categories].sort(() => (lcg() % 2 ? 1 : -1));
  for (const cat of shuffledCats) {
    if (picked.length >= count) break;
    const pool = TASK_POOL[cat].filter(t => allowed.includes(t.difficulty));
    if (!pool.length) continue;
    const t = pool[lcg() % pool.length];
    if (!usedTexts.has(t.text)) {
      picked.push({ ...t, category: cat });
      usedTexts.add(t.text);
    }
  }

  // Fill remaining slots from the full allowed pool
  const all = categories.flatMap(cat =>
    TASK_POOL[cat].filter(t => allowed.includes(t.difficulty)).map(t => ({ ...t, category: cat }))
  );
  let tries = 0;
  while (picked.length < count && tries++ < 80) {
    const t = all[lcg() % all.length];
    if (!usedTexts.has(t.text)) {
      picked.push(t);
      usedTexts.add(t.text);
    }
  }

  return picked.slice(0, count).map((t, i) => ({
    id: `default-${dateStr}-${offset}-${i}`,
    text: t.text,
    category: t.category,
    difficulty: t.difficulty,
    xp: xpForDifficulty(t.difficulty),
    done: false,
    date: dateStr,
    isDefault: true,
  }));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function nextDayStr(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
}

function getLevel(totalXP) {
  let level = 1, xp = totalXP;
  while (xp >= level * 100) { xp -= level * 100; level++; }
  return { level, currentXP: xp, xpNeeded: level * 100 };
}

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

function fmtCountdown(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function daysAgo(dateStr, today) {
  const a = new Date(dateStr + "T00:00:00");
  const b = new Date(today  + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

const RANKS = [
  { min:   1, max:  19, label:"E", color:"#607080" },
  { min:  20, max:  39, label:"D", color:"#4a9a6a" },
  { min:  40, max:  59, label:"C", color:"#3a7ab5" },
  { min:  60, max:  79, label:"B", color:"#7050c0" },
  { min:  80, max:  99, label:"A", color:"#c07020" },
  { min: 100, max: Infinity, label:"S", color:"#cc3333" },
];

function getRank(level) {
  return RANKS.find(r => level >= r.min && level <= r.max) ?? RANKS[0];
}

const TITLES = [
  { min:   1, max:  10, label:"Beginner",    color:"rgba(140,180,220,0.8)" },
  { min:  11, max:  25, label:"Consistent",  color:"rgba(0,200,140,0.85)"  },
  { min:  26, max:  50, label:"Disciplined", color:"rgba(100,140,255,0.9)" },
  { min:  51, max: 100, label:"Elite",       color:"rgba(220,160,40,0.9)"  },
  { min: 101, max: Infinity, label:"Master", color:"rgba(0,220,255,0.95)"  },
];

function getTitle(level) {
  return TITLES.find(t => level >= t.min && level <= t.max) ?? TITLES[0];
}

// Every 5 levels the user gets a 5% XP bonus on their next task
const XP_MILESTONE_BONUS = 0.05;

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { min-height: 100vh; background: #070a12; font-family: 'Rajdhani', sans-serif; }

  .sl-wrapper {
    min-height: 100vh; background: #070a12;
    display: flex; align-items: flex-start; justify-content: center;
    padding: 36px 16px 60px; position: relative; overflow: hidden;
  }
  .sl-wrapper::before {
    content: ''; position: fixed; inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,140,255,0.08) 0%, transparent 70%),
      repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,120,255,0.04) 39px, rgba(0,120,255,0.04) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,120,255,0.04) 39px, rgba(0,120,255,0.04) 40px);
    pointer-events: none; z-index: 0;
  }

  .sl-panel {
    position: relative; z-index: 1; width: 100%; max-width: 560px;
    background: rgba(8,14,28,0.96); border: 1px solid rgba(0,160,255,0.35);
    clip-path: polygon(0 0,calc(100% - 24px) 0,100% 24px,100% 100%,24px 100%,0 calc(100% - 24px));
    padding: 26px 30px 30px;
    box-shadow: 0 0 40px rgba(0,140,255,0.07), inset 0 0 60px rgba(0,80,180,0.04);
  }
  .sl-panel::before {
    content: ''; position: absolute; inset: 0;
    clip-path: polygon(0 0,calc(100% - 24px) 0,100% 24px,100% 100%,24px 100%,0 calc(100% - 24px));
    border: 1px solid rgba(0,220,255,0.13); pointer-events: none;
  }
  .sl-corner {
    position: absolute; width: 8px; height: 8px; background: #00aaff;
    box-shadow: 0 0 8px #00aaff, 0 0 16px rgba(0,170,255,0.6);
  }
  .sl-corner.tl { top:-1px; left:-1px; }
  .sl-corner.br { bottom:-1px; right:-1px; }

  /* ── Player card ── */
  .sl-player-card {
    display: flex; align-items: center; gap: 16px; padding: 14px 16px;
    background: rgba(0,60,120,0.14); border: 1px solid rgba(0,160,220,0.25);
    margin-bottom: 18px; position: relative; overflow: hidden;
    box-shadow: inset 0 0 30px rgba(0,100,200,0.06), 0 0 20px rgba(0,100,200,0.05);
  }
  .sl-player-card::after {
    content: ''; position: absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg,transparent,rgba(0,220,255,0.7),transparent);
  }
  .sl-rank-badge {
    width:50px; height:50px; flex-shrink:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; border:2px solid;
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    background:rgba(0,0,0,0.5); transition:border-color 0.4s,box-shadow 0.4s;
  }
  .sl-rank-letter { font-family:'Orbitron',sans-serif; font-weight:900; font-size:19px; line-height:1; }
  .sl-rank-lbl { font-family:'Orbitron',sans-serif; font-size:8px; letter-spacing:1px; opacity:0.7; margin-top:1px; }
  .sl-player-info { flex:1; min-width:0; }
  .sl-level-row { display:flex; align-items:baseline; gap:8px; margin-bottom:6px; }
  .sl-level-num { font-family:'Orbitron',sans-serif; font-size:21px; font-weight:900; line-height:1; }
  .sl-level-tag { font-family:'Orbitron',sans-serif; font-size:9px; letter-spacing:2px; color:rgba(0,160,220,0.6); }
  .sl-title-badge {
    font-family:'Orbitron',sans-serif; font-size:8px; font-weight:700; letter-spacing:1.5px;
    padding:2px 7px; border:1px solid; margin-left:auto; white-space:nowrap; flex-shrink:0;
    opacity:0.85;
  }
  .sl-total-xp { font-family:'Orbitron',sans-serif; font-size:9px; letter-spacing:1.5px; color:rgba(100,180,240,0.4); margin-left:auto; }
  .sl-xp-labels { display:flex; justify-content:space-between; margin-bottom:4px; }
  .sl-xp-label { font-family:'Orbitron',sans-serif; font-size:9px; letter-spacing:1.5px; color:rgba(0,160,220,0.55); }
  .sl-xp-val { font-family:'Orbitron',sans-serif; font-size:9px; color:#00aaff; text-shadow:0 0 8px rgba(0,180,255,0.7); }
  .sl-xp-track {
    height:6px; background:rgba(0,60,120,0.4); border:1px solid rgba(0,140,220,0.3);
    overflow:hidden; box-shadow:0 0 8px rgba(0,120,200,0.15);
  }
  .sl-xp-fill {
    height:100%; background:linear-gradient(90deg,#0055bb,#00aaff,#55ddff);
    transition:width 0.5s cubic-bezier(0.25,1,0.5,1); position:relative;
    box-shadow:0 0 10px rgba(0,200,255,0.6), 0 0 20px rgba(0,160,255,0.3);
  }
  .sl-xp-fill::after {
    content:''; position:absolute; top:0; right:0; width:20px; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35));
  }

  /* ── Level-up overlay ── */
  .sl-levelup {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(0,10,30,0.88); z-index:10; animation:luFade 2.5s ease forwards; pointer-events:none;
  }
  .sl-levelup-text {
    font-family:'Orbitron',sans-serif; font-size:28px; font-weight:900; color:#00ddff;
    letter-spacing:6px; text-align:center; animation:luPulse 2.5s ease forwards;
    text-shadow:0 0 40px rgba(0,220,255,0.9),0 0 80px rgba(0,140,255,0.4); line-height:1.4;
  }
  .sl-levelup-sub { font-size:12px; letter-spacing:5px; color:rgba(0,200,255,0.65); display:block; margin-top:4px; }
  @keyframes luFade { 0%{opacity:0} 12%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
  @keyframes luPulse {
    0%{transform:scale(0.75);opacity:0} 12%{transform:scale(1.06);opacity:1}
    22%{transform:scale(1)} 80%{transform:scale(1);opacity:1} 100%{transform:scale(1.08);opacity:0}
  }

  /* ── Rank-up banner ── */
  .sl-rankup {
    display:flex; align-items:center; gap:10px; padding:10px 16px;
    background:rgba(180,120,0,0.1); border:1px solid rgba(220,160,40,0.35);
    margin-bottom:12px; animation:toastIn 0.35s ease, toastOut 0.4s ease 2.6s forwards;
  }
  .sl-rankup-icon { font-size:18px; flex-shrink:0; }
  .sl-rankup-text {
    font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700; letter-spacing:2px;
    line-height:1.4;
  }
  .sl-rankup-sub { font-size:9px; letter-spacing:1.5px; color:rgba(200,170,100,0.6); display:block; margin-top:2px; font-weight:400; }

  /* ── XP float popup ── */
  .sl-xp-popup {
    position: absolute; right: 58px; top: 50%;
    font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 900; letter-spacing: 2px;
    color: #00ffee; pointer-events: none; z-index: 10; white-space: nowrap;
    animation: xpFloat 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    text-shadow:
      0 0 8px rgba(0,255,220,1),
      0 0 20px rgba(0,220,255,0.9),
      0 0 40px rgba(0,180,255,0.6),
      0 0 70px rgba(0,140,255,0.3);
  }
  @keyframes xpFloat {
    0%   { opacity: 0;   transform: translateY(0px)   scale(0.5); }
    18%  { opacity: 1;   transform: translateY(-14px) scale(1.25); }
    45%  { opacity: 1;   transform: translateY(-22px) scale(1); }
    75%  { opacity: 0.8; transform: translateY(-30px) scale(0.95); }
    100% { opacity: 0;   transform: translateY(-44px) scale(0.8); }
  }

  /* ── Task list ── */
  .sl-task-list { list-style:none; display:flex; flex-direction:column; gap:7px; margin-bottom:16px; }

  .sl-task-item {
    display:flex; align-items:center; gap:12px; padding:11px 14px;
    border:1px solid rgba(0,140,220,0.15); border-left:2px solid rgba(0,170,255,0.5);
    background:rgba(0,80,160,0.07); transition:border-color 0.25s, background 0.25s, opacity 0.3s, box-shadow 0.25s;
    cursor:pointer; position:relative; animation:taskIn 0.25s ease both;
    box-shadow:inset 0 0 20px rgba(0,80,180,0.04);
  }
  .sl-task-item:hover {
    background:rgba(0,100,180,0.13); border-left-color:rgba(0,220,255,0.85);
    border-color:rgba(0,180,255,0.22); box-shadow:0 0 12px rgba(0,160,255,0.1), inset 0 0 20px rgba(0,100,200,0.06);
  }
  .sl-task-item.done {
    background:rgba(0,40,80,0.05); border-left-color:rgba(0,90,140,0.3);
    border-color:rgba(0,100,160,0.1); opacity:0.45; box-shadow:none;
  }

  /* Completion flash — triggered by .completing class */
  .sl-task-item.completing {
    animation: completionFlash 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes completionFlash {
    0%   { background: rgba(0,230,255,0.22); border-left-color: #00ffee; border-color: rgba(0,230,255,0.55);
           box-shadow: 0 0 0 2px rgba(0,220,255,0.25), 0 0 28px rgba(0,200,255,0.35), inset 0 0 30px rgba(0,200,255,0.14);
           transform: scaleY(1.04); }
    30%  { background: rgba(0,180,255,0.13); border-left-color: rgba(0,230,255,0.9);
           box-shadow: 0 0 18px rgba(0,200,255,0.2); transform: scaleY(1.01); }
    100% { background: rgba(0,40,80,0.05); border-left-color: rgba(0,90,140,0.3);
           border-color: rgba(0,100,160,0.1); box-shadow: none; transform: scaleY(1); }
  }

  /* Pending tasks — soft warm amber, not alarming */
  .sl-task-item.pending-item {
    background: rgba(180,150,50,0.05);
    border-color: rgba(200,170,70,0.13);
    border-left-color: rgba(210,180,80,0.38);
    box-shadow: inset 0 0 16px rgba(180,140,30,0.03);
  }
  .sl-task-item.pending-item:hover {
    background: rgba(180,150,50,0.09);
    border-left-color: rgba(230,200,90,0.6);
    box-shadow: 0 0 10px rgba(200,170,50,0.07), inset 0 0 16px rgba(180,140,30,0.05);
  }
  .sl-task-item.pending-item.done { background:rgba(80,60,10,0.04); border-left-color:rgba(140,110,30,0.2); opacity:0.42; box-shadow:none; }
  .sl-task-item.pending-item.completing { animation: completionFlashPending 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  @keyframes completionFlashPending {
    0%   { background: rgba(255,210,80,0.18); border-left-color: #ffd84a; border-color: rgba(255,210,60,0.45);
           box-shadow: 0 0 0 2px rgba(255,200,40,0.2), 0 0 24px rgba(255,190,30,0.28), inset 0 0 28px rgba(220,170,20,0.1);
           transform: scaleY(1.04); }
    30%  { background: rgba(200,160,30,0.1); border-left-color: rgba(240,200,70,0.8);
           box-shadow: 0 0 14px rgba(220,170,20,0.16); transform: scaleY(1.01); }
    100% { background: rgba(80,60,10,0.04); border-left-color: rgba(140,110,30,0.2);
           border-color: rgba(0,100,160,0.1); box-shadow: none; transform: scaleY(1); }
  }

  .sl-overdue-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(220,190,80,0.65); flex-shrink: 0;
    box-shadow: 0 0 4px rgba(210,180,60,0.35);
  }

  @keyframes taskIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

  .sl-checkbox {
    width:18px; height:18px; border:1.5px solid rgba(0,160,255,0.5); background:transparent;
    flex-shrink:0; display:flex; align-items:center; justify-content:center;
    clip-path:polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px));
    transition:background 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .sl-task-item:hover .sl-checkbox { box-shadow:0 0 6px rgba(0,180,255,0.4); }
  .sl-task-item.pending-item .sl-checkbox { border-color:rgba(200,180,80,0.38); }
  .sl-task-item.done .sl-checkbox { background:rgba(0,120,200,0.35); border-color:rgba(0,200,255,0.8); box-shadow:0 0 8px rgba(0,200,255,0.35); }
  .sl-task-item.pending-item.done .sl-checkbox { background:rgba(160,130,30,0.22); border-color:rgba(210,190,80,0.7); box-shadow:0 0 6px rgba(200,180,50,0.25); }

  .sl-check-icon { width:10px; height:10px; opacity:0; transition:opacity 0.15s; }
  .sl-task-item.done .sl-check-icon { opacity:1; }
  .sl-task-item.completing .sl-check-icon { animation: checkBounce 0.45s cubic-bezier(0.34, 1.6, 0.64, 1) forwards; }
  @keyframes checkBounce {
    0%   { opacity:0; transform: scale(0) rotate(-20deg); }
    55%  { opacity:1; transform: scale(1.4) rotate(6deg); }
    100% { opacity:1; transform: scale(1) rotate(0deg); }
  }

  .sl-task-text { flex:1; font-size:15px; font-weight:500; color:#b8d8f8; letter-spacing:0.4px; transition:color 0.25s; }
  .sl-task-item.pending-item .sl-task-text { color:rgba(210,195,140,0.8); }
  .sl-task-item.done .sl-task-text { text-decoration:line-through; color:rgba(80,130,180,0.45); }
  .sl-task-item.pending-item.done .sl-task-text { color:rgba(150,130,80,0.4); }

  .sl-task-xp {
    font-family:'Orbitron',sans-serif; font-size:9px; font-weight:700; letter-spacing:1px;
    padding:2px 7px; border:1px solid; white-space:nowrap; flex-shrink:0; transition:color 0.2s, border-color 0.2s, text-shadow 0.2s;
  }

  .sl-delete-btn {
    background:none; border:none; color:rgba(80,130,180,0.3); cursor:pointer; font-size:13px;
    padding:2px 4px; transition:color 0.15s, text-shadow 0.15s; font-family:'Orbitron',sans-serif; line-height:1; flex-shrink:0;
  }
  .sl-delete-btn:hover { color:rgba(255,80,80,0.85); text-shadow:0 0 8px rgba(255,60,60,0.5); }

  /* ── Footer ── */
  .sl-footer {
    margin-top:6px; padding-top:14px; border-top:1px solid rgba(0,100,180,0.15);
    display:flex; justify-content:space-between; align-items:center;
  }
  .sl-stats { font-family:'Orbitron',sans-serif; font-size:10px; letter-spacing:1.5px; color:rgba(0,140,200,0.5); }
  .sl-stats b { color:#00aaff; font-weight:700; text-shadow:0 0 8px rgba(0,180,255,0.5); }
  .sl-progress-bar { height:3px; width:90px; background:rgba(0,80,140,0.2); overflow:hidden; }
  .sl-progress-fill {
    height:100%; background:linear-gradient(90deg,#0055aa,#00aaff);
    transition:width 0.4s ease; box-shadow:0 0 6px rgba(0,180,255,0.4);
  }

  /* ── Header ── */
  .sl-header { margin-bottom:14px; display:flex; align-items:flex-end; justify-content:space-between; }
  .sl-header-left {}
  .sl-system-tag { font-family:'Orbitron',sans-serif; font-size:10px; font-weight:600; letter-spacing:4px; color:#0099dd; margin-bottom:4px; text-shadow:0 0 10px rgba(0,180,255,0.5); }
  .sl-title {
    font-family:'Orbitron',sans-serif; font-size:24px; font-weight:900; color:#e8f4ff; letter-spacing:2px; line-height:1;
    text-shadow:0 0 20px rgba(0,180,255,0.5), 0 0 40px rgba(0,120,255,0.25);
  }
  .sl-title span { color:#00aaff; text-shadow:0 0 16px rgba(0,200,255,0.8), 0 0 32px rgba(0,160,255,0.4); }

  /* ── Reset countdown ── */
  .sl-reset-box {
    display:flex; flex-direction:column; align-items:flex-end; gap:4px;
  }
  .sl-reset-lbl { font-family:'Orbitron',sans-serif; font-size:8px; letter-spacing:2px; color:rgba(0,140,200,0.45); }
  .sl-countdown { font-family:'Orbitron',sans-serif; font-size:14px; font-weight:700; color:rgba(0,180,255,0.7); letter-spacing:2px; }
  .sl-next-day-btn {
    font-family:'Orbitron',sans-serif; font-size:8px; font-weight:700; letter-spacing:1.5px;
    color:rgba(200,100,50,0.8); background:rgba(200,80,30,0.08); border:1px solid rgba(200,80,30,0.3);
    padding:3px 8px; cursor:pointer; transition:background 0.15s,color 0.15s; margin-top:2px;
  }
  .sl-next-day-btn:hover { background:rgba(200,80,30,0.18); color:rgba(255,130,80,1); }

  /* ── Divider ── */
  .sl-divider {
    height:1px; background:linear-gradient(90deg,#00aaff,rgba(0,170,255,0.15),transparent);
    margin-bottom:20px; box-shadow:0 0 8px rgba(0,180,255,0.3);
  }

  /* ── Input ── */
  .sl-input-row { display:flex; gap:10px; margin-bottom:20px; }
  .sl-input {
    flex:1; background:rgba(0,80,160,0.08); border:1px solid rgba(0,150,255,0.25);
    color:#c8dff5; font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:500;
    padding:10px 14px; outline:none; transition:border-color 0.2s, box-shadow 0.2s;
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);
  }
  .sl-input::placeholder { color:rgba(100,160,220,0.35); font-style:italic; }
  .sl-input:focus {
    border-color:rgba(0,200,255,0.7);
    box-shadow:0 0 0 1px rgba(0,180,255,0.15) inset, 0 0 16px rgba(0,160,255,0.12);
  }
  .sl-add-btn {
    font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px;
    color:#070a12; background:#00aaff; border:none; padding:10px 16px; cursor:pointer;
    white-space:nowrap; clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);
    transition:background 0.15s,transform 0.1s,box-shadow 0.15s;
    box-shadow:0 0 12px rgba(0,180,255,0.35);
  }
  .sl-add-btn:hover { background:#33bbff; box-shadow:0 0 20px rgba(0,200,255,0.6); }
  .sl-add-btn:active { transform:scale(0.97); }
  .sl-add-btn:disabled { background:rgba(0,120,180,0.2); color:rgba(100,160,200,0.35); cursor:not-allowed; box-shadow:none; }

  /* ── Section labels ── */
  .sl-section-label {
    font-family:'Orbitron',sans-serif; font-size:10px; font-weight:600; letter-spacing:3px;
    margin-bottom:9px; display:flex; align-items:center; gap:10px;
  }
  .sl-section-label::after { content:''; flex:1; height:1px; background:rgba(0,130,200,0.15); }
  .sl-section-label.today { color:rgba(0,160,220,0.65); }
  .sl-section-label.pending { color:rgba(200,170,70,0.6); }
  .sl-section-label.pending::after { background:rgba(200,170,60,0.1); }

  .sl-pending-badge {
    font-family:'Orbitron',sans-serif; font-size:9px; font-weight:700; letter-spacing:1px;
    padding:2px 7px; background:rgba(200,170,60,0.08); border:1px solid rgba(200,170,60,0.22);
    color:rgba(220,190,80,0.75);
  }

  .sl-pending-nudge {
    font-family:'Rajdhani',sans-serif; font-size:12px; font-weight:500; letter-spacing:0.3px;
    color:rgba(180,160,80,0.45); margin-bottom:10px; margin-top:-4px;
  }

  .sl-task-edit-input {
    flex:1; background:rgba(0,80,160,0.12); border:1px solid rgba(0,200,255,0.5);
    color:#c8dff5; font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:500;
    padding:2px 8px; outline:none; min-width:0;
    box-shadow:0 0 10px rgba(0,180,255,0.15);
  }
  .sl-edit-btn {
    background:none; border:none; color:rgba(0,160,220,0.4); cursor:pointer; font-size:12px;
    padding:2px 4px; transition:color 0.15s, text-shadow 0.15s; line-height:1; flex-shrink:0;
  }
  .sl-edit-btn:hover { color:rgba(0,220,255,0.9); text-shadow:0 0 8px rgba(0,200,255,0.5); }
  .sl-save-btn {
    background:none; border:1px solid rgba(0,200,100,0.4); color:rgba(0,220,120,0.8); cursor:pointer;
    font-family:'Orbitron',sans-serif; font-size:9px; font-weight:700; letter-spacing:1px;
    padding:2px 8px; transition:background 0.15s, color 0.15s; flex-shrink:0;
  }
  .sl-save-btn:hover { background:rgba(0,200,100,0.12); color:rgba(0,255,140,1); }
  .sl-cancel-btn {
    background:none; border:none; color:rgba(140,100,80,0.5); cursor:pointer; font-size:12px;
    padding:2px 4px; transition:color 0.15s; line-height:1; flex-shrink:0;
  }
  .sl-cancel-btn:hover { color:rgba(255,120,80,0.8); }

  .sl-footer-row {
    margin-top:6px; padding-top:14px; border-top:1px solid rgba(0,100,180,0.15);
    display:flex; justify-content:space-between; align-items:center; gap:10px;
  }
  .sl-reset-tasks-btn {
    font-family:'Orbitron',sans-serif; font-size:8px; font-weight:700; letter-spacing:1.5px;
    color:rgba(0,160,220,0.6); background:rgba(0,80,160,0.08); border:1px solid rgba(0,140,220,0.25);
    padding:4px 10px; cursor:pointer; transition:background 0.15s, color 0.15s, box-shadow 0.15s;
    white-space:nowrap; flex-shrink:0;
  }
  /* ── Streak bar ── */
  .sl-streak-bar {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 14px; margin-bottom:14px;
    background:rgba(255,100,20,0.07); border:1px solid rgba(255,120,30,0.2);
    box-shadow:inset 0 0 20px rgba(255,80,0,0.04);
    position:relative; overflow:hidden;
  }
  .sl-streak-bar::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,160,60,0.5),transparent);
  }
  .sl-streak-flame {
    font-size:20px; line-height:1; flex-shrink:0;
    filter: drop-shadow(0 0 6px rgba(255,120,30,0.8));
  }
  .sl-streak-flame.dead { filter:grayscale(1) opacity(0.3); font-size:16px; }
  .sl-streak-info { flex:1; padding:0 10px; }
  .sl-streak-label {
    font-family:'Orbitron',sans-serif; font-size:8px; letter-spacing:2px;
    color:rgba(255,140,60,0.6); display:block; margin-bottom:2px;
  }
  .sl-streak-count {
    font-family:'Orbitron',sans-serif; font-size:18px; font-weight:900; line-height:1;
    color:#ff8c30; text-shadow:0 0 12px rgba(255,120,30,0.7), 0 0 24px rgba(255,80,0,0.3);
  }
  .sl-streak-count.dead { color:rgba(100,100,120,0.5); text-shadow:none; }
  .sl-streak-sub {
    font-family:'Orbitron',sans-serif; font-size:8px; letter-spacing:1px;
    color:rgba(255,140,60,0.45); margin-left:4px;
  }
  .sl-streak-best {
    font-family:'Orbitron',sans-serif; font-size:8px; letter-spacing:1.5px;
    color:rgba(255,160,80,0.4); text-align:right;
  }
  .sl-streak-best b { color:rgba(255,180,80,0.7); }

  /* ── Player name ── */
  .sl-player-name {
    font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600;
    color:rgba(180,220,255,0.7); letter-spacing:1px; margin-bottom:1px;
    cursor:pointer; display:inline-flex; align-items:center; gap:5px;
    transition:color 0.15s;
  }
  .sl-player-name:hover { color:rgba(0,220,255,0.9); }
  .sl-player-name-pencil { font-size:10px; opacity:0.5; }
  .sl-name-edit-wrap { display:flex; align-items:center; gap:6px; margin-bottom:1px; }
  .sl-name-input {
    background:rgba(0,80,160,0.15); border:1px solid rgba(0,200,255,0.5);
    color:#c8dff5; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600;
    padding:1px 7px; outline:none; width:130px; letter-spacing:1px;
    box-shadow:0 0 8px rgba(0,180,255,0.12);
  }
  .sl-name-save {
    font-family:'Orbitron',sans-serif; font-size:8px; font-weight:700; letter-spacing:1px;
    color:rgba(0,220,120,0.8); background:rgba(0,200,100,0.08);
    border:1px solid rgba(0,200,100,0.3); padding:2px 7px; cursor:pointer;
    transition:background 0.15s;
  }
  .sl-name-save:hover { background:rgba(0,200,100,0.16); }
  .sl-name-cancel {
    background:none; border:none; color:rgba(150,100,80,0.5); cursor:pointer;
    font-size:12px; padding:1px 3px; line-height:1; transition:color 0.15s;
  }
  .sl-name-cancel:hover { color:rgba(255,100,80,0.8); }

  /* ── Full reset section ── */
  .sl-full-reset-section {
    margin-top: 28px; padding-top: 18px;
    border-top: 1px solid rgba(255,50,50,0.12);
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .sl-full-reset-btn {
    font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2px;
    color: rgba(255,70,70,0.6); background: rgba(255,40,40,0.05);
    border: 1px solid rgba(255,60,60,0.2); padding: 8px 24px; cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
    clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  }
  .sl-full-reset-btn:hover {
    background: rgba(255,40,40,0.1); color: rgba(255,90,90,0.9);
    box-shadow: 0 0 14px rgba(255,50,50,0.18);
  }
  .sl-full-reset-btn.confirming {
    color: rgba(255,50,50,1); background: rgba(255,40,40,0.15);
    border-color: rgba(255,60,60,0.5); box-shadow: 0 0 18px rgba(255,40,40,0.25);
    animation: resetPulse 0.6s ease infinite alternate;
  }
  @keyframes resetPulse {
    from { box-shadow: 0 0 8px rgba(255,40,40,0.2); }
    to   { box-shadow: 0 0 22px rgba(255,40,40,0.45); }
  }
  .sl-full-reset-hint {
    font-family: 'Orbitron', sans-serif; font-size: 8px; letter-spacing: 1.5px;
    color: rgba(255,80,80,0.5); text-align: center;
  }

  /* ── Onboarding banner ── */
  .sl-onboard {
    display:flex; align-items:flex-start; gap:10px; padding:10px 14px;
    background:rgba(0,120,200,0.08); border:1px solid rgba(0,160,255,0.2);
    margin-bottom:16px; position:relative;
  }
  .sl-onboard-icon { font-size:16px; flex-shrink:0; margin-top:1px; }
  .sl-onboard-text {
    flex:1; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:500;
    color:rgba(160,210,255,0.8); line-height:1.45;
  }
  .sl-onboard-text b { color:rgba(0,210,255,0.9); font-weight:600; }
  .sl-onboard-dismiss {
    background:none; border:none; color:rgba(80,140,200,0.4); cursor:pointer;
    font-size:14px; padding:0 2px; line-height:1; flex-shrink:0;
    transition:color 0.15s;
  }
  .sl-onboard-dismiss:hover { color:rgba(0,200,255,0.8); }

  /* ── Settings button in header ── */
  .sl-settings-btn {
    background:none; border:1px solid rgba(0,140,220,0.2); color:rgba(0,160,220,0.5);
    font-size:14px; cursor:pointer; padding:4px 8px; line-height:1;
    transition:color 0.15s, border-color 0.15s, box-shadow 0.15s;
    flex-shrink:0;
  }
  .sl-settings-btn:hover { color:rgba(0,220,255,0.9); border-color:rgba(0,200,255,0.45); box-shadow:0 0 10px rgba(0,180,255,0.15); }

  /* ── Settings overlay ── */
  .sl-settings-overlay {
    position:fixed; inset:0; background:rgba(0,5,18,0.75); z-index:50;
    display:flex; align-items:flex-end; justify-content:center;
    animation:overlayIn 0.2s ease;
  }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }

  .sl-settings-panel {
    width:100%; max-width:560px; background:rgba(8,14,30,0.98);
    border:1px solid rgba(0,160,255,0.3); border-bottom:none;
    padding:24px 24px 32px;
    animation:panelUp 0.25s cubic-bezier(0.22,1,0.36,1);
    position:relative;
    clip-path:polygon(0 16px,16px 0,100% 0,100% 100%,0 100%);
  }
  @keyframes panelUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }

  .sl-settings-header {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;
  }
  .sl-settings-title {
    font-family:'Orbitron',sans-serif; font-size:13px; font-weight:700; letter-spacing:3px;
    color:rgba(0,200,255,0.8); text-shadow:0 0 12px rgba(0,180,255,0.4);
  }
  .sl-settings-close {
    background:none; border:none; color:rgba(80,140,200,0.4); cursor:pointer;
    font-size:18px; line-height:1; transition:color 0.15s;
  }
  .sl-settings-close:hover { color:rgba(255,100,100,0.8); }

  .sl-settings-section-title {
    font-family:'Orbitron',sans-serif; font-size:9px; font-weight:700; letter-spacing:2.5px;
    color:rgba(0,150,220,0.55); margin-bottom:10px;
  }

  /* Mode selector grid */
  .sl-mode-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:24px; }
  .sl-mode-card {
    padding:10px 12px; border:1px solid rgba(0,120,200,0.18); background:rgba(0,60,120,0.08);
    cursor:pointer; transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
    text-align:left;
  }
  .sl-mode-card:hover { background:rgba(0,80,160,0.14); border-color:rgba(0,180,255,0.35); }
  .sl-mode-card.active {
    border-color:rgba(0,200,255,0.7); background:rgba(0,100,200,0.16);
    box-shadow:0 0 14px rgba(0,180,255,0.18);
  }
  .sl-mode-card-name {
    font-family:'Orbitron',sans-serif; font-size:10px; font-weight:700; letter-spacing:1px;
    color:rgba(180,220,255,0.8); display:block; margin-bottom:4px;
  }
  .sl-mode-card.active .sl-mode-card-name { color:#00ddff; text-shadow:0 0 8px rgba(0,210,255,0.5); }
  .sl-mode-card-desc {
    font-family:'Rajdhani',sans-serif; font-size:11px; font-weight:500;
    color:rgba(100,160,200,0.55); line-height:1.3;
  }
  .sl-mode-card.active .sl-mode-card-desc { color:rgba(140,200,240,0.7); }

  .sl-settings-divider { height:1px; background:rgba(0,100,180,0.12); margin-bottom:18px; }

  /* ── Streak lost toast ── */
  .sl-streak-lost {
    display:flex; align-items:center; gap:8px; padding:9px 14px;
    background:rgba(60,20,10,0.7); border:1px solid rgba(180,80,40,0.35);
    margin-bottom:12px; animation:toastIn 0.3s ease, toastOut 0.4s ease 2.6s forwards;
  }
  @keyframes toastIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(-4px)} }
  .sl-streak-lost-text {
    font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600;
    color:rgba(255,150,100,0.85); letter-spacing:0.3px;
  }
  .sl-streak-lost-text b { color:rgba(255,100,60,0.95); }

  /* ── Reset confirmation modal ── */
  .sl-confirm-overlay {
    position:fixed; inset:0; background:rgba(0,5,18,0.82); z-index:100;
    display:flex; align-items:center; justify-content:center;
    animation:overlayIn 0.18s ease;
    padding:20px;
  }
  .sl-confirm-box {
    width:100%; max-width:340px; background:rgba(10,16,34,0.98);
    border:1px solid rgba(255,60,60,0.3); padding:24px;
    animation:panelUp 0.22s cubic-bezier(0.22,1,0.36,1);
    clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));
  }
  .sl-confirm-icon { font-size:28px; display:block; text-align:center; margin-bottom:12px; }
  .sl-confirm-title {
    font-family:'Orbitron',sans-serif; font-size:13px; font-weight:900; letter-spacing:2px;
    color:rgba(255,100,80,0.9); text-align:center; margin-bottom:8px;
    text-shadow:0 0 12px rgba(255,60,40,0.4);
  }
  .sl-confirm-body {
    font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:500;
    color:rgba(160,180,210,0.7); text-align:center; line-height:1.5; margin-bottom:20px;
  }
  .sl-confirm-body b { color:rgba(255,120,90,0.85); }
  .sl-confirm-actions { display:flex; gap:10px; }
  .sl-confirm-cancel {
    flex:1; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px;
    color:rgba(100,160,220,0.7); background:rgba(0,80,160,0.08); border:1px solid rgba(0,140,220,0.25);
    padding:10px; cursor:pointer; transition:background 0.15s, color 0.15s;
  }
  .sl-confirm-cancel:hover { background:rgba(0,100,200,0.15); color:rgba(100,200,255,0.9); }
  .sl-confirm-danger {
    flex:1; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px;
    color:rgba(255,80,60,0.9); background:rgba(255,40,20,0.08); border:1px solid rgba(255,60,40,0.35);
    padding:10px; cursor:pointer; transition:background 0.15s, box-shadow 0.15s;
    clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%);
  }
  .sl-confirm-danger:hover { background:rgba(255,40,20,0.16); box-shadow:0 0 14px rgba(255,50,30,0.25); }

  /* ── All-done banner ── */
  .sl-alldone {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; margin-bottom: 14px;
    background: rgba(0,180,100,0.07);
    border: 1px solid rgba(0,210,120,0.25);
    border-left: 3px solid rgba(0,220,130,0.6);
    animation: toastIn 0.4s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 0 20px rgba(0,200,110,0.06), inset 0 0 20px rgba(0,180,90,0.04);
    position: relative; overflow: hidden;
  }
  .sl-alldone::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,230,140,0.5), transparent);
  }
  .sl-alldone-icon { font-size: 20px; flex-shrink: 0; }
  .sl-alldone-text {
    font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600;
    color: rgba(120,230,170,0.85); letter-spacing: 0.4px; line-height: 1.45;
  }
  .sl-alldone-text b {
    color: rgba(0,240,150,0.95);
    text-shadow: 0 0 10px rgba(0,220,130,0.5);
  }
  .sl-alldone-sub {
    font-family: 'Orbitron', sans-serif; font-size: 8px; letter-spacing: 2px;
    color: rgba(0,200,120,0.4); display: block; margin-top: 3px;
  }

  /* Panel glow when all tasks done */
  .sl-panel.all-done-glow {
    box-shadow: 0 0 40px rgba(0,140,255,0.07), inset 0 0 60px rgba(0,80,180,0.04),
                0 0 60px rgba(0,200,100,0.06);
    border-color: rgba(0,200,100,0.25);
    transition: box-shadow 1s ease, border-color 1s ease;
  }

  /* ── Quests per day selector ── */
  .sl-count-row { display:flex; gap:8px; margin-bottom:22px; }
  .sl-count-pill {
    flex:1; padding:8px 4px; border:1px solid rgba(0,120,200,0.18);
    background:rgba(0,60,120,0.08); cursor:pointer; font-family:'Orbitron',sans-serif;
    font-size:11px; font-weight:700; letter-spacing:1px;
    color:rgba(140,190,240,0.6); transition:all 0.15s; text-align:center;
  }
  .sl-count-pill:hover { background:rgba(0,80,160,0.14); border-color:rgba(0,180,255,0.3); color:rgba(180,220,255,0.85); }
  .sl-count-pill.active {
    border-color:rgba(0,200,255,0.65); background:rgba(0,100,200,0.16);
    color:#00ddff; box-shadow:0 0 10px rgba(0,180,255,0.15);
    text-shadow:0 0 8px rgba(0,200,255,0.5);
  }

  /* ── Routine pill on task row ── */
  .sl-routine-pill {
    font-family:'Orbitron',sans-serif; font-size:8px; font-weight:700; letter-spacing:1px;
    padding:1px 6px; border:1px solid rgba(0,210,200,0.4); background:rgba(0,180,170,0.1);
    color:rgba(0,225,215,0.85); white-space:nowrap; flex-shrink:0;
  }
  .sl-routine-star-btn {
    background:none; border:none; cursor:pointer; font-size:14px; line-height:1;
    padding:1px 3px; flex-shrink:0; transition:transform 0.15s, filter 0.15s;
    filter: grayscale(0.6) opacity(0.5);
  }
  .sl-routine-star-btn:hover { filter:grayscale(0) opacity(1); transform:scale(1.2); }
  .sl-routine-star-btn.active { filter:grayscale(0) opacity(1); }

  /* ── Routine toggle row under input ── */
  .sl-routine-toggle {
    display:flex; align-items:center; gap:8px; margin-top:-12px; margin-bottom:16px; padding:0 2px;
  }
  .sl-routine-toggle-label {
    font-family:'Orbitron',sans-serif; font-size:9px; letter-spacing:1.5px;
    color:rgba(0,200,190,0.6); cursor:pointer; user-select:none;
    transition:color 0.15s;
  }
  .sl-routine-toggle-label.on { color:rgba(0,225,215,0.9); text-shadow:0 0 8px rgba(0,210,200,0.4); }
  .sl-routine-check {
    width:14px; height:14px; border:1.5px solid rgba(0,200,190,0.4); background:transparent;
    flex-shrink:0; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:background 0.15s, border-color 0.15s;
  }
  .sl-routine-check.on { background:rgba(0,200,190,0.2); border-color:rgba(0,225,215,0.8); }

  /* ── Mobile layout ≤ 480px ─────────────────────────────────────── */
  @media (max-width: 480px) {

    /* Tighter outer padding */
    .sl-wrapper { padding: 16px 10px 48px; }
    .sl-panel { padding: 18px 14px 22px; }

    /* Streak bar — compress */
    .sl-streak-bar { padding: 7px 10px; }
    .sl-streak-count { font-size: 15px; }
    .sl-streak-flame { font-size: 17px; }
    .sl-streak-best { font-size: 7px; }

    /* Player card — shrink badge */
    .sl-player-card { gap: 10px; padding: 10px 12px; }
    .sl-rank-badge { width: 38px; height: 38px; }
    .sl-rank-letter { font-size: 14px; }
    .sl-rank-lbl { font-size: 7px; }
    .sl-level-num { font-size: 17px; }
    .sl-level-tag { font-size: 8px; letter-spacing: 1px; }
    .sl-total-xp { display: none; }          /* hidden on mobile — saves width */
    .sl-xp-label { font-size: 8px; }
    .sl-xp-val { font-size: 8px; }

    /* Header — smaller title, tighter countdown */
    .sl-title { font-size: 19px; letter-spacing: 1px; }
    .sl-system-tag { font-size: 8px; letter-spacing: 2px; }
    .sl-countdown { font-size: 12px; letter-spacing: 1px; }
    .sl-reset-lbl { font-size: 7px; }
    .sl-next-day-btn { font-size: 7px; padding: 2px 6px; }

    /* Input row — prevent add-btn from squeezing */
    .sl-input { font-size: 14px; padding: 9px 10px; }
    .sl-add-btn { font-size: 10px; padding: 9px 12px; letter-spacing: 1px; }

    /* Task items — reduce gaps and padding so nothing overflows */
    .sl-task-item { gap: 8px; padding: 9px 10px; }
    .sl-task-text { font-size: 13px; letter-spacing: 0; }

    /* Hide difficulty label; keep category pill */
    .sl-difficulty-label { display: none; }

    /* XP chip — shorter */
    .sl-task-xp { font-size: 8px; padding: 1px 5px; letter-spacing: 0.5px; }

    /* Edit / delete buttons — slightly tighter */
    .sl-edit-btn { font-size: 11px; padding: 1px 3px; }
    .sl-delete-btn { font-size: 11px; padding: 1px 3px; }

    /* Section labels */
    .sl-section-label { font-size: 9px; letter-spacing: 2px; }
    .sl-pending-badge { font-size: 8px; padding: 1px 5px; }

    /* Footer row — tighten */
    .sl-footer-row { gap: 6px; }
    .sl-stats { font-size: 9px; letter-spacing: 1px; }
    .sl-progress-bar { width: 60px; }
    .sl-reset-tasks-btn { font-size: 7px; padding: 3px 7px; letter-spacing: 1px; }

    /* Full reset button */
    .sl-full-reset-btn { font-size: 9px; padding: 7px 18px; letter-spacing: 1.5px; }
    .sl-full-reset-hint { font-size: 7px; }

    /* Player name input */
    .sl-name-input { width: 110px; font-size: 12px; }
    .sl-player-name { font-size: 12px; }

    /* Level-up overlay — smaller text on small screen */
    .sl-levelup-text { font-size: 20px; letter-spacing: 4px; }
    .sl-levelup-sub  { font-size: 10px; letter-spacing: 3px; }

    /* XP popup — slightly smaller */
    .sl-xp-popup { font-size: 12px; right: 44px; }

    /* Pending nudge text */
    .sl-pending-nudge { font-size: 11px; }
  }

  .sl-empty {
    text-align:center; padding:28px 0; color:rgba(80,140,200,0.3);
    font-family:'Orbitron',sans-serif; font-size:10px; letter-spacing:2px;
  }
`;

// ── TaskRow defined outside to prevent remount on every re-render ──────────
function TaskRow({ task, isPending, appDay, popups, completing, editingId, editText, onToggle, onDelete, onEditStart, onEditChange, onEditSave, onEditCancel, onRoutineToggle, routineIds }) {
  const hasPopup     = popups.some(p => p.taskId === task.id);
  const popup        = popups.find(p => p.taskId === task.id);
  const isCompleting = completing.has(task.id);
  const isEditing    = editingId === task.id;
  const cat          = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Routine;
  const ago          = isPending ? daysAgo(task.date, appDay) : 0;
  const isRoutine    = task.isRoutine || (routineIds && routineIds.has(task.routineSourceId));

  const xpColor  = task.done
    ? isPending ? "rgba(150,130,50,0.35)" : "rgba(0,120,180,0.35)"
    : isPending ? "rgba(210,185,80,0.8)"  : "#00aaff";
  const xpBorder = task.done
    ? isPending ? "rgba(130,110,30,0.2)"  : "rgba(0,100,160,0.18)"
    : isPending ? "rgba(200,175,70,0.35)" : "rgba(0,160,255,0.3)";
  const checkColor = isPending ? "#d4b84a" : "#00aaff";

  const handleRowClick = () => { if (!isEditing) onToggle(task.id); };

  return (
    <li
      className={`sl-task-item${isPending ? " pending-item" : ""}${task.done ? " done" : ""}${isCompleting ? " completing" : ""}`}
      onClick={handleRowClick}
    >
      {hasPopup && <span className="sl-xp-popup">+{popup.xp} XP</span>}
      {isPending && !task.done && <span className="sl-overdue-dot" />}
      <div className="sl-checkbox">
        <svg className="sl-check-icon" viewBox="0 0 10 10" fill="none">
          <polyline points="1.5,5 4,7.5 8.5,2.5" stroke={checkColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {isEditing ? (
          <input
            className="sl-task-edit-input"
            value={editText}
            onChange={e => onEditChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === "Enter") onEditSave(task.id); if (e.key === "Escape") onEditCancel(); }}
            autoFocus
          />
        ) : (
          <span className="sl-task-text">{task.text}</span>
        )}
        {task.category && !isEditing && (
          <div style={{ display:"flex", gap:5, alignItems:"center", marginTop:3, flexWrap:"wrap" }}>
            <span style={{
              fontFamily:"'Orbitron',sans-serif", fontSize:"8px", fontWeight:700, letterSpacing:"1px",
              padding:"1px 6px", border:`1px solid ${cat.border}`, background:cat.bg, color:cat.text, whiteSpace:"nowrap",
            }}>{task.category.toUpperCase()}</span>
            {task.difficulty && (
              <span className="sl-difficulty-label" style={{
                fontFamily:"'Orbitron',sans-serif", fontSize:"8px", letterSpacing:"1px",
                color: task.difficulty === "Hard"   ? "rgba(255,90,90,0.75)"  :
                       task.difficulty === "Medium" ? "rgba(255,180,60,0.7)"  :
                                                      "rgba(120,180,220,0.6)",
              }}>{task.difficulty.toUpperCase()}</span>
            )}
            {isRoutine && <span className="sl-routine-pill">ROUTINE</span>}
            {isPending && ago > 0 && (
              <span style={{
                fontFamily:"'Orbitron',sans-serif", fontSize:"8px", letterSpacing:"1px",
                color:"rgba(200,180,80,0.5)",
              }}>{ago === 1 ? "YESTERDAY" : `${ago}D AGO`}</span>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <>
          <button className="sl-save-btn"   onClick={e => { e.stopPropagation(); onEditSave(task.id); }}>SAVE</button>
          <button className="sl-cancel-btn" onClick={e => { e.stopPropagation(); onEditCancel(); }}>✕</button>
        </>
      ) : (
        <>
          <span className="sl-task-xp" style={{ color: xpColor, borderColor: xpBorder }}>
            +{task.xp ?? XP_EASY} XP
          </span>
          <button
            className={`sl-routine-star-btn${isRoutine ? " active" : ""}`}
            title={isRoutine ? "Remove from daily routine" : "Save as daily routine"}
            onClick={e => { e.stopPropagation(); onRoutineToggle(task); }}
          >
            {isRoutine ? "★" : "☆"}
          </button>
          <button className="sl-edit-btn"   onClick={e => { e.stopPropagation(); onEditStart(task.id, task.text); }} title="Edit">✎</button>
          <button className="sl-delete-btn" onClick={e => { e.stopPropagation(); onDelete(task.id); }}>✕</button>
        </>
      )}
    </li>
  );
}

// ── localStorage helpers ───────────────────────────────────────────────────
const LS_KEY = "dailylog-v1";

function loadState(today) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const savedDay = d.appDay || today;
    const mode  = d.difficultyMode ?? "mixed";
    const count = d.questsPerDay   ?? 5;
    if (savedDay !== today) {
      const completedYesterday = d.lastDoneDay === savedDay;
      const newStreak   = completedYesterday ? (d.streak || 0) + 1 : 0;
      const newBest     = Math.max(d.bestStreak || 0, newStreak);
      const carriedTasks = (d.tasks || []).filter(t => !t.done);
      return { ...d, appDay: today, streak: newStreak, bestStreak: newBest,
               tasks: [...carriedTasks, ...pickDailyTasks(today, 0, mode, count)], resetOffset: 0 };
    }
    return d;
  } catch (_) { return null; }
}

function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {}
}

// ── Component ──────────────────────────────────────────────────────────────
export default function App() {

  const today = toDateStr(new Date());

  // ── Load everything from localStorage once on mount
  const saved = useState(() => loadState(today))[0];

  const [appDay,      setAppDay]      = useState(() => saved?.appDay      ?? today);
  const [totalXP,     setTotalXP]     = useState(() => saved?.totalXP     ?? 0);
  const [tasks, setTasks] = useState(() => {
    const base = saved?.tasks ?? pickDailyTasks(today, 0);
    const savedRoutines = saved?.routines ?? [];
    // inject any routine that doesn't already have a copy for today
    const existingRoutineIds = new Set(base.filter(t => t.isRoutine).map(t => t.routineSourceId));
    const missing = savedRoutines
      .filter(r => !existingRoutineIds.has(r.id))
      .map(r => ({
        id: `routine-${r.id}-${today}`,
        text: r.text, category: r.category ?? "Routine",
        difficulty: r.difficulty ?? "Easy", xp: r.xp ?? XP_EASY,
        done: false, date: today, isDefault: false, isRoutine: true, routineSourceId: r.id,
      }));
    return [...missing, ...base];
  });
  const [resetOffset, setResetOffset] = useState(() => saved?.resetOffset ?? 0);
  const [streak,      setStreak]      = useState(() => saved?.streak      ?? 0);
  const [bestStreak,  setBestStreak]  = useState(() => saved?.bestStreak  ?? 0);
  const [lastDoneDay, setLastDoneDay] = useState(() => saved?.lastDoneDay ?? null);
  const [playerName,  setPlayerName]  = useState(() => saved?.playerName  ?? "Player");

  const [input,        setInput]       = useState("");
  const [isRoutineInput, setIsRoutineInput] = useState(false);
  const [routines,     setRoutines]    = useState(() => saved?.routines ?? []);
  const [popups,       setPopups]      = useState([]);
  const [completing,   setCompleting]  = useState(new Set());
  const [levelUpMsg,   setLevelUpMsg]  = useState(null);
  const [countdown,    setCountdown]   = useState(fmtCountdown(msUntilMidnight()));
  const [editingId,    setEditingId]   = useState(null);
  const [editText,     setEditText]    = useState("");
  const [editingName,  setEditingName] = useState(false);
  const [nameInput,    setNameInput]   = useState("");
  const [confirmReset,    setConfirmReset]    = useState(false); // kept for compat, unused
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [streakLostMsg,   setStreakLostMsg]   = useState(false);

  const [allDoneDay, setAllDoneDay] = useState(() => saved?.allDoneDay ?? null);

  const [difficultyMode, setDifficultyMode] = useState(() => saved?.difficultyMode ?? "mixed");
  const [questsPerDay,   setQuestsPerDay]   = useState(() => saved?.questsPerDay   ?? 5);
  const [onboardingDone, setOnboardingDone] = useState(() => saved?.onboardingDone ?? false);
  const [showSettings,   setShowSettings]   = useState(false);

  const [rankUpMsg, setRankUpMsg] = useState(null);
  const rankUpTimer  = useRef(null);
  const luTimer      = useRef(null);
  const confirmTimer = useRef(null);

  // ── Inject styles
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = styles;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    saveState({ appDay, totalXP, tasks, resetOffset, streak, bestStreak,
                lastDoneDay, playerName, difficultyMode, onboardingDone, questsPerDay, allDoneDay, routines });
  }, [appDay, totalXP, tasks, resetOffset, streak, bestStreak, lastDoneDay, playerName, difficultyMode, onboardingDone, questsPerDay, allDoneDay, routines]);

  const appDayRef = useRef(appDay);
  useEffect(() => { appDayRef.current = appDay; }, [appDay]);

  // Real countdown tick — checks for day change every second
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(fmtCountdown(msUntilMidnight()));
      const newDay = toDateStr(new Date());
      if (newDay !== appDayRef.current) performReset(newDay);
    }, 1000);
    return () => clearInterval(tick);
  }, []); // intentionally empty — runs once, reads appDayRef for fresh value

  const { level, currentXP, xpNeeded } = getLevel(totalXP);
  const xpPct     = Math.round((currentXP / xpNeeded) * 100);
  const rankObj   = getRank(level);
  const rankColor = rankObj.color;
  const rank      = rankObj.label;
  const levelColor = rank === "E" ? "#e8f4ff" : rankColor;
  const titleObj  = getTitle(level);

  // ── Streak evaluation — called whenever the day changes
  const evaluateStreak = (currentLastDoneDay, currentStreak, prevAppDay) => {
    const completedPrevDay = currentLastDoneDay === prevAppDay;
    const next = completedPrevDay ? currentStreak + 1 : 0;
    if (!completedPrevDay && currentStreak > 0) {
      setStreakLostMsg(true);
      setTimeout(() => setStreakLostMsg(false), 3000);
    }
    setStreak(next);
    setBestStreak(b => Math.max(b, next));
    return next;
  };

  const makeRoutineTask = (routine, dateStr) => ({
    id: `routine-${routine.id}-${dateStr}`,
    text: routine.text,
    category: routine.category ?? "Routine",
    difficulty: routine.difficulty ?? "Easy",
    xp: routine.xp ?? XP_EASY,
    done: false,
    date: dateStr,
    isDefault: false,
    isRoutine: true,
    routineSourceId: routine.id,
  });

  const performReset = (newDay) => {
    setLastDoneDay(prevLDD => {
      setStreak(prevStreak => {
        evaluateStreak(prevLDD, prevStreak, appDay);
        return prevStreak;
      });
      return prevLDD;
    });
    setResetOffset(0);
    setTasks(prev => {
      const carried = prev.filter(t => !t.done && !t.isRoutine);
      const freshRoutines = routines.map(r => makeRoutineTask(r, newDay));
      return [...freshRoutines, ...carried, ...pickDailyTasks(newDay, 0, difficultyMode, questsPerDay)];
    });
    setAppDay(newDay);
  };

  const simulateNextDay = () => performReset(nextDayStr(appDay));

  const resetTasks = () => {
    const newOffset = resetOffset + 1;
    setResetOffset(newOffset);
    setTasks(prev => {
      const completedDefaults = prev.filter(t => t.done && t.date === appDay && t.isDefault);
      const xpLost = completedDefaults.reduce((sum, t) => sum + (t.xp ?? XP_EASY), 0);
      if (xpLost > 0) setTotalXP(x => Math.max(0, x - xpLost));
      const userTasks = prev.filter(t => !t.isDefault);
      return [...userTasks, ...pickDailyTasks(appDay, newOffset, difficultyMode, questsPerDay)];
    });
    setEditingId(null);
  };

  const changeMode = (newMode) => {
    setDifficultyMode(newMode);
    setTasks(prev => {
      const completedDefaults = prev.filter(t => t.done && t.date === appDay && t.isDefault);
      const xpLost = completedDefaults.reduce((sum, t) => sum + (t.xp ?? XP_EASY), 0);
      if (xpLost > 0) setTotalXP(x => Math.max(0, x - xpLost));
      const userTasks = prev.filter(t => !t.isDefault || t.date !== appDay);
      return [...userTasks, ...pickDailyTasks(appDay, 0, newMode, questsPerDay)];
    });
    setResetOffset(0);
  };

  const changeQuestsPerDay = (count) => {
    setQuestsPerDay(count);
    setTasks(prev => {
      const completedDefaults = prev.filter(t => t.done && t.date === appDay && t.isDefault);
      const xpLost = completedDefaults.reduce((sum, t) => sum + (t.xp ?? XP_EASY), 0);
      if (xpLost > 0) setTotalXP(x => Math.max(0, x - xpLost));
      const userTasks = prev.filter(t => !t.isDefault || t.date !== appDay);
      return [...userTasks, ...pickDailyTasks(appDay, 0, difficultyMode, count)];
    });
    setResetOffset(0);
  };

  // ── Edit handlers
  const onEditStart  = (id, text) => { setEditingId(id); setEditText(text); };
  const onEditChange = (val)       => setEditText(val);
  const onEditCancel = ()          => setEditingId(null);
  const onEditSave   = (id)        => {
    const trimmed = editText.trim();
    if (trimmed) setTasks(prev => prev.map(t => t.id === id ? { ...t, text: trimmed } : t));
    setEditingId(null);
  };

  const handleFullReset = () => {
    setShowResetConfirm(false);
    setTotalXP(0);
    setStreak(0);
    setBestStreak(0);
    setLastDoneDay(null);
    setPlayerName("Player");
    setTasks(pickDailyTasks(appDay, 0, "mixed", 5));
    setDifficultyMode("mixed");
    setRoutines([]);
    setQuestsPerDay(5);
    setOnboardingDone(false);
    setResetOffset(0);
    setEditingId(null);
    setEditingName(false);
    setStreakLostMsg(false);
    localStorage.removeItem(LS_KEY);
  };
  const startNameEdit  = () => { setNameInput(playerName); setEditingName(true); };
  const saveNameEdit   = () => { const t = nameInput.trim(); if (t) setPlayerName(t); setEditingName(false); };
  const cancelNameEdit = () => setEditingName(false);
  const spawnPopup = (taskId, xp) => {
    const p = { uid: Date.now() + Math.random(), taskId, xp };
    setPopups(prev => [...prev, p]);
    setTimeout(() => setPopups(prev => prev.filter(x => x.uid !== p.uid)), 950);
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const completing = !t.done;
      const taskXP = t.xp ?? XP_EASY;
      // Apply 5% bonus XP at every 5th level milestone
      const bonusMult = completing && level > 0 && level % 5 === 0 ? (1 + XP_MILESTONE_BONUS) : 1;
      const earnedXP  = completing ? Math.round(taskXP * bonusMult) : taskXP;
      const delta     = completing ? earnedXP : -taskXP;
      setTotalXP(prev => {
        const newXP = Math.max(0, prev + delta);
        if (completing) {
          const oldLevel = getLevel(prev).level;
          const newLevel = getLevel(newXP).level;
          if (newLevel > oldLevel) {
            clearTimeout(luTimer.current);
            const newTitle = getTitle(newLevel).label;
            setLevelUpMsg({ level: newLevel, title: newTitle });
            luTimer.current = setTimeout(() => setLevelUpMsg(null), 3000);
          }
          const oldRank = getRank(oldLevel).label;
          const newRank = getRank(newLevel).label;
          if (newRank !== oldRank) {
            clearTimeout(rankUpTimer.current);
            setRankUpMsg(`RANK ${newRank}`);
            rankUpTimer.current = setTimeout(() => setRankUpMsg(null), 3000);
          }
        }
        return newXP;
      });
      if (completing) {
        spawnPopup(id, earnedXP);
        setCompleting(prev => { const s = new Set(prev); s.add(id); return s; });
        setTimeout(() => setCompleting(prev => { const s = new Set(prev); s.delete(id); return s; }), 520);
        setLastDoneDay(appDay);
      }
      return { ...t, done: completing };
    }));
  };

  const toggleRoutine = (task) => {
    const alreadyRoutine = routines.some(r => r.id === task.routineSourceId || r.id === task.id);
    if (alreadyRoutine) {
      // Remove from routines
      const srcId = task.routineSourceId ?? task.id;
      setRoutines(prev => prev.filter(r => r.id !== srcId));
      // Remove the isRoutine flag from the current task instance
      setTasks(prev => prev.map(t =>
        (t.routineSourceId === srcId || t.id === srcId)
          ? { ...t, isRoutine: false, routineSourceId: undefined }
          : t
      ));
    } else {
      // Save as routine
      const routineId = task.routineSourceId ?? `r-${Date.now()}`;
      const newRoutine = { id: routineId, text: task.text, category: task.category, difficulty: task.difficulty, xp: task.xp };
      setRoutines(prev => [...prev, newRoutine]);
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, isRoutine: true, routineSourceId: routineId } : t
      ));
    }
  };

  const addTask = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const routineId = isRoutineInput ? `r-${Date.now()}` : undefined;
    const newTask = {
      id: Date.now(),
      text: trimmed,
      category: "Routine",
      difficulty: "Easy",
      xp: XP_EASY,
      done: false,
      date: appDay,
      isDefault: false,
      isRoutine: isRoutineInput,
      routineSourceId: routineId,
    };
    if (isRoutineInput) {
      setRoutines(prev => [...prev, { id: routineId, text: trimmed, category: "Routine", difficulty: "Easy", xp: XP_EASY }]);
    }
    setTasks(prev => {
      const firstDefaultIdx = prev.findIndex(t => (t.isDefault || (!t.isRoutine)) && t.date === appDay && !t.isRoutine);
      // routines always at top
      if (isRoutineInput) return [newTask, ...prev];
      const arr = [...prev];
      const insertAt = prev.findIndex(t => t.isDefault && t.date === appDay);
      if (insertAt === -1) arr.push(newTask);
      else arr.splice(insertAt, 0, newTask);
      return arr;
    });
    setInput("");
    setIsRoutineInput(false);
  };

  const deleteTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task?.done) setTotalXP(prev => Math.max(0, prev - (task.xp ?? XP_EASY)));
    if (task?.isRoutine && task?.routineSourceId) {
      setRoutines(prev => prev.filter(r => r.id !== task.routineSourceId));
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleKey = (e) => { if (e.key === "Enter") addTask(); };

  // ── Derived lists
  const todayTasks   = tasks.filter(t => t.date === appDay);
  const pendingTasks = tasks.filter(t => t.date !== appDay && !t.done);
  const doneToday    = todayTasks.filter(t => t.done).length;
  const questPct     = todayTasks.length === 0 ? 0 : Math.round((doneToday / todayTasks.length) * 100);
  const isAllDone    = todayTasks.length > 0 && todayTasks.every(t => t.done);
  const routineIds   = new Set(routines.map(r => r.id));

  // ── Render
  return (
    <div className="sl-wrapper">
      <div className={`sl-panel${isAllDone ? " all-done-glow" : ""}`}>
        <div className="sl-corner tl" />
        <div className="sl-corner br" />

        {levelUpMsg && (
          <div className="sl-levelup">
            <div className="sl-levelup-text">
              LEVEL {levelUpMsg.level}
              <span className="sl-levelup-sub">[ LEVEL UP ] — {levelUpMsg.title.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Streak bar */}
        <div className="sl-streak-bar">
          <span className={`sl-streak-flame${streak === 0 ? " dead" : ""}`}>🔥</span>
          <div className="sl-streak-info">
            <span className="sl-streak-label">DAILY STREAK</span>
            <span className={`sl-streak-count${streak === 0 ? " dead" : ""}`}>
              {streak}
              <span className="sl-streak-sub">{streak === 1 ? "DAY" : "DAYS"}</span>
            </span>
          </div>
          <div className="sl-streak-best">
            <div>BEST</div>
            <b>{bestStreak}</b>
          </div>
        </div>

        {/* Streak lost toast */}
        {streakLostMsg && (
          <div className="sl-streak-lost">
            <span>😔</span>
            <span className="sl-streak-lost-text"><b>Streak lost</b> — start again today.</span>
          </div>
        )}

        {/* Rank-up banner */}
        {rankUpMsg && (
          <div className="sl-rankup">
            <span className="sl-rankup-icon">⬆️</span>
            <span className="sl-rankup-text" style={{ color: getRank(level).color, textShadow:`0 0 10px ${getRank(level).color}88` }}>
              RANK UPGRADED TO {rankUpMsg}
              <span className="sl-rankup-sub">NEXT RANK REQUIRES MORE LEVELS</span>
            </span>
          </div>
        )}

        {/* All-done banner — shows whenever all today's tasks are complete */}
        {isAllDone && (
          <div className="sl-alldone">
            <span className="sl-alldone-icon">✅</span>
            <span className="sl-alldone-text">
              <b>All done.</b> You showed up today.
              <span className="sl-alldone-sub">KEEP THE STREAK ALIVE TOMORROW</span>
            </span>
          </div>
        )}

        {/* Player card */}
        <div className="sl-player-card">
          <div className="sl-rank-badge" style={{ borderColor: rankColor, boxShadow: `0 0 14px ${rankColor}55` }}>
            <span className="sl-rank-letter" style={{ color: rankColor }}>{rank}</span>
            <span className="sl-rank-lbl"    style={{ color: rankColor }}>
              {rank === "S" ? "MAX" : `LV${getRank(level).max + 1}`}
            </span>
          </div>
          <div className="sl-player-info">
            {editingName ? (
              <div className="sl-name-edit-wrap">
                <input
                  className="sl-name-input"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveNameEdit(); if (e.key === "Escape") cancelNameEdit(); }}
                  autoFocus
                  maxLength={20}
                />
                <button className="sl-name-save"   onClick={saveNameEdit}>OK</button>
                <button className="sl-name-cancel"  onClick={cancelNameEdit}>✕</button>
              </div>
            ) : (
              <div className="sl-player-name" onClick={startNameEdit} title="Click to edit name">
                {playerName}
                <span className="sl-player-name-pencil">✎</span>
              </div>
            )}
            <div className="sl-level-row">
              <span className="sl-level-num" style={{ color: levelColor }}>LV.{level}</span>
              <span className="sl-level-tag">{titleObj.label.toUpperCase()}</span>
              <span
                className="sl-title-badge"
                style={{ color: titleObj.color, borderColor: titleObj.color.replace("0.8","0.3").replace("0.85","0.3").replace("0.9","0.3").replace("0.95","0.35") }}
              >
                {titleObj.label.toUpperCase()}
              </span>
            </div>
            <div className="sl-xp-labels">
              <span className="sl-xp-label">EXPERIENCE</span>
              <span className="sl-xp-val">{currentXP} / {xpNeeded}</span>
              <span className="sl-total-xp" style={{ marginLeft:"auto" }}>{totalXP} XP</span>
            </div>
            <div className="sl-xp-track">
              <div className="sl-xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        {/* Header + countdown */}
        <div className="sl-header">
          <div className="sl-header-left">
            <div className="sl-system-tag">[ DAILY SYSTEM ]</div>
            <div className="sl-title">DAILY <span>LOG</span></div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <button className="sl-settings-btn" onClick={() => setShowSettings(true)} title="Settings">⚙</button>
            <div className="sl-reset-box">
              <span className="sl-reset-lbl">RESET IN</span>
              <span className="sl-countdown">{countdown}</span>
              <button className="sl-next-day-btn" onClick={simulateNextDay} title="Simulate next day reset">
                ▶ NEXT DAY
              </button>
            </div>
          </div>
        </div>

        <div className="sl-divider" />

        {/* Onboarding hint — new users only */}
        {!onboardingDone && (
          <div className="sl-onboard">
            <span className="sl-onboard-icon">💡</span>
            <span className="sl-onboard-text">
              <b>Welcome!</b> Complete tasks to earn XP and level up. Your streak grows every day you finish at least one task. Tap ⚙ to change difficulty.
            </span>
            <button className="sl-onboard-dismiss" onClick={() => setOnboardingDone(true)} title="Got it">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="sl-input-row">
          <input
            className="sl-input"
            placeholder={isRoutineInput ? "Name your daily routine..." : "Add a custom task for today..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="sl-add-btn" onClick={addTask} disabled={!input.trim()}>
            + ADD
          </button>
        </div>
        <div className="sl-routine-toggle">
          <div
            className={`sl-routine-check${isRoutineInput ? " on" : ""}`}
            onClick={() => setIsRoutineInput(v => !v)}
          >
            {isRoutineInput && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6.5 7,1.5" stroke="rgba(0,220,210,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span
            className={`sl-routine-toggle-label${isRoutineInput ? " on" : ""}`}
            onClick={() => setIsRoutineInput(v => !v)}
          >
            SAVE AS DAILY ROUTINE
          </span>
        </div>

        {/* Pending section */}
        {pendingTasks.length > 0 && (
          <>
            <div className="sl-section-label pending">
              CARRIED FORWARD
              <span className="sl-pending-badge">{pendingTasks.length} {pendingTasks.length === 1 ? "TASK" : "TASKS"}</span>
            </div>
            <p className="sl-pending-nudge">Still time to knock these out — no pressure.</p>
            <ul className="sl-task-list">
              {pendingTasks.map(t => <TaskRow key={t.id} task={t} isPending={true} appDay={appDay} popups={popups} completing={completing} editingId={editingId} editText={editText} onToggle={toggleTask} onDelete={deleteTask} onEditStart={onEditStart} onEditChange={onEditChange} onEditSave={onEditSave} onEditCancel={onEditCancel} onRoutineToggle={toggleRoutine} routineIds={routineIds} />)}
            </ul>
          </>
        )}

        {/* Today's section */}
        <div className="sl-section-label today">TODAY'S TASKS</div>
        {todayTasks.length === 0 ? (
          <div className="sl-empty">NO TASKS FOR TODAY</div>
        ) : (
          <ul className="sl-task-list">
            {todayTasks.map(t => <TaskRow key={t.id} task={t} isPending={false} appDay={appDay} popups={popups} completing={completing} editingId={editingId} editText={editText} onToggle={toggleTask} onDelete={deleteTask} onEditStart={onEditStart} onEditChange={onEditChange} onEditSave={onEditSave} onEditCancel={onEditCancel} onRoutineToggle={toggleRoutine} routineIds={routineIds} />)}
          </ul>
        )}

        {/* Footer */}
        {todayTasks.length > 0 && (
          <div className="sl-footer-row">
            <div className="sl-stats">TODAY <b>{doneToday}</b> / {todayTasks.length}</div>
            <div className="sl-progress-bar">
              <div className="sl-progress-fill" style={{ width: `${questPct}%` }} />
            </div>
            <button className="sl-reset-tasks-btn" onClick={resetTasks} title="Get a new set of tasks">
              ↺ NEW SET
            </button>
          </div>
        )}

        {/* Settings overlay */}
        {showSettings && (
          <div className="sl-settings-overlay" onClick={() => setShowSettings(false)}>
            <div className="sl-settings-panel" onClick={e => e.stopPropagation()}>
              <div className="sl-settings-header">
                <span className="sl-settings-title">[ SETTINGS ]</span>
                <button className="sl-settings-close" onClick={() => setShowSettings(false)}>✕</button>
              </div>

              <div className="sl-settings-section-title">DIFFICULTY MODE</div>
              <div className="sl-mode-grid">
                {Object.entries(DIFFICULTY_MODES).map(([key, m]) => (
                  <button
                    key={key}
                    className={`sl-mode-card${difficultyMode === key ? " active" : ""}`}
                    onClick={() => changeMode(key)}
                  >
                    <span className="sl-mode-card-name">{m.label}</span>
                    <span className="sl-mode-card-desc">{m.desc}</span>
                  </button>
                ))}
              </div>

              <div className="sl-settings-divider" />
              <div className="sl-settings-section-title">QUESTS PER DAY</div>
              <div className="sl-count-row">
                {[3, 5, 8].map(n => (
                  <button
                    key={n}
                    className={`sl-count-pill${questsPerDay === n ? " active" : ""}`}
                    onClick={() => changeQuestsPerDay(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="sl-settings-divider" />
              <div className="sl-full-reset-section" style={{ marginTop:0, paddingTop:0, borderTop:"none" }}>
                <button
                  className="sl-full-reset-btn"
                  onClick={() => { setShowSettings(false); setShowResetConfirm(true); }}
                >
                  RESET ALL PROGRESS
                </button>
                <span className="sl-full-reset-hint">CLEARS XP · LEVEL · STREAK · NAME</span>
              </div>
            </div>
          </div>
        )}

        {/* Reset confirmation modal */}
        {showResetConfirm && (
          <div className="sl-confirm-overlay" onClick={() => setShowResetConfirm(false)}>
            <div className="sl-confirm-box" onClick={e => e.stopPropagation()}>
              <span className="sl-confirm-icon">⚠️</span>
              <div className="sl-confirm-title">ARE YOU SURE?</div>
              <p className="sl-confirm-body">
                This will permanently delete <b>all your XP, level, streak and name</b>. This cannot be undone.
              </p>
              <div className="sl-confirm-actions">
                <button className="sl-confirm-cancel" onClick={() => setShowResetConfirm(false)}>CANCEL</button>
                <button className="sl-confirm-danger" onClick={handleFullReset}>YES, RESET</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}