import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";

const BACKEND_URL = "https://wordvault-backend-xl0w.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>WordVault</h1>
        <p style={styles.subtitle}>Welcome back</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Google sign-in temporarily hidden
        <div style={styles.divider}>
          <div style={styles.dividerLine}/>
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine}/>
        </div>
        <a href={`${BACKEND_URL}/api/auth/google`} style={styles.googleBtn}>
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="Google"/>
          Continue with Google
        </a>
        */}

        <p style={styles.link}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0e0e0f",
  },
  card: {
    background: "#1a1a1c",
    border: "1px solid #2e2e30",
    borderRadius: 12,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontFamily: "Georgia, serif",
    fontSize: 28,
    color: "#f0ece3",
    margin: "0 0 4px 0",
    textAlign: "center",
  },
  subtitle: {
    color: "#8a8070",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    background: "#0e0e0f",
    border: "1px solid #2e2e30",
    borderRadius: 6,
    color: "#f0ece3",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
  },
  button: {
    background: "#c9a96e",
    border: "none",
    borderRadius: 6,
    color: "#0e0e0f",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    padding: "11px",
    marginTop: 4,
  },
  error: {
    color: "#e07070",
    fontSize: 12,
    margin: 0,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "20px 0 12px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#2e2e30",
  },
  dividerText: {
    color: "#4a4640",
    fontSize: 12,
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#0e0e0f",
    border: "1px solid #2e2e30",
    borderRadius: 6,
    color: "#f0ece3",
    fontSize: 14,
    padding: "10px",
    cursor: "pointer",
    textDecoration: "none",
    marginBottom: 4,
  },
  link: {
    color: "#8a8070",
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
};
