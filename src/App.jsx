import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yzwbwbrbogxblgpomlpj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2J3YnJib2d4YmxncG9tbHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTE5NzIsImV4cCI6MjA5NDc2Nzk3Mn0.1geyi1DAMc_B8IX5VsgN2ZyORHthRUifcCRT2fNFN_g";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || "admin";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || "livroecafe2026";

const FORMAT_META = {
  pdf:  { label: "PDF",         icon: "📄", color: "#e05252" },
  epub: { label: "EPUB",        icon: "📖", color: "#5287e0" },
  mobi: { label: "MOBI",        icon: "📱", color: "#52a0e0" },
  txt:  { label: "TXT",         icon: "📝", color: "#7acc66" },
  mp3:  { label: "MP3 (Áudio)", icon: "🎧", color: "#c8873a" },
};
const EMPTY_FORMATS = { pdf: "", epub: "", mobi: "", txt: "", mp3: "" };
const DEFAULT_GENRES = ["Fantasia","Distopia","Ficção","Clássico","Não-ficção","Ficção Científica","Romance"];
const truncate = (str, n) => str && str.length > n ? str.slice(0, n).trimEnd() + "…" : (str || "");
const EMPTY_FORM = { title:"", author:"", genre:"", cover_url:"", description:"", featured:false, is_new:true, formats:{ ...EMPTY_FORMATS } };

/* ── Google Books Search ── */
const GOOGLE_BOOKS_KEY = "AIzaSyA1v8PRGiiVDp6lN8NGeu3Wc_DNWN5w7ns";

async function searchGoogleBooks(query) {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=pt&maxResults=6&printType=books&key=${GOOGLE_BOOKS_KEY}`
    );
    const data = await res.json();
    return (data.items || []).map(item => {
      const info = item.volumeInfo;
      return {
        title: info.title || "",
        author: (info.authors || []).join(", "),
        description: info.description || "",
        cover_url: info.imageLinks?.thumbnail?.replace("http://","https://").replace("&zoom=1","&zoom=2") || "",
        genre: (info.categories || [""])[0] || "",
        publisher: info.publisher || "",
        year: info.publishedDate?.slice(0,4) || "",
      };
    });
  } catch(e) {
    return [];
  }
}

/* ── CSS ── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:4px}
.nav-wrap{transition:background .4s,box-shadow .4s}
.nav-wrap.scrolled{background:rgba(10,8,6,.97)!important;box-shadow:0 1px 0 rgba(255,255,255,.05)}
.book-card{cursor:pointer;position:relative;border-radius:6px;overflow:hidden;flex-shrink:0;transition:transform .32s cubic-bezier(.4,0,.2,1),box-shadow .32s}
.book-card:hover{transform:scale(1.08) translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,.8);z-index:20}
.book-card:hover .c-overlay{opacity:1}
.book-card:hover .c-shine{opacity:1}
.c-overlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.93) 0%,rgba(0,0,0,.15) 55%,transparent 100%);opacity:0;transition:opacity .3s;display:flex;flex-direction:column;justify-content:flex-end;padding:12px}
.c-shine{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,transparent 55%);opacity:0;transition:opacity .3s;pointer-events:none}
.row-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;scroll-behavior:smooth}
.row-scroll::-webkit-scrollbar{display:none}
.pill{padding:7px 18px;border-radius:20px;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,.1);background:transparent;color:#888;white-space:nowrap}
.pill.active,.pill:hover{background:#c8873a;border-color:#c8873a;color:#fff}
.btn-primary{background:#c8873a;color:#fff;border:none;border-radius:5px;padding:11px 22px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:7px;transition:background .2s,transform .15s;white-space:nowrap}
.btn-primary:hover{background:#d9964a;transform:scale(1.03)}
.btn-primary:disabled{background:#555;cursor:not-allowed;transform:none}
.btn-ghost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:5px;padding:11px 22px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:7px;transition:background .2s;white-space:nowrap;backdrop-filter:blur(8px)}
.btn-ghost:hover{background:rgba(255,255,255,.18)}
.btn-danger{background:rgba(200,40,40,.12);color:#ff6060;border:1px solid rgba(200,40,40,.25);border-radius:5px;padding:7px 14px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:background .2s;white-space:nowrap}
.btn-danger:hover{background:rgba(200,40,40,.22)}
.input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:7px;padding:11px 14px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.input:focus{border-color:#c8873a}
.input::placeholder{color:#444}
select.input{appearance:none;cursor:pointer}
.admin-tab{padding:13px 22px;background:none;border:none;border-bottom:2px solid transparent;color:#555;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap}
.admin-tab.active{color:#fff;border-bottom-color:#c8873a}
.admin-tab:hover:not(.active){color:#bbb}
.list-row{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);transition:background .2s}
.list-row:hover{background:rgba(255,255,255,.045)}
.badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-family:'DM Sans',sans-serif;font-weight:700;letter-spacing:.4px}
.badge-amber{background:linear-gradient(90deg,#c9a227,#e8c040);color:#000}
.badge-red{background:#c8873a;color:#fff}
.badge-green{background:rgba(40,180,100,.2);color:#4dcc88;border:1px solid rgba(40,180,100,.3)}
.format-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#ccc;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;text-decoration:none}
.format-btn:hover{background:rgba(200,135,58,.15);border-color:#c8873a;color:#e8a858}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(14px);z-index:500;display:flex;align-items:center;justify-content:center;animation:fadeUp .2s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.login-card{background:linear-gradient(160deg,#1a1510 0%,#0f0d0a 100%);border:1px solid rgba(200,135,58,.2);border-radius:16px;padding:40px;width:min(420px,92vw);box-shadow:0 40px 100px rgba(0,0,0,.9)}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1e1a14;border:1px solid rgba(200,135,58,.4);color:#e8a858;padding:12px 22px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;z-index:9999;animation:fadeUp .2s ease;box-shadow:0 8px 32px rgba(0,0,0,.6);white-space:nowrap}
.toast.error{border-color:rgba(200,50,50,.5);color:#ff8080;background:#1a0f0f}
.toast.success{border-color:rgba(50,200,100,.4);color:#60cc88;background:#0f1a12}
.section-title{font-family:'DM Sans',sans-serif;font-size:19px;font-weight:600;color:#fff;margin-bottom:14px;display:flex;align-items:center;gap:10px}
.section-title small{color:#555;font-size:13px;font-weight:400}
.check-row{display:flex;align-items:center;gap:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;color:#ccc}
.check-row input{accent-color:#c8873a;width:15px;height:15px;cursor:pointer}
.spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,.15);border-top-color:#c8873a;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.skeleton{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.share-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#ccc;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
.share-btn:hover{background:rgba(200,135,58,.15);border-color:#c8873a;color:#e8a858}
.search-overlay{position:fixed;inset:0;background:rgba(0,0,0,.92);backdrop-filter:blur(20px);z-index:300;display:flex;flex-direction:column;padding:80px 40px 40px;animation:fadeUp .2s ease}
.search-result-card{display:flex;align-items:center;gap:16px;padding:14px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);cursor:pointer;transition:all .2s}
.search-result-card:hover{background:rgba(200,135,58,.08);border-color:rgba(200,135,58,.25)}
.star{font-size:20px;cursor:pointer;transition:transform .15s;color:#444}
.star.filled{color:#f5a623}
.star:hover{transform:scale(1.2)}
.dash-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px 24px}
.dash-stat{font-family:'Playfair Display',serif;font-size:38px;font-weight:900;color:#fff;line-height:1}
.dash-label{font-family:'DM Sans',sans-serif;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

/* Google Books suggestions */
.gb-suggestions{position:absolute;top:100%;left:0;right:0;background:#1a1510;border:1px solid rgba(200,135,58,.3);border-radius:0 0 10px 10px;z-index:100;max-height:320px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.8)}
.gb-item{display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.04)}
.gb-item:last-child{border-bottom:none}
.gb-item:hover{background:rgba(200,135,58,.1)}
.gb-badge{font-family:'DM Sans',sans-serif;font-size:10px;background:rgba(200,135,58,.15);color:#c8873a;border:1px solid rgba(200,135,58,.25);padding:2px 8px;border-radius:4px}

@media(max-width:768px){
  .nav-pills{display:none!important}
  .hero-content{left:20px!important;right:20px!important;max-width:100%!important}
  .hero-content h1{font-size:clamp(26px,7vw,40px)!important}
  .content-pad{padding:0 16px 40px!important}
  .section-title{font-size:16px!important}
  .sub-banner{flex-direction:column!important;text-align:center!important;gap:12px!important}
  .footer-wrap{flex-direction:column!important;text-align:center!important;gap:8px!important}
  .admin-modal{width:100vw!important;max-height:100vh!important;border-radius:0!important}
  .admin-form-grid{grid-template-columns:1fr!important}
  .format-grid{grid-template-columns:1fr!important}
  .hero-dots{left:20px!important}
  .nav-mobile-row{display:flex!important}
}
@media(min-width:769px){.nav-mobile-row{display:none!important}}
`;

/* ── Toast ── */
function Toast({ msg, type = "info" }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

function SkeletonCard() {
  return (
    <div style={{ width: 150, height: 220, flexShrink: 0, borderRadius: 6, overflow: "hidden" }}>
      <div className="skeleton" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/* ── Google Books Search Input ── */
function GoogleBooksInput({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    clearTimeout(timer.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      const results = await searchGoogleBooks(val);
      setSuggestions(results);
      setOpen(results.length > 0);
      setSearching(false);
    }, 500);
  };

  const handleSelect = (book) => {
    onSelect(book);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input className="input" value={value} onChange={e => handleChange(e.target.value)}
          placeholder={placeholder || "Digite o título..."} onFocus={() => suggestions.length && setOpen(true)} />
        {searching && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            <div className="spinner" style={{ width: 16, height: 16 }} />
          </div>
        )}
        {!searching && value && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#555", fontFamily: "'DM Sans',sans-serif" }}>
            🔍 Google Books
          </div>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="gb-suggestions">
          <div style={{ padding: "8px 14px 6px", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#555", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            📚 Resultados do Google Books — clique para preencher automaticamente
          </div>
          {suggestions.map((book, i) => (
            <div key={i} className="gb-item" onClick={() => handleSelect(book)}>
              {book.cover_url
                ? <img src={book.cover_url} alt={book.title} style={{ width: 36, height: 50, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                : <div style={{ width: 36, height: 50, background: "#2a2a2a", borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#888", fontSize: 11, marginTop: 2 }}>{book.author}</div>
                {book.genre && <span className="gb-badge" style={{ marginTop: 4, display: "inline-block" }}>{book.genre}</span>}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#c8873a", flexShrink: 0 }}>✓ Auto-preencher</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Admin Login ── */
function AdminLogin({ onLogin, onClose }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr]   = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (user === ADMIN_USER && pass === ADMIN_PASS) { onLogin(); }
    else { setErr("Usuário ou senha incorretos."); setTimeout(() => setErr(""), 3000); }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-card" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>☕</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#c8873a", fontWeight: 700 }}>Livro & Café</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#444", marginTop: 4 }}>Acesso restrito — Administrador</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Usuário</label>
            <input className="input" value={user} onChange={e => setUser(e.target.value)} placeholder="admin" autoFocus onKeyDown={e => e.key === "Enter" && attempt()} />
          </div>
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input className="input" type={show ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && attempt()} style={{ paddingRight: 42 }} />
              <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>{show ? "🙈" : "👁"}</button>
            </div>
          </div>
          {err && <div style={{ background: "rgba(200,50,50,.12)", border: "1px solid rgba(200,50,50,.3)", color: "#ff7070", borderRadius: 6, padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>⚠ {err}</div>}
          <button className="btn-primary" onClick={attempt} disabled={loading} style={{ justifyContent: "center", marginTop: 4, padding: "13px" }}>
            {loading ? <><div className="spinner" />Verificando...</> : "Entrar no Painel"}
          </button>
          <button className="btn-ghost" onClick={onClose} style={{ justifyContent: "center", padding: "10px" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star${i <= (hover || value) ? " filled" : ""}`}
          onClick={() => !readonly && onChange && onChange(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ fontSize: readonly ? 14 : 22, cursor: readonly ? "default" : "pointer", color: i <= (hover || value) ? "#f5a623" : "#333" }}>★</span>
      ))}
    </div>
  );
}

function ReviewsSection({ book }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating]   = useState(0);
  const [name, setName]       = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    supabase.from("reviews").select("*").eq("book_id", book.id).order("created_at", { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoading(false); });
  }, [book.id]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    const { error } = await supabase.from("reviews").insert([{ book_id: book.id, name: name.trim() || "Anônimo", rating, comment: comment.trim() }]);
    if (!error) {
      const { data } = await supabase.from("reviews").select("*").eq("book_id", book.id).order("created_at", { ascending: false });
      setReviews(data || []);
      setRating(0); setName(""); setComment(""); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Avaliações</div>
        {avgRating && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#f5a623", fontSize: 16 }}>★</span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", color: "#fff", fontWeight: 700, fontSize: 15 }}>{avgRating}</span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", color: "#555", fontSize: 12 }}>({reviews.length})</span>
          </div>
        )}
      </div>
      {loading ? <div style={{ color: "#444", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Carregando...</div>
        : reviews.length === 0 ? <div style={{ color: "#444", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 16 }}>Seja o primeiro a avaliar!</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 180, overflowY: "auto" }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#ccc", fontSize: 13 }}>{r.name}</span>
                  <StarRating value={r.rating} readonly />
                  <span style={{ fontFamily: "'DM Sans',sans-serif", color: "#444", fontSize: 11, marginLeft: "auto" }}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                {r.comment && <p style={{ fontFamily: "'DM Sans',sans-serif", color: "#999", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
      }
      {saved
        ? <div style={{ background: "rgba(40,180,100,.1)", border: "1px solid rgba(40,180,100,.3)", color: "#4dcc88", borderRadius: 8, padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>✓ Avaliação enviada!</div>
        : <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#666", marginBottom: 8 }}>Sua avaliação:</div>
            <StarRating value={rating} onChange={setRating} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome (opcional)"
              style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", marginTop: 10, boxSizing: "border-box" }} />
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Comentário (opcional)" rows={2}
              style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", marginTop: 8, resize: "none", boxSizing: "border-box" }} />
            <button onClick={handleSubmit} disabled={!rating || saving}
              style={{ marginTop: 10, background: rating ? "#c8873a" : "#2a2a2a", color: rating ? "#fff" : "#555", border: "none", borderRadius: 6, padding: "9px 20px", cursor: rating ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
              {saving ? "Enviando..." : "Enviar Avaliação"}
            </button>
          </div>
      }
    </div>
  );
}

function BookModal({ book, onClose }) {
  const fmts = book.formats ? Object.entries(book.formats).filter(([, v]) => v) : [];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141210", borderRadius: 12, width: "min(700px,94vw)", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.95)", border: "1px solid rgba(200,135,58,.12)" }}>
        <div style={{ position: "relative", height: 240 }}>
          <img src={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80"} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80"; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,#141210 0%,transparent 55%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.65)", border: "1px solid rgba(255,255,255,.12)", color: "#ccc", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6 }}>
            {book.featured && <span className="badge badge-amber">DESTAQUE</span>}
            {book.is_new   && <span className="badge badge-red">NOVO</span>}
          </div>
        </div>
        <div style={{ padding: "0 22px 22px", overflowY: "auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px,5vw,26px)", color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>{book.title}</h2>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#888", fontSize: 14, marginBottom: 14 }}>{book.author} · <span style={{ color: "#c8873a" }}>{book.genre}</span></div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#bbb", fontSize: "clamp(13px,3.5vw,15px)", lineHeight: 1.7, marginBottom: 16 }}>{truncate(book.description, 220)}</p>
          {fmts.length > 0 && (
            <>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Formatos disponíveis</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {fmts.map(([fmt, link]) => {
                  const m = FORMAT_META[fmt];
                  return <a key={fmt} href={link} target="_blank" rel="noreferrer" className="format-btn" style={{ borderColor: `${m.color}33`, color: m.color }}><span>{m.icon}</span> {m.label}</a>;
                })}
              </div>
            </>
          )}
          <ReviewsSection book={book} />
          <div style={{ marginTop: 16 }}>
            <button className="btn-ghost" onClick={onClose} style={{ padding: "10px 22px" }}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCard({ book, w = 150, h = 220, onClick }) {
  return (
    <div className="book-card" style={{ width: w, height: h, flexShrink: 0 }} onClick={() => onClick(book)}>
      <img src={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"; }} />
      <div className="c-shine" />
      <div className="c-overlay">
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {book.is_new && <span className="badge badge-red">NOVO</span>}
          {book.formats && Object.entries(book.formats).filter(([,v]) => v).map(([fmt]) => (
            <span key={fmt} style={{ fontSize: 11 }}>{FORMAT_META[fmt]?.icon}</span>
          ))}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#fff", lineHeight: 1.3 }}>{book.title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>{book.author}</div>
        <button className="btn-primary" style={{ marginTop: 8, padding: "6px 12px", fontSize: 11 }}>Ver formatos</button>
      </div>
    </div>
  );
}

function Row({ title, books, onBook, loading }) {
  const ref = useRef(null);
  return (
    <div style={{ marginBottom: 38 }}>
      <div className="section-title">{title} {!loading && <small>{books.length} livros</small>}</div>
      <div style={{ position: "relative" }}>
        <button onClick={() => { ref.current.scrollLeft -= 580; }} style={{ position: "absolute", left: -18, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <div className="row-scroll" ref={ref}>
          {loading ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : books.length > 0 ? books.map(b => <BookCard key={b.id} book={b} onClick={onBook} />)
            : <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", fontSize: 13, padding: "20px 0" }}>Nenhum livro nesta categoria ainda.</div>
          }
        </div>
        <button onClick={() => { ref.current.scrollLeft += 580; }} style={{ position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
    </div>
  );
}

const FORMAT_EXTENSIONS = {
  pdf: ".pdf",
  epub: ".epub",
  mobi: ".mobi",
  txt: ".txt",
  mp3: ".mp3",
};

function FormatInputs({ formats, setFormats }) {
  const [uploading, setUploading] = useState({});

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [key]: true }));
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
      const { data, error } = await supabase.storage
        .from('epubs')
        .upload(filename, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('epubs').getPublicUrl(filename);
      setFormats({ ...formats, [key]: urlData.publicUrl });
    } catch (err) {
      alert('Erro ao fazer upload: ' + err.message);
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 18 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
        Links de Download — Cole um link ou faça upload direto para o Supabase
      </div>
      <div className="format-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {Object.entries(FORMAT_META).map(([key, meta]) => (
          <div key={key}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span>{meta.icon}</span>
              <span style={{ color: meta.color }}>{meta.label}</span>
              <span style={{ color: "#333", fontSize: 10 }}>(opcional)</span>
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input" value={formats[key] || ""} onChange={e => setFormats({ ...formats, [key]: e.target.value })}
                placeholder={`Link ou faça upload →`} style={{ fontSize: 12, padding: "9px 12px", flex: 1 }} />
              <label style={{
                background: uploading[key] ? "#333" : "rgba(200,135,58,.15)",
                border: "1px solid rgba(200,135,58,.3)",
                borderRadius: 6, padding: "0 10px", cursor: uploading[key] ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#c8873a", flexShrink: 0
              }}>
                {uploading[key] ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Enviando...</> : "⬆ Upload"}
                <input type="file" accept={FORMAT_EXTENSIONS[key]} style={{ display: "none" }}
                  onChange={e => handleUpload(key, e.target.files[0])} disabled={uploading[key]} />
              </label>
            </div>
            {formats[key] && formats[key].includes('supabase') && (
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#4dcc88", marginTop: 4 }}>
                ⚡ Supabase Storage
              </div>
            )}
            {formats[key] && formats[key].includes('drive.google') && (
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#5287e0", marginTop: 4 }}>
                ☁️ Google Drive
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Book Form (shared for Add and Edit) ── */
function BookForm({ form, setForm, genres, onSubmit, saving, submitLabel, onCancel }) {
  const handleGoogleSelect = (book) => {
    setForm(f => ({
      ...f,
      title: book.title || f.title,
      author: book.author || f.author,
      description: book.description || f.description,
      cover_url: book.cover_url || f.cover_url,
      genre: book.genre || f.genre,
    }));
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Google Books tip */}
      <div style={{ background: "rgba(200,135,58,.08)", border: "1px solid rgba(200,135,58,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#c8873a", lineHeight: 1.5 }}>
          <strong>Auto-preenchimento ativo!</strong> Digite o título do livro e selecione nos resultados do Google Books para preencher automaticamente autor, capa e descrição.
        </div>
      </div>

      <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Título * <span style={{ color: "#555", fontSize: 10, fontWeight: 400 }}>— busca automática no Google Books</span></label>
          <GoogleBooksInput
            value={form.title}
            onChange={val => setForm(f => ({ ...f, title: val }))}
            onSelect={handleGoogleSelect}
            placeholder="Ex: A Empregada — vai buscar automaticamente..."
          />
        </div>
        {[["author","Autor *"],["cover_url","URL da Capa"]].map(([k, l]) => (
          <div key={k}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>{l}</label>
            <input className="input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={k === "author" ? "Ex: Freida McFadden" : "https://..."} />
          </div>
        ))}
        <div>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Gênero</label>
          <select className="input" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 22 }}>
          <label className="check-row"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> ⭐ Marcar como Destaque</label>
          <label className="check-row"><input type="checkbox" checked={form.is_new} onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))} /> 🆕 Marcar como Novo</label>
        </div>
      </div>

      {/* Cover preview */}
      {form.cover_url && (
        <div style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <img src={form.cover_url} alt="Capa" style={{ width: 60, height: 84, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,.1)" }} onError={e => { e.target.style.display = "none"; }} />
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#555", paddingTop: 4 }}>Preview da capa</div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Descrição / Sinopse</label>
        <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve sinopse..." rows={4} style={{ resize: "vertical" }} />
      </div>
      <FormatInputs formats={form.formats} setFormats={fmts => setForm(f => ({ ...f, formats: fmts }))} />
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="btn-primary" onClick={onSubmit} disabled={saving} style={{ padding: "13px 28px", fontSize: 15 }}>
          {saving ? <><div className="spinner" />Salvando...</> : submitLabel}
        </button>
        {onCancel && <button className="btn-ghost" onClick={onCancel} style={{ padding: "13px 20px" }}>Cancelar</button>}
      </div>
    </div>
  );
}

/* ── Admin Panel ── */
function AdminPanel({ onClose, showToast, price, setPrice }) {
  const [tab, setTab]       = useState("library");
  const [books, setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({ ...EMPTY_FORM, formats: { ...EMPTY_FORMATS } });
  const [draftPrice, setDraft] = useState(price);
  const [deleteId, setDeleteId] = useState(null);
  const [subscribers, setSubs] = useState([]);
  const [genres, setGenres] = useState(DEFAULT_GENRES);
  const [newGenre, setNewGenre] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm]       = useState(null);
  const [editSaving, setEditSaving]   = useState(false);
  const [renamingGenre, setRenamingGenre] = useState(null);
  const [renameValue, setRenameValue]     = useState("");

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (error) showToast("Erro ao carregar livros: " + error.message, "error");
    else setBooks(data || []);
    setLoading(false);
  }, []);

  const fetchSubs = useCallback(async () => {
    const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
    setSubs(data || []);
  }, []);

  useEffect(() => {
    const fromBooks = books.map(b => b.genre).filter(Boolean);
    const merged = Array.from(new Set([...DEFAULT_GENRES, ...fromBooks])).sort();
    setGenres(merged);
    if (!form.genre && merged.length) setForm(f => ({ ...f, genre: merged[0] }));
  }, [books]);

  useEffect(() => { fetchBooks(); fetchSubs(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.author.trim()) { showToast("Preencha pelo menos título e autor.", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("books").insert([{
      title: form.title.trim(), author: form.author.trim(), genre: form.genre,
      description: form.description.trim(),
      cover_url: form.cover_url.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80",
      featured: form.featured, is_new: form.is_new, formats: form.formats,
    }]);
    if (error) showToast("Erro ao salvar: " + error.message, "error");
    else {
      showToast("✓ Livro adicionado com sucesso!", "success");
      setForm({ ...EMPTY_FORM, formats: { ...EMPTY_FORMATS } });
      fetchBooks(); setTab("library");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) showToast("Erro ao remover: " + error.message, "error");
    else { showToast("🗑 Livro removido.", "success"); fetchBooks(); }
    setDeleteId(null);
  };

  const startEdit = (book) => {
    setEditingBook(book);
    setEditForm({ title: book.title, author: book.author, genre: book.genre, cover_url: book.cover_url || "", description: book.description || "", featured: book.featured || false, is_new: book.is_new || false, formats: book.formats || { ...EMPTY_FORMATS } });
    setTab("edit");
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.author.trim()) { showToast("Preencha título e autor.", "error"); return; }
    setEditSaving(true);
    const { error } = await supabase.from("books").update({
      title: editForm.title.trim(), author: editForm.author.trim(), genre: editForm.genre,
      description: editForm.description.trim(),
      cover_url: editForm.cover_url.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80",
      featured: editForm.featured, is_new: editForm.is_new, formats: editForm.formats,
    }).eq("id", editingBook.id);
    if (error) showToast("Erro ao salvar: " + error.message, "error");
    else { showToast("✓ Livro atualizado!", "success"); setEditingBook(null); setEditForm(null); fetchBooks(); setTab("library"); }
    setEditSaving(false);
  };

  const handleRenameGenre = (oldName) => {
    const newName = renameValue.trim();
    if (!newName) return;
    if (genres.includes(newName) && newName !== oldName) { showToast("Já existe um gênero com esse nome.", "error"); return; }
    setGenres(prev => prev.map(g => g === oldName ? newName : g).sort());
    books.filter(b => b.genre === oldName).forEach(async (b) => { await supabase.from("books").update({ genre: newName }).eq("id", b.id); });
    setRenamingGenre(null); setRenameValue("");
    showToast(`✓ Gênero renomeado para "${newName}"`, "success");
    fetchBooks();
  };

  const handleAddGenre = () => {
    const g = newGenre.trim();
    if (!g) return;
    if (genres.includes(g)) { showToast("Gênero já existe.", "error"); return; }
    setGenres(prev => [...prev, g].sort()); setNewGenre("");
    showToast(`✓ Gênero "${g}" adicionado!`, "success");
  };

  const handleSavePrice = async () => {
    const { error } = await supabase.from("settings").upsert({ key: "subscription_price", value: draftPrice.toString(), updated_at: new Date().toISOString() });
    if (error) { showToast("Erro ao salvar preço: " + error.message, "error"); return; }
    setPrice(draftPrice);
    showToast("✓ Preço atualizado!", "success");
  };

  const tabList = [
    { id: "dashboard", icon: "📊", label: "Dashboard", count: null },
    { id: "library",   icon: "📚", label: "Biblioteca", count: books.length },
    { id: "add",       icon: "＋", label: "Adicionar",  count: null },
    ...(editingBook ? [{ id: "edit", icon: "✏", label: "Editando", count: null }] : []),
    { id: "genres",      icon: "🏷", label: "Gêneros",    count: genres.length },
    { id: "subscribers", icon: "👥", label: "Assinantes", count: subscribers.length },
    { id: "pricing",     icon: "💳", label: "Assinatura", count: null },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="admin-modal" style={{ background: "#0e0c0a", width: "min(1000px,97vw)", margin: "auto", borderRadius: 14, border: "1px solid rgba(200,135,58,.15)", display: "flex", flexDirection: "column", maxHeight: "93vh", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.95)" }}>

        {/* Header */}
        <div style={{ background: "#181410", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ background: "linear-gradient(135deg,#c8873a,#e8a84a)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚙</div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>Painel Administrador</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555" }}>livroecafe.com.br · Supabase conectado ✓</div>
          </div>
          <div style={{ flex: 1 }} />
          <a href="https://livroecafe.vercel.app" target="_blank" rel="noreferrer" style={{ background: "rgba(200,135,58,.12)", color: "#c8873a", border: "1px solid rgba(200,135,58,.25)", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, textDecoration: "none" }}>🌐 Ver Site</a>
          <button className="btn-ghost" onClick={() => onClose(true)} style={{ padding: "8px 16px", fontSize: 13 }}>✕ Sair</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.06)", background: "#141210", overflowX: "auto", scrollbarWidth: "none" }}>
          {tabList.map(({ id, icon, label, count }) => (
            <button key={id} onClick={() => { setTab(id); if (id === "subscribers" || id === "dashboard") fetchSubs(); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "14px 20px", flexShrink: 0, background: "none", border: "none", borderBottom: tab === id ? "2px solid #c8873a" : "2px solid transparent", color: tab === id ? "#fff" : "#666", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: tab === id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", transition: "color .2s" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span>{label}</span>
              {count !== null && <span style={{ background: "rgba(200,135,58,.18)", color: "#c8873a", fontSize: 11, padding: "1px 7px", borderRadius: 10, fontWeight: 700, marginLeft: 2 }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

          {/* DASHBOARD */}
          {tab === "dashboard" && (() => {
            const thisMonth = subscribers.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length;
            const totalFormats = books.reduce((acc, b) => acc + Object.values(b.formats || {}).filter(Boolean).length, 0);
            return (
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#fff", marginBottom: 20 }}>Dashboard</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
                  {[["📚", books.length, "Livros"], ["👥", subscribers.length, "Assinantes"], ["🆕", thisMonth, "Novos este mês"], ["📥", totalFormats, "Formatos"]].map(([icon, val, label]) => (
                    <div key={label} className="dash-card">
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                      <div className="dash-stat">{val}</div>
                      <div className="dash-label">{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 12 }}>🆕 Assinantes recentes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {subscribers.slice(0, 5).length === 0
                    ? <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#444", fontSize: 13 }}>Nenhum assinante ainda.</div>
                    : subscribers.slice(0, 5).map(s => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(255,255,255,.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,.04)" }}>
                          <span style={{ fontSize: 18 }}>👤</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#ccc", fontSize: 13, fontWeight: 500 }}>{s.name || "—"}</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#555", fontSize: 12 }}>{s.email}</div>
                          </div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#444", fontSize: 11 }}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</div>
                        </div>
                      ))
                  }
                </div>
              </div>
            );
          })()}

          {/* LIBRARY */}
          {tab === "library" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#444", fontSize: 14 }}>🔍</span>
                  <input placeholder="Buscar livro ou autor..." onChange={e => { const q = e.target.value.toLowerCase(); if (!q) { fetchBooks(); return; } setBooks(prev => prev.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))); }}
                    style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "'DM Sans',sans-serif", width: "100%" }} />
                </div>
                <button className="btn-primary" onClick={fetchBooks} style={{ padding: "9px 14px", fontSize: 13 }} title="Recarregar">↺</button>
              </div>
              {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 8 }} />)
                : books.length === 0
                  ? <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", textAlign: "center", padding: "60px 0" }}>Nenhum livro cadastrado ainda.</div>
                  : books.map(b => {
                      const fmtCount = b.formats ? Object.values(b.formats).filter(Boolean).length : 0;
                      return (
                        <div key={b.id} className="list-row">
                          <img src={b.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"} alt={b.title} style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"; }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              {b.title}
                              {b.featured && <span className="badge badge-amber">DESTAQUE</span>}
                              {b.is_new   && <span className="badge badge-red">NOVO</span>}
                            </div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555", marginTop: 2 }}>{b.author} · {b.genre}</div>
                            <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                              {b.formats && Object.entries(b.formats).filter(([,v]) => v).map(([fmt]) => (
                                <span key={fmt} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: FORMAT_META[fmt].color, background: `${FORMAT_META[fmt].color}18`, border: `1px solid ${FORMAT_META[fmt].color}33`, padding: "1px 7px", borderRadius: 4 }}>
                                  {FORMAT_META[fmt].icon} {FORMAT_META[fmt].label}
                                </span>
                              ))}
                              {fmtCount === 0 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#333" }}>Sem formatos</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {deleteId === b.id
                              ? <><button className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(b.id)}>Confirmar</button><button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setDeleteId(null)}>Cancelar</button></>
                              : <><button onClick={() => startEdit(b)} style={{ background: "rgba(200,135,58,.12)", color: "#c8873a", border: "1px solid rgba(200,135,58,.25)", borderRadius: 5, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>✏ Editar</button><button className="btn-danger" onClick={() => setDeleteId(b.id)}>🗑 Remover</button></>
                            }
                          </div>
                        </div>
                      );
                    })
              }
            </div>
          )}

          {/* ADD */}
          {tab === "add" && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 22 }}>Adicionar Novo Livro</div>
              <BookForm form={form} setForm={setForm} genres={genres} onSubmit={handleAdd} saving={saving} submitLabel="＋ Adicionar à Biblioteca" />
            </div>
          )}

          {/* EDIT */}
          {tab === "edit" && editForm && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff" }}>Editar Livro</div>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#555" }}>— {editingBook.title}</span>
              </div>
              <BookForm form={editForm} setForm={setEditForm} genres={genres} onSubmit={handleSaveEdit} saving={editSaving} submitLabel="💾 Salvar Alterações" onCancel={() => { setEditingBook(null); setEditForm(null); setTab("library"); }} />
            </div>
          )}

          {/* GENRES */}
          {tab === "genres" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 8 }}>Gerenciar Gêneros</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginBottom: 24 }}>Adicione novos gêneros para categorizar seus livros.</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                <input className="input" value={newGenre} onChange={e => setNewGenre(e.target.value)} placeholder="Ex: Autoajuda, Aventura, HQ..." onKeyDown={e => e.key === "Enter" && handleAddGenre()} style={{ flex: 1 }} />
                <button className="btn-primary" onClick={handleAddGenre} style={{ padding: "11px 20px", flexShrink: 0 }}>＋ Adicionar</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {genres.map(g => (
                  <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 14px" }}>
                    {renamingGenre === g
                      ? <div style={{ display: "flex", flex: 1, gap: 8, alignItems: "center" }}>
                          <input className="input" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleRenameGenre(g); if (e.key === "Escape") { setRenamingGenre(null); setRenameValue(""); } }} autoFocus style={{ flex: 1, padding: "7px 12px", fontSize: 13 }} />
                          <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => handleRenameGenre(g)}>Salvar</button>
                          <button className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => { setRenamingGenre(null); setRenameValue(""); }}>✕</button>
                        </div>
                      : <>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#ccc", flex: 1 }}>{g}</span>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#444" }}>{books.filter(b => b.genre === g).length} livro{books.filter(b => b.genre === g).length !== 1 ? "s" : ""}</span>
                          <button onClick={() => { setRenamingGenre(g); setRenameValue(g); }} style={{ background: "rgba(200,135,58,.1)", color: "#c8873a", border: "1px solid rgba(200,135,58,.2)", borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>✏ Renomear</button>
                          {!DEFAULT_GENRES.includes(g) && <button onClick={() => setGenres(prev => prev.filter(x => x !== g))} style={{ background: "rgba(200,40,40,.1)", color: "#ff6060", border: "1px solid rgba(200,40,40,.2)", borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>🗑</button>}
                        </>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBSCRIBERS */}
          {tab === "subscribers" && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 8 }}>Assinantes</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginBottom: 20 }}>{subscribers.length} assinante{subscribers.length !== 1 ? "s" : ""} cadastrado{subscribers.length !== 1 ? "s" : ""}</p>
              {subscribers.length === 0
                ? <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#333", textAlign: "center", padding: "60px 0" }}>Nenhum assinante ainda.</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {subscribers.map(s => (
                      <div key={s.id} className="list-row">
                        <div style={{ width: 36, height: 36, background: "rgba(200,135,58,.15)", border: "1px solid rgba(200,135,58,.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#fff", fontSize: 14 }}>{s.name || "—"}</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555" }}>{s.email}</div>
                        </div>
                        <span className={`badge ${s.status === "active" ? "badge-green" : "badge-red"}`}>{s.status === "active" ? "Ativo" : "Inativo"}</span>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444" }}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* PRICING */}
          {tab === "pricing" && (
            <div style={{ maxWidth: 500 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 8 }}>Valor da Assinatura</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginBottom: 26, lineHeight: 1.7 }}>Preço mensal para acesso ilimitado a toda a biblioteca.</p>
              <div style={{ background: "#181410", border: "1px solid rgba(200,135,58,.15)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", display: "block", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Preço Mensal</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#666", fontSize: 22, fontWeight: 600 }}>R$</span>
                  <input type="number" className="input" value={draftPrice} min={0} step={0.01} onChange={e => setDraft(Number(e.target.value))} style={{ fontSize: 32, fontWeight: 700, textAlign: "center", width: 160, fontFamily: "'Playfair Display', serif" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", fontSize: 16 }}>/mês</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 20 }}>
                  <div style={{ background: "linear-gradient(135deg,#1a1208,#120e06)", border: "1px solid rgba(200,135,58,.25)", borderRadius: 10, padding: "20px 24px" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#c8873a", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>☕ Livro & Café — Assinatura</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1 }}>R$ {draftPrice.toFixed(2).replace(".", ",")}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#c8873a", fontSize: 14, marginTop: 6 }}>/mês · {books.length} livros · Todos os formatos</div>
                  </div>
                </div>
              </div>
              <button className="btn-primary" onClick={handleSavePrice} style={{ padding: "13px 28px", fontSize: 15 }}>💾 Salvar Preço</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [books, setBooks]         = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [price, setPrice]         = useState(29.90);
  const [genre, setGenre]         = useState("Todos");
  const [heroIdx, setHeroIdx]     = useState(0);
  const [scrolled, setScrolled]   = useState(false);
  const [subscribed, setSub]      = useState(false);
  const [selectedBook, setSelBook]= useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [adminAuth, setAdminAuth] = useState(() => sessionStorage.getItem("lc_admin") === "true");
  const [showAdmin, setShowAdmin] = useState(false);
  const [toast, setToast]         = useState({ msg: "", type: "info" });
  const [subEmail, setSubEmail]   = useState("");
  const [subName, setSubName]     = useState("");
  const [showSubForm, setShowSubForm] = useState(false);
  const [subSaving, setSubSaving] = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "info" }), 3000); };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from("books").select("*").or(`title.ilike.%${q}%,author.ilike.%${q}%,genre.ilike.%${q}%`);
    setSearchResults(data || []);
  };

  const openBook = async (book) => {
    await supabase.from("books").update({ views: (book.views || 0) + 1 }).eq("id", book.id);
    setSelBook(book);
    if (showSearch) setShowSearch(false);
  };

  const fetchPrice = useCallback(async () => {
    const { data } = await supabase.from("settings").select("value").eq("key", "subscription_price").single();
    if (data) setPrice(parseFloat(data.value));
  }, []);

  const fetchBooks = useCallback(async () => {
    setBooksLoading(true);
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (error) showToast("Erro ao carregar livros.", "error");
    else setBooks(data || []);
    setBooksLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); fetchPrice(); }, []);

  useEffect(() => {
    const featured = books.filter(b => b.featured);
    if (!featured.length) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [books]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(s => !s); }
      if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const handleSubscribe = async () => {
    if (!subEmail.trim()) { showToast("Digite seu e-mail.", "error"); return; }
    setSubSaving(true);
    const { error } = await supabase.from("subscribers").upsert([{ email: subEmail.trim().toLowerCase(), name: subName.trim(), status: "active" }], { onConflict: "email" });
    if (error) showToast("Erro ao registrar: " + error.message, "error");
    else { showToast("🎉 Assinatura registrada!", "success"); setSub(true); setShowSubForm(false); }
    setSubSaving(false);
  };

  const featured = books.filter(b => b.featured);
  const heroBook = featured[heroIdx] || books[0];
  const newBooks = books.filter(b => b.is_new);
  const allGenres = ["Todos", ...Array.from(new Set(books.map(b => b.genre).filter(Boolean))).sort()];
  const filtered = books.filter(b => {
    const gOk = genre === "Todos" || b.genre === genre;
    return gOk;
  });

  return (
    <>
      <style>{css}</style>
      <Toast msg={toast.msg} type={toast.type} />
      <div style={{ background: "#0e0c0a", minHeight: "100vh", color: "#fff" }}>

        {showLogin && <AdminLogin onLogin={() => { setAdminAuth(true); sessionStorage.setItem("lc_admin","true"); setShowLogin(false); setShowAdmin(true); showToast("✓ Bem-vindo, administrador!", "success"); }} onClose={() => setShowLogin(false)} />}
        {showAdmin && adminAuth && <AdminPanel onClose={(logout) => { setShowAdmin(false); if (logout) { setAdminAuth(false); sessionStorage.removeItem("lc_admin"); showToast("Sessão encerrada."); } }} showToast={showToast} price={price} setPrice={setPrice} />}
        {selectedBook && <BookModal book={selectedBook} onClose={() => setSelBook(null)} />}

        {/* Subscribe Modal */}
        {showSubForm && (
          <div className="modal-backdrop" onClick={() => setShowSubForm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(160deg,#1a1510,#0f0d0a)", border: "1px solid rgba(200,135,58,.2)", borderRadius: 16, padding: 36, width: "min(440px,92vw)", boxShadow: "0 40px 100px rgba(0,0,0,.9)" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>☕</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#c8873a" }}>Assinar Livro & Café</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginTop: 6 }}>Acesso ilimitado por <strong style={{ color: "#fff" }}>R$ {price.toFixed(2).replace(".", ",")}/mês</strong></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Nome</label>
                  <input className="input" value={subName} onChange={e => setSubName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>E-mail *</label>
                  <input className="input" type="email" value={subEmail} onChange={e => setSubEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e => e.key === "Enter" && handleSubscribe()} />
                </div>
                <button className="btn-primary" onClick={handleSubscribe} disabled={subSaving} style={{ justifyContent: "center", padding: "13px", marginTop: 4 }}>
                  {subSaving ? <><div className="spinner" />Registrando...</> : "Confirmar Assinatura"}
                </button>
                <button className="btn-ghost" onClick={() => setShowSubForm(false)} style={{ justifyContent: "center", padding: "10px" }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* NAVBAR */}
        <nav className={`nav-wrap${scrolled ? " scrolled" : ""}`} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "linear-gradient(180deg,rgba(14,12,10,.98) 0%,rgba(14,12,10,0) 100%)", padding: "0 20px", height: 66, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#c8873a", flexShrink: 0, letterSpacing: "-.5px" }}>☕ Livro & Café</div>
          <div className="nav-pills" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {allGenres.map(g => <button key={g} className={`pill${genre === g ? " active" : ""}`} onClick={() => setGenre(g)}>{g}</button>)}
          </div>
          <div className="nav-mobile-row" style={{ position: "fixed", top: 66, left: 0, right: 0, zIndex: 190, background: "rgba(14,12,10,.97)", borderBottom: "1px solid rgba(255,255,255,.05)", padding: "8px 16px", gap: 6, overflowX: "auto" }}>
            {allGenres.map(g => <button key={g} className={`pill${genre === g ? " active" : ""}`} onClick={() => setGenre(g)} style={{ fontSize: 12, padding: "5px 12px" }}>{g}</button>)}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowSearch(true)} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 6, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ color: "#555", fontSize: 14 }}>🔍</span>
            <span style={{ color: "#444", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Buscar... <span style={{ fontSize: 11, color: "#333" }}>⌘K</span></span>
          </button>
          <button className={subscribed ? "btn-ghost" : "btn-primary"} style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => subscribed ? null : setShowSubForm(true)}>
            {subscribed ? "✓ Assinante" : `Assinar R$ ${price.toFixed(2).replace(".", ",")}`}
          </button>
          <button onClick={() => adminAuth ? setShowAdmin(true) : setShowLogin(true)} title="Área restrita" style={{ background: "none", border: "1px solid rgba(255,255,255,.06)", color: "#2a2a2a", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#2a2a2a"; e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; }}>⚙</button>
        </nav>

        {/* HERO */}
        <div style={{ position: "relative", height: "90vh", overflow: "hidden" }}>
          {heroBook ? <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroBook.cover_url || ""})`, backgroundSize: "cover", backgroundPosition: "center top", filter: "blur(3px) brightness(.28)", transform: "scale(1.06)", transition: "background-image .8s" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(14,12,10,.97) 0%,rgba(14,12,10,.55) 55%,transparent 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(0deg,#0e0c0a 0%,transparent 100%)" }} />
            <div className="hero-content" style={{ position: "absolute", top: "50%", left: 56, transform: "translateY(-52%)", maxWidth: 520 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {heroBook.featured && <span className="badge badge-amber" style={{ fontSize: 11 }}>DESTAQUE</span>}
                {heroBook.is_new   && <span className="badge badge-red"   style={{ fontSize: 11 }}>NOVO</span>}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(34px,4.5vw,58px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 10 }}>{heroBook.title}</h1>
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#c8873a", fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{heroBook.author} · {heroBook.genre}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#bbb", fontSize: 15, lineHeight: 1.75, marginBottom: 24, maxWidth: 420 }}>{truncate(heroBook.description, 180)}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn-primary" style={{ fontSize: 15, padding: "13px 26px" }} onClick={() => openBook(heroBook)}>📖 Ver Formatos</button>
                <button className="btn-ghost"   style={{ fontSize: 15, padding: "13px 20px" }} onClick={() => openBook(heroBook)}>ⓘ Detalhes</button>
              </div>
            </div>
            <div className="hero-dots" style={{ position: "absolute", bottom: 28, left: 56, display: "flex", gap: 8 }}>
              {featured.map((_, i) => <button key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 22 : 7, height: 4, borderRadius: 2, background: i === heroIdx ? "#c8873a" : "#333", border: "none", cursor: "pointer", transition: "all .3s" }} />)}
            </div>
          </> : booksLoading
            ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 48 }}>☕</div><div style={{ fontFamily: "'Playfair Display', serif", color: "#c8873a", fontSize: 28, fontWeight: 700 }}>Livro & Café</div></div>
          }
        </div>

        {/* CONTENT */}
        <div className="content-pad" style={{ padding: "0 56px 56px", marginTop: -16 }}>
          {!subscribed && (
            <div className="sub-banner" style={{ background: "linear-gradient(135deg,#1a1208,#120e06)", border: "1px solid rgba(200,135,58,.2)", borderRadius: 12, padding: "18px 26px", display: "flex", alignItems: "center", gap: 20, marginBottom: 38, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#fff", marginBottom: 3 }}>Acesse toda a biblioteca</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 13 }}>{books.length} livros · PDF, EPUB, MOBI, TXT e Audiolivro · Cancele quando quiser</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: "#fff", fontWeight: 900, flexShrink: 0 }}>R$ {price.toFixed(2).replace(".", ",")}<span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", fontWeight: 400 }}>/mês</span></div>
              <button className="btn-primary" style={{ padding: "12px 26px", fontSize: 14, flexShrink: 0 }} onClick={() => setShowSubForm(true)}>Assinar Agora</button>
            </div>
          )}

          {genre === "Todos" && featured.length > 0 && (
            <div style={{ marginBottom: 42 }}>
              <div className="section-title">⭐ Destaques da Semana</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(172px,1fr))", gap: 14 }}>
                {booksLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 6 }} />)
                  : featured.map(b => <BookCard key={b.id} book={b} w="100%" h={260} onClick={openBook} />)}
              </div>
            </div>
          )}
          {(newBooks.length > 0 || booksLoading) && <Row title="🔥 Novidades" books={newBooks} onBook={openBook} loading={booksLoading} />}
          <Row title={genre === "Todos" ? "📚 Toda a Biblioteca" : `📖 ${genre}`} books={filtered} onBook={openBook} loading={booksLoading} />
          {genre === "Todos" && allGenres.filter(g => g !== "Todos").map(g => {
            const gb = books.filter(b => b.genre === g);
            if (!booksLoading && gb.length === 0) return null;
            return <Row key={g} title={g} books={gb} onBook={openBook} loading={booksLoading} />;
          })}
        </div>

        {adminAuth && !showAdmin && (
          <button onClick={() => setShowAdmin(true)} style={{ position: "fixed", bottom: 28, right: 28, zIndex: 300, background: "linear-gradient(135deg,#c8873a,#e8a84a)", border: "none", borderRadius: "50%", width: 52, height: 52, cursor: "pointer", fontSize: 22, boxShadow: "0 4px 20px rgba(200,135,58,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
        )}

        {/* Search Overlay */}
        {showSearch && (
          <div className="search-overlay" onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(200,135,58,.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <input autoFocus value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Buscar livros, autores, gêneros..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 18, fontFamily: "'DM Sans',sans-serif" }} />
                {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 }}>✕</button>}
              </div>
              {searchQuery && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {searchResults.length === 0
                    ? <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#444", textAlign: "center", padding: "40px 0" }}>Nenhum resultado para "{searchQuery}"</div>
                    : searchResults.map(book => (
                        <div key={book.id} className="search-result-card" onClick={() => openBook(book)}>
                          <img src={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"} alt={book.title} style={{ width: 50, height: 70, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"; }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: "#fff", fontWeight: 700 }}>{book.title}</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#888", marginTop: 2 }}>{book.author}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#c8873a", background: "rgba(200,135,58,.1)", border: "1px solid rgba(200,135,58,.2)", padding: "2px 8px", borderRadius: 4 }}>{book.genre}</span>
                              {book.is_new && <span className="badge badge-red" style={{ fontSize: 9 }}>NOVO</span>}
                            </div>
                          </div>
                        </div>
                      ))
                  }
                </div>
              )}
              {!searchQuery && <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#333", textAlign: "center", padding: "40px 0", fontSize: 14 }}>Digite para buscar · <span style={{ color: "#222" }}>ESC para fechar</span></div>}
            </div>
          </div>
        )}

        <div className="footer-wrap" style={{ borderTop: "1px solid rgba(255,255,255,.04)", padding: "22px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#c8873a" }}>☕ Livro & Café</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#282828", fontSize: 12 }}>© 2026 · livroecafe.com.br · Todos os direitos reservados</div>
        </div>
      </div>
    </>
  );
}
