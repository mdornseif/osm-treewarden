import React, { useState } from 'react';
import Settings from './Settings';

const SettingsWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`settings-window-container ${isOpen ? 'open' : ''}`}>
      <button 
        className="settings-toggle"
        onClick={toggleWindow}
                  title={isOpen ? 'Einstellungen ausblenden' : 'Einstellungen anzeigen'}
      >
        {isOpen ? '×' : '⚙️'}
      </button>
      {isOpen && (
        <div className="settings-window">
          <Settings />
        </div>
      )}
    </div>
  );
};

export default SettingsWindow;