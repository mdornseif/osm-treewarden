import React, { useState } from 'react';
import TreeList from './TreeList';

interface TreeListWindowProps {
  children: React.ReactNode;
}

const TreeListWindow: React.FC<TreeListWindowProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`tree-list-window-container ${isOpen ? 'open' : ''}`}>
      <div className="main-content">
        {children}
        <button 
          className="tree-list-toggle"
          onClick={toggleWindow}
          title={isOpen ? 'Hide tree list' : 'Show tree list'}
        >
          {isOpen ? '×' : '🌳'}
        </button>
      </div>
      {isOpen && (
        <div className="tree-list-window">
          <TreeList />
        </div>
      )}
    </div>
  );
};

export default TreeListWindow; 