import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, children }) => {
  return (
    <header className="page-header">
      <div className="header-left">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Retour">
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="page-title">{title}</h1>
      </div>
      {children && (
        <div className="header-right">
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
