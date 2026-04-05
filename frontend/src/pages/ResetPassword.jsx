import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form,    setForm]    = useState({ password: "", confirm: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, form.password);
      navigate("/login?reset=1");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>WordVault</h1>
          <p style={styles.error}>Invalid reset link.</p>
          <p style={styles.link}><Link to="/forgot-password">Request a new one</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>WordVault</h1>
        <p style={styles.subtitle}>Choose a new password</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="New password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="password"
            name="confirm"
            placeholder="Confirm new password"
            value={form.confirm}
            onChange={handleChange}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p style={styles.link}>
          <Link to="/login">Back to login</Link>
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
  link: {
    color: "#8a8070",
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
};
