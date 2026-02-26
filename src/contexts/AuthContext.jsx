// 1. นำเข้าตัวแปร auth จากไฟล์ firebase.js ของคุณ (เปลี่ยน path ให้ตรงกับโฟลเดอร์ของคุณ)
import { auth } from './firebase'; 
// 2. นำเข้าคำสั่งล็อกอินของ Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';

// ตัวอย่างฟังก์ชันตอนกดปุ่มล็อกอิน
const handleLogin = (email, password) => {
    
    // สังเกตตรงนี้ครับ! เราต้องใส่คำว่า auth ลงไปเป็นตัวแรกเสมอ
    signInWithEmailAndPassword(auth, email, password) 
        .then((userCredential) => {
            console.log("ล็อกอินสำเร็จ!");
        })
        .catch((error) => {
            console.error("เกิดข้อผิดพลาด:", error.message);
        });
}

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

