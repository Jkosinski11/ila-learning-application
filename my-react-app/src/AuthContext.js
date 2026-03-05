import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(profileRef);
        setProfile(snap.exists() ? snap.data() : null);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    try {
      const profileRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(profileRef);
      setProfile(snap.exists() ? snap.data() : null);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      setProfile(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, logout, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
