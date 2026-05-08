import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
// 🚨 แก้บรรทัดนี้: ดึง rtdb มาแล้วตั้งชื่อเล่นว่า db (โค้ดข้างล่างจะได้ไม่ต้องแก้)
import { rtdb as db, isFirebaseConfigured } from '../lib/firebase';
import { CATEGORIES } from '../lib/utils';
import ProductCard from '../components/products/ProductCard';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const activeCategory = searchParams.get('category') || 'ทั้งหมด';

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setProducts([]);
            setLoading(false);
            return;
        }

        // เชื่อมต่อ Node 'products'
        const productsRef = ref(db, 'products');

        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const productList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                const sortedData = productList
                    .filter(p => p.status === 'active')
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setProducts(sortedData);
            } else {
                setProducts([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Database Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ... ส่วนที่เหลือของไฟล์ (filtered, setCategory, return JSX) ใช้ของเดิมได้เลยครับ ...