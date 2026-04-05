import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// const BACKEND_URL = "https://wordvault-backend-xl0w.onrender.com";

/* Google sign-in icon — uncomment when Google OAuth is re-enabled
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.5-2.9-11.2-7.1l-6.6 5.1C9.8 39.7 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.3 5.2C40.9 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
);
*/

const features = [
  {
    icon: "⚡",
    title: "Auto Definitions",
    desc: "Type any word and instantly get its definition, part of speech, and an example sentence — no dictionary tab needed.",
  },
  {
    icon: "📝",
    title: "Personal Notes",
    desc: "Remember where you first encountered a word. Add context, quotes, or anything that helps it stick.",
  },
  {
    icon: "📚",
    title: "Collections",
    desc: "Organise words into themed collections. Collaborate with friends on shared lists in real time.",
  },
  {
    icon: "📊",
    title: "Export to Excel",
    desc: "Download your entire vocabulary as a spreadsheet — great for studying, sharing, or archiving.",
  },
];

const steps = [
  { n: "1", title: "Add a word",        desc: "Type any word into your collection." },
  { n: "2", title: "Get the definition", desc: "WordVault fetches the definition, part of speech, and example instantly." },
  { n: "3", title: "Build your lexicon", desc: "Grow and share your vocabulary over time." },
];


const CtaButtons = () => (
  <div style={s.ctaRow}>
    {/* Google sign-in — uncomment when OAuth is re-enabled
    <a href={`${BACKEND_URL}/api/auth/google`} style={s.ctaGoogle}>
      <GoogleIcon />
      Sign up with Google
    </a>
    */}
    <Link to="/register" style={s.ctaEmail}>Sign up with email</Link>
  </div>
);

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={s.page}>

      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <span style={s.navLogo}>WordVault</span>

        {isMobile ? (
          <button style={s.hamburger} onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/login"    style={s.navLogin}>Login</Link>
            <Link to="/register" style={s.navSignup}>Sign Up</Link>
          </div>
        )}
      </nav>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={s.mobileMenu}>
          <Link to="/login"    style={s.mobileMenuLink} onClick={() => setMenuOpen(false)}>Login</Link>
          <Link to="/register" style={s.mobileMenuLink} onClick={() => setMenuOpen(false)}>Sign Up</Link>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{ ...s.hero, padding: isMobile ? "60px 6% 56px" : "88px 6% 80px" }}>
        <p style={s.heroBadge}>vocabulary tracker</p>
        <h1 style={{ ...s.heroTitle, fontSize: isMobile ? 32 : "clamp(36px, 5.5vw, 56px)" }}>
          Every word you learn,{isMobile ? " " : <br />}
          <span style={s.heroAccent}>remembered forever.</span>
        </h1>
        <p style={{ ...s.heroSub, fontSize: isMobile ? 15 : 18 }}>
          Save words as you encounter them, get instant definitions, add personal notes,
          and build collections you can share with friends.
        </p>
        <CtaButtons />
        <p style={s.heroNote}>Free forever · No credit card required</p>
      </section>

      {/* ── Features ── */}
      <section style={s.section}>
        <h2 style={{ ...s.sectionTitle, fontSize: isMobile ? 22 : "clamp(24px, 4vw, 34px)" }}>
          Everything you need to grow your vocabulary
        </h2>
        <div style={{
          ...s.featureGrid,
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
        }}>
          {features.map(f => (
            <div key={f.title} style={s.featureCard}>
              <span style={s.featureIcon}>{f.icon}</span>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ ...s.section, background: "#111113", maxWidth: "100%", padding: "72px 6%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ ...s.sectionTitle, fontSize: isMobile ? 22 : "clamp(24px, 4vw, 34px)" }}>
            How it works
          </h2>
          <div style={{ ...s.steps, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
            {steps.map((step, i) => (
              <div key={step.n} style={{ ...s.stepWrap, flexDirection: isMobile ? "column" : "row" }}>
                <div style={s.step}>
                  <div style={s.stepNum}>{step.n}</div>
                  <h3 style={s.stepTitle}>{step.title}</h3>
                  <p style={s.stepDesc}>{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ ...s.stepArrow, transform: isMobile ? "rotate(90deg)" : "none" }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ ...s.ctaBanner, padding: isMobile ? "56px 6%" : "80px 6%" }}>
        <h2 style={{ ...s.ctaBannerTitle, fontSize: isMobile ? 22 : "clamp(24px, 4vw, 34px)" }}>
          Start building your lexicon today
        </h2>
        <CtaButtons />
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <span style={s.footerText}>Built by Yashwin · </span>
        <Link to="/register" style={s.footerLink}>Open WordVault →</Link>
      </footer>

    </div>
  );
}

const s = {
  page: {
    background: "#0e0e0f",
    color: "#f0ece3",
    fontFamily: "Georgia, serif",
    minHeight: "100vh",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 6%",
    borderBottom: "1px solid #1e1e20",
    position: "sticky",
    top: 0,
    background: "#0e0e0f",
    zIndex: 100,
  },
  navLogo: {
    fontFamily: "Georgia, serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#c9a96e",
  },
  navLogin: {
    color: "#8a8070",
    fontSize: 14,
    textDecoration: "none",
    padding: "8px 18px",
    border: "1px solid #2e2e30",
    borderRadius: 6,
  },
  navSignup: {
    color: "#0e0e0f",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    padding: "8px 18px",
    background: "#c9a96e",
    borderRadius: 6,
  },
  hamburger: {
    background: "transparent",
    border: "none",
    color: "#c9a96e",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
  },
  mobileMenu: {
    background: "#1a1a1c",
    borderBottom: "1px solid #2e2e30",
    display: "flex",
    flexDirection: "column",
    padding: "8px 6%",
  },
  mobileMenuLink: {
    color: "#f0ece3",
    textDecoration: "none",
    fontSize: 15,
    padding: "12px 0",
    borderBottom: "1px solid #2e2e30",
  },
  hero: {
    textAlign: "center",
    maxWidth: 760,
    margin: "0 auto",
  },
  heroBadge: {
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#c9a96e",
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "Georgia, serif",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#f0ece3",
    margin: "0 0 20px",
  },
  heroAccent: {
    color: "#c9a96e",
  },
  heroSub: {
    color: "#8a8070",
    lineHeight: 1.7,
    maxWidth: 540,
    margin: "0 auto 36px",
  },
  ctaRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  ctaGoogle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#1a1a1c",
    border: "1px solid #2e2e30",
    borderRadius: 8,
    color: "#f0ece3",
    fontSize: 15,
    fontWeight: 600,
    padding: "13px 24px",
    textDecoration: "none",
  },
  ctaEmail: {
    display: "flex",
    alignItems: "center",
    background: "#c9a96e",
    borderRadius: 8,
    color: "#0e0e0f",
    fontSize: 15,
    fontWeight: 600,
    padding: "13px 28px",
    textDecoration: "none",
  },
  heroNote: {
    color: "#3a3630",
    fontSize: 13,
    marginTop: 16,
  },
  section: {
    padding: "72px 6%",
    maxWidth: 1100,
    margin: "0 auto",
  },
  sectionTitle: {
    fontFamily: "Georgia, serif",
    color: "#f0ece3",
    textAlign: "center",
    marginBottom: 48,
    fontWeight: 700,
  },
  featureGrid: {
    display: "grid",
    gap: 20,
  },
  featureCard: {
    background: "#1a1a1c",
    border: "1px solid #2e2e30",
    borderRadius: 12,
    padding: "28px 24px",
  },
  featureIcon: {
    fontSize: 28,
    display: "block",
    marginBottom: 14,
  },
  featureTitle: {
    fontFamily: "Georgia, serif",
    fontSize: 17,
    color: "#f0ece3",
    margin: "0 0 10px",
    fontWeight: 700,
  },
  featureDesc: {
    fontSize: 14,
    color: "#8a8070",
    lineHeight: 1.7,
    margin: 0,
  },
  steps: {
    display: "flex",
    justifyContent: "center",
    gap: 0,
    flexWrap: "wrap",
  },
  stepWrap: {
    display: "flex",
    alignItems: "center",
  },
  step: {
    textAlign: "center",
    maxWidth: 220,
    padding: "0 20px 24px",
  },
  stepNum: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(201,169,110,0.12)",
    border: "1px solid rgba(201,169,110,0.3)",
    color: "#c9a96e",
    fontSize: 18,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  stepTitle: {
    fontFamily: "Georgia, serif",
    fontSize: 16,
    color: "#f0ece3",
    margin: "0 0 8px",
    fontWeight: 700,
  },
  stepDesc: {
    fontSize: 13,
    color: "#8a8070",
    lineHeight: 1.6,
    margin: 0,
  },
  stepArrow: {
    color: "#2e2e30",
    fontSize: 22,
    padding: "0 4px",
    marginBottom: 24,
    flexShrink: 0,
  },
  ctaBanner: {
    textAlign: "center",
    borderTop: "1px solid #1e1e20",
  },
  ctaBannerTitle: {
    fontFamily: "Georgia, serif",
    color: "#f0ece3",
    marginBottom: 36,
    fontWeight: 700,
  },
  footer: {
    borderTop: "1px solid #1e1e20",
    padding: "24px 6%",
    textAlign: "center",
  },
  footerText: {
    color: "#3a3630",
    fontSize: 13,
  },
  footerLink: {
    color: "#c9a96e",
    fontSize: 13,
    textDecoration: "none",
  },
};
