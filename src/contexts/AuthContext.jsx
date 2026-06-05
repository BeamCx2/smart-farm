import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [redirectError, setRedirectError] = useState(null);

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

    // Handle redirect result when using signInWithRedirect
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const result = await getRedirectResult(auth);
                if (!mounted) return;
                if (result && result.user) {
                    // Save profile if needed
                    await handlePostSignIn(result.user);
                }
            } catch (err) {
                if (!mounted) return;
                // Map common auth errors to user-friendly messages
                const code = err?.code || '';
                let message = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google';
                if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
                    message = 'ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว';
                } else if (code === 'auth/user-disabled') {
                    message = 'บัญชีนี้ถูกปิดใช้งาน';
                } else if (code === 'auth/popup-closed-by-user') {
                    message = 'คุณปิดหน้าต่างยืนยันก่อนจะเสร็จ';
                } else if (code === 'auth/cancelled-popup-request') {
                    message = 'คำขอถูกยกเลิก กรุณาลองอีกครั้ง';
                }
                setRedirectError(message + (err.message ? (': ' + err.message) : ''));
            }
        })();

        return () => { mounted = false; };
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

    // By default use redirect flow to avoid popup blockers; pass { forceRedirect: false }
    // to attempt popup first.
    async function googleLogin(options = {}) {
        const { forceRedirect = true } = options || {};
        const provider = new GoogleAuthProvider();
        // If caller requests redirect explicitly, do it immediately.
        if (forceRedirect) {
            await signInWithRedirect(auth, provider);
            return;
        }

        try {
            const cred = await signInWithPopup(auth, provider);
            const user = cred.user;

            if (!user) {
                throw new Error('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ในขณะนี้');
            }

            // proceed with profile save below
            return await handlePostSignIn(user);
        } catch (err) {
            // If popup is blocked or environment doesn't support popup, fallback to redirect
            const fallbackCodes = [
                'auth/popup-blocked',
                'auth/operation-not-supported-in-this-environment',
                'auth/cancelled-popup-request',
            ];
            if (fallbackCodes.includes(err.code)) {
                // start redirect flow — this will navigate away
                await signInWithRedirect(auth, provider);
                return;
            }
            // rethrow other errors
            throw err;
        }
    }

    // Extracted helper to save user profile after sign-in
    async function handlePostSignIn(user) {
        const userDoc = doc(db, 'users', user.uid);
        const snap = await getDoc(userDoc);

        const profileData = {
            name: user.displayName || '',
            email: user.email || '',
            role: 'customer',
            photoURL: user.photoURL || '',
            updatedAt: serverTimestamp(),
        };

        try {
            if (!snap.exists()) {
                await setDoc(userDoc, {
                    ...profileData,
                    createdAt: serverTimestamp(),
                });
            } else {
                await setDoc(userDoc, profileData, { merge: true });
            }
        } catch (e) {
            console.warn('Could not save Google user profile to Firestore:', e.message);
        }

        setUserProfile(profileData);
        return user;
    }

    function clearRedirectError() {
        setRedirectError(null);
    }

    async function logout() {
        await signOut(auth);
    }

    const isAdmin = userProfile?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, login, googleLogin, register, logout, isAdmin, redirectError, clearRedirectError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
