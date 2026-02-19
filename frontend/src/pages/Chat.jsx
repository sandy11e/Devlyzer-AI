import { useState, useEffect, useRef } from "react";
import axios from "axios";

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

  html, body { height: 100%; overflow: hidden; }

  body {
    background: var(--ink);
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::selection { background: var(--em); color: var(--ink); }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--em); border-radius: 99px; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes scan     { 0%{top:-20%} 100%{top:120%} }
  @keyframes dot-bounce {
    0%,80%,100% { transform: translateY(0); opacity: 0.4; }
    40%          { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes msg-in {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    100% { left: 200%;  }
  }
  @keyframes glow-pulse {
    0%,100% { box-shadow: 0 0 12px rgba(0,245,196,0.2); }
    50%     { box-shadow: 0 0 28px rgba(0,245,196,0.45); }
  }
  @keyframes slide-in-right {
    from { opacity:0; transform: translateX(16px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes slide-in-left {
    from { opacity:0; transform: translateX(-16px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes wave {
    0%,100% { height: 8px; }
    50%     { height: 20px; }
  }
`;

function useCSS() {
  useEffect(() => {
    if (document.getElementById("chat-css")) return;
    const el = document.createElement("style");
    el.id = "chat-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/* ─── MATRIX CANVAS (subtle) ─── */
function MatrixBg() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = Math.floor(c.width / 24);
    const drops = Array(cols).fill(1);
    const chars = "01アイウカキサシスタチ▲△□◇";
    const id = setInterval(() => {
      ctx.fillStyle = "rgba(5,7,13,0.06)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "rgba(0,245,196,0.045)";
      ctx.font = "13px 'Fira Code'";
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 24, y * 24);
        if (y * 24 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 65);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", opacity:0.28 }} />;
}

/* ─── CRT OVERLAY ─── */
function CRT() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
      <div style={{
        position:"absolute", left:0, right:0, height:"30%",
        background:"linear-gradient(180deg,transparent,rgba(0,245,196,0.009),transparent)",
        animation:"scan 11s linear infinite",
      }} />
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.055) 2px,rgba(0,0,0,0.055) 4px)",
      }} />
    </div>
  );
}

/* ─── DOT ─── */
function Dot({ color="var(--em)", size=7, pulse=false }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size, borderRadius:"50%",
      background:color, boxShadow:`0 0 6px ${color}`,
      animation: pulse ? "glow-pulse 2s ease infinite" : "none",
      flexShrink:0,
    }} />
  );
}

/* ─── TAG ─── */
function Tag({ children, color="em" }) {
  const map = {
    em:  { bg:"rgba(0,245,196,0.08)",   border:"rgba(0,245,196,0.25)",   text:"var(--em)"  },
    em2: { bg:"rgba(123,97,255,0.08)",  border:"rgba(123,97,255,0.25)",  text:"var(--em2)" },
    em4: { bg:"rgba(255,209,102,0.08)", border:"rgba(255,209,102,0.25)", text:"var(--em4)" },
  };
  const c = map[color]||map.em;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", background:c.bg, border:`1px solid ${c.border}`,
      borderRadius:4, fontSize:11, fontWeight:500,
      color:c.text, fontFamily:"'Fira Code',monospace", letterSpacing:0.3,
    }}>{children}</span>
  );
}

/* ─── TYPING INDICATOR ─── */
function TypingIndicator() {
  return (
    <div style={{
      display:"flex", alignItems:"flex-end", gap:12,
      animation:"slide-in-left 0.3s ease",
    }}>
      {/* Avatar */}
      <div style={{
        width:34, height:34, borderRadius:9, flexShrink:0,
        background:"linear-gradient(135deg,rgba(0,245,196,0.15),rgba(0,245,196,0.05))",
        border:"1px solid rgba(0,245,196,0.25)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14,
      }}>⬡</div>
      <div style={{
        background:"linear-gradient(135deg,rgba(26,34,54,0.9),rgba(18,24,40,0.95))",
        border:"1px solid var(--border)",
        borderRadius:"4px 14px 14px 14px",
        padding:"14px 18px",
        display:"flex", alignItems:"center", gap:5,
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:"50%",
            background:"var(--em)", opacity:0.6,
            animation:`dot-bounce 1.2s ease infinite`,
            animationDelay:`${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── WAVEFORM (send button idle) ─── */
function Waveform({ active }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2.5, height:20 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:3, borderRadius:99,
          background: active ? "var(--em)" : "var(--dim)",
          height: active ? undefined : 4,
          animation: active ? `wave 1s ease ${i*0.12}s infinite` : "none",
          transition:"background 0.3s",
        }} />
      ))}
    </div>
  );
}

/* ─── MESSAGE BUBBLE ─── */
function Message({ role, text, ts, idx }) {
  const isUser = role === "user";
  return (
    <div style={{
      display:"flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems:"flex-end", gap:10,
      animation: isUser ? "slide-in-right 0.35s ease" : "slide-in-left 0.35s ease",
      animationFillMode:"both",
    }}>
      {/* Avatar */}
      <div style={{
        width:34, height:34, borderRadius:9, flexShrink:0,
        background: isUser
          ? "linear-gradient(135deg,rgba(123,97,255,0.2),rgba(123,97,255,0.08))"
          : "linear-gradient(135deg,rgba(0,245,196,0.15),rgba(0,245,196,0.05))",
        border:`1px solid ${isUser ? "rgba(123,97,255,0.3)" : "rgba(0,245,196,0.25)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14,
      }}>
        {isUser ? "◈" : "⬡"}
      </div>

      <div style={{ maxWidth:"68%", display:"flex", flexDirection:"column", gap:4, alignItems: isUser ? "flex-end" : "flex-start" }}>
        {/* Role label */}
        <div style={{
          fontFamily:"'Fira Code'", fontSize:9, letterSpacing:1,
          color: isUser ? "var(--em2)" : "var(--em)",
          paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0,
        }}>
          {isUser ? "// you" : "// devlyzer_ai"}
        </div>

        {/* Bubble */}
        <div style={{
          background: isUser
            ? "linear-gradient(135deg,rgba(123,97,255,0.15),rgba(123,97,255,0.08))"
            : "linear-gradient(135deg,rgba(26,34,54,0.95),rgba(18,24,40,0.98))",
          border:`1px solid ${isUser ? "rgba(123,97,255,0.25)" : "var(--border)"}`,
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding:"13px 16px",
          fontSize:13.5, lineHeight:1.75,
          color:"var(--text)",
          backdropFilter:"blur(12px)",
          boxShadow: isUser
            ? "0 4px 20px rgba(123,97,255,0.1)"
            : "0 4px 20px rgba(0,0,0,0.3)",
          position:"relative", overflow:"hidden",
        }}>
          {/* Subtle inner shimmer for AI */}
          {!isUser && (
            <div style={{
              position:"absolute", top:0, left:0, right:0, height:1,
              background:"linear-gradient(90deg,transparent,rgba(0,245,196,0.15),transparent)",
            }} />
          )}
          {text}
        </div>

        {/* Timestamp */}
        <div style={{ fontFamily:"'Fira Code'", fontSize:9, color:"var(--dim)", letterSpacing:0.5 }}>
          {ts}
        </div>
      </div>
    </div>
  );
}

/* ─── SUGGESTED PROMPTS ─── */
function Suggestions({ onSelect, visible }) {
  const prompts = [
    "What are my biggest technical weaknesses?",
    "How does my GitHub compare to senior engineers?",
    "Which LeetCode topics should I focus on?",
    "Am I ready for FAANG interviews?",
  ];
  if (!visible) return null;
  return (
    <div style={{
      display:"flex", flexWrap:"wrap", gap:8,
      padding:"0 0 16px", animation:"fadeUp 0.5s ease",
    }}>
      <div style={{ width:"100%", fontFamily:"'Fira Code'", fontSize:9, color:"var(--dim)", letterSpacing:1, marginBottom:4 }}>
        // suggested_queries
      </div>
      {prompts.map((p, i) => (
        <button key={i} onClick={() => onSelect(p)} style={{
          background:"rgba(0,245,196,0.05)",
          border:"1px solid rgba(0,245,196,0.18)",
          borderRadius:8, padding:"7px 14px",
          fontFamily:"'Fira Code'", fontSize:11,
          color:"var(--mid)", cursor:"pointer",
          transition:"all 0.2s",
          animation:`fadeUp 0.4s ease ${i*80}ms both`,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="var(--em)"; e.currentTarget.style.color="var(--em)"; e.currentTarget.style.background="rgba(0,245,196,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(0,245,196,0.18)"; e.currentTarget.style.color="var(--mid)"; e.currentTarget.style.background="rgba(0,245,196,0.05)"; }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT
═══════════════════════════════════════════════ */
export default function Chat() {
  const storedData = JSON.parse(localStorage.getItem("devlensData") || "{}");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  useCSS();

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [chat, loading]);

  const send = async (msg) => {
    const text = (msg || message).trim();
    if (!text || loading) return;
    setMessage("");

    const ts = now();
    setChat(prev => [...prev, { role:"user", text, ts }]);
    setLoading(true);

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/chat/${storedData.github_username}/${storedData.leetcode_username}`,
        { message: text }
      );
      setChat(prev => [...prev, { role:"ai", text: res.data.reply, ts: now() }]);
    } catch {
      setChat(prev => [...prev, { role:"ai", text:"// connection error — please try again.", ts: now() }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const isEmpty = chat.length === 0;

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      background:"var(--ink)", position:"relative", overflow:"hidden",
    }}>
      <MatrixBg />
      <CRT />

      {/* ── NAV ── */}
      <header style={{
        position:"relative", zIndex:10,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"18px 28px", borderBottom:"1px solid var(--border)",
        background:"rgba(5,7,13,0.85)", backdropFilter:"blur(20px)",
        flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* Logo */}
          <div style={{
            width:34, height:34, borderRadius:8, flexShrink:0,
            background:"linear-gradient(135deg,var(--em),#008c6e)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 18px var(--glow)",
            animation:"float 4s ease-in-out infinite",
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="#05070d" />
              <circle cx="8" cy="8" r="6" stroke="#05070d" strokeWidth="1.5" fill="none" />
              <line x1="8" y1="2" x2="8" y2="5" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="11" x2="8" y2="14" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="5" y2="8" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="8" x2="14" y2="8" stroke="#05070d" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:"var(--white)", letterSpacing:-0.2 }}>Devlyzer AI</div>
            <div style={{ fontFamily:"'Fira Code'", fontSize:9, color:"var(--dim)", letterSpacing:1.5 }}>// chat interface</div>
          </div>
        </div>

        {/* Center: who we're talking about */}
        {storedData.github_username && (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:"rgba(123,97,255,0.12)",
              border:"1px solid rgba(123,97,255,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Outfit'", fontWeight:700, fontSize:14,
              color:"var(--em2)",
            }}>
              {storedData.github_username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:"'Fira Code'", fontSize:11, color:"var(--text)", letterSpacing:0.3 }}>
                {storedData.github_username}
              </div>
              <div style={{ fontFamily:"'Fira Code'", fontSize:9, color:"var(--dim)", letterSpacing:0.5 }}>
                score: {storedData.final_score ?? "–"} · {storedData.category ?? ""}
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Tag color="em"><Dot size={5} pulse />&nbsp;AI online</Tag>
          <a href="/dashboard" onClick={() => sessionStorage.setItem('fromChat', 'true')} style={{
            background:"transparent", border:"1px solid var(--border)",
            borderRadius:7, padding:"7px 16px",
            color:"var(--mid)", fontSize:12, fontWeight:500,
            cursor:"pointer", transition:"all 0.2s",
            textDecoration:"none", display:"inline-block",
            fontFamily:"'Outfit'",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--em)"; e.currentTarget.style.color="var(--em)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--mid)"; }}
          >← Dashboard</a>
        </div>
      </header>

      {/* ── CHAT AREA ── */}
      <div style={{
        flex:1, overflowY:"auto", position:"relative", zIndex:2,
        padding:"32px 0",
        display:"flex", flexDirection:"column",
      }}>
        <div style={{ maxWidth:780, width:"100%", margin:"0 auto", padding:"0 24px", flex:1, display:"flex", flexDirection:"column" }}>

          {/* Empty state */}
          {isEmpty && (
            <div style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              gap:20, textAlign:"center",
              animation:"fadeIn 0.6s ease",
            }}>
              {/* Animated orb */}
              <div style={{ position:"relative", width:80, height:80 }}>
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(0,245,196,0.18) 0%, transparent 70%)",
                  animation:"glow-pulse 3s ease infinite",
                }} />
                <div style={{
                  position:"absolute", inset:8, borderRadius:"50%",
                  background:"linear-gradient(135deg,var(--em),#008c6e)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:28, boxShadow:"0 0 30px var(--glow)",
                  animation:"float 4s ease-in-out infinite",
                }}>⬡</div>
                {/* Orbiting ring */}
                <div style={{
                  position:"absolute", inset:-8, borderRadius:"50%",
                  border:"1px dashed rgba(0,245,196,0.2)",
                  animation:"spin-slow 12s linear infinite",
                }} />
              </div>

              <div>
                <div style={{
                  fontFamily:"'Outfit'", fontSize:22, fontWeight:700,
                  color:"var(--white)", marginBottom:8, letterSpacing:-0.4,
                }}>Ask me anything.</div>
                <div style={{ fontFamily:"'Fira Code'", fontSize:11, color:"var(--dim)", letterSpacing:0.5, lineHeight:1.8 }}>
                  {storedData.github_username
                    ? `// analyzing ${storedData.github_username} · ready for queries`
                    : "// no profile loaded — analyze a profile from the dashboard first"}
                </div>
              </div>

              {/* Score pills */}
              {storedData.final_score && (
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
                  {[
                    { label:"GitHub",      val: storedData.engineering_score,   color:"var(--em)"  },
                    { label:"LeetCode",    val: storedData.dsa_score,           color:"var(--em2)" },
                    { label:"Consistency", val: storedData.consistency_score,   color:"var(--em3)" },
                    { label:"Collab",      val: storedData.collaboration_score, color:"var(--em4)" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding:"6px 16px", borderRadius:99,
                      background:`${s.color}10`, border:`1px solid ${s.color}30`,
                      fontFamily:"'Fira Code'", fontSize:11, color:s.color,
                      display:"flex", gap:8, alignItems:"center",
                    }}>
                      <Dot color={s.color} size={5} />
                      {s.label} · {s.val}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {!isEmpty && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              {chat.map((m, i) => (
                <Message key={i} {...m} idx={i} />
              ))}
              {loading && <TypingIndicator />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        position:"relative", zIndex:10, flexShrink:0,
        borderTop:"1px solid var(--border)",
        background:"rgba(5,7,13,0.9)", backdropFilter:"blur(24px)",
        padding:"16px 0 20px",
      }}>
        <div style={{ maxWidth:780, margin:"0 auto", padding:"0 24px" }}>

          {/* Suggestions (show when empty) */}
          <Suggestions visible={isEmpty} onSelect={msg => { setMessage(msg); inputRef.current?.focus(); }} />

          {/* Input row */}
          <div style={{
            display:"flex", gap:10, alignItems:"flex-end",
            background:"linear-gradient(135deg,rgba(26,34,54,0.95),rgba(18,24,40,0.98))",
            border:`1px solid ${inputFocus ? "rgba(0,245,196,0.4)" : "var(--border)"}`,
            borderRadius:12, padding:"10px 10px 10px 16px",
            boxShadow: inputFocus ? "0 0 0 3px rgba(0,245,196,0.08), 0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.3)",
            transition:"border-color 0.2s, box-shadow 0.2s",
            position:"relative", overflow:"hidden",
          }}>
            {/* Top shimmer on focus */}
            {inputFocus && (
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:1,
                background:"linear-gradient(90deg,transparent,rgba(0,245,196,0.3),transparent)",
              }} />
            )}

            {/* Prompt prefix */}
            <span style={{
              fontFamily:"'Fira Code'", fontSize:13,
              color:"var(--em)", userSelect:"none", paddingBottom:4, flexShrink:0,
            }}>$</span>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              placeholder="ask anything about your developer profile..."
              rows={1}
              style={{
                flex:1, background:"transparent", border:"none",
                color:"var(--text)", fontSize:13.5, fontFamily:"'Outfit'",
                outline:"none", resize:"none", lineHeight:1.6,
                padding:"4px 0",
                maxHeight:120, overflowY:"auto",
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />

            {/* Right side: waveform + send */}
            <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:2 }}>
              <Waveform active={loading} />

              <button
                onClick={() => send()}
                disabled={!message.trim() || loading}
                style={{
                  width:38, height:38, borderRadius:9, flexShrink:0,
                  background: message.trim() && !loading
                    ? "linear-gradient(135deg,var(--em),#00b89a)"
                    : "rgba(255,255,255,0.05)",
                  border: message.trim() && !loading
                    ? "none"
                    : "1px solid var(--border)",
                  cursor: message.trim() && !loading ? "pointer" : "not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.2s",
                  boxShadow: message.trim() && !loading ? "0 4px 16px var(--glow)" : "none",
                  
                }}
                onMouseEnter={e => { if(message.trim()&&!loading) e.currentTarget.style.transform="scale(1.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
              >
                {loading ? (
                  <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(0,245,196,0.3)", borderTopColor:"var(--em)", animation:"spin 0.7s linear infinite" }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8L2 3l3 5-3 5 12-5z" fill={message.trim() ? "#031a14" : "var(--dim)"} />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Footer hint */}
          <div style={{
            marginTop:10, textAlign:"center",
            fontFamily:"'Fira Code'", fontSize:9, color:"var(--dim)", letterSpacing:0.8,
          }}>
            enter to send · shift+enter for newline · context-aware of your profile data
          </div>
        </div>
      </div>
    </div>
  );
}