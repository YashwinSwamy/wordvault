import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listWords, addWord, deleteWord, exportWords, listCollections, createCollection, inviteMember } from "../api";

export default function Dashboard() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem("user") || "{}");

  // ── State ────────────────────────────────────────────────────────────────────
  const [words,           setWords]           = useState([]);
  const [collections,     setCollections]     = useState({ owned: [], shared: [] });
  const [activeCollection, setActiveCollection] = useState(null);
  const [word,            setWord]            = useState("");
  const [notes,           setNotes]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [newColName,      setNewColName]       = useState("");
  const [inviteEmail,     setInviteEmail]     = useState("");
  const [inviteColId,     setInviteColId]     = useState(null);
  const [message,         setMessage]         = useState("");

  // ── On load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (activeCollection) fetchWords();
  }, [activeCollection]);

  // ── Fetch collections ────────────────────────────────────────────────────────
  const fetchCollections = async () => {
    try {
      const res = await listCollections();
      setCollections(res.data);
      // default to personal collection
      const personal = res.data.owned.find(c => c.name === "Personal");
      if (personal) setActiveCollection(personal);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  };

  // ── Fetch words ──────────────────────────────────────────────────────────────
  const fetchWords = async () => {
    try {
      const res = await listWords(activeCollection.id);
      setWords(res.data.words);
    } catch (err) {
      setError("Could not load words");
    }
  };

  // ── Add word ─────────────────────────────────────────────────────────────────
  const handleAddWord = async () => {
    if (!word.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await addWord({ word, notes, collection_id: activeCollection.id });
      setWords([res.data.word, ...words]);
      setWord("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not add word");
    }
    setLoading(false);
  };

  // ── Delete word ──────────────────────────────────────────────────────────────
  const handleDelete = async (word_id) => {
    try {
      await deleteWord(word_id);
      setWords(words.filter(w => w.id !== word_id));
    } catch (err) {
      setError("Could not delete word");
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await exportWords(activeCollection.id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", "wordvault.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Could not export");
    }
  };

  // ── Create collection ────────────────────────────────────────────────────────
  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    try {
      const res = await createCollection({ name: newColName, is_shared: true });
      setCollections(prev => ({ ...prev, owned: [...prev.owned, res.data.collection] }));
      setNewColName("");
      showMessage("Collection created!");
    } catch (err) {
      setError("Could not create collection");
    }
  };

  // ── Invite member ────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteColId) return;
    try {
      await inviteMember(inviteColId, inviteEmail);
      setInviteEmail("");
      showMessage("Member invited!");
    } catch (err) {
      setError(err.response?.data?.error || "Could not invite member");
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const allCollections = [...(collections.owned || []), ...(collections.shared || [])];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <span style={styles.logo}>WordVault</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={styles.username}>Hi, {user.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <p style={styles.sidebarLabel}>My Collections</p>
          {allCollections.map(c => (
            <div
              key={c.id}
              style={{
                ...styles.collectionItem,
                ...(activeCollection?.id === c.id ? styles.collectionActive : {})
              }}
              onClick={() => setActiveCollection(c)}
            >
              <span>{c.name}</span>
              {c.is_shared && <span style={styles.sharedBadge}>shared</span>}
            </div>
          ))}

          {/* Create collection */}
          <div style={styles.newColForm}>
            <input
              style={styles.sidebarInput}
              placeholder="New collection..."
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateCollection()}
            />
            <button style={styles.sidebarBtn} onClick={handleCreateCollection}>+</button>
          </div>

          {/* Invite to collection */}
          {collections.owned?.filter(c => c.is_shared).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={styles.sidebarLabel}>Invite to Collection</p>
              <select
                style={styles.sidebarInput}
                onChange={e => setInviteColId(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select collection</option>
                {collections.owned.filter(c => c.is_shared).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                style={{ ...styles.sidebarInput, marginTop: 6 }}
                placeholder="Friend's email..."
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <button style={{ ...styles.sidebarBtn, width: "100%", marginTop: 6 }} onClick={handleInvite}>
                Invite
              </button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={styles.main}>

          {/* Header */}
          <div style={styles.mainHeader}>
            <h2 style={styles.collectionTitle}>{activeCollection?.name}</h2>
            <button style={styles.exportBtn} onClick={handleExport} disabled={words.length === 0}>
              ↓ Export Excel
            </button>
          </div>

          {/* Add word form */}
          <div style={styles.addForm}>
            <input
              style={styles.wordInput}
              placeholder="Enter a word..."
              value={word}
              onChange={e => setWord(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddWord()}
              disabled={loading}
            />
            <input
              style={styles.notesInput}
              placeholder="Notes (optional)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddWord()}
              disabled={loading}
            />
            <button style={styles.addBtn} onClick={handleAddWord} disabled={loading || !word.trim()}>
              {loading ? "Looking up..." : "Add Word"}
            </button>
          </div>

          {/* Messages */}
          {error   && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          {/* Words table */}
          {words.length === 0 ? (
            <div style={styles.empty}>No words yet — add your first one above!</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Word", "Part of Speech", "Definition", "Example", "Notes", "Added", ""].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {words.map(w => (
                    <tr key={w.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#f0ece3" }}>{w.word}</td>
                      <td style={styles.td}>
                        <span style={styles.posBadge}>{w.part_of_speech}</span>
                      </td>
                      <td style={styles.td}>{w.definition}</td>
                      <td style={{ ...styles.td, fontStyle: "italic", color: "#7a7062" }}>{w.example || "—"}</td>
                      <td style={{ ...styles.td, color: "#5a5650" }}>{w.notes || "—"}</td>
                      <td style={{ ...styles.td, fontSize: 12, color: "#4a4640" }}>
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(w.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:       { minHeight: "100vh", background: "#0e0e0f", color: "#f0ece3", fontFamily: "Georgia, serif" },
  navbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid #2e2e30", background: "#1a1a1c" },
  logo:       { fontFamily: "Georgia, serif", fontSize: 20, color: "#c9a96e", fontWeight: 700 },
  username:   { color: "#8a8070", fontSize: 14 },
  logoutBtn:  { background: "transparent", border: "1px solid #2e2e30", borderRadius: 6, color: "#8a8070", cursor: "pointer", fontSize: 12, padding: "6px 14px" },
  body:       { display: "flex", minHeight: "calc(100vh - 57px)" },
  sidebar:    { width: 220, borderRight: "1px solid #2e2e30", padding: "24px 16px", background: "#161617", flexShrink: 0 },
  sidebarLabel: { fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4a4640", marginBottom: 10 },
  collectionItem: { padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#8a8070", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  collectionActive: { background: "#2e2e30", color: "#f0ece3" },
  sharedBadge: { fontSize: 9, background: "rgba(201,169,110,0.15)", color: "#c9a96e", padding: "2px 6px", borderRadius: 99, letterSpacing: 1 },
  newColForm: { display: "flex", gap: 6, marginTop: 16 },
  sidebarInput: { background: "#0e0e0f", border: "1px solid #2e2e30", borderRadius: 4, color: "#f0ece3", fontSize: 12, padding: "7px 10px", width: "100%", outline: "none" },
  sidebarBtn: { background: "#c9a96e", border: "none", borderRadius: 4, color: "#0e0e0f", cursor: "pointer", fontSize: 16, fontWeight: 700, padding: "6px 12px" },
  main:       { flex: 1, padding: "32px 40px", overflowX: "auto" },
  mainHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  collectionTitle: { fontFamily: "Georgia, serif", fontSize: 22, color: "#f0ece3", margin: 0 },
  exportBtn:  { background: "transparent", border: "1px solid #2e2e30", borderRadius: 4, color: "#8a8070", cursor: "pointer", fontFamily: "monospace", fontSize: 11, letterSpacing: 1, padding: "8px 16px" },
  addForm:    { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  wordInput:  { background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 6, color: "#f0ece3", fontSize: 16, padding: "10px 16px", outline: "none", width: 200 },
  notesInput: { background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 6, color: "#f0ece3", fontSize: 14, padding: "10px 16px", outline: "none", flex: 1 },
  addBtn:     { background: "#c9a96e", border: "none", borderRadius: 6, color: "#0e0e0f", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "10px 24px", whiteSpace: "nowrap" },
  error:      { color: "#e07070", fontSize: 13, marginBottom: 12 },
  success:    { color: "#6ec97a", fontSize: 13, marginBottom: 12 },
  empty:      { color: "#3a3630", fontStyle: "italic", fontSize: 18, textAlign: "center", padding: "60px 0" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4a4640", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #2e2e30" },
  tr:         { borderBottom: "1px solid #1e1e20" },
  td:         { fontSize: 14, color: "#c8c2b5", padding: "14px 12px", verticalAlign: "top", lineHeight: 1.5 },
  posBadge:   { fontFamily: "monospace", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#c9a96e", background: "rgba(201,169,110,0.1)", padding: "2px 7px", borderRadius: 99 },
  deleteBtn:  { background: "transparent", border: "none", color: "#3a3630", cursor: "pointer", fontSize: 14, padding: "2px 6px" },
};