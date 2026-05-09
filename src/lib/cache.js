/**
 * 🚀 Cache Utility - ลดการดึงข้อมูลจาก Firestore
 * 
 * ใช้ localStorage เพื่อเก็บข้อมูลไว้ชั่วคราว
 * และ refresh ตามเวลาที่กำหนด
 */

const CACHE_PREFIX = 'sf_cache_';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 นาที

/**
 * ตรวจสอบว่า cache ยังใช้งานได้หรือไม่
 */
export const isCacheValid = (cacheKey) => {
    try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
        if (!cached) return false;

        const { timestamp, data } = JSON.parse(cached);
        const now = Date.now();
        const isExpired = now - timestamp > DEFAULT_CACHE_TTL;

        if (isExpired) {
            localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
            return false;
        }

        return true;
    } catch {
        return false;
    }
};

/**
 * ดึงข้อมูลจาก cache
 */
export const getCache = (cacheKey) => {
    try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
        if (!cached) return null;

        const { data } = JSON.parse(cached);
        return data;
    } catch {
        return null;
    }
};

/**
 * เก็บข้อมูลใน cache
 */
export const setCache = (cacheKey, data) => {
    try {
        localStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (e) {
        console.warn('ไม่สามารถเก็บ cache:', e);
    }
};

/**
 * ล้าง cache ของ key ที่ระบุ
 */
export const clearCache = (cacheKey) => {
    localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
};

/**
 * ล้าง cache ทั้งหมด
 */
export const clearAllCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
};

/**
 * Hook สำหรับใช้ cache กับ Firestore query
 * 
 * @example
 * const { data, refresh } = useFirestoreCache('products', async () => {
 *     const q = query(collection(db, 'products'), where('status', '==', 'active'));
 *     const snap = await getDocs(q);
 *     return snap.docs.map(d => ({ id: d.id, ...d.data() }));
 * });
 */
export const useFirestoreCache = (cacheKey, fetchFn) => {
    // ดึงจาก cache ถ้ายังไม่หมดอายุ
    if (isCacheValid(cacheKey)) {
        return {
            data: getCache(cacheKey),
            refresh: async () => {
                const newData = await fetchFn();
                setCache(cacheKey, newData);
                return newData;
            }
        };
    }

    // Return null พร้อม refresh function
    return {
        data: null,
        refresh: async () => {
            const newData = await fetchFn();
            setCache(cacheKey, newData);
            return newData;
        }
    };
};
