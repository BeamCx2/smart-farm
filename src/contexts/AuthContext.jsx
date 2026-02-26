import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (snap.exists()) {
                        setUserProfile(snap.data());
                    }
                } catch (e) {
                    console.warn('Could not fetch user profile:', e.message);
                    setUserProfile({ role: 'customer', name: firebaseUser.displayName || '' });
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    async function login(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    }

    async function register(name, email, password) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        try {
            await setDoc(doc(db, 'users', cred.user.uid), {
                name,
                email,
                role: 'customer',
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.warn('Could not save user profile to Firestore:', e.message);
        }
        setUserProfile({ name, email, role: 'customer' });
        return cred.user;
    }

    async function logout() {
        await signOut(auth);
    }

    const isAdmin = userProfile?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
