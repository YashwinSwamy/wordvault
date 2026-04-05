import axios from "axios";

const API = axios.create({
  // baseURL: "http://127.0.0.1:5000/api",
  baseURL: "https://wordvault-backend-xl0w.onrender.com/api",
});

// automatically attach JWT token to every request if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register       = (data)             => API.post("/auth/register",       data);
export const login          = (data)             => API.post("/auth/login",           data);
export const getMe          = ()                 => API.get("/auth/me");
export const forgotPassword = (email)            => API.post("/auth/forgot-password", { email });
export const resetPassword  = (token, password)  => API.post("/auth/reset-password",  { token, password });
export const resendVerify   = ()                 => API.post("/auth/resend-verify");

// ── Words ─────────────────────────────────────────────────────────────────────
export const addWord     = (data)           => API.post("/words/", data);
export const listWords   = (collection_id)  => API.get("/words/", { params: { collection_id } });
export const deleteWord  = (word_id)        => API.delete(`/words/${word_id}`);
export const updateWord  = (word_id, data)  => API.patch(`/words/${word_id}`, data);
export const exportWords = (collection_id)  => API.get("/words/export", {
  params: { collection_id },
  responseType: "blob",
});
export const importWords = (collection_id, file) => {
  const form = new FormData();
  form.append("file", file);
  form.append("collection_id", collection_id);
  return API.post("/words/import", form);
};

// ── Collections ───────────────────────────────────────────────────────────────
export const createCollection = (data)                    => API.post("/collections/", data);
export const listCollections  = ()                        => API.get("/collections/");
export const inviteMember     = (collection_id, email)   => API.post(`/collections/${collection_id}/invite`, { email });
export const listMembers      = (collection_id)          => API.get(`/collections/${collection_id}/members`);
export const removeMember     = (collection_id, user_id) => API.delete(`/collections/${collection_id}/members/${user_id}`);
export const deleteCollection = (collection_id)          => API.delete(`/collections/${collection_id}`);

// ── Share links ───────────────────────────────────────────────────────────────
export const generateShareLink   = (collection_id, days) => API.post(`/share/${collection_id}/generate`, { expires_in_days: days || null });
export const revokeShareLink     = (collection_id)       => API.delete(`/share/${collection_id}/generate`);
export const getSharedCollection = (token)               => API.get(`/share/${token}`);

// ── Settings ──────────────────────────────────────────────────────────────────
export const updateUsername = (username) => API.patch("/settings/username", { username });
export const updatePassword = (data)    => API.patch("/settings/password", data);
export const deleteAccount  = (password) => API.delete("/settings/account", { data: { password } });
