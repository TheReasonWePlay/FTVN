import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './toast.css';
import type { ToastMessage } from '../types/toast';

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    const handleClose = useCallback(() => {
        setIsHiding(true);
        setIsVisible(false);

        // Wait for animation to complete before removing
        setTimeout(() => {
            onCloseRef.current(toast.id);
        }, 300);
    }, [toast.id]);

    useEffect(() => {
        // Trigger show animation
        setIsVisible(true);

        // Set up auto-dismiss timer
        const timer = setTimeout(() => {
            handleClose();
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast.duration, handleClose]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            case 'info':
                return <Info size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getClassName = () => {
        let className = `toast toast-${toast.type}`;
        if (isVisible && !isHiding) {
            className += ' show';
        } else if (isHiding) {
            className += ' hide';
        }
        return className;
    };

    return (
        <div className={getClassName()}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
                className="toast-close"
                onClick={handleClose}
                aria-label="Fermer la notification"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
