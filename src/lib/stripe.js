import { loadStripe } from '@stripe/stripe-js';

let stripePromise = null;

export function getStripe() {
    if (!stripePromise) {
        const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (key) {
            stripePromise = loadStripe(key);
        }
    }
    return stripePromise;
}
