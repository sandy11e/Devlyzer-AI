import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip,
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer,
} from "recharts";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ─── GLOBAL CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800;900&family=Fira+Code:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:    #05070d;
    --ink1:   #0b0f1a;
    --ink2:   #121828;
    --ink3:   #1a2236;
    --border: rgba(255,255,255,0.07);
    --hi:     rgba(255,255,255,0.12);
    --em:     #00f5c4;
    --em2:    #7b61ff;
    --em3:    #ff6b6b;
    --em4:    #ffd166;
    --dim:    #4a5578;
    --mid:    #8892aa;
    --text:   #dce3f0;
    --white:  #ffffff;
    --glow-em:  rgba(0,245,196,0.25);
    --glow-em2: rgba(123,97,255,0.25);
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--ink);
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  input, button { font-family: 'Outfit', sans-serif; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--em); border-radius: 99px; }
  ::selection { background: var(--em); color: var(--ink); }

  @keyframes up   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes in   { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes scan-line {
    0%   { top: -15%; }
    100% { top: 115%; }
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-5px); }
  }
  @keyframes dot-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.5; transform:scale(1.5); }
  }
  @keyframes glitch {
    0%,94%,100% { transform:none; opacity:1; }
    95%         { transform:translate(-2px,0); opacity:0.8; clip-path:inset(30% 0 40% 0); }
    97%         { transform:translate(2px,0);  opacity:0.8; clip-path:inset(60% 0 20% 0); }
  }
`;

function useCSS() {
  useEffect(() => {
    if (document.getElementById("dl-css")) return;
    const el = document.createElement("style");
    el.id = "dl-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/* ─── MATRIX CANVAS ─── */
function MatrixBg() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const cols = Math.floor(c.width / 22);
    const drops = Array(cols).fill(1);
    const chars = "01アイウカキクサシスタチ▲△□◇◆";
    const id = setInterval(() => {
      ctx.fillStyle = "rgba(5,7,13,0.055)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "rgba(0,245,196,0.055)";
      ctx.font = "13px 'Fira Code'";
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 22, y * 22);
        if (y * 22 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 65);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.35 }} />;
}

/* ─── SCAN LINE ─── */
function ScanLine() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: "28%",
        background: "linear-gradient(180deg,transparent,rgba(0,245,196,0.012),transparent)",
        animation: "scan-line 9s linear infinite",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)",
      }} />
    </div>
  );
}

/* ─── CORNER BRACKETS ─── */
function Brackets({ color = "var(--em)", size = 12, thick = 1.5 }) {
  const s = { position: "absolute", width: size, height: size };
  const b = `${thick}px solid ${color}`;
  return (
    <>
      <div style={{ ...s, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <div style={{ ...s, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <div style={{ ...s, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <div style={{ ...s, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

/* ─── DOT ─── */
function Dot({ color = "var(--em)", size = 7, pulse = true }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: color, boxShadow: `0 0 6px ${color}`,
      animation: pulse ? "dot-pulse 2s ease infinite" : "none",
      flexShrink: 0,
    }} />
  );
}

/* ─── TAG ─── */
function Tag({ children, color = "em", style: s = {} }) {
  const map = {
    em:  { bg: "rgba(0,245,196,0.08)",   border: "rgba(0,245,196,0.25)",   text: "var(--em)"  },
    em2: { bg: "rgba(123,97,255,0.08)",  border: "rgba(123,97,255,0.25)",  text: "var(--em2)" },
    em3: { bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.25)", text: "var(--em3)" },
    em4: { bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.25)", text: "var(--em4)" },
  };
  const c = map[color] || map.em;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px",
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 4, fontSize: 11, fontWeight: 500,
      color: c.text, fontFamily: "'Fira Code',monospace",
      letterSpacing: 0.3, ...s,
    }}>{children}</span>
  );
}

/* ─── PANEL ─── */
function Panel({ children, style: s = {}, label = null, glow = false }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(26,34,54,0.88),rgba(18,24,40,0.93))",
      border: "1px solid var(--border)",
      borderRadius: 12, position: "relative", overflow: "hidden",
      backdropFilter: "blur(18px)",
      boxShadow: glow
        ? "0 0 0 1px rgba(0,245,196,0.1),0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 16px 48px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)",
      ...s,
    }}>
      {label && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 34,
          background: "rgba(0,0,0,0.35)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", paddingLeft: 12, gap: 8,
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f56","#ffbd2e","#27c93f"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.65 }} />
            ))}
          </div>
          <span style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 0.4, marginLeft: 2 }}>
            {label}
          </span>
        </div>
      )}
      <div style={{ paddingTop: label ? 34 : 0 }}>{children}</div>
    </div>
  );
}

/* ─── SVG RING ─── */
function Ring({ value = 0, size = 110, color = "#00f5c4", label, sub }) {
  const stroke = 5, r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => {
    let f = null;
    const dur = 1400;
    const run = ts => {
      if (!f) f = ts;
      const p = Math.min((ts - f) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(value * e));
      if (p < 1) requestAnimationFrame(run);
    };
    const t = setTimeout(() => requestAnimationFrame(run), 150);
    return () => clearTimeout(t);
  }, [value]);
  const offset = circ - (v / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <div style={{
          position: "absolute", inset: "20%", borderRadius: "50%",
          background: `radial-gradient(circle,${color}18 0%,transparent 70%)`,
        }} />
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 0.04s" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Outfit'", fontSize: size * 0.27, fontWeight: 800, color, lineHeight: 1, textShadow: `0 0 20px ${color}80` }}>
            {v}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "'Fira Code'", letterSpacing: 0.5, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── STAT BAR ─── */
function StatBar({ label, value, color = "#00f5c4", delay = 0 }) {
  const [w, setW] = useState(0);
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  const pct = Math.min(100, num);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay + 80);
    return () => clearTimeout(t);
  }, [pct, delay]);
  const display = Number.isInteger(num) ? num : num.toFixed(2);
  return (
    <div style={{ padding: "7px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "var(--mid)", textTransform: "capitalize" }}>
          {label.replace(/_/g, " ")}
        </span>
        <span style={{ fontFamily: "'Fira Code'", fontSize: 11, color }}>{display}</span>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 99 }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg,${color}80,${color})`,
          width: `${w}%`, transition: `width 0.8s cubic-bezier(0.22,1,0.36,1)`,
          boxShadow: `0 0 10px ${color}50`,
        }} />
      </div>
    </div>
  );
}

/* ─── TOOLTIP ─── */
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(11,15,26,0.97)", border: "1px solid var(--hi)",
      borderRadius: 8, padding: "8px 14px",
      fontFamily: "'Fira Code'", fontSize: 11, color: "var(--text)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      {label && <div style={{ color: "var(--dim)", marginBottom: 3 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--em)" }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
export default function Dashboard() {
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [data, setData] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [showDesc, setShowDesc] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  useCSS();

  useEffect(() => {
    // Only restore from localStorage if coming from Chat page
    // Don't restore if coming from Landing page (initial load)
    const fromChat = location.state?.from === 'chat' || sessionStorage.getItem('fromChat');
    
    if (fromChat) {
      try {
        const saved = localStorage.getItem("devlensData");
        if (saved) {
          const obj = JSON.parse(saved);
          setData(obj);
          setCurrentAnalysis(obj);
          if (obj.github_username) setGithub(obj.github_username);
          if (obj.leetcode_username) setLeetcode(obj.leetcode_username);
        }
      } catch (e) { /* ignore parse errors */ }
      sessionStorage.removeItem('fromChat');
    }
  }, []);

  const featureDescriptions = {
    language_entropy: "Diversity of languages across repositories. Higher indicates broader language usage.",
    project_depth: "Average repo size; higher often means deeper, more substantial projects.",
    documentation_score: "Proportion of repos with descriptions — proxy for docs and discoverability.",
    popularity_score: "Stars/forks weighted score indicating community interest.",
    activity_score: "Recent activity (pushes) across repos — signals ongoing maintenance.",
    professional_signal: "Presence of pages/wiki which often indicate polished projects.",
    hard_score: "Share of hard problems solved on LeetCode relative to total solved.",
    volume_score: "Overall problem volume solved on LeetCode.",
    acceptance_score: "Solved/submission ratio — indicates solution quality.",
    ranking_score: "LeetCode public ranking (lower is better) normalized into a score.",
  };

  const toggleDesc = key => setShowDesc(s => ({ ...s, [key]: !s[key] }));

  const fetchHistory = async () => {
    if (!github) return;
    setFetchingHistory(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/evaluations/${github}`);
      setHistory(res.data || []);
      setShowHistory(true);
    } catch (e) { console.error(e); }
    finally { setFetchingHistory(false); }
  };

  const loadHistoryItem = h => {
    setData({ ...h });
    setViewingHistoryItem(true);
    setShowHistory(false);
    localStorage.setItem("devlensData", JSON.stringify(h));
  };

  const exportPDF = () => {
    if (!data) return;
    const title = `${data.github_username || 'profile'} · Devlyzer Report`;
    const now = new Date().toLocaleString();
    const reposHtml = (data.repositories || []).slice().sort((a,b) => (b.stars||0)-(a.stars||0)).slice(0,5).map(r => (
      `<div style="margin-bottom:8px;"><div style="font-weight:700">${r.name}</div><div style="color:#6b7280">${r.description||''}</div><div style="font-family:monospace;color:#374151;margin-top:6px">${r.language||''} • ★ ${r.stars||0} • ${r.size}kb</div></div>`
    )).join("");

    const engFeatures = Object.entries(data.engineering_features || {}).map(([k,v]) => `<tr><td style="padding:6px 8px;border:1px solid #e5e7eb">${k.replace(/_/g,' ')}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right">${v}</td></tr>`).join("");
    const dsaFeatures = Object.entries(data.dsa_features || {}).map(([k,v]) => `<tr><td style="padding:6px 8px;border:1px solid #e5e7eb">${k.replace(/_/g,' ')}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right">${v}</td></tr>`).join("");

    const html = `
      <html><head><title>${title}</title>
        <meta charset="utf-8" />
        <style>
          body{font-family:Inter,Arial,Helvetica,sans-serif;color:#0f172a;padding:24px}
          .header{display:flex;justify-content:space-between;align-items:center}
          .card{border:1px solid #e6edf3;padding:12px;border-radius:8px;margin-bottom:12px}
          table{border-collapse:collapse;width:100%;margin-top:8px}
          th,td{border:1px solid #e5e7eb;padding:6px 8px}
        </style>
      </head><body>
        <div class="header"><div><h1 style="margin:0">${title}</h1><div style="color:#6b7280">Generated: ${now}</div></div><div style="text-align:right">Final score: <strong>${data.final_score ?? '–'}</strong><div style="color:#6b7280">Category: ${data.category||'–'}</div></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div class="card">
            <h3 style="margin:0 0 8px 0">Engineering Features</h3>
            <table><tbody>${engFeatures}</tbody></table>
          </div>
          <div class="card">
            <h3 style="margin:0 0 8px 0">DSA Features</h3>
            <table><tbody>${dsaFeatures}</tbody></table>
          </div>
        </div>
        <div class="card" style="margin-top:12px">
          <h3 style="margin:0 0 8px 0">Top repositories</h3>
          ${reposHtml || '<div style="color:#6b7280">No repositories</div>'}
        </div>
        <div style="margin-top:18px;color:#6b7280;font-size:12px">Report generated by Devlyzer</div>
      </body></html>`;

    const w = window.open('', '_blank', 'noopener');
    if (!w) { alert('Please allow popups to export PDF'); return; }
    w.document.write(html);
    w.document.close();
    // Give the new window a moment to render then trigger print dialog
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  const exportPDFDirect = async () => {
    if (!data) return;
    // Build a clean report node (off-DOM) for printable layout
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.width = '1200px';
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#0f172a';
    wrapper.style.padding = '32px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.fontFamily = 'Arial, Helvetica, sans-serif';
    wrapper.innerHTML = (function build() {
      const now = new Date().toLocaleString();
      
      // Top 5 repos with links
      const reposHtml = (data.repositories || []).slice().sort((a,b) => (b.stars||0)-(a.stars||0)).slice(0,5).map(r => `
        <div style="margin-bottom:16px;border-bottom:1px solid #eef2f7;padding-bottom:12px">
          <div style="font-weight:700;font-size:15px"><a href="https://github.com/${data.github_username}/${r.name}" style="color:#0f172a;text-decoration:none;border-bottom:2px solid #3b82f6">${r.name}</a></div>
          <div style="color:#6b7280;font-size:13px;margin-top:6px;line-height:1.5">${r.description||'—'}</div>
          <div style="font-family:monospace;color:#374151;margin-top:8px;font-size:12px">${r.language||'—'} • ★ ${r.stars||0} • ${r.size}kb</div>
        </div>`).join('');

      // Engineering features
      const engRows = Object.entries(data.engineering_features || {}).map(([k,v]) => `
        <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">${k.replace(/_/g,' ').replace(/^./, c => c.toUpperCase())}</td><td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:600">${v}</td></tr>
      `).join('');

      // DSA features
      const dsaRows = Object.entries(data.dsa_features || {}).map(([k,v]) => `
        <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">${k.replace(/_/g,' ').replace(/^./, c => c.toUpperCase())}</td><td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:600">${v}</td></tr>
      `).join('');

      // Consistency & Collaboration
      const consistRows = Object.entries(data.consistency_features || {}).map(([k,v]) => `
        <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">${k.replace(/_/g,' ').replace(/^./, c => c.toUpperCase())}</td><td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:600">${v}</td></tr>
      `).join('');

      const collabRows = Object.entries(data.collaboration_features || {}).map(([k,v]) => `
        <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">${k.replace(/_/g,' ').replace(/^./, c => c.toUpperCase())}</td><td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:600">${v}</td></tr>
      `).join('');

      // Recommendations with steps
      const recsHtml = (data.recommendations || []).map(r => `
        <div style="margin-bottom:16px;padding:14px;border-left:4px solid ${r.severity === 'high' ? '#ef4444' : r.severity === 'medium' ? '#f59e0b' : '#6366f1'};background:#f9fafb;border-radius:4px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-weight:700;font-size:14px;color:#0f172a">${r.title}</div>
            <span style="font-size:11px;padding:3px 8px;background:${r.severity === 'high' ? '#fee2e2' : r.severity === 'medium' ? '#fef3c7' : '#e0e7ff'};color:${r.severity === 'high' ? '#991b1b' : r.severity === 'medium' ? '#92400e' : '#312e81'};border-radius:3px;font-weight:600;text-transform:uppercase">${r.severity}</span>
          </div>
          <div style="color:#4b5563;font-size:13px;line-height:1.6;margin-bottom:10px">${r.text}</div>
          ${r.steps && r.steps.length > 0 ? `
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb">
              <div style="font-weight:600;font-size:12px;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Action Items</div>
              <ol style="margin:0;padding-left:20px;color:#374151;font-size:12px;line-height:1.8">
                ${r.steps.map(step => `<li style="margin-bottom:6px">${step}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
        </div>
      `).join('');

      return `
        <div style="width:100%;max-width:1152px;margin:0 auto">
          <!-- Header -->
          <div style="border-bottom:3px solid #0f172a;padding-bottom:20px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font-size:28px;font-weight:900;color:#0f172a">${data.github_username || 'Developer'}</div>
                <div style="font-size:14px;color:#6b7280;margin-top:4px">Devlyzer Technical Assessment Report</div>
                <div style="font-size:12px;color:#9ca3af;margin-top:8px">Generated: ${now}</div>
              </div>
              <div style="text-align:right;padding:16px;background:#f3f4f6;border-radius:8px">
                <div style="font-size:32px;font-weight:900;color:#0f172a">${data.final_score ?? '–'}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px">Final Score</div>
                <div style="font-size:14px;font-weight:700;color:#3b82f6;margin-top:8px">${data.category || '–'}</div>
              </div>
            </div>
          </div>

          <!-- Score Summary Grid -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
            <div style="border:1px solid #e5e7eb;padding:14px;border-radius:8px;background:#fafbfc">
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px">ENGINEERING</div>
              <div style="font-size:24px;font-weight:900;color:#0f172a">${data.engineering_score ?? '–'}</div>
            </div>
            <div style="border:1px solid #e5e7eb;padding:14px;border-radius:8px;background:#fafbfc">
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px">DSA</div>
              <div style="font-size:24px;font-weight:900;color:#0f172a">${data.dsa_score ?? '–'}</div>
            </div>
            <div style="border:1px solid #e5e7eb;padding:14px;border-radius:8px;background:#fafbfc">
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px">CONSISTENCY</div>
              <div style="font-size:24px;font-weight:900;color:#0f172a">${data.consistency_score ?? '–'}</div>
            </div>
            <div style="border:1px solid #e5e7eb;padding:14px;border-radius:8px;background:#fafbfc">
              <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px">COLLABORATION</div>
              <div style="font-size:24px;font-weight:900;color:#0f172a">${data.collaboration_score ?? '–'}</div>
            </div>
          </div>

          <!-- Detailed Feature Breakdown -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px">
            <div style="border:1px solid #e5e7eb;padding:16px;border-radius:8px">
              <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0f172a">ENGINEERING METRICS</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px">${engRows || '<tr><td colspan="2" style="padding:8px;color:#6b7280">No data</td></tr>'}</table>
            </div>
            <div style="border:1px solid #e5e7eb;padding:16px;border-radius:8px">
              <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0f172a">DSA METRICS</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px">${dsaRows || '<tr><td colspan="2" style="padding:8px;color:#6b7280">No data</td></tr>'}</table>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px">
            <div style="border:1px solid #e5e7eb;padding:16px;border-radius:8px">
              <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0f172a">CONSISTENCY METRICS</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px">${consistRows || '<tr><td colspan="2" style="padding:8px;color:#6b7280">No data</td></tr>'}</table>
            </div>
            <div style="border:1px solid #e5e7eb;padding:16px;border-radius:8px">
              <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0f172a">COLLABORATION METRICS</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px">${collabRows || '<tr><td colspan="2" style="padding:8px;color:#6b7280">No data</td></tr>'}</table>
            </div>
          </div>

          <!-- Top Repositories -->
          <div style="margin-bottom:24px">
            <div style="font-weight:700;font-size:16px;margin-bottom:14px;color:#0f172a;border-bottom:2px solid #e5e7eb;padding-bottom:8px">TOP REPOSITORIES</div>
            ${reposHtml || '<div style="color:#6b7280;padding:12px">No repositories found</div>'}
          </div>

          <!-- LeetCode Breakdown -->
          ${data.leetcode_breakdown ? `
            <div style="margin-bottom:24px;border:1px solid #e5e7eb;padding:16px;border-radius:8px;background:#fafbfc">
              <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0f172a">LEETCODE PROBLEM BREAKDOWN</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
                <div>
                  <div style="font-size:24px;font-weight:900;color:#0f172a">${data.leetcode_breakdown.easy || 0}</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:4px">Easy Problems Solved</div>
                </div>
                <div>
                  <div style="font-size:24px;font-weight:900;color:#0f172a">${data.leetcode_breakdown.medium || 0}</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:4px">Medium Problems Solved</div>
                </div>
                <div>
                  <div style="font-size:24px;font-weight:900;color:#0f172a">${data.leetcode_breakdown.hard || 0}</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:4px">Hard Problems Solved</div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Recommendations -->
          <div style="margin-bottom:24px">
            <div style="font-weight:700;font-size:16px;margin-bottom:14px;color:#0f172a;border-bottom:2px solid #e5e7eb;padding-bottom:8px">PERSONALIZED RECOMMENDATIONS</div>
            ${recsHtml || '<div style="color:#6b7280;padding:12px">No recommendations at this time</div>'}
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;color:#9ca3af;font-size:11px;text-align:center">
            <p>This report was generated by Devlyzer, a technical assessment platform.</p>
            <p>For more information, visit <a href="https://devlyzer.com" style="color:#3b82f6;text-decoration:none">devlyzer.com</a></p>
          </div>
        </div>`;
    })();

    document.body.appendChild(wrapper);
    try {
      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgWidth = 595; // A4 pt width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'pt', 'a4');

      // slice canvas into pages if needed
      const pageHeightPx = Math.floor(canvas.width * (842 / imgWidth));
      let y = 0;
      while (y < canvas.height) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(pageHeightPx, canvas.height - y);
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, y, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        const imgData = sliceCanvas.toDataURL('image/png');
        const h = (sliceCanvas.height * imgWidth) / canvas.width;
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, h);
        y += sliceCanvas.height;
      }

      pdf.save(`${data.github_username || 'profile'}-devlyzer.pdf`);
    } catch (err) {
      console.error(err);
      alert('PDF generation failed — opening print dialog fallback.');
      exportPDF();
    } finally {
      wrapper.remove();
    }
  };
  const run = async () => {
    if (!github || !leetcode) return;
    try {
      setLoading(true); setData(null);
      const res = await axios.get(`http://127.0.0.1:8000/devlens-evaluate/${github}/${leetcode}`);
      setData(res.data);
      setCurrentAnalysis(res.data);
      setViewingHistoryItem(false);
      localStorage.setItem("devlensData", JSON.stringify(res.data));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const radarData = data ? [
    { subject: "Engineering", value: data.engineering_score },
    { subject: "DSA",         value: data.dsa_score         },
    { subject: "Consistency", value: data.consistency_score  },
    { subject: "Collab",      value: data.collaboration_score},
  ] : [];

  const lcData = data ? [
    { name: "Easy",   solved: data.leetcode_breakdown?.easy,   color: "#00f5c4" },
    { name: "Medium", solved: data.leetcode_breakdown?.medium, color: "#ffd166" },
    { name: "Hard",   solved: data.leetcode_breakdown?.hard,   color: "#ff6b6b" },
  ] : [];

  const sections = [
    { key: "engineering",   label: "github",        score: data?.engineering_score,   details: data?.engineering_features,   color: "#00f5c4" },
    { key: "dsa",           label: "leetcode",      score: data?.dsa_score,           details: data?.dsa_features,           color: "#7b61ff" },
    { key: "consistency",   label: "consistency",   score: data?.consistency_score,   details: data?.consistency_features,   color: "#ff6b6b" },
    { key: "collaboration", label: "collaboration", score: data?.collaboration_score, details: data?.collaboration_features, color: "#ffd166" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", position: "relative" }}>
      <MatrixBg />
      <ScanLine />

      <div ref={reportRef} style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>

        {/* ── NAV ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0", borderBottom: "1px solid var(--border)",
          animation: "in 0.5s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg,var(--em),#008c6e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px var(--glow-em)",
              animation: "float 4s ease-in-out infinite",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="#05070d" />
                <circle cx="8" cy="8" r="6" stroke="#05070d" strokeWidth="1.5" fill="none" />
                <line x1="8" y1="2" x2="8" y2="5" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="11" x2="8" y2="14" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="2" y1="8" x2="5" y2="8" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="11" y1="8" x2="14" y2="8" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--white)", letterSpacing: -0.2 }}>Devlyzer</div>
              <div style={{ fontFamily: "'Fira Code'", fontSize: 9, color: "var(--dim)", letterSpacing: 1.5 }}>// v2.0 stable</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Tag color="em"><Dot size={5} />&nbsp;system online</Tag>
            <button onClick={() => navigate("/chat")} style={{
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: 7, padding: "7px 16px",
              color: "var(--mid)", fontSize: 12, fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--em)"; e.currentTarget.style.color = "var(--em)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--mid)"; }}
            >AI Chat →</button>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ padding: "70px 0 52px", animation: "up 0.7s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Left */}
            <div>
              <div style={{
                fontFamily: "'Fira Code'", fontSize: 11, color: "var(--em)",
                letterSpacing: 2, textTransform: "uppercase",
                marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
              }}>
                <Dot size={6} /> Developer_Intelligence.exe
              </div>
              <h1 style={{
                fontFamily: "'Outfit'",
                fontSize: "clamp(36px,4.5vw,60px)",
                fontWeight: 800, lineHeight: 1.05,
                color: "var(--white)", letterSpacing: -2, marginBottom: 20,
              }}>
                Know every{" "}
                <span style={{
                  background: "linear-gradient(135deg,var(--em),#4adecc)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>metric</span>
                {" "}that matters.
              </h1>
              <p style={{ color: "var(--mid)", fontSize: 15, lineHeight: 1.75, maxWidth: 420, marginBottom: 36 }}>
                Deep profiling of GitHub & LeetCode. Surface hidden patterns in consistency, collaboration, engineering quality, and DSA mastery.
              </p>
              <div style={{ display: "flex", gap: 28 }}>
                {[["4", "dimensions"], ["100pt", "scale"], ["AI", "powered"]].map(([n, l], i) => (
                  <div key={i}>
                    <div style={{
                      fontFamily: "'Outfit'", fontSize: 26, fontWeight: 800, lineHeight: 1,
                      color: ["var(--em)","var(--em2)","var(--em4)"][i],
                    }}>{n}</div>
                    <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "'Fira Code'", marginTop: 3, letterSpacing: 0.5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: input */}
            <Panel label="devlyzer://analyze" glow style={{ padding: "28px 26px 24px" }}>
              <Brackets color="var(--em)" size={14} />
              <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", marginBottom: 16, letterSpacing: 0.5 }}>
                // enter credentials
              </div>
              {[
                { label: "github_username",   value: github,   set: setGithub,   color: "var(--em)"  },
                { label: "leetcode_username", value: leetcode, set: setLeetcode, color: "var(--em2)" },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: "'Fira Code'", fontSize: 10, color: f.color, marginBottom: 5, letterSpacing: 0.3 }}>
                    $ {f.label}
                  </label>
                  <input
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && run()}
                    placeholder={`enter ${f.label.split("_")[0]} handle`}
                    style={{
                      width: "100%", background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${f.value ? f.color + "50" : "var(--border)"}`,
                      borderRadius: 8, padding: "11px 16px",
                      color: "var(--text)", fontSize: 13, fontFamily: "'Fira Code'",
                      outline: "none", transition: "border-color 0.2s,box-shadow 0.2s",
                    }}
                    onFocus={e => { e.target.style.borderColor = f.color; e.target.style.boxShadow = `0 0 0 3px ${f.color}12`; }}
                    onBlur={e => { e.target.style.borderColor = f.value ? f.color + "50" : "var(--border)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              ))}
              <button
                onClick={run}
                disabled={!github || !leetcode || loading}
                style={{
                  width: "100%", padding: "13px 0",
                  background: (!github || !leetcode) ? "rgba(255,255,255,0.04)"
                    : loading ? "rgba(0,245,196,0.06)"
                    : "linear-gradient(135deg,var(--em),#00b89a)",
                  border: (!github || !leetcode) ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: 9,
                  color: (!github || !leetcode) ? "var(--dim)" : loading ? "var(--em)" : "#031a14",
                  fontSize: 13, fontWeight: 700,
                  cursor: (!github || !leetcode || loading) ? "not-allowed" : "pointer",
                  transition: "all 0.2s", letterSpacing: 0.5,
                  boxShadow: (!github || !leetcode || loading) ? "none" : "0 4px 24px var(--glow-em)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={e => { if (github && leetcode && !loading) e.currentTarget.style.transform = "scale(1.015)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(0,245,196,0.3)", borderTopColor: "var(--em)", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    analyzing
                    <span style={{ animation: "blink 1s step-end infinite" }}>_</span>
                  </>
                ) : "run_analysis()"}
              </button>
              {(!github || !leetcode) && (
                <p style={{ textAlign: "center", fontSize: 10, color: "var(--dim)", marginTop: 10, fontFamily: "'Fira Code'" }}>
                  * both fields required
                </p>
              )}
            </Panel>
          </div>
        </section>

        {/* ── RESULTS ── */}
        {data && (
          <div style={{ animation: "up 0.5s ease", paddingBottom: 80 }}>

            {/* History Warning Banner */}
            {viewingHistoryItem && (
              <div style={{
                background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.25)",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10, animation: "up 0.3s ease"
              }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#ffd166" }}>Viewing historical evaluation</div>
                  <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>Some detailed data might be unavailable from older records. Run a new analysis for complete information.</div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <Tag color="em"><Dot size={5} />&nbsp;analysis complete · {github}</Tag>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Row 1: final score + quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Panel style={{ padding: "32px 36px", display: "flex", alignItems: "center", gap: 36 }}>
                {/* Big ring */}
                <div style={{ position: "relative", width: 136, height: 136, flexShrink: 0 }}>
                  <div style={{ position: "absolute", inset: "15%", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,196,0.15) 0%,transparent 70%)" }} />
                  <svg width="136" height="136" style={{ transform: "rotate(-90deg)", overflow: "visible", position: "absolute" }}>
                    <circle cx="68" cy="68" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
                    <circle cx="68" cy="68" r="60" fill="none" stroke="var(--em)" strokeWidth="7"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - data.final_score / 100)}`}
                      strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 12px var(--em))", transition: "stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Outfit'", fontSize: 40, fontWeight: 800, color: "var(--em)", lineHeight: 1, textShadow: "0 0 28px var(--glow-em)" }}>
                      {data.final_score}
                    </span>
                    <span style={{ fontFamily: "'Fira Code'", fontSize: 9, color: "var(--dim)", letterSpacing: 1 }}>/100</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 1, marginBottom: 6 }}>FINAL_SCORE</div>
                  <div style={{
                    fontFamily: "'Outfit'", fontSize: 26, fontWeight: 800,
                    color: "var(--white)", letterSpacing: -0.5, marginBottom: 6,
                    
                  }}>
                    {github}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 14 }}>@{leetcode} on LeetCode</div>
                  <Tag color="em"><Dot size={5} />&nbsp;{data.category}</Tag>
                </div>
              </Panel>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Engineering",       sub: "GitHub",  val: data.engineering_score,   color: "#00f5c4" },
                  { label: "DSA",          sub: "LeetCode",   val: data.dsa_score,           color: "#7b61ff" },
                  { label: "Consistency",  sub: "activity",     val: data.consistency_score,   color: "#ff6b6b" },
                  { label: "Collab",       sub: "teamwork",     val: data.collaboration_score, color: "#ffd166" },
                ].map((s, i) => (
                  <Panel key={i} style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontFamily: "'Fira Code'", fontSize: 9, color: "var(--dim)", letterSpacing: 1, textTransform: "uppercase" }}>{s.sub}</span>
                      <Dot color={s.color} size={6} pulse={false} />
                    </div>
                    <div style={{ fontFamily: "'Outfit'", fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, textShadow: `0 0 18px ${s.color}50`, marginBottom: 4 }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--mid)", marginBottom: 10 }}>{s.label}</div>
                    <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: s.color, width: `${s.val}%`, transition: `width 1s ease ${i * 150}ms`, boxShadow: `0 0 6px ${s.color}` }} />
                    </div>
                  </Panel>
                ))}
              </div>
            </div>

            {/* Row 2: charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Panel label="chart://skill_radar" style={{ padding: "22px" }}>
                <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 1, marginBottom: 12 }}>SKILL_RADAR</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--mid)", fontSize: 11, fontFamily: "'Fira Code'" }} />
                    <Radar dataKey="value" stroke="var(--em)" fill="var(--em)" fillOpacity={0.1} strokeWidth={2}
                      dot={{ fill: "var(--em)", r: 3, strokeWidth: 0 }}
                    />
                    <Tooltip content={<Tip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel label="chart://leetcode_dist" style={{ padding: "22px" }}>
                <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 1, marginBottom: 12 }}>LEETCODE_DISTRIBUTION</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={lcData} barSize={44} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="transparent" tick={{ fill: "var(--mid)", fontSize: 11, fontFamily: "'Fira Code'" }} />
                    <YAxis stroke="transparent" tick={{ fill: "var(--dim)", fontSize: 10 }} />
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="solved" radius={[6, 6, 0, 0]}>
                      {lcData.map((d, i) => (
                        <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 6px ${d.color}80)` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            {/* Tech Stack */}
            <Panel label="profile://tech_stack" style={{ padding: "22px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 1, marginBottom: 14 }}>
                SKILL_TAGS <span style={{ color: "var(--em)" }}>[{data.skills?.length || 0}]</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills?.map((s, i) => (
                  <Tag key={i} color={["em","em2","em3","em4"][i % 4]} s={{ cursor: "default", transition: "transform 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.07)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >{s}</Tag>
                ))}
              </div>
            </Panel>

            {/* Repos */}
            <Panel label="github://repositories" style={{ padding: "22px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 1, marginBottom: 14 }}>
                REPOSITORIES <span style={{ color: "var(--em2)" }}>[{data.repositories?.length || 0} found]</span>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))",
                gap: 10, maxHeight: 360, overflowY: "auto", paddingRight: 4,
              }}>
                {data.repositories?.map((repo, i) => (
                  <a 
                    key={i} 
                    href={`https://github.com/${data.github_username}/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)",
                      borderRadius: 9, padding: "14px 16px",
                      animation: `up 0.4s ease ${i * 40}ms both`,
                      transition: "border-color 0.2s,background 0.2s,transform 0.2s", 
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "block"
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.borderColor = "rgba(0,245,196,0.4)"; 
                      e.currentTarget.style.background = "rgba(0,245,196,0.05)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.borderColor = "var(--border)"; 
                      e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--em)" }}>▸</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--em)", transition: "color 0.2s" }}>{repo.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--dim)" }}>→</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.6, marginBottom: 10 }}>
                      {repo.description || "// no description"}
                    </p>
                    <div style={{ display: "flex", gap: 14, fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)" }}>
                      {repo.language && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Dot color="var(--em2)" size={5} pulse={false} /> {repo.language}
                        </span>
                      )}
                      <span>★ {repo.stars}</span>
                      <span>{repo.size}kb</span>
                    </div>
                  </a>
                ))}
              </div>
            </Panel>

            {/* Score Breakdown */}
            <Panel label="analysis://score_breakdown" style={{ padding: "22px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 1, marginBottom: 18 }}>
                SCORE_BREAKDOWN <span style={{ color: "var(--em4)" }}>// click to expand</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sections.map((sec, si) => (
                  <div key={sec.key} style={{ animation: `up 0.4s ease ${si * 70}ms both` }}>
                    <button
                      onClick={() => setTab(tab === sec.key ? null : sec.key)}
                      style={{
                        width: "100%",
                        background: tab === sec.key ? `${sec.color}08` : "rgba(0,0,0,0.25)",
                        border: `1px solid ${tab === sec.key ? sec.color + "35" : "var(--border)"}`,
                        borderRadius: tab === sec.key ? "9px 9px 0 0" : 9,
                        padding: "13px 16px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { if (tab !== sec.key) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = sec.color + "25"; } }}
                      onMouseLeave={e => { if (tab !== sec.key) { e.currentTarget.style.background = "rgba(0,0,0,0.25)"; e.currentTarget.style.borderColor = "var(--border)"; } }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Dot color={sec.color} size={8} pulse={tab === sec.key} />
                        <span style={{ fontFamily: "'Fira Code'", fontSize: 12, color: sec.color, letterSpacing: 0.3 }}>{sec.label}</span>
                        <span style={{ fontSize: 12, color: "var(--mid)" }}>score</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 80, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: sec.color, width: `${Math.min(100,sec.score)}%`, transition: "width 0.8s ease", boxShadow: `0 0 6px ${sec.color}` }} />
                        </div>
                        <span style={{ fontFamily: "'Fira Code'", fontSize: 14, fontWeight: 600, color: sec.color, width: 26, textAlign: "right" }}>{sec.score}</span>
                        <span style={{ fontSize: 13, color: "var(--dim)", transform: tab === sec.key ? "rotate(180deg)" : "none", transition: "transform 0.25s", display: "inline-block" }}>▾</span>
                      </div>
                    </button>
                    {tab === sec.key && (
                      <div style={{
                        background: `${sec.color}05`,
                        border: `1px solid ${sec.color}35`, borderTop: "none",
                        borderRadius: "0 0 9px 9px", padding: "16px 18px",
                        animation: "up 0.25s ease",
                      }}>
                        {sec.details && Object.entries(sec.details).map(([k, v], i) => (
                          <StatBar key={k} label={k} value={typeof v === "number" ? v : parseFloat(v) || 0} color={sec.color} delay={i * 55} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Technical Insights: expanded professional layout */}
            <Panel label="analysis://technical_insights" style={{ padding: "20px 22px", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: "var(--dim)", letterSpacing: 1 }}>
                  TECHNICAL_INSIGHTS
                </div>
                <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: "var(--em4)" }}>feature-level signals & recommendations</div>
              </div>

              {/* Top summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
                {[{
                  title: "Engineering",
                  val: data?.engineering_score,
                  color: "var(--em)",
                },{
                  title: "DSA",
                  val: data?.dsa_score,
                  color: "var(--em2)",
                },{
                  title: "Consistency",
                  val: data?.consistency_score,
                  color: "var(--em3)",
                },{
                  title: "Collab",
                  val: data?.collaboration_score,
                  color: "var(--em4)",
                }].map((c, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04))", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: "var(--mid)" }}>{c.title}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 800, color: c.color }}>{c.val ?? "–"}</div>
                      <div style={{ width: 88, height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: c.color, width: `${Math.min(100,c.val||0)}%`, transition: "width 0.6s" }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: "var(--dim)" }}>
                      {typeof c.val === 'number' ? (c.val >= 75 ? "Strong" : c.val >= 55 ? "Competent" : c.val >= 35 ? "Developing" : "Needs work") : "–"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                {/* Left: detailed feature bars */}
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Panel style={{ padding: 14 }}>
                      <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--em)", marginBottom: 8 }}>Engineering Signals</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {data?.engineering_features && Object.entries(data.engineering_features).map(([k, v], i) => (
                          <div key={k}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--mid)" }}>{k.replace(/_/g, ' ')}</span>
                                <button onClick={() => toggleDesc(k)} style={{ border: 'none', background: 'transparent', color: 'var(--dim)', cursor: 'pointer', fontSize: 12 }}>ℹ️</button>
                              </div>
                              <div style={{ minWidth: 90 }}>
                                <StatBar label="" value={typeof v === 'number' ? v : parseFloat(v) || 0} color="#00f5c4" delay={i * 60} />
                              </div>
                            </div>
                            {showDesc[k] && (
                              <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>{featureDescriptions[k] || 'No description available.'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Panel>

                    <Panel style={{ padding: 14 }}>
                      <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--em2)", marginBottom: 8 }}>DSA Signals</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {data?.dsa_features && Object.entries(data.dsa_features).map(([k, v], i) => (
                          <div key={k}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--mid)" }}>{k.replace(/_/g, ' ')}</span>
                                <button onClick={() => toggleDesc(k)} style={{ border: 'none', background: 'transparent', color: 'var(--dim)', cursor: 'pointer', fontSize: 12 }}>ℹ️</button>
                              </div>
                              <div style={{ minWidth: 90 }}>
                                <StatBar label="" value={typeof v === 'number' ? v : parseFloat(v) || 0} color="#7b61ff" delay={i * 60} />
                              </div>
                            </div>
                            {showDesc[k] && (
                              <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>{featureDescriptions[k] || 'No description available.'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </div>

                  {/* Recommendations */}
                  <div style={{ marginTop: 12 }}>
                    <Panel style={{ padding: 14 }}>
                      <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>📋 Recommendations</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(data?.recommendations && data.recommendations.length) ? (
                            data.recommendations.map((r, idx) => {
                              const key = `rec-${r.id || idx}`;
                              const isExpanded = showDesc[key];
                              return (
                                <div key={r.id || idx} style={{ borderLeft: `3px solid ${r.severity === 'high' ? 'var(--em3)' : r.severity === 'medium' ? 'var(--em4)' : 'var(--em2)'}`, padding: "12px 14px", background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                                  <button 
                                    onClick={() => toggleDesc(key)}
                                    style={{
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', 
                                      background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0
                                    }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontFamily: "'Fira Code'", fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{r.title}</span>
                                        <span style={{ fontSize: 10, padding: '2px 6px', background: r.severity === 'high' ? 'rgba(255,107,107,0.2)' : r.severity === 'medium' ? 'rgba(255,209,102,0.2)' : 'rgba(123,97,255,0.2)', color: r.severity === 'high' ? 'var(--em3)' : r.severity === 'medium' ? 'var(--em4)' : 'var(--em2)', borderRadius: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{r.severity}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--dim)', fontFamily: "'Fira Code'" }}>impact: {r.impact}/10</span>
                                      </div>
                                      <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: 'var(--mid)', lineHeight: 1.5 }}>{r.text}</div>
                                    </div>
                                    <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--em)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                                  </button>
                                  {isExpanded && r.steps && r.steps.length > 0 && (
                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                      <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: 'var(--dim)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Actionable Steps</div>
                                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {r.steps.map((step, sIdx) => (
                                          <li key={sIdx} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6, listStyleType: 'decimal' }}>
                                            {step}
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--mid)", fontFamily: "'Fira Code'", fontSize: 12 }}>
                              <li>Document 1–2 flagship projects with README + architecture notes.</li>
                              <li>Prioritize 2–3 medium/hard LeetCode problems weekly to boost hard ratio.</li>
                              <li>Maintain submission quality to keep acceptance rate above ~60%.</li>
                              <li>Focus on fewer, deeper repos rather than many small forks.</li>
                            </ul>
                          )}
                        </div>
                    </Panel>
                  </div>
                </div>

                  {/* Right: flagship repos + quick profile */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--dim)" }}>
                      {viewingHistoryItem && <span style={{ color: "var(--em)" }}>📋 History Item · </span>}
                      Actions
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {viewingHistoryItem && (
                        <button
                          onClick={() => {
                            if (currentAnalysis) {
                              setData({ ...currentAnalysis });
                            }
                            setViewingHistoryItem(false);
                          }}
                          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,107,107,0.2)', background: 'rgba(255,107,107,0.05)', color: '#ff6b6b', cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s', fontWeight: 600 }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.4)'; e.currentTarget.style.background = 'rgba(255,107,107,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.2)'; e.currentTarget.style.background = 'rgba(255,107,107,0.05)'; }}
                        >← Back</button>
                      )}
                      <button
                        onClick={fetchHistory}
                        disabled={!github || fetchingHistory}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)', background: 'transparent', color: 'var(--mid)', cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                      >History</button>

                      <button
                        onClick={exportPDFDirect}
                        disabled={!data}
                        style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7b61ff,#8b5cf6)', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 30px rgba(123,97,255,0.08)', fontWeight:700, transition: 'transform 0.12s, box-shadow 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(123,97,255,0.14)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(123,97,255,0.08)'; }}
                      >Export PDF</button>
                    </div>
                  </div>
                  <Panel style={{ padding: 12 }}>
                    <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>⭐ Flagship Repositories</div>
                    {(data?.repositories || []).slice().sort((a,b) => (b.stars||0) - (a.stars||0)).slice(0,3).map((r, i) => (
                      <a 
                        key={i} 
                        href={`https://github.com/${data.github_username}/${r.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          display: 'block',
                          padding: 10, 
                          borderRadius: 8, 
                          background: "rgba(0,0,0,0.25)", 
                          marginBottom: 8,
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          border: '1px solid rgba(0,245,196,0.1)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(0,245,196,0.08)";
                          e.currentTarget.style.borderColor = "rgba(0,245,196,0.3)";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(0,0,0,0.25)";
                          e.currentTarget.style.borderColor = "rgba(0,245,196,0.1)";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--em)", marginBottom: 6 }}>{r.name} →</div>
                        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>{r.description || "— no description"}</div>
                        <div style={{ display: "flex", gap: 10, fontFamily: "'Fira Code'", fontSize: 11, color: "var(--mid)" }}>
                          {r.language && <div>●&nbsp;{r.language}</div>}
                          <div>★ {r.stars || 0}</div>
                          <div>{r.size}kb</div>
                        </div>
                      </a>
                    ))}
                    {!data?.repositories?.length && <div style={{ color: "var(--dim)", fontFamily: "'Fira Code'", fontSize: 12 }}>No repositories to show.</div>}
                  </Panel>

                  <Panel style={{ padding: 12 }}>
                    <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>Profile Snapshot</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>{data?.github_username || "—"}</div>
                        <div style={{ fontFamily: "'Fira Code'", fontSize: 12, color: "var(--dim)" }}>final score · {data?.final_score ?? "–"}</div>
                      </div>
                      <Tag color="em"><Dot size={6} />&nbsp;{data?.category || "–"}</Tag>
                    </div>
                  </Panel>
                </div>
              </div>
            </Panel>
          </div>
        )}

      {/* ─── HISTORY MODAL ─── */}
      {showHistory && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(5,7,13,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "in 0.2s ease"
        }}>
          <Panel style={{ width: "90%", maxWidth: 600, maxHeight: "80vh", overflow: "auto" }} label="history">
            <div style={{ padding: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Fira Code'", fontSize: 11, color: "var(--dim)", letterSpacing: 0.5, marginBottom: 12 }}>
                  {history.length} evaluation{history.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {history.length === 0 ? (
                <div style={{ color: "var(--dim)", textAlign: "center", padding: "24px 0" }}>
                  No evaluations found for <strong>{github}</strong>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => loadHistoryItem(item)}
                      style={{
                        padding: 12, borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.02)",
                        cursor: "pointer", transition: "all 0.15s",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--em)";
                        e.currentTarget.style.background = "rgba(0,245,196,0.04)";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                          {item.github_username} · {item.leetcode_username}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4, fontFamily: "'Fira Code'" }}>
                          Score: {item.final_score ?? '—'} · {item.category || '—'}
                        </div>
                        {item.created_at && (
                          <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 3 }}>
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <div style={{ color: "var(--em)", fontSize: 14, marginLeft: 12 }}>→</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--mid)", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    transition: "all 0.12s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--em)";
                    e.currentTarget.style.color = "var(--em)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--mid)";
                  }}
                >Close</button>
              </div>
            </div>
          </Panel>
        </div>
      )}
      </div>

      {/* Footer */}
      <div style={{
        position: "relative", zIndex: 2,
        borderTop: "1px solid var(--border)", padding: "14px 0",
        textAlign: "center", fontFamily: "'Fira Code'", fontSize: 10,
        color: "var(--dim)", letterSpacing: 1.5,
      }}>
        devlyzer://2026 · developer_intelligence_platform · all_systems_nominal
        <span style={{ color: "var(--em)", animation: "blink 1.5s step-end infinite", marginLeft: 6 }}>█</span>
      </div>
    </div>
  );
}