import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, createUserProfile, updateUserName } from '../services/firestore';

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
            // New user — create a placeholder profile and flag for name setup
            const placeholderName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
            await createUserProfile(firebaseUser.uid, {
              name: placeholderName,
              email: firebaseUser.email,
            });
            profile = await getUserProfile(firebaseUser.uid);
            // If this was a Google sign-in (no password provider), prompt for name
            const isGoogleOnly = firebaseUser.providerData.some(p => p.providerId === 'google.com')
              && !firebaseUser.providerData.some(p => p.providerId === 'password');
            if (isGoogleOnly) {
              setUser({ ...profile, id: firebaseUser.uid, needsNameSetup: true });
              setLoading(false);
              return;
            }
          }
          setUser({ ...profile, id: firebaseUser.uid });
        } catch (err) {
          console.error('Failed to load profile:', err);
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

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle profile creation and setUser
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const finishNameSetup = async (name) => {
    await updateUserName(user.id, name);
    setUser(prev => ({ ...prev, name, needsNameSetup: false }));
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, updateUser, finishNameSetup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
