import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateUsername, updatePassword, deleteAccount } from "../api";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // username
  const [username, setUsername]   = useState(user.username || "");
  const [unameMsg, setUnameMsg]   = useState("");
  const [unameErr, setUnameErr]   = useState("");
  const [unameLoading, setUL]     = useState(false);

  // password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [pwMsg,     setPwMsg]     = useState("");
  const [pwErr,     setPwErr]     = useState("");
  const [pwLoading, setPL]        = useState(false);

  // delete account
  const [delPw,      setDelPw]    = useState("");
  const [delErr,     setDelErr]   = useState("");
  const [delLoading, setDL]       = useState(false);

  const isGoogleUser = !user.password_hash; // Google OAuth users have no password

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setUL(true); setUnameErr(""); setUnameMsg("");
    try {
      const res = await updateUsername(username.trim());
      const updated = { ...user, username: res.data.user.username };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setUnameMsg("Username updated!");
    } catch (err) {
      setUnameErr(err.response?.data?.error || "Could not update username");
    }
    setUL(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { setPwErr("New password must be at least 6 characters"); return; }
    setPL(true); setPwErr(""); setPwMsg("");
    try {
      await updatePassword({ current_password: currentPw, new_password: newPw });
      setCurrentPw(""); setNewPw("");
      setPwMsg("Password updated!");
    } catch (err) {
      setPwErr(err.response?.data?.error || "Could not update password");
    }
    setPL(false);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDL(true); setDelErr("");
    try {
      await deleteAccount(isGoogleUser ? undefined : delPw);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (err) {
      setDelErr(err.response?.data?.error || "Could not delete account");
    }
    setDL(false);
  };

  return (
    <div style={s.page}>
      {/* Navbar */}
      <div style={s.navbar}>
        <Link to="/" style={{ textDecoration: "none" }}><span style={s.logo}>WordVault</span></Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/dashboard" style={s.backLink}>← Dashboard</Link>
          <span style={s.username}>{user.username}</span>
        </div>
      </div>

      <div style={{ ...s.container, padding: isMobile ? "24px 16px" : "48px 6%" }}>
        <h1 style={s.pageTitle}>Account Settings</h1>

        {/* ── Account Info ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Account Info</h2>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Member since</span>
            <span style={s.infoValue}>
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Last login</span>
            <span style={s.infoValue}>
              {user.last_login
                ? new Date(user.last_login).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                : "—"}
            </span>
          </div>
        </div>

        {/* ── Username ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Username</h2>
          <form onSubmit={handleUpdateUsername} style={s.form}>
            <input
              style={s.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            {unameErr && <p style={s.error}>{unameErr}</p>}
            {unameMsg && <p style={s.success}>{unameMsg}</p>}
            <button style={s.btn} type="submit" disabled={unameLoading}>
              {unameLoading ? "Saving..." : "Save username"}
            </button>
          </form>
        </div>

        {/* ── Password (email users only) ── */}
        {!isGoogleUser && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Change Password</h2>
            <form onSubmit={handleUpdatePassword} style={s.form}>
              <input
                style={s.input}
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required
              />
              <input
                style={s.input}
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
              />
              {pwErr && <p style={s.error}>{pwErr}</p>}
              {pwMsg && <p style={s.success}>{pwMsg}</p>}
              <button style={s.btn} type="submit" disabled={pwLoading}>
                {pwLoading ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        )}
        {isGoogleUser && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Password</h2>
            <p style={s.muted}>This account uses Google sign-in — no password to manage.</p>
          </div>
        )}

        {/* ── Danger zone ── */}
        <div style={{ ...s.card, borderColor: "#4a1a1a" }}>
          <h2 style={{ ...s.cardTitle, color: "#e07070" }}>Danger Zone</h2>
          <p style={s.muted}>
            Permanently deletes your account and all your words and collections.
            This cannot be undone.
          </p>
          <form onSubmit={handleDeleteAccount} style={s.form}>
            {!isGoogleUser && (
              <input
                style={s.input}
                type="password"
                placeholder="Enter your password to confirm"
                value={delPw}
                onChange={e => setDelPw(e.target.value)}
                required
              />
            )}
            {delErr && <p style={s.error}>{delErr}</p>}
            <button style={s.dangerBtn} type="submit" disabled={delLoading}>
              {delLoading ? "Deleting..." : "Delete my account"}
            </button>
          </form>
        </div>

        <p style={s.feedback}>
          Have feedback or need help?{" "}
          <a href="mailto:getwordvault@gmail.com" style={s.feedbackLink}>getwordvault@gmail.com</a>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "#0e0e0f", color: "#f0ece3", fontFamily: "Georgia, serif", animation: "wv-fadeIn 0.4s ease" },
  navbar:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid #2e2e30", background: "#1a1a1c" },
  logo:      { fontFamily: "Georgia, serif", fontSize: 20, color: "#c9a96e", fontWeight: 700 },
  backLink:  { color: "#8a8070", fontSize: 13, textDecoration: "none" },
  username:  { color: "#8a8070", fontSize: 14 },
  container: { maxWidth: 560, margin: "0 auto" },
  pageTitle: { fontFamily: "Georgia, serif", fontSize: 26, color: "#f0ece3", marginBottom: 32 },
  card:      { background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 12, padding: "28px 24px", marginBottom: 20 },
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 16, color: "#f0ece3", margin: "0 0 20px", fontWeight: 700 },
  form:      { display: "flex", flexDirection: "column", gap: 12 },
  input:     { background: "#0e0e0f", border: "1px solid #2e2e30", borderRadius: 6, color: "#f0ece3", fontSize: 14, padding: "10px 14px", outline: "none" },
  btn:       { background: "#c9a96e", border: "none", borderRadius: 6, color: "#0e0e0f", cursor: "pointer", fontSize: 14, fontWeight: 600, padding: "11px", alignSelf: "flex-start" },
  dangerBtn: { background: "transparent", border: "1px solid #e07070", borderRadius: 6, color: "#e07070", cursor: "pointer", fontSize: 14, fontWeight: 600, padding: "10px 20px", alignSelf: "flex-start" },
  error:     { color: "#e07070", fontSize: 12, margin: 0 },
  success:   { color: "#6ec97a", fontSize: 12, margin: 0 },
  muted:     { color: "#8a8070", fontSize: 14, lineHeight: 1.6, margin: 0 },
  feedback:  { color: "#3a3630", fontSize: 13, marginTop: 24, textAlign: "center" },
  feedbackLink: { color: "#5a5650", textDecoration: "none" },
  infoRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2e2e30" },
  infoLabel: { color: "#8a8070", fontSize: 13 },
  infoValue: { color: "#f0ece3", fontSize: 13 },
};
