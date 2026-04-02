import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, createUserProfile } from '../services/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            // Profile missing (e.g. created before Firestore was ready) — create it now
            await createUserProfile(firebaseUser.uid, {
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
            });
            profile = await getUserProfile(firebaseUser.uid);
          }
          setUser({ ...profile, id: firebaseUser.uid });
        } catch (err) {
          console.error('Failed to load profile:', err);
          // Last resort fallback
          try {
            await createUserProfile(firebaseUser.uid, {
              name: firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
            });
          } catch (_) { /* profile may already exist */ }
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email.split('@')[0],
            icon_color: '#22c55e',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(cred.user.uid);
    const userData = profile || { id: cred.user.uid, email, name: '', icon_color: '#22c55e' };
    setUser({ ...userData, id: cred.user.uid });
  };

  const register = async (email, name, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(cred.user.uid, { name, email });
    const userData = { id: cred.user.uid, email, name, icon_color: '#22c55e' };
    setUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
