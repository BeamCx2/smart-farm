import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function AuthRedirectHandler() {
    const { redirectError, clearRedirectError } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        if (redirectError) {
            addToast(redirectError, 'error');
            clearRedirectError();
        }
    }, [redirectError, addToast, clearRedirectError]);

    return null;
}
