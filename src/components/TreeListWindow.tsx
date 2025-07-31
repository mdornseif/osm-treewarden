import React, { useState } from 'react';
import TreeList from './TreeList';

const TreeListWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`tree-list-window-container ${isOpen ? 'open' : ''}`}>
      <button 
        className="tree-list-toggle"
        onClick={toggleWindow}
        title={isOpen ? 'Hide tree list' : 'Show tree list'}
      >
        {isOpen ? '×' : '🌳'}
      </button>
      {isOpen && (
        <div className="tree-list-window">
          <TreeList />
        </div>
      )}
    </div>
  );
};

export default TreeListWindow; 