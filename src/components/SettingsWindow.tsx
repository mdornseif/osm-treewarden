import React, { useState } from 'react';
import Settings from './Settings';

interface SettingsWindowProps {
  children: React.ReactNode;
}

const SettingsWindow: React.FC<SettingsWindowProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`settings-window-container ${isOpen ? 'open' : ''}`}>
      <div className="main-content">
        {children}
        <button 
          className="settings-toggle"
          onClick={toggleWindow}
          title={isOpen ? 'Hide settings' : 'Show settings'}
        >
          {isOpen ? '×' : '⚙️'}
        </button>
      </div>
      {isOpen && (
        <div className="settings-window">
          <Settings />
        </div>
      )}
    </div>
  );
};

export default SettingsWindow;