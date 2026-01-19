import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import '../styles/dialog.css';

export type DialogType = 'success' | 'error';

interface DialogProps {
  type: DialogType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideDelay?: number; // Optional auto-hide after delay in milliseconds
}

const Dialog: React.FC<DialogProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoHideDelay = 0
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // Auto-hide if delay is specified
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, autoHideDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    // Delay the actual close to allow fade-out animation
    setTimeout(() => {
      onClose();
    }, 300); // Match the CSS transition duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <AlertCircle size={24} />;
      default:
        return null;
    }
  };

  const getDialogClass = () => {
    return `dialog ${type} ${isAnimating ? 'visible' : ''}`;
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  return (
    <div className={getDialogClass()}>
      <div className="dialog-content">
        <div className="dialog-icon">
          {getIcon()}
        </div>
        <div className="dialog-message">
          {message}
        </div>
        <button
          className="dialog-close"
          onClick={handleClose}
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Dialog;
