import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import '../styles/notification-dialog.css';

export type NotificationType = 'success' | 'error';

interface NotificationDialogProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideDelay?: number; // Optional auto-hide after delay in milliseconds
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoHideDelay = 5000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // Play notification sound
      playNotificationSound();

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

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound based on type
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      } else {
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.15);
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
      // Silently fail if Web Audio API is not supported
      console.warn('Notification sound not supported');
    }
  };

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
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return null;
    }
  };

  const getNotificationClass = () => {
    return `notification-dialog ${type} ${isAnimating ? 'visible' : ''}`;
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  return (
    <div className={getNotificationClass()}>
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-message">
          {message}
        </div>
        <button
          className="notification-close"
          onClick={handleClose}
          aria-label="Fermer la notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationDialog;
