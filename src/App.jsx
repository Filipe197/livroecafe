import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ─── Supabase client ─────────────────────────────────────────────────────── */
const SUPABASE_URL = "https://yzwbwbrbogxblgpomlpj.supabase.co";
const SUPABASE_KEY = "sb_publishable_cPsjiFM_Q61ETYYdJuGVfQ_mBNFl4Tk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── Admin credentials (em produção, use Supabase Auth) ─────────────────── */
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || "admin";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || "livroecafe2026";

/* ─── Constants ───────────────────────────────────────────────────────────── */
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

/* ─── Global CSS ──────────────────────────────────────────────────────────── */
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

/* ── Responsive ── */
@media(max-width:768px){
  .nav-pills{display:none!important}
  .hero-content{left:20px!important;right:20px!important;max-width:100%!important}
  .hero-content h1{font-size:clamp(26px,7vw,40px)!important}
  .hero-content p{font-size:13px!important}
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
@media(min-width:769px){
  .nav-mobile-row{display:none!important}
}
.share-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#ccc;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
.share-btn:hover{background:rgba(200,135,58,.15);border-color:#c8873a;color:#e8a858}

.skeleton{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

/* ─── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg, type = "info" }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

/* ─── Skeleton Card ───────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ width: 150, height: 220, flexShrink: 0, borderRadius: 6, overflow: "hidden" }}>
      <div className="skeleton" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/* ─── Admin Login ─────────────────────────────────────────────────────────── */
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

/* ─── Share helper ────────────────────────────────────────────────────────── */
async function shareBook(book, format, link) {
  const title = `${book.title} — ${book.author}`;
  const text = `Leia "${book.title}" de ${book.author} no Livro & Café ☕`;
  // Try Web Share API (mobile) first
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: link });
      return;
    } catch(e) { /* user cancelled or not supported */ }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(link);
    alert(`Link copiado! Cole no ${format} ou app de sua preferência.`);
  } catch(e) {
    window.open(link, "_blank");
  }
}

/* ─── Book Modal ──────────────────────────────────────────────────────────── */
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
        <div style={{ padding: "0 22px 22px", overflowY: "auto", flex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px,5vw,26px)", color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>{book.title}</h2>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#888", fontSize: 14, marginBottom: 14 }}>
            {book.author} · <span style={{ color: "#c8873a" }}>{book.genre}</span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#bbb", fontSize: "clamp(13px,3.5vw,15px)", lineHeight: 1.7, marginBottom: 16 }}>{truncate(book.description, 220)}</p>
          {fmts.length > 0 ? (
            <>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Formatos disponíveis</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {fmts.map(([fmt, link]) => {
                  const m = FORMAT_META[fmt];
                  return (
                    <a key={fmt} href={link} target="_blank" rel="noreferrer" className="format-btn" style={{ borderColor: `${m.color}33`, color: m.color }}>
                      <span>{m.icon}</span> {m.label}
                    </a>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", fontSize: 13, marginBottom: 20 }}>Nenhum formato disponível ainda.</div>
          )}
          <button className="btn-ghost" onClick={onClose} style={{ padding: "10px 22px" }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Book Card ───────────────────────────────────────────────────────────── */
function BookCard({ book, w = 150, h = 220, onClick }) {
  const fmtCount = book.formats ? Object.values(book.formats).filter(Boolean).length : 0;
  return (
    <div className="book-card" style={{ width: w, height: h, flexShrink: 0 }} onClick={() => onClick(book)}>
      <img src={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"; }} />
      <div className="c-shine" />
      <div className="c-overlay">
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {book.is_new && <span className="badge badge-red">NOVO</span>}
          {fmtCount > 0 && <span className="badge badge-green">{fmtCount} fmt</span>}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#fff", lineHeight: 1.3 }}>{book.title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>{book.author}</div>
        <button className="btn-primary" style={{ marginTop: 8, padding: "6px 12px", fontSize: 11 }}>Ver formatos</button>
      </div>
    </div>
  );
}

/* ─── Carousel Row ────────────────────────────────────────────────────────── */
function Row({ title, books, onBook, loading }) {
  const ref = useRef(null);
  return (
    <div style={{ marginBottom: 38 }}>
      <div className="section-title">{title} {!loading && <small>{books.length} livros</small>}</div>
      <div style={{ position: "relative" }}>
        <button onClick={() => { ref.current.scrollLeft -= 580; }} style={{ position: "absolute", left: -18, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <div className="row-scroll" ref={ref}>
          {loading
            ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : books.length > 0
              ? books.map(b => <BookCard key={b.id} book={b} onClick={onBook} />)
              : <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", fontSize: 13, padding: "20px 0" }}>Nenhum livro nesta categoria ainda.</div>
          }
        </div>
        <button onClick={() => { ref.current.scrollLeft += 580; }} style={{ position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
    </div>
  );
}

/* ─── Format Inputs ───────────────────────────────────────────────────────── */
function FormatInputs({ formats, setFormats }) {
  return (
    <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 18 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Links de Download (Google Drive)</div>
      <div className="format-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {Object.entries(FORMAT_META).map(([key, meta]) => (
          <div key={key}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span>{meta.icon}</span>
              <span style={{ color: meta.color }}>{meta.label}</span>
              <span style={{ color: "#333", fontSize: 10 }}>(opcional)</span>
            </label>
            <input className="input" value={formats[key] || ""} onChange={e => setFormats({ ...formats, [key]: e.target.value })} placeholder={`Link Drive para ${meta.label}...`} style={{ fontSize: 12, padding: "9px 12px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Admin Panel ─────────────────────────────────────────────────────────── */
function AdminPanel({ onClose, showToast, price, setPrice }) {
  const [tab, setTab]         = useState("library");
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ ...EMPTY_FORM, formats: { ...EMPTY_FORMATS } });
  const [draftPrice, setDraft]= useState(price);
  const [deleteId, setDeleteId] = useState(null);
  const [subscribers, setSubs]  = useState([]);
  const [genres, setGenres]     = useState(DEFAULT_GENRES);
  const [newGenre, setNewGenre] = useState("");
  const [genreSaving, setGenreSaving] = useState(false);
  const [editingBook, setEditingBook] = useState(null); // book being edited
  const [editForm, setEditForm]       = useState(null);
  const [editSaving, setEditSaving]   = useState(false);
  const [renamingGenre, setRenamingGenre] = useState(null); // genre name being renamed
  const [renameValue, setRenameValue]     = useState("");

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (error) { showToast("Erro ao carregar livros: " + error.message, "error"); }
    else { setBooks(data || []); }
    setLoading(false);
  }, []);

  const fetchSubs = useCallback(async () => {
    const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
    setSubs(data || []);
  }, []);

  // derive genres dynamically from books + defaults
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
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre,
      description: form.description.trim(),
      cover_url: form.cover_url.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80",
      featured: form.featured,
      is_new: form.is_new,
      formats: form.formats,
    }]);
    if (error) { showToast("Erro ao salvar: " + error.message, "error"); }
    else {
      showToast("✓ Livro adicionado com sucesso!", "success");
      setForm({ ...EMPTY_FORM, formats: { ...EMPTY_FORMATS } });
      fetchBooks();
      setTab("library");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) { showToast("Erro ao remover: " + error.message, "error"); }
    else { showToast("🗑 Livro removido.", "success"); fetchBooks(); }
    setDeleteId(null);
  };

  const startEdit = (book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      cover_url: book.cover_url || "",
      description: book.description || "",
      featured: book.featured || false,
      is_new: book.is_new || false,
      formats: book.formats || { ...EMPTY_FORMATS },
    });
    setTab("edit");
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.author.trim()) { showToast("Preencha título e autor.", "error"); return; }
    setEditSaving(true);
    const { error } = await supabase.from("books").update({
      title: editForm.title.trim(),
      author: editForm.author.trim(),
      genre: editForm.genre,
      description: editForm.description.trim(),
      cover_url: editForm.cover_url.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80",
      featured: editForm.featured,
      is_new: editForm.is_new,
      formats: editForm.formats,
    }).eq("id", editingBook.id);
    if (error) { showToast("Erro ao salvar: " + error.message, "error"); }
    else {
      showToast("✓ Livro atualizado!", "success");
      setEditingBook(null); setEditForm(null);
      fetchBooks(); setTab("library");
    }
    setEditSaving(false);
  };

  const handleRenameGenre = (oldName) => {
    const newName = renameValue.trim();
    if (!newName) return;
    if (genres.includes(newName) && newName !== oldName) { showToast("Já existe um gênero com esse nome.", "error"); return; }
    setGenres(prev => prev.map(g => g === oldName ? newName : g).sort());
    // Update all books with this genre
    books.filter(b => b.genre === oldName).forEach(async (b) => {
      await supabase.from("books").update({ genre: newName }).eq("id", b.id);
    });
    setRenamingGenre(null); setRenameValue("");
    showToast(`✓ Gênero renomeado para "${newName}"`, "success");
    fetchBooks();
  };

  const handleAddGenre = () => {
    const g = newGenre.trim();
    if (!g) return;
    if (genres.includes(g)) { showToast("Gênero já existe.", "error"); return; }
    setGenres(prev => [...prev, g].sort());
    setNewGenre("");
    showToast(`✓ Gênero "${g}" adicionado!`, "success");
  };

  const handleRemoveGenre = (g) => {
    if (DEFAULT_GENRES.includes(g)) { showToast("Não é possível remover gêneros padrão.", "error"); return; }
    setGenres(prev => prev.filter(x => x !== g));
  };

  const handleSavePrice = async () => {
    setPrice(draftPrice);
    showToast("✓ Preço atualizado!", "success");
  };

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
          <button className="btn-ghost" onClick={onClose} style={{ padding: "8px 16px", fontSize: 13 }}>✕ Sair</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.06)", background: "#141210", overflowX: "auto", gap: 0, scrollbarWidth: "none" }}>
          {[
            ["library", "📚", "Biblioteca", books.length],
            ["add", "＋", "Adicionar", null],
            ...(editingBook ? [["edit", "✏", "Editando", null]] : []),
            ["genres", "🏷", "Gêneros", genres.length],
            ["subscribers", "👥", "Assinantes", subscribers.length],
            ["pricing", "💳", "Assinatura", null],
          ].map(([id, icon, label, count]) => (
            <button key={id} className={`admin-tab${tab === id ? " active" : ""}`}
              onClick={() => { setTab(id); if (id === "subscribers") fetchSubs(); }}
              style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, padding: "12px 18px", whiteSpace: "nowrap", flexShrink: 0 }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span style={{ fontSize: 13 }}>{label}</span>
              {count !== null && <span style={{ background: "rgba(200,135,58,.2)", color: "#c8873a", fontSize: 10, padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

          {/* ── LIBRARY ── */}
          {tab === "library" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#444", fontSize: 14 }}>🔍</span>
                  <input
                    placeholder="Buscar livro ou autor..."
                    onChange={e => {
                      const q = e.target.value.toLowerCase();
                      if (!q) { fetchBooks(); return; }
                      setBooks(prev => prev.filter(b =>
                        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
                      ));
                    }}
                    style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "'DM Sans',sans-serif", width: "100%" }}
                  />
                </div>
                <button className="btn-primary" onClick={fetchBooks} style={{ padding: "9px 14px", fontSize: 13 }} title="Recarregar">↺</button>
              </div>
              {loading
                ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 8 }} />)
                : books.length === 0
                  ? <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", textAlign: "center", padding: "60px 0" }}>Nenhum livro cadastrado ainda.<br /><span style={{ fontSize: 12, color: "#333" }}>Adicione o primeiro pelo botão "＋ Adicionar Livro"</span></div>
                  : books.map(b => {
                      const fmtCount = b.formats ? Object.values(b.formats).filter(Boolean).length : 0;
                      return (
                        <div key={b.id} className="list-row">
                          <img src={b.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"} alt={b.title} style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: "1px solid rgba(255,255,255,.06)" }} onError={e => { e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80"; }} />
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
                              ? <>
                                  <button className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(b.id)}>Confirmar</button>
                                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setDeleteId(null)}>Cancelar</button>
                                </>
                              : <>
                                  <button onClick={() => startEdit(b)} style={{ background: "rgba(200,135,58,.12)", color: "#c8873a", border: "1px solid rgba(200,135,58,.25)", borderRadius: 5, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>✏ Editar</button>
                                  <button className="btn-danger" onClick={() => setDeleteId(b.id)}>🗑 Remover</button>
                                </>
                            }
                          </div>
                        </div>
                      );
                    })
              }
            </div>
          )}

          {/* ── ADD ── */}
          {tab === "add" && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 22 }}>Adicionar Novo Livro</div>
              <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Título *</label>
                  <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: O Hobbit" />
                </div>
                {[["author","Autor *","Ex: J.R.R. Tolkien"],["cover_url","URL da Capa","https://..."]].map(([k,l,p]) => (
                  <div key={k}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>{l}</label>
                    <input className="input" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={p} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Gênero</label>
                  <select className="input" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}>
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 22 }}>
                  <label className="check-row"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> ⭐ Marcar como Destaque</label>
                  <label className="check-row"><input type="checkbox" checked={form.is_new} onChange={e => setForm({ ...form, is_new: e.target.checked })} /> 🆕 Marcar como Novo</label>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Descrição</label>
                <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve sinopse..." rows={3} style={{ resize: "vertical" }} />
              </div>
              <FormatInputs formats={form.formats} setFormats={f => setForm({ ...form, formats: f })} />
              <button className="btn-primary" onClick={handleAdd} disabled={saving} style={{ marginTop: 20, padding: "13px 28px", fontSize: 15 }}>
                {saving ? <><div className="spinner" />Salvando...</> : "＋ Adicionar à Biblioteca"}
              </button>
            </div>
          )}

          {/* ── EDIT ── */}
          {tab === "edit" && editForm && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff" }}>Editar Livro</div>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#555" }}>— {editingBook.title}</span>
                <button onClick={() => { setEditingBook(null); setEditForm(null); setTab("library"); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>✕ Cancelar</button>
              </div>
              <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Título *</label>
                  <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                {[["author","Autor *"],["cover_url","URL da Capa"]].map(([k,l]) => (
                  <div key={k}>
                    <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>{l}</label>
                    <input className="input" value={editForm[k]} onChange={e => setEditForm({ ...editForm, [k]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Gênero</label>
                  <select className="input" value={editForm.genre} onChange={e => setEditForm({ ...editForm, genre: e.target.value })}>
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 22 }}>
                  <label className="check-row"><input type="checkbox" checked={editForm.featured} onChange={e => setEditForm({ ...editForm, featured: e.target.checked })} /> ⭐ Destaque</label>
                  <label className="check-row"><input type="checkbox" checked={editForm.is_new} onChange={e => setEditForm({ ...editForm, is_new: e.target.checked })} /> 🆕 Novo</label>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 500 }}>Descrição</label>
                <textarea className="input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ resize: "vertical" }} />
              </div>
              <FormatInputs formats={editForm.formats} setFormats={f => setEditForm({ ...editForm, formats: f })} />
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button className="btn-primary" onClick={handleSaveEdit} disabled={editSaving} style={{ padding: "13px 28px", fontSize: 15 }}>
                  {editSaving ? <><div className="spinner" />Salvando...</> : "💾 Salvar Alterações"}
                </button>
                <button className="btn-ghost" onClick={() => { setEditingBook(null); setEditForm(null); setTab("library"); }} style={{ padding: "13px 20px" }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* ── GENRES ── */}
          {tab === "genres" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 8 }}>Gerenciar Gêneros</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginBottom: 24 }}>Adicione novos gêneros para categorizar seus livros. Gêneros padrão não podem ser removidos.</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                <input className="input" value={newGenre} onChange={e => setNewGenre(e.target.value)} placeholder="Ex: Autoajuda, Aventura, HQ..." onKeyDown={e => e.key === "Enter" && handleAddGenre()} style={{ flex: 1 }} />
                <button className="btn-primary" onClick={handleAddGenre} disabled={genreSaving} style={{ padding: "11px 20px", flexShrink: 0 }}>＋ Adicionar</button>
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
                          {!DEFAULT_GENRES.includes(g)
                            ? <button onClick={() => handleRemoveGenre(g)} style={{ background: "rgba(200,40,40,.1)", color: "#ff6060", border: "1px solid rgba(200,40,40,.2)", borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>🗑 Remover</button>
                            : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#333", padding: "5px 8px" }}>padrão</span>
                          }
                        </>
                    }
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#333", marginTop: 12 }}>Gêneros "padrão" podem ser renomeados mas não removidos.</div>
            </div>
          )}

          {/* ── SUBSCRIBERS ── */}
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

          {/* ── PRICING ── */}
          {tab === "pricing" && (
            <div style={{ maxWidth: 500 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", marginBottom: 8 }}>Valor da Assinatura</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginBottom: 26, lineHeight: 1.7 }}>Preço mensal para acesso ilimitado a toda a biblioteca, incluindo todos os formatos.</p>
              <div style={{ background: "#181410", border: "1px solid rgba(200,135,58,.15)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", display: "block", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Preço Mensal</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#666", fontSize: 22, fontWeight: 600 }}>R$</span>
                  <input type="number" className="input" value={draftPrice} min={0} step={0.01} onChange={e => setDraft(Number(e.target.value))} style={{ fontSize: 32, fontWeight: 700, textAlign: "center", width: 160, fontFamily: "'Playfair Display', serif" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", fontSize: 16 }}>/mês</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 20 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Preview</div>
                  <div style={{ background: "linear-gradient(135deg,#1a1208,#120e06)", border: "1px solid rgba(200,135,58,.25)", borderRadius: 10, padding: "20px 24px" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#c8873a", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>☕ Livro & Café — Assinatura</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1 }}>R$ {draftPrice.toFixed(2).replace(".", ",")}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#c8873a", fontSize: 14, marginTop: 6 }}>/mês · {books.length} livros · Todos os formatos</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#333", fontSize: 12, marginTop: 10 }}>Cancele quando quiser · Sem fidelidade</div>
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

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [books, setBooks]         = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [price, setPrice]         = useState(29.90);
  const [genre, setGenre]         = useState("Todos");
  const [search, setSearch]       = useState("");
  const [heroIdx, setHeroIdx]     = useState(0);
  const [scrolled, setScrolled]   = useState(false);
  const [subscribed, setSub]      = useState(false);
  const [selectedBook, setSelBook]= useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [toast, setToast]         = useState({ msg: "", type: "info" });
  const [subEmail, setSubEmail]   = useState("");
  const [subName, setSubName]     = useState("");
  const [showSubForm, setShowSubForm] = useState(false);
  const [subSaving, setSubSaving] = useState(false);

  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "info" }), 3000); };

  /* fetch books from Supabase */
  const fetchBooks = useCallback(async () => {
    setBooksLoading(true);
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (error) { showToast("Erro ao carregar livros.", "error"); }
    else { setBooks(data || []); }
    setBooksLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); }, []);

  /* hero rotation */
  useEffect(() => {
    const featured = books.filter(b => b.featured);
    if (!featured.length) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [books]);

  /* scroll nav */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* subscribe handler */
  const handleSubscribe = async () => {
    if (!subEmail.trim()) { showToast("Digite seu e-mail.", "error"); return; }
    setSubSaving(true);
    const { error } = await supabase.from("subscribers").upsert([{ email: subEmail.trim().toLowerCase(), name: subName.trim(), status: "active" }], { onConflict: "email" });
    if (error) { showToast("Erro ao registrar: " + error.message, "error"); }
    else { showToast("🎉 Assinatura registrada com sucesso!", "success"); setSub(true); setShowSubForm(false); }
    setSubSaving(false);
  };

  const featured = books.filter(b => b.featured);
  const heroBook = featured[heroIdx] || books[0];
  const newBooks = books.filter(b => b.is_new);
  // Build genre list dynamically from actual books
  const allGenres = ["Todos", ...Array.from(new Set(books.map(b => b.genre).filter(Boolean))).sort()];
  const filtered = books.filter(b => {
    const gOk = genre === "Todos" || b.genre === genre;
    const sOk = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    return gOk && sOk;
  });

  const openAdmin = () => { if (adminAuth) setShowAdmin(true); else setShowLogin(true); };

  return (
    <>
      <style>{css}</style>
      <Toast msg={toast.msg} type={toast.type} />

      <div style={{ background: "#0e0c0a", minHeight: "100vh", color: "#fff" }}>

        {showLogin && (
          <AdminLogin
            onLogin={() => { setAdminAuth(true); setShowLogin(false); setShowAdmin(true); showToast("✓ Bem-vindo, administrador!", "success"); }}
            onClose={() => setShowLogin(false)}
          />
        )}
        {showAdmin && adminAuth && (
          <AdminPanel
            onClose={() => { setShowAdmin(false); setAdminAuth(false); showToast("Sessão admin encerrada."); }}
            showToast={showToast}
            price={price}
            setPrice={setPrice}
          />
        )}
        {selectedBook && <BookModal book={selectedBook} onClose={() => setSelBook(null)} />}

        {/* Subscribe Modal */}
        {showSubForm && (
          <div className="modal-backdrop" onClick={() => setShowSubForm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(160deg,#1a1510,#0f0d0a)", border: "1px solid rgba(200,135,58,.2)", borderRadius: 16, padding: 36, width: "min(440px,92vw)", boxShadow: "0 40px 100px rgba(0,0,0,.9)" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>☕</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#c8873a" }}>Assinar Livro & Café</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14, marginTop: 6 }}>
                  Acesso ilimitado por <strong style={{ color: "#fff" }}>R$ {price.toFixed(2).replace(".", ",")}/mês</strong>
                </div>
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

        {/* ── NAVBAR ── */}
        <nav className={`nav-wrap${scrolled ? " scrolled" : ""}`} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "linear-gradient(180deg,rgba(14,12,10,.98) 0%,rgba(14,12,10,0) 100%)", padding: "0 20px", height: 66, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#c8873a", flexShrink: 0, letterSpacing: "-.5px" }}>☕ Livro & Café</div>
          <div className="nav-pills" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {allGenres.map(g => <button key={g} className={`pill${genre === g ? " active" : ""}`} onClick={() => setGenre(g)}>{g}</button>)}
          </div>
          {/* Mobile genre row */}
          <div className="nav-mobile-row" style={{ position: "fixed", top: 66, left: 0, right: 0, zIndex: 190, background: "rgba(14,12,10,.97)", borderBottom: "1px solid rgba(255,255,255,.05)", padding: "8px 16px", gap: 6, overflowX: "auto" }}>
            {allGenres.map(g => <button key={g} className={`pill${genre === g ? " active" : ""}`} onClick={() => setGenre(g)} style={{ fontSize: 12, padding: "5px 12px" }}>{g}</button>)}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 6, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#555", fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: 150 }} />
          </div>
          <button className={subscribed ? "btn-ghost" : "btn-primary"} style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => subscribed ? null : setShowSubForm(true)}>
            {subscribed ? "✓ Assinante" : `Assinar R$ ${price.toFixed(2).replace(".", ",")}`}
          </button>
          <button onClick={openAdmin} title="Área restrita" style={{ background: "none", border: "1px solid rgba(255,255,255,.06)", color: "#2a2a2a", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#2a2a2a"; e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; }}>⚙</button>
        </nav>

        {/* ── HERO ── */}
        <div style={{ position: "relative", height: "90vh", overflow: "hidden", paddingTop: 0 }}>
          {heroBook
            ? <>
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
                  {heroBook.formats && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                      {Object.entries(heroBook.formats).filter(([,v]) => v).map(([fmt]) => (
                        <span key={fmt} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: FORMAT_META[fmt].color, background: `${FORMAT_META[fmt].color}18`, border: `1px solid ${FORMAT_META[fmt].color}33`, padding: "3px 9px", borderRadius: 4, fontWeight: 500 }}>
                          {FORMAT_META[fmt].icon} {FORMAT_META[fmt].label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button className="btn-primary" style={{ fontSize: 15, padding: "13px 26px" }} onClick={() => setSelBook(heroBook)}>📖 Ver Formatos</button>
                    <button className="btn-ghost"   style={{ fontSize: 15, padding: "13px 20px" }} onClick={() => setSelBook(heroBook)}>ⓘ Detalhes</button>
                    {navigator.share && <button className="share-btn" onClick={() => shareBook(heroBook, "link", window.location.href + "#" + heroBook.id)}>↗ Compartilhar</button>}
                  </div>
                </div>
                <div className="hero-dots" style={{ position: "absolute", bottom: 28, left: 56, display: "flex", gap: 8 }}>
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 22 : 7, height: 4, borderRadius: 2, background: i === heroIdx ? "#c8873a" : "#333", border: "none", cursor: "pointer", transition: "all .3s" }} />
                  ))}
                </div>
              </>
            : booksLoading
              ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 16px" }} />
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 14 }}>Carregando biblioteca...</div>
                  </div>
                </div>
              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 48 }}>☕</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", color: "#c8873a", fontSize: 28, fontWeight: 700 }}>Livro & Café</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 15 }}>Nenhum livro cadastrado ainda. Acesse o painel admin para adicionar.</div>
                </div>
          }
        </div>

        {/* ── CONTENT ── */}
        <div className="content-pad" style={{ padding: "0 56px 56px", marginTop: -16 }}>

          {/* Sub banner */}
          {!subscribed && (
            <div className="sub-banner" style={{ background: "linear-gradient(135deg,#1a1208,#120e06)", border: "1px solid rgba(200,135,58,.2)", borderRadius: 12, padding: "18px 26px", display: "flex", alignItems: "center", gap: 20, marginBottom: 38, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#fff", marginBottom: 3 }}>Acesse toda a biblioteca</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#555", fontSize: 13 }}>{books.length} livros · PDF, EPUB, MOBI, TXT e Audiolivro · Cancele quando quiser</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
                R$ {price.toFixed(2).replace(".", ",")}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", fontWeight: 400 }}>/mês</span>
              </div>
              <button className="btn-primary" style={{ padding: "12px 26px", fontSize: 14, flexShrink: 0 }} onClick={() => setShowSubForm(true)}>Assinar Agora</button>
            </div>
          )}

          {/* Search */}
          {search && (
            <div style={{ marginBottom: 40 }}>
              <div className="section-title">Resultados para "{search}" <small>{filtered.length} livros</small></div>
              {filtered.length > 0
                ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 12 }}>
                    {filtered.map(b => <BookCard key={b.id} book={b} onClick={setSelBook} />)}
                  </div>
                : <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#444", padding: "40px 0" }}>Nenhum resultado.</div>
              }
            </div>
          )}

          {!search && (
            <>
              {genre === "Todos" && featured.length > 0 && (
                <div style={{ marginBottom: 42 }}>
                  <div className="section-title">⭐ Destaques da Semana</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(172px,1fr))", gap: 14 }}>
                    {booksLoading
                      ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 6 }} />)
                      : featured.map(b => <BookCard key={b.id} book={b} w="100%" h={260} onClick={setSelBook} />)
                    }
                  </div>
                </div>
              )}
              {(newBooks.length > 0 || booksLoading) && <Row title="🔥 Novidades" books={newBooks} onBook={setSelBook} loading={booksLoading} />}
              <Row title={genre === "Todos" ? "📚 Toda a Biblioteca" : `📖 ${genre}`} books={filtered} onBook={setSelBook} loading={booksLoading} />
              {genre === "Todos" && allGenres.filter(g => g !== "Todos").map(g => {
                const gb = books.filter(b => b.genre === g);
                if (!booksLoading && gb.length === 0) return null;
                return <Row key={g} title={g} books={gb} onBook={setSelBook} loading={booksLoading} />;
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="footer-wrap" style={{ borderTop: "1px solid rgba(255,255,255,.04)", padding: "22px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#c8873a" }}>☕ Livro & Café</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#282828", fontSize: 12 }}>© 2026 · livroecafe.com.br · Todos os direitos reservados</div>
        </div>
      </div>
    </>
  );
}