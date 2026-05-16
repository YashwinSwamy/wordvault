import axios from 'axios';
import { getToken } from './auth';

const API = axios.create({ baseURL: 'https://api.wordvault.in/api' });

API.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const register       = (data: object)                     => API.post('/auth/register', data);
export const login          = (data: object)                     => API.post('/auth/login', data);
export const getMe          = ()                                  => API.get('/auth/me');
export const forgotPassword = (email: string)                    => API.post('/auth/forgot-password', { email });
export const resetPassword  = (token: string, password: string)  => API.post('/auth/reset-password', { token, password });

// ── Words ─────────────────────────────────────────────────────────────────────
export const addWord    = (data: object)                          => API.post('/words/', data);
export const listWords  = (collection_id: number)                 => API.get('/words/', { params: { collection_id } });
export const deleteWord = (word_id: number)                       => API.delete(`/words/${word_id}`);
export const updateWord = (word_id: number, data: object)         => API.patch(`/words/${word_id}`, data);

// ── Collections ───────────────────────────────────────────────────────────────
export const createCollection = (data: object)                              => API.post('/collections/', data);
export const listCollections  = ()                                           => API.get('/collections/');
export const inviteMember     = (collection_id: number, email: string)      => API.post(`/collections/${collection_id}/invite`, { email });
export const listMembers      = (collection_id: number)                     => API.get(`/collections/${collection_id}/members`);
export const removeMember     = (collection_id: number, user_id: number)    => API.delete(`/collections/${collection_id}/members/${user_id}`);
export const deleteCollection = (collection_id: number)                     => API.delete(`/collections/${collection_id}`);

// ── Settings ──────────────────────────────────────────────────────────────────
export const updateUsername = (username: string) => API.patch('/settings/username', { username });
export const updatePassword = (data: object)     => API.patch('/settings/password', data);
export const deleteAccount  = (password: string) => API.delete('/settings/account', { data: { password } });
