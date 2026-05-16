import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, saveUser, clearAuth, getUser } from './auth';
import { User } from './types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token,   setToken]   = useState<string | null>(null);
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getToken(), getUser()]).then(([t, u]) => {
      setToken(t);
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async (t: string, u: User) => {
    await saveToken(t);
    await saveUser(u);
    setToken(t);
    setUser(u);
  };

  const signOut = async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
