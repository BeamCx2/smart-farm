import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import ProductCard from '../components/products/ProductCard';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const productsRef = ref(rtdb, 'products');
        return onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                // กรองเฉพาะสินค้าที่สถานะเป็น active เท่านั้น
                setProducts(list.filter(p => p.status === 'active'));
            } else { setProducts([]); }
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-20 text-center animate-spin">🥗</div>;

    return (
        <div className="max-w-7xl mx-auto p-8">
            <h1 className="text-3xl font-black mb-10 uppercase tracking-tighter">🛍️ Shop All Products</h1>
            {products.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem]">ไม่มีสินค้าในฟาร์มขณะนี้</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            )}
        </div>
    );
}