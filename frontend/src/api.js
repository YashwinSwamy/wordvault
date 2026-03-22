import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
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
export const register = (data) => API.post("/auth/register", data);
export const login    = (data) => API.post("/auth/login", data);
export const getMe    = ()     => API.get("/auth/me");

// ── Words ─────────────────────────────────────────────────────────────────────
export const addWord     = (data)           => API.post("/words/", data);
export const listWords   = (collection_id)  => API.get("/words/", { params: { collection_id } });
export const deleteWord  = (word_id)        => API.delete(`/words/${word_id}`);
export const exportWords = (collection_id)  => API.get("/words/export", {
  params: { collection_id },
  responseType: "blob", // tells axios to treat the response as a file
});

// ── Collections ───────────────────────────────────────────────────────────────
export const createCollection = (data)                         => API.post("/collections/", data);
export const listCollections  = ()                             => API.get("/collections/");
export const inviteMember     = (collection_id, email)        => API.post(`/collections/${collection_id}/invite`, { email });
export const listMembers      = (collection_id)               => API.get(`/collections/${collection_id}/members`);
export const removeMember     = (collection_id, user_id)      => API.delete(`/collections/${collection_id}/members/${user_id}`);
export const deleteCollection = (collection_id)               => API.delete(`/collections/${collection_id}`);
