import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    message = 'Une erreur s\'est produite lors du chargement des données.',
    onRetry,
    className = ''
}) => {
    return (
        <div className={`error-state ${className}`}>
            <div className="error-state-content">
                <AlertTriangle size={48} className="error-state-icon" />
                <h3 className="error-state-title">Erreur</h3>
                <p className="error-state-message">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="error-state-retry-button"
                    >
                        <RefreshCw size={16} />
                        Réessayer
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorState;
