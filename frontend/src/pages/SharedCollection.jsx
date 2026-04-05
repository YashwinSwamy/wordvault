import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSharedCollection } from "../api";

export default function SharedCollection() {
  const { token } = useParams();
  const [data,     setData]     = useState(null);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    getSharedCollection(token)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || "Could not load collection"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <span style={s.logo}>WordVault</span>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login"    style={s.navLogin}>Login</Link>
          <Link to="/register" style={s.navSignup}>Sign Up</Link>
        </div>
      </nav>

      <div style={{ ...s.body, padding: isMobile ? "24px 16px" : "40px 6%" }}>
        {loading && <p style={s.muted}>Loading...</p>}

        {error && (
          <div style={s.errorCard}>
            <p style={s.errorText}>{error}</p>
            <Link to="/register" style={s.cta}>Create your own vault →</Link>
          </div>
        )}

        {data && (
          <>
            <div style={s.header}>
              <div>
                <h1 style={s.title}>{data.collection.name}</h1>
                <p style={s.subtitle}>Shared by {data.collection.owner_username} · {data.words.length} words</p>
              </div>
            </div>

            {data.words.length === 0 ? (
              <p style={s.empty}>No words in this collection yet.</p>
            ) : isMobile ? (
              <div>
                {data.words.map(w => (
                  <div key={w.id} style={s.mobileCard}>
                    <div style={s.mobileWord}>
                      {w.word}
                      {w.part_of_speech && <span style={s.posBadge}>{w.part_of_speech}</span>}
                    </div>
                    <div style={s.mobileDef}>{w.definition}</div>
                    {w.example && <div style={s.mobileEx}>{w.example}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Word", "Part of Speech", "Definition", "Example"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.words.map(w => (
                      <tr key={w.id} style={s.tr}>
                        <td style={{ ...s.td, fontWeight: 600, color: "#f0ece3" }}>{w.word}</td>
                        <td style={s.td}><span style={s.posBadge}>{w.part_of_speech}</span></td>
                        <td style={s.td}>{w.definition}</td>
                        <td style={{ ...s.td, fontStyle: "italic", color: "#7a7062" }}>{w.example || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div style={s.footerCta}>
        <p style={s.footerText}>Want to build your own vocabulary vault?</p>
        <Link to="/register" style={s.footerBtn}>Sign up free →</Link>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "#0e0e0f", color: "#f0ece3", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column", animation: "wv-fadeIn 0.4s ease" },
  nav:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 6%", borderBottom: "1px solid #1e1e20", background: "#0e0e0f", position: "sticky", top: 0, zIndex: 100 },
  logo:      { fontFamily: "Georgia, serif", fontSize: 20, color: "#c9a96e", fontWeight: 700 },
  navLogin:  { color: "#8a8070", fontSize: 14, textDecoration: "none", padding: "7px 16px", border: "1px solid #2e2e30", borderRadius: 6 },
  navSignup: { color: "#0e0e0f", fontSize: 14, fontWeight: 600, textDecoration: "none", padding: "7px 16px", background: "#c9a96e", borderRadius: 6 },
  body:      { flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%" },
  header:    { marginBottom: 28 },
  title:     { fontFamily: "Georgia, serif", fontSize: 28, color: "#f0ece3", margin: "0 0 6px" },
  subtitle:  { color: "#8a8070", fontSize: 14, margin: 0 },
  muted:     { color: "#8a8070", fontStyle: "italic" },
  empty:     { color: "#3a3630", fontStyle: "italic", fontSize: 18, textAlign: "center", padding: "60px 0" },
  errorCard: { textAlign: "center", padding: "60px 0" },
  errorText: { color: "#e07070", fontSize: 16, marginBottom: 20 },
  cta:       { color: "#c9a96e", fontSize: 15, textDecoration: "none" },
  tableWrap: { overflowX: "auto" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4a4640", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #2e2e30" },
  tr:        { borderBottom: "1px solid #1e1e20" },
  td:        { fontSize: 14, color: "#c8c2b5", padding: "14px 12px", verticalAlign: "top", lineHeight: 1.5 },
  posBadge:  { fontFamily: "monospace", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#c9a96e", background: "rgba(201,169,110,0.1)", padding: "2px 7px", borderRadius: 99 },
  mobileCard:{ padding: "14px 0", borderBottom: "1px solid #1e1e20" },
  mobileWord:{ fontWeight: 600, fontSize: 15, color: "#f0ece3", marginBottom: 6, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
  mobileDef: { fontSize: 13, color: "#c8c2b5", lineHeight: 1.6 },
  mobileEx:  { fontSize: 12, color: "#7a7062", fontStyle: "italic", marginTop: 4, lineHeight: 1.5 },
  footerCta: { borderTop: "1px solid #1e1e20", padding: "28px 6%", textAlign: "center" },
  footerText:{ color: "#8a8070", fontSize: 14, margin: "0 0 10px" },
  footerBtn: { color: "#c9a96e", fontSize: 14, textDecoration: "none" },
};
