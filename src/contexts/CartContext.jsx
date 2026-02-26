import { createContext, useContext, useEffect, useReducer } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'sf_cart';

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function cartReducer(state, action) {
    let next;
    switch (action.type) {
        case 'ADD': {
            const existing = state.find((i) => i.id === action.payload.id);
            if (existing) {
                next = state.map((i) =>
                    i.id === action.payload.id
                        ? { ...i, qty: Math.min(i.qty + (action.payload.qty || 1), action.payload.stock || 999) }
                        : i
                );
            } else {
                next = [...state, { ...action.payload, qty: action.payload.qty || 1 }];
            }
            break;
        }
        case 'REMOVE':
            next = state.filter((i) => i.id !== action.payload);
            break;
        case 'UPDATE_QTY':
            next = state.map((i) =>
                i.id === action.payload.id ? { ...i, qty: Math.max(1, action.payload.qty) } : i
            );
            break;
        case 'CLEAR':
            next = [];
            break;
        default:
            return state;
    }
    saveCart(next);
    return next;
}

export function CartProvider({ children }) {
    const [items, dispatch] = useReducer(cartReducer, [], loadCart);

    // Re-sync when storage changes in another tab
    useEffect(() => {
        const handler = (e) => {
            if (e.key === STORAGE_KEY) {
                dispatch({ type: 'CLEAR' });
                const loaded = loadCart();
                loaded.forEach((item) => dispatch({ type: 'ADD', payload: item }));
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    function addToCart(product, qty = 1) {
        dispatch({
            type: 'ADD',
            payload: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                stock: product.stock,
                qty,
            },
        });
    }

    function removeFromCart(id) {
        dispatch({ type: 'REMOVE', payload: id });
    }

    function updateQty(id, qty) {
        dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
    }

    function clearCart() {
        dispatch({ type: 'CLEAR' });
    }

    const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 1500 ? 0 : 100;
    const total = subtotal + shipping;

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, subtotal, shipping, total }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
