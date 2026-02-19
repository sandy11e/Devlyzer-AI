import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─── GLOBAL CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800;900&family=Fira+Code:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:   #05070d;
    --ink1:  #0b0f1a;
    --ink2:  #121828;
    --ink3:  #1a2236;
    --border: rgba(255,255,255,0.07);
    --hi:     rgba(255,255,255,0.11);
    --em:    #00f5c4;
    --em2:   #7b61ff;
    --em3:   #ff6b6b;
    --em4:   #ffd166;
    --dim:   #4a5578;
    --mid:   #8892aa;
    --text:  #dce3f0;
    --white: #ffffff;
    --glow:  rgba(0,245,196,0.22);
  }

  html, body { height: 100%; }

  body {
    background: var(--ink);
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  ::selection { background: var(--em); color: var(--ink); }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--em); border-radius: 99px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-7px); }
  }
  @keyframes scan {
    0%   { top: -20%; }
    100% { top: 120%; }
  }
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.92); opacity: 0.8; }
    100% { transform: scale(1.5);  opacity: 0;   }
  }
  @keyframes dash {
    to { stroke-dashoffset: 0; }
  }
  @keyframes glitch {
    0%,92%,100% { transform: none; opacity: 1; clip-path: none; }
    93%  { transform: translate(-3px, 0); opacity: 0.85; clip-path: inset(20% 0 50% 0); }
    95%  { transform: translate(3px, 0);  opacity: 0.85; clip-path: inset(60% 0 10% 0); }
    97%  { transform: translate(-1px, 0); opacity: 0.9;  clip-path: inset(40% 0 30% 0); }
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    100% { left: 200%;  }
  }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes beam {
    0%   { opacity: 0; transform: scaleX(0); }
    50%  { opacity: 1; }
    100% { opacity: 0; transform: scaleX(1); }
  }
`;

function useCSS() {
  useEffect(() => {
    if (document.getElementById("landing-css")) return;
    const el = document.createElement("style");
    el.id = "landing-css";
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
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const cols = Math.floor(c.width / 22);
    const drops = Array(cols).fill(1);
    const chars = "01アイウカキクサシスタチ▲△□◇◆∑∫≈";
    const id = setInterval(() => {
      ctx.fillStyle = "rgba(5,7,13,0.052)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = "13px 'Fira Code'";
      drops.forEach((y, i) => {
        const bright = y * 22 > c.height * 0.7 ? 0.04 : 0.06;
        ctx.fillStyle = `rgba(0,245,196,${bright})`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 22, y * 22);
        if (y * 22 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 62);
    return () => { clearInterval(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.38 }} />;
}

/* ─── SCAN + CRT ─── */
function CRT() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: "32%",
        background: "linear-gradient(180deg,transparent,rgba(0,245,196,0.011),transparent)",
        animation: "scan 10s linear infinite",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.065) 2px,rgba(0,0,0,0.065) 4px)",
      }} />
    </div>
  );
}

/* ─── CORNER BRACKETS ─── */
function Brackets({ color = "var(--em)", size = 14, thick = 1.5 }) {
  const b = `${thick}px solid ${color}`;
  const s = { position: "absolute", width: size, height: size };
  return (
    <>
      <div style={{ ...s, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <div style={{ ...s, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <div style={{ ...s, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <div style={{ ...s, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

/* ─── STATUS DOT ─── */
function Dot({ color = "var(--em)", size = 7 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: "50%", background: color,
      boxShadow: `0 0 6px ${color}`, flexShrink: 0,
    }} />
  );
}

/* ─── TAG ─── */
function Tag({ children, color = "em" }) {
  const map = {
    em:  { bg: "rgba(0,245,196,0.08)",   border: "rgba(0,245,196,0.25)",   text: "var(--em)"  },
    em2: { bg: "rgba(123,97,255,0.08)",  border: "rgba(123,97,255,0.25)",  text: "var(--em2)" },
    em3: { bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.25)", text: "var(--em3)" },
    em4: { bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.25)", text: "var(--em4)" },
  };
  const c = map[color] || map.em;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 11px",
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 4, fontSize: 11, fontWeight: 500,
      color: c.text, fontFamily: "'Fira Code',monospace", letterSpacing: 0.3,
    }}>{children}</span>
  );
}

/* ─── TYPEWRITER ─── */
function Typewriter({ words, speed = 80, pause = 1800 }) {
  const [display, setDisplay] = useState("");
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wi];
    const delay = deleting ? 40 : speed;
    const t = setTimeout(() => {
      if (!deleting) {
        setDisplay(word.slice(0, ci + 1));
        if (ci + 1 === word.length) {
          setTimeout(() => setDeleting(true), pause);
        } else {
          setCi(ci + 1);
        }
      } else {
        setDisplay(word.slice(0, ci - 1));
        if (ci - 1 === 0) {
          setDeleting(false);
          setWi((wi + 1) % words.length);
          setCi(0);
        } else {
          setCi(ci - 1);
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [ci, deleting, wi, words, speed, pause]);

  return (
    <span style={{ color: "var(--em)", fontFamily: "'Fira Code'" }}>
      {display}
      <span style={{ animation: "blink 1s step-end infinite", marginLeft: 1 }}>█</span>
    </span>
  );
}

/* ─── ANIMATED STAT ─── */
function AnimStat({ target, label, color, delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = null;
      const dur = 1600;
      const run = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(typeof target === "number" ? Math.round(target * e) : target);
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);

  return (
    <div style={{ textAlign: "center", animation: `fadeUp 0.6s ease ${delay}ms both` }}>
      <div style={{
        fontFamily: "'Outfit'",
        fontSize: 42, fontWeight: 800,
        color, lineHeight: 1,
        textShadow: `0 0 24px ${color}60`,
      }}>
        {typeof target === "number" ? val : target}
        {typeof target === "number" && <span style={{ fontSize: 22, opacity: 0.6 }}>+</span>}
      </div>
      <div style={{
        fontFamily: "'Fira Code'", fontSize: 10,
        color: "var(--dim)", letterSpacing: 1,
        textTransform: "uppercase", marginTop: 6,
      }}>{label}</div>
    </div>
  );
}

/* ─── FEATURE CARD ─── */
function FeatureCard({ icon, label, desc, color, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}08` : "linear-gradient(135deg,rgba(26,34,54,0.85),rgba(18,24,40,0.9))",
        border: `1px solid ${hov ? color + "35" : "var(--border)"}`,
        borderRadius: 12, padding: "24px 22px",
        position: "relative", overflow: "hidden",
        backdropFilter: "blur(16px)",
        transition: "all 0.25s",
        animation: `fadeUp 0.6s ease ${delay}ms both`,
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${color}20` : "0 8px 32px rgba(0,0,0,0.3)",
        cursor: "default",
      }}
    >
      <Brackets color={hov ? color : "transparent"} size={10} thick={1} />
      <div style={{
        width: 38, height: 38, borderRadius: 9,
        background: `${color}18`, border: `1px solid ${color}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, marginBottom: 14,
        boxShadow: hov ? `0 0 18px ${color}30` : "none",
        transition: "box-shadow 0.25s",
      }}>{icon}</div>
      <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </div>
      <p style={{ fontSize: 13, color: "var(--mid)", lineHeight: 1.7 }}>{desc}</p>
      {hov && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANDING
═══════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [btnHov, setBtnHov] = useState(false);
  useCSS();

  const features = [
    { icon: "⬡", label: "engineering_depth",  color: "#00f5c4", desc: "Analyzes commit quality, repo architecture, code diversity, and real engineering signal from GitHub activity.",       delay: 500 },
    { icon: "λ", label: "dsa_mastery",         color: "#7b61ff", desc: "Maps LeetCode performance across difficulty tiers. Identifies algorithmic strengths and blind spots.",               delay: 600 },
    { icon: "⟳", label: "consistency_score",   color: "#ff6b6b", desc: "Tracks contribution cadence, streak patterns, and long-term momentum — not just spikes.",                           delay: 700 },
    { icon: "◈", label: "collaboration_index", color: "#ffd166", desc: "Evaluates PR participation, issue engagement, and open-source teamwork indicators.",                                delay: 800 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", position: "relative", overflowX: "hidden" }}>
      <MatrixBg />
      <CRT />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>

        {/* ── NAV ── */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "22px 0", borderBottom: "1px solid var(--border)",
          animation: "fadeIn 0.5s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo */}
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg,var(--em),#008c6e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px var(--glow)",
              animation: "float 4s ease-in-out infinite",
              flexShrink: 0,
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
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--white)", letterSpacing: -0.3 }}>Devlyzer</div>
              <div style={{ fontFamily: "'Fira Code'", fontSize: 9, color: "var(--dim)", letterSpacing: 1.5 }}>// AI intelligence</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Tag color="em"><Dot size={5} color="var(--em)" />&nbsp;v2.0 live</Tag>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: 7, padding: "7px 18px",
                color: "var(--mid)", fontSize: 12, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
                fontFamily: "'Outfit'",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--em)"; e.currentTarget.style.color = "var(--em)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--mid)"; }}
            >Dashboard →</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ paddingTop: 96, paddingBottom: 88, textAlign: "center" }}>

          {/* Pre-label */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'Fira Code'", fontSize: 11, color: "var(--em)",
            letterSpacing: 2, textTransform: "uppercase", marginBottom: 28,
            animation: "fadeUp 0.5s ease 0.1s both",
          }}>
            <Dot size={6} color="var(--em)" />
            Developer_Intelligence.exe · initialized
          </div>

          {/* Main heading */}
          <h1 style={{
            fontFamily: "'Outfit'",
            fontSize: "clamp(42px, 6vw, 78px)",
            fontWeight: 800, lineHeight: 1.04,
            letterSpacing: -2.5, marginBottom: 24,
            color: "var(--white)",
            animation: "fadeUp 0.6s ease 0.2s both",
          }}>
            Analyze the developer,<br />
            <span style={{
              background: "linear-gradient(135deg, var(--em) 0%, #4adecc 50%, var(--em2) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}>
              not just the resume.
            </span>
          </h1>

          {/* Typewriter subtitle */}
          <p style={{
            fontSize: 17, color: "var(--mid)", lineHeight: 1.7,
            maxWidth: 540, margin: "0 auto 14px",
            animation: "fadeUp 0.6s ease 0.3s both",
          }}>
            AI-powered profiling across GitHub & LeetCode.{" "}
            <br />Surface real signals in{" "}
            <Typewriter
              words={["engineering depth.", "DSA mastery.", "consistency.", "collaboration.", "technical readiness."]}
              speed={70}
              pause={2000}
            />
          </p>

          {/* CTA row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 14, marginTop: 44,
            animation: "fadeUp 0.6s ease 0.45s both",
          }}>
            <div style={{ position: "relative" }}>
              {/* pulse ring */}
              {btnHov && (
                <div style={{
                  position: "absolute", inset: -6, borderRadius: 14,
                  border: "1px solid var(--em)",
                  animation: "pulse-ring 1s ease-out forwards",
                }} />
              )}
              <button
                onClick={() => navigate("/dashboard")}
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
                style={{
                  position: "relative", overflow: "hidden",
                  background: "linear-gradient(135deg,var(--em),#00b89a)",
                  border: "none", borderRadius: 10,
                  padding: "14px 34px",
                  color: "#031a14", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", letterSpacing: 0.3,
                  boxShadow: btnHov ? "0 8px 36px var(--glow)" : "0 4px 20px var(--glow)",
                  transform: btnHov ? "scale(1.03)" : "scale(1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  fontFamily: "'Outfit'",
                }}
              >
                {/* Shimmer */}
                <span style={{
                  position: "absolute", top: 0, bottom: 0, width: "60%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  animation: "shimmer 2.4s ease infinite",
                  pointerEvents: "none",
                }} />
                run_analysis() →
              </button>
            </div>
            <button
              onClick={() => navigate("/chat")}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 10, padding: "14px 28px",
                color: "var(--mid)", fontSize: 14, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
                fontFamily: "'Outfit'",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--em2)"; e.currentTarget.style.color = "var(--em2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--mid)"; }}
            >AI Chat</button>
          </div>

          {/* Trust note */}
          <p style={{
            fontFamily: "'Fira Code'", fontSize: 10,
            color: "var(--dim)", letterSpacing: 0.8, marginTop: 20,
            animation: "fadeIn 0.6s ease 0.7s both",
          }}>
            // no signup required · reads public profiles only
          </p>
        </section>

        {/* ── HORIZONTAL DIVIDER WITH BEAM ── */}
        <div style={{
          position: "relative", height: 1,
          background: "var(--border)", marginBottom: 72,
          overflow: "visible",
        }}>
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
            background: "linear-gradient(90deg,transparent,var(--em),transparent)",
            opacity: 0.5,
          }} />
        </div>

        {/* ── STATS ── */}
        <section style={{ marginBottom: 80, animation: "fadeUp 0.6s ease 0.5s both" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: 0, position: "relative",
          }}>
            {[
              { target: 4,    label: "scoring_dimensions", color: "var(--em)",  delay: 600 },
              { target: 100,  label: "point_scale",         color: "var(--em2)", delay: 750 },
              { target: 12,   label: "feature_signals",     color: "var(--em3)", delay: 900 },
              { target: "AI", label: "powered_engine",      color: "var(--em4)", delay: 1050 },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "32px 20px",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
                position: "relative",
              }}>
                <AnimStat {...s} />
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp 0.6s ease 0.5s both" }}>
            <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--em)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              // scoring_modules
            </div>
            <h2 style={{
              fontFamily: "'Outfit'", fontSize: "clamp(24px,3vw,38px)",
              fontWeight: 800, color: "var(--white)", letterSpacing: -1, lineHeight: 1.1,
            }}>
              Four lenses.<br />
              <span style={{ color: "var(--mid)", fontWeight: 300 }}>One complete picture.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </section>

        {/* ── TERMINAL DEMO BLOCK ── */}
        <section style={{ marginBottom: 96, animation: "fadeUp 0.6s ease 0.6s both" }}>
          <div style={{
            background: "linear-gradient(135deg,rgba(26,34,54,0.9),rgba(18,24,40,0.95))",
            border: "1px solid var(--border)",
            borderRadius: 14, overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,245,196,0.06)",
          }}>
            {/* Window chrome */}
            <div style={{
              background: "rgba(0,0,0,0.4)", borderBottom: "1px solid var(--border)",
              padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ff5f56","#ffbd2e","#27c93f"].map((c, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 0.4, marginLeft: 4 }}>
                devlyzer://sample_output.json
              </span>
            </div>

            {/* Terminal content */}
            <div style={{ padding: "28px 32px", fontFamily: "'Fira Code'", fontSize: 12, lineHeight: 2 }}>
              {[
                { pre: "$", text: " devlyzer analyze torvalds leetcode_user_42", color: "var(--text)" },
                { pre: "▸", text: " fetching github profile...",                 color: "var(--dim)" },
                { pre: "▸", text: " scanning leetcode submissions...",           color: "var(--dim)" },
                { pre: "▸", text: " running ml scoring pipeline...",             color: "var(--dim)" },
                { pre: "✓", text: " analysis complete [1.4s]",                  color: "var(--em)"  },
                { pre: "",  text: "",                                            color: ""           },
                { pre: "→", text: " engineering_score   : 87 / 100",            color: "var(--em)"  },
                { pre: "→", text: " dsa_score           : 74 / 100",            color: "var(--em2)" },
                { pre: "→", text: " consistency_score   : 91 / 100",            color: "var(--em3)" },
                { pre: "→", text: " collaboration_score : 63 / 100",            color: "var(--em4)" },
                { pre: "",  text: "",                                            color: ""           },
                { pre: "★", text: " final_score         : 84 · category: Senior Engineer", color: "var(--white)" },
              ].map((line, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: line.pre === "★" ? "var(--em)" : line.pre === "✓" ? "var(--em)" : "var(--dim)", userSelect: "none" }}>
                    {line.pre}
                  </span>
                  <span style={{ color: line.color }}>{line.text}</span>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <span style={{ color: "var(--dim)" }}>$</span>
                <span style={{ color: "var(--em)", animation: "blink 1s step-end infinite", marginLeft: 8 }}>█</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA BOTTOM ── */}
        <section style={{ textAlign: "center", paddingBottom: 100, animation: "fadeUp 0.6s ease 0.7s both" }}>
          <div style={{
            display: "inline-block", position: "relative",
            padding: "52px 64px",
            background: "linear-gradient(135deg,rgba(26,34,54,0.85),rgba(18,24,40,0.9))",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,245,196,0.04)",
          }}>
            <Brackets color="var(--em)" size={16} thick={1.5} />
            <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: "var(--dim)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
              // ready to begin
            </div>
            <h2 style={{
              fontFamily: "'Outfit'", fontSize: "clamp(26px,3.5vw,44px)",
              fontWeight: 800, color: "var(--white)", letterSpacing: -1,
              lineHeight: 1.1, marginBottom: 12,
            }}>
              Your profile.<br />
              <span style={{ color: "var(--em)" }}>Decoded.</span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--mid)", marginBottom: 32, lineHeight: 1.6 }}>
              Paste your GitHub and LeetCode handles.<br />
              Get your full intelligence report in seconds.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                position: "relative", overflow: "hidden",
                background: "linear-gradient(135deg,var(--em),#00b89a)",
                border: "none", borderRadius: 10,
                padding: "14px 36px",
                color: "#031a14", fontSize: 14, fontWeight: 700,
                cursor: "pointer", letterSpacing: 0.3,
                boxShadow: "0 4px 24px var(--glow)",
                transition: "transform 0.2s, box-shadow 0.2s",
                fontFamily: "'Outfit'",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 8px 40px var(--glow)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.boxShadow = "0 4px 24px var(--glow)"; }}
            >
              run_analysis() →
            </button>
          </div>
        </section>

      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position: "relative", zIndex: 2,
        borderTop: "1px solid var(--border)", padding: "14px 0",
        textAlign: "center", fontFamily: "'Fira Code'",
        fontSize: 10, color: "var(--dim)", letterSpacing: 1.5,
      }}>
        devlyzer://2025 · developer_intelligence_platform · all_systems_nominal
        <span style={{ color: "var(--em)", animation: "blink 1.5s step-end infinite", marginLeft: 6 }}>█</span>
      </div>
    </div>
  );
}