import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip,
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer,
} from "recharts";

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
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(null);
  const navigate = useNavigate();
  useCSS();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("devlensData");
      if (saved) {
        const obj = JSON.parse(saved);
        setData(obj);
        if (obj.github_username) setGithub(obj.github_username);
        if (obj.leetcode_username) setLeetcode(obj.leetcode_username);
      }
    } catch (e) { /* ignore parse errors */ }
  }, []);
  const run = async () => {
    if (!github || !leetcode) return;
    try {
      setLoading(true); setData(null);
      const res = await axios.get(`http://127.0.0.1:8000/devlens-evaluate/${github}/${leetcode}`);
      setData(res.data);
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

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>

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
                  <div key={i} style={{
                    background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)",
                    borderRadius: 9, padding: "14px 16px",
                    animation: `up 0.4s ease ${i * 40}ms both`,
                    transition: "border-color 0.2s,background 0.2s", cursor: "default",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,245,196,0.25)"; e.currentTarget.style.background = "rgba(0,245,196,0.02)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "rgba(0,0,0,0.3)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--em)" }}>▸</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{repo.name}</span>
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
                  </div>
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