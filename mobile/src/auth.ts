import * as SecureStore from 'expo-secure-store';
import { User } from './types';

const TOKEN_KEY = 'wv_token';
const USER_KEY  = 'wv_user';

export const getToken  = ()              => SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = (t: string)     => SecureStore.setItemAsync(TOKEN_KEY, t);
export const clearAuth = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const getUser = async (): Promise<User | null> => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

export const saveUser = (user: User) =>
  SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
