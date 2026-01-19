import React from 'react';

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Chargement...',
    size = 'medium',
    className = ''
}) => {
    const sizeClasses = {
        small: 'loading-spinner-small',
        medium: 'loading-spinner-medium',
        large: 'loading-spinner-large'
    };

    return (
        <div className={`loading-state ${className}`}>
            <div className={`loading-spinner ${sizeClasses[size]}`}></div>
            <p className="loading-message">{message}</p>
        </div>
    );
};

export default LoadingState;
