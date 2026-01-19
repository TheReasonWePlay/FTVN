import React from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import './toast.css';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
