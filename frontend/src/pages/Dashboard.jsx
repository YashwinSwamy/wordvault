import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  listWords, addWord, deleteWord, updateWord, exportWords, importWords,
  listCollections, createCollection, inviteMember, resendVerify,
  generateShareLink, revokeShareLink,
} from "../api";

export default function Dashboard() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const user      = JSON.parse(localStorage.getItem("user") || "{}");

  // ── State ────────────────────────────────────────────────────────────────────
  const [words,            setWords]            = useState([]);
  const [collections,      setCollections]      = useState({ owned: [], shared: [] });
  const [activeCollection, setActiveCollection] = useState(null);
  const [word,             setWord]             = useState("");
  const [notes,            setNotes]            = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [warning,          setWarning]          = useState("");
  const [newColName,       setNewColName]        = useState("");
  const [inviteEmail,      setInviteEmail]      = useState("");
  const [inviteColId,      setInviteColId]      = useState(null);
  const [message,          setMessage]          = useState("");
  const [isMobile,         setIsMobile]         = useState(window.innerWidth < 768);
  const [sidebarOpen,      setSidebarOpen]      = useState(window.innerWidth >= 768);
  const [verifyMsg,        setVerifyMsg]        = useState("");

  // search
  const [searchQuery,      setSearchQuery]      = useState("");

  // inline edit
  const [editingId,        setEditingId]        = useState(null);
  const [editedNotes,      setEditedNotes]      = useState("");

  // flashcard
  const [flashcardMode,    setFlashcardMode]    = useState(false);
  const [flashIndex,       setFlashIndex]       = useState(0);
  const [flashFlipped,     setFlashFlipped]     = useState(false);

  // slide-in animation for newly added word
  const [newlyAddedId,     setNewlyAddedId]     = useState(null);

  // share link
  const [shareToken,       setShareToken]       = useState(null);
  const [shareCopied,      setShareCopied]      = useState(false);

  // ── On load ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchCollections(); }, []);

  useEffect(() => {
    if (activeCollection) {
      fetchWords();
      setShareToken(activeCollection.share_token || null);
      setSearchQuery("");
      setFlashcardMode(false);
    }
  }, [activeCollection]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchCollections = async () => {
    try {
      const res = await listCollections();
      setCollections(res.data);
      const personal = res.data.owned.find(c => c.name === "Personal");
      if (personal) setActiveCollection(personal);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  };

  const fetchWords = async () => {
    try {
      const res = await listWords(activeCollection.id);
      setWords(res.data.words);
    } catch {
      setError("Could not load words");
    }
  };

  // ── Add word ─────────────────────────────────────────────────────────────────
  const handleAddWord = async () => {
    if (!word.trim()) return;
    setLoading(true);
    setError("");
    setWarning("");
    try {
      const res = await addWord({ word, notes, collection_id: activeCollection.id });
      const newWord = res.data.word;
      setWords(prev => [newWord, ...prev]);
      setNewlyAddedId(newWord.id);
      setTimeout(() => setNewlyAddedId(null), 400);
      setWord("");
      setNotes("");
      if (res.data.definition_found === false) {
        showWarning("Word added, but no definition was found. You can update it later.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not add word");
    }
    setLoading(false);
  };

  // ── Delete word ──────────────────────────────────────────────────────────────
  const handleDelete = async (word_id) => {
    try {
      await deleteWord(word_id);
      setWords(prev => prev.filter(w => w.id !== word_id));
    } catch {
      setError("Could not delete word");
    }
  };

  // ── Inline notes edit ─────────────────────────────────────────────────────────
  const handleEditNotes = async (word_id) => {
    try {
      const res = await updateWord(word_id, { notes: editedNotes });
      setWords(prev => prev.map(w => w.id === word_id ? res.data.word : w));
      setEditingId(null);
    } catch {
      setError("Could not update notes");
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await exportWords(activeCollection.id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${activeCollection.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Could not export");
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    try {
      const res = await importWords(activeCollection.id, file);
      await fetchWords();
      showMessage(`Imported ${res.data.imported} word${res.data.imported !== 1 ? "s" : ""}${res.data.skipped ? `, skipped ${res.data.skipped}` : ""}`);
    } catch (err) {
      setError(err.response?.data?.error || "Import failed");
    }
  };

  // ── Collections ───────────────────────────────────────────────────────────────
  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    try {
      const res = await createCollection({ name: newColName, is_shared: true });
      setCollections(prev => ({ ...prev, owned: [...prev.owned, res.data.collection] }));
      setNewColName("");
      showMessage("Collection created!");
    } catch {
      setError("Could not create collection");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteColId) return;
    try {
      await inviteMember(inviteColId, inviteEmail);
      setInviteEmail("");
      showMessage("Invite sent!");
    } catch (err) {
      setError(err.response?.data?.error || "Could not invite member");
    }
  };

  // ── Share link ────────────────────────────────────────────────────────────────
  const handleGenerateShare = async () => {
    try {
      const res = await generateShareLink(activeCollection.id, null);
      const token = res.data.share_token;
      setShareToken(token);
      setCollections(prev => ({
        ...prev,
        owned: prev.owned.map(c => c.id === activeCollection.id ? { ...c, share_token: token } : c),
      }));
    } catch {
      setError("Could not generate share link");
    }
  };

  const handleRevokeShare = async () => {
    try {
      await revokeShareLink(activeCollection.id);
      setShareToken(null);
      setCollections(prev => ({
        ...prev,
        owned: prev.owned.map(c => c.id === activeCollection.id ? { ...c, share_token: null } : c),
      }));
    } catch {
      setError("Could not revoke link");
    }
  };

  const handleCopyShare = () => {
    const url = `${window.location.origin}/c/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const showWarning = (msg) => {
    setWarning(msg);
    setTimeout(() => setWarning(""), 5000);
  };

  const handleResendVerify = async () => {
    try {
      await resendVerify();
      setVerifyMsg("Verification email sent — check your inbox.");
    } catch {
      setVerifyMsg("Could not send email. Try again later.");
    }
  };

  // ── Computed ──────────────────────────────────────────────────────────────────
  const allCollections = [...(collections.owned || []), ...(collections.shared || [])];
  const isOwned = collections.owned?.some(c => c.id === activeCollection?.id);

  const filteredWords = searchQuery.trim()
    ? words.filter(w =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.definition || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : words;

  // ── Flashcard subrender ───────────────────────────────────────────────────────
  const flashWord = filteredWords[flashIndex];

  // ── Sidebar style ─────────────────────────────────────────────────────────────
  const sidebarStyle = isMobile
    ? { ...styles.sidebar, position: "fixed", top: 0, left: 0, height: "100vh",
        zIndex: 200, width: 260,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s ease" }
    : { ...styles.sidebar,
        width: sidebarOpen ? 220 : 0,
        padding: sidebarOpen ? "24px 16px" : 0,
        overflow: "hidden",
        transition: "width 0.2s ease, padding 0.2s ease" };

  const mainStyle    = isMobile ? { ...styles.main, padding: "20px 16px" } : styles.main;
  const addFormStyle = isMobile ? { ...styles.addForm, flexDirection: "column" } : styles.addForm;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button style={styles.hamburger} onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <span style={styles.logo}>WordVault</span>
        </div>
        {!isMobile && <span style={styles.username}>Hi, {user.username}</span>}
      </div>

      {/* Email verification banner */}
      {user.is_verified === false && (
        <div style={styles.verifyBanner}>
          <span>Please verify your email — check your inbox for a link.</span>
          <button style={styles.verifyBtn} onClick={handleResendVerify}>Resend</button>
          {verifyMsg && <span style={{ marginLeft: 12, fontSize: 12, color: "#6ec97a" }}>{verifyMsg}</span>}
        </div>
      )}

      <div style={styles.body}>

        {/* Mobile backdrop */}
        {isMobile && sidebarOpen && (
          <div style={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div style={sidebarStyle}>

          {/* Mobile header row — ✕ button */}
          {isMobile && (
            <div style={styles.sidebarHeader}>
              <button style={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
          )}

          {/* Scrollable content */}
          <div style={styles.sidebarScroll}>
            <p style={styles.sidebarLabel}>My Collections</p>
            {allCollections.map(c => (
              <div
                key={c.id}
                style={{
                  ...styles.collectionItem,
                  ...(activeCollection?.id === c.id ? styles.collectionActive : {})
                }}
                onClick={() => { setActiveCollection(c); if (isMobile) setSidebarOpen(false); }}
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

            {/* Share link (owned collections only) */}
            {isOwned && (
              <div style={{ marginTop: 24 }}>
                <p style={styles.sidebarLabel}>Share Link</p>
                {shareToken ? (
                  <div>
                    <button style={{ ...styles.sidebarBtn, width: "100%", marginBottom: 6, fontSize: 12 }} onClick={handleCopyShare}>
                      {shareCopied ? "Copied!" : "Copy link"}
                    </button>
                    <button style={styles.revokeLinkBtn} onClick={handleRevokeShare}>Revoke</button>
                  </div>
                ) : (
                  <button style={{ ...styles.sidebarBtn, width: "100%", fontSize: 12 }} onClick={handleGenerateShare}>
                    Generate link
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pinned bottom: Settings + Logout */}
          <div style={styles.sidebarBottom}>
            <Link to="/settings" style={styles.sidebarBottomLink}>Settings</Link>
            <button style={styles.sidebarBottomBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Main content */}
        <div style={mainStyle}>

          {/* Header */}
          <div style={styles.mainHeader}>
            <h2 style={styles.collectionTitle}>{activeCollection?.name}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filteredWords.length > 0 && (
                <button
                  style={styles.headerBtn}
                  onClick={() => { setFlashcardMode(m => !m); setFlashIndex(0); setFlashFlipped(false); }}
                >
                  {flashcardMode ? "✕ Exit" : "🃏 Flashcards"}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <button style={styles.headerBtn} onClick={() => fileRef.current?.click()}>
                ↑ Import
              </button>
              <button style={styles.headerBtn} onClick={handleExport} disabled={words.length === 0}>
                ↓ Export
              </button>
            </div>
          </div>

          {/* Add word form */}
          {!flashcardMode && (
            <div style={addFormStyle}>
              <input
                style={{ ...styles.wordInput, ...(isMobile ? { width: "100%", boxSizing: "border-box" } : {}) }}
                placeholder="Enter a word..."
                value={word}
                onChange={e => setWord(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddWord()}
                disabled={loading}
              />
              <input
                style={{ ...styles.notesInput, ...(isMobile ? { width: "100%", boxSizing: "border-box" } : {}) }}
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
          )}

          {/* Search */}
          {!flashcardMode && words.length > 0 && (
            <input
              style={styles.searchInput}
              placeholder="Search words, definitions, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          )}

          {/* Messages */}
          {error   && <p style={styles.error}>{error}</p>}
          {warning && <p style={styles.warning}>{warning}</p>}
          {message && <p style={styles.success}>{message}</p>}

          {/* Flashcard mode */}
          {flashcardMode && filteredWords.length > 0 && flashWord && (
            <div style={styles.flashWrap}>
              <div
                style={{
                  ...styles.flashCard,
                  transform: flashFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                onClick={() => setFlashFlipped(f => !f)}
              >
                {/* Front */}
                <div style={styles.flashFront}>
                  <div style={styles.flashWord}>{flashWord.word}</div>
                  {flashWord.part_of_speech && (
                    <span style={styles.posBadge}>{flashWord.part_of_speech}</span>
                  )}
                  <p style={styles.flashHint}>tap to reveal</p>
                </div>
                {/* Back */}
                <div style={styles.flashBack}>
                  <div style={styles.flashDef}>{flashWord.definition}</div>
                  {flashWord.example && (
                    <div style={styles.flashEx}>"{flashWord.example}"</div>
                  )}
                  {flashWord.notes && (
                    <div style={styles.flashNotes}>{flashWord.notes}</div>
                  )}
                </div>
              </div>
              <div style={styles.flashControls}>
                <button
                  style={styles.flashBtn}
                  disabled={flashIndex === 0}
                  onClick={() => { setFlashIndex(i => i - 1); setFlashFlipped(false); }}
                >← Prev</button>
                <span style={styles.flashCounter}>{flashIndex + 1} / {filteredWords.length}</span>
                <button
                  style={styles.flashBtn}
                  disabled={flashIndex === filteredWords.length - 1}
                  onClick={() => { setFlashIndex(i => i + 1); setFlashFlipped(false); }}
                >Next →</button>
              </div>
            </div>
          )}

          {/* Words list */}
          {!flashcardMode && (
            filteredWords.length === 0 ? (
              <div style={styles.empty}>
                {words.length === 0 ? "No words yet — add your first one above!" : "No words match your search."}
              </div>
            ) : isMobile ? (
              /* Mobile: card layout */
              <div>
                {filteredWords.map(w => (
                  <div key={w.id} className="wv-hover-lift" style={{
                    ...styles.mobileCard,
                    ...(w.id === newlyAddedId ? { animation: "wv-slideIn 0.3s ease" } : {}),
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.mobileWord}>
                          {w.word}
                          {w.part_of_speech && <span style={{ ...styles.posBadge, marginLeft: 8 }}>{w.part_of_speech}</span>}
                        </div>
                        <div style={styles.mobileDef}>{w.definition}</div>
                        {w.example && <div style={styles.mobileEx}>{w.example}</div>}
                        {editingId === w.id ? (
                          <div style={{ marginTop: 8 }}>
                            <textarea
                              style={styles.notesTextarea}
                              value={editedNotes}
                              onChange={e => setEditedNotes(e.target.value)}
                              rows={2}
                              autoFocus
                            />
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              <button style={styles.saveNotesBtn} onClick={() => handleEditNotes(w.id)}>Save</button>
                              <button style={styles.cancelNotesBtn} onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          w.notes && <div style={styles.mobileNotes}>{w.notes}</div>
                        )}
                      </div>
                      <button style={styles.mobileDeleteBtn} onClick={() => handleDelete(w.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: full table */
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
                    {filteredWords.map(w => (
                      <tr key={w.id} style={{
                        ...styles.tr,
                        ...(w.id === newlyAddedId ? { animation: "wv-slideIn 0.3s ease" } : {}),
                      }}>
                        <td style={{ ...styles.td, fontWeight: 600, color: "#f0ece3" }}>{w.word}</td>
                        <td style={styles.td}>
                          <span style={styles.posBadge}>{w.part_of_speech}</span>
                        </td>
                        <td style={styles.td}>{w.definition}</td>
                        <td style={{ ...styles.td, fontStyle: "italic", color: "#7a7062" }}>{w.example || "—"}</td>
                        <td style={{ ...styles.td, color: "#5a5650", minWidth: 140 }}>
                          {editingId === w.id ? (
                            <div>
                              <textarea
                                style={styles.notesTextarea}
                                value={editedNotes}
                                onChange={e => setEditedNotes(e.target.value)}
                                rows={2}
                                autoFocus
                              />
                              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                <button style={styles.saveNotesBtn} onClick={() => handleEditNotes(w.id)}>Save</button>
                                <button style={styles.cancelNotesBtn} onClick={() => setEditingId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <span
                              style={{ cursor: "pointer" }}
                              title="Click to edit notes"
                              onClick={() => { setEditingId(w.id); setEditedNotes(w.notes || ""); }}
                            >
                              {w.notes || <span style={{ color: "#3a3630" }}>✎ add note</span>}
                            </span>
                          )}
                        </td>
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
            )
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:       { minHeight: "100vh", background: "#0e0e0f", color: "#f0ece3", fontFamily: "Georgia, serif", animation: "wv-fadeIn 0.4s ease" },
  navbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid #2e2e30", background: "#1a1a1c" },
  logo:       { fontFamily: "Georgia, serif", fontSize: 20, color: "#c9a96e", fontWeight: 700 },
  username:   { color: "#8a8070", fontSize: 14 },
  settingsLink: { color: "#8a8070", fontSize: 13, textDecoration: "none", padding: "6px 14px", border: "1px solid #2e2e30", borderRadius: 6 },
  logoutBtn:  { background: "transparent", border: "1px solid #2e2e30", borderRadius: 6, color: "#8a8070", cursor: "pointer", fontSize: 12, padding: "6px 14px" },
  hamburger:  { background: "transparent", border: "none", color: "#c9a96e", fontSize: 22, cursor: "pointer", padding: "0 12px 0 0", lineHeight: 1 },
  body:       { display: "flex", minHeight: "calc(100vh - 57px)" },
  sidebarBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 },
  sidebar:    { width: 220, borderRight: "1px solid #2e2e30", padding: "24px 16px", background: "#161617", flexShrink: 0, display: "flex", flexDirection: "column" },
  sidebarHeader: { display: "flex", justifyContent: "flex-end", marginBottom: 8 },
  sidebarScroll: { flex: 1, overflowY: "auto", minHeight: 0 },
  sidebarBottom: { paddingTop: 16, borderTop: "1px solid #2e2e30", display: "flex", flexDirection: "column", gap: 6 },
  sidebarBottomLink: { color: "#8a8070", fontSize: 13, textDecoration: "none", padding: "8px 12px", borderRadius: 6, display: "block" },
  sidebarBottomBtn: { background: "transparent", border: "none", color: "#8a8070", cursor: "pointer", fontSize: 13, padding: "8px 12px", borderRadius: 6, textAlign: "left" },
  sidebarClose: { background: "transparent", border: "none", color: "#8a8070", fontSize: 18, cursor: "pointer", padding: "0 4px" },
  sidebarLabel: { fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4a4640", marginBottom: 10, marginTop: 0 },
  collectionItem: { padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#8a8070", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  collectionActive: { background: "#2e2e30", color: "#f0ece3" },
  sharedBadge: { fontSize: 9, background: "rgba(201,169,110,0.15)", color: "#c9a96e", padding: "2px 6px", borderRadius: 99, letterSpacing: 1 },
  newColForm: { display: "flex", gap: 6, marginTop: 16 },
  sidebarInput: { background: "#0e0e0f", border: "1px solid #2e2e30", borderRadius: 4, color: "#f0ece3", fontSize: 12, padding: "7px 10px", width: "100%", outline: "none" },
  sidebarBtn: { background: "#c9a96e", border: "none", borderRadius: 4, color: "#0e0e0f", cursor: "pointer", fontSize: 16, fontWeight: 700, padding: "6px 12px" },
  revokeLinkBtn: { background: "transparent", border: "1px solid #4a1a1a", borderRadius: 4, color: "#e07070", cursor: "pointer", fontSize: 11, padding: "5px 10px", width: "100%" },
  main:       { flex: 1, padding: "32px 40px", overflowX: "auto" },
  mainHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  collectionTitle: { fontFamily: "Georgia, serif", fontSize: 22, color: "#f0ece3", margin: 0 },
  headerBtn:  { background: "transparent", border: "1px solid #2e2e30", borderRadius: 4, color: "#8a8070", cursor: "pointer", fontFamily: "monospace", fontSize: 11, letterSpacing: 1, padding: "8px 14px" },
  addForm:    { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  wordInput:  { background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 6, color: "#f0ece3", fontSize: 16, padding: "10px 16px", outline: "none", width: 200 },
  notesInput: { background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 6, color: "#f0ece3", fontSize: 14, padding: "10px 16px", outline: "none", flex: 1 },
  addBtn:     { background: "#c9a96e", border: "none", borderRadius: 6, color: "#0e0e0f", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "10px 24px", whiteSpace: "nowrap" },
  searchInput: { background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 6, color: "#f0ece3", fontSize: 13, padding: "9px 14px", outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 16 },
  error:      { color: "#e07070", fontSize: 13, marginBottom: 12 },
  warning:    { color: "#c9a96e", fontSize: 13, marginBottom: 12 },
  success:    { color: "#6ec97a", fontSize: 13, marginBottom: 12 },
  empty:      { color: "#3a3630", fontStyle: "italic", fontSize: 18, textAlign: "center", padding: "60px 0" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4a4640", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #2e2e30" },
  tr:         { borderBottom: "1px solid #1e1e20" },
  td:         { fontSize: 14, color: "#c8c2b5", padding: "14px 12px", verticalAlign: "top", lineHeight: 1.5 },
  posBadge:   { fontFamily: "monospace", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#c9a96e", background: "rgba(201,169,110,0.1)", padding: "2px 7px", borderRadius: 99 },
  deleteBtn:  { background: "transparent", border: "none", color: "#3a3630", cursor: "pointer", fontSize: 14, padding: "2px 6px" },
  notesTextarea: { background: "#0e0e0f", border: "1px solid #2e2e30", borderRadius: 4, color: "#f0ece3", fontSize: 12, padding: "6px 10px", outline: "none", width: "100%", resize: "vertical", fontFamily: "Georgia, serif" },
  saveNotesBtn: { background: "#c9a96e", border: "none", borderRadius: 4, color: "#0e0e0f", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "4px 12px" },
  cancelNotesBtn: { background: "transparent", border: "1px solid #2e2e30", borderRadius: 4, color: "#8a8070", cursor: "pointer", fontSize: 11, padding: "4px 10px" },
  mobileCard: { padding: "14px 0", borderBottom: "1px solid #1e1e20" },
  mobileWord: { fontWeight: 600, fontSize: 15, color: "#f0ece3", marginBottom: 6, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 },
  mobileDef:  { fontSize: 13, color: "#c8c2b5", lineHeight: 1.6 },
  mobileEx:   { fontSize: 12, color: "#7a7062", fontStyle: "italic", marginTop: 4 },
  mobileNotes: { fontSize: 12, color: "#5a5650", marginTop: 6 },
  mobileDeleteBtn: { background: "transparent", border: "none", color: "#4a4640", cursor: "pointer", fontSize: 16, padding: "0 0 0 12px", flexShrink: 0 },
  verifyBanner: { background: "rgba(201,169,110,0.1)", borderBottom: "1px solid rgba(201,169,110,0.2)", color: "#c9a96e", fontSize: 13, padding: "10px 32px", display: "flex", alignItems: "center", gap: 12 },
  verifyBtn:    { background: "transparent", border: "1px solid #c9a96e", borderRadius: 4, color: "#c9a96e", cursor: "pointer", fontSize: 12, padding: "4px 12px" },
  // flashcard
  flashWrap:    { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" },
  flashCard:    { width: "min(480px, 100%)", height: 260, cursor: "pointer", transformStyle: "preserve-3d", transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)", position: "relative" },
  flashFront:   { position: "absolute", inset: 0, background: "#1a1a1c", border: "1px solid #2e2e30", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, backfaceVisibility: "hidden" },
  flashBack:    { position: "absolute", inset: 0, background: "#1a1a1c", border: "1px solid #c9a96e40", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, backfaceVisibility: "hidden", transform: "rotateY(180deg)", overflowY: "auto" },
  flashWord:    { fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 700, color: "#f0ece3", marginBottom: 12, textAlign: "center" },
  flashHint:    { color: "#4a4640", fontSize: 12, marginTop: 16, fontStyle: "italic" },
  flashDef:     { fontSize: 15, color: "#c8c2b5", lineHeight: 1.6, textAlign: "center", marginBottom: 12 },
  flashEx:      { fontSize: 13, color: "#7a7062", fontStyle: "italic", textAlign: "center", marginBottom: 8 },
  flashNotes:   { fontSize: 12, color: "#5a5650", textAlign: "center" },
  flashControls: { display: "flex", alignItems: "center", gap: 24, marginTop: 28 },
  flashBtn:     { background: "transparent", border: "1px solid #2e2e30", borderRadius: 6, color: "#8a8070", cursor: "pointer", fontSize: 13, padding: "8px 20px" },
  flashCounter: { color: "#4a4640", fontSize: 13, fontFamily: "monospace" },
};
