import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token      = params.get("token");
    const user_id    = params.get("user");
    const username   = params.get("username");
    const email      = params.get("email");
    const isVerified = params.get("is_verified");
    const error      = params.get("error");

    if (error || !token) {
      navigate("/login?error=google_failed");
      return;
    }

    // save token and user to localStorage — same as regular login
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify({
      id: user_id,
      username,
      email,
      is_verified: isVerified === "true",
    }));

    navigate("/dashboard");
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.text}>Signing you in with Google...</p>
        <div style={styles.spinner}/>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  text: {
    color: "#8a8070",
    fontFamily: "Georgia, serif",
    fontSize: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "2px solid #2e2e30",
    borderTop: "2px solid #c9a96e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};