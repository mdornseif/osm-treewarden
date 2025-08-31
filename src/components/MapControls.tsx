import React, { useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { startAddingTree, isAddingTree, selectedTreeType, addTreeAtLocation, toggleStreuobstwiesen, showStreuobstwiesen } from '../store/treeStore';
import { hasPatches } from '../store/patchStore';
import { useStore } from '@nanostores/react';
import { toggleTreeList, uiState } from '../store/uiStore';
import Settings from './Settings';
import UploadManager from './UploadManager';
import TreeList from './TreeList';
import BackgroundLayerSelector from './BackgroundLayerSelector';
import styles from '../styles/map-controls.module.css';
import type { Tree } from '../types';
import { getShareableURL } from '../store/urlStore';

interface ControlButton {
  id: string;
  icon: string;
  title: string;
  activeTitle?: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  shouldShow?: boolean;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'teal' | 'red';
}

interface MapControlsProps {
  onTreeSelect?: (tree: Tree) => void;
  selectedTreeId?: number | null;
}

const MapControls: React.FC<MapControlsProps> = ({ onTreeSelect, selectedTreeId }) => {
  const map = useMap();
  const addingTree = useStore(isAddingTree);
  const treeType = useStore(selectedTreeType);
  const hasPatchesInStore = useStore(hasPatches);
  const streuobstwiesenVisible = useStore(showStreuobstwiesen);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [backgroundLayerOpen, setBackgroundLayerOpen] = useState(false);
  const treeListOpen = useStore(uiState).isTreeListOpen;

  const handleAddTreeClick = () => {
    startAddingTree();
  };

  const handleOpenInOSM = () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const url = `https://www.openstreetmap.org/#map=${zoom}/${center.lat}/${center.lng}`;
    window.open(url, '_blank');
  };

  const handleShareMap = async () => {
    const shareableURL = getShareableURL();
    
    try {
      if (navigator.share) {
        // Use native share API if available (mobile devices)
        await navigator.share({
          title: 'TreeWarden - Karte teilen',
          text: 'Schaue dir diese Karte in TreeWarden an',
          url: shareableURL
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareableURL);
        // Show a temporary notification
        const notification = document.createElement('div');
        notification.textContent = 'Link in die Zwischenablage kopiert!';
        notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 10000;
          font-size: 14px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: show the URL in an alert
      alert(`Teile diesen Link:\n${shareableURL}`);
    }
  };

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (addingTree && treeType) {
      const { lat, lng } = e.latlng;
      addTreeAtLocation(lat, lng);
    }
  }, [addingTree, treeType]);

  // Add click listener to map when in adding mode
  React.useEffect(() => {
    if (addingTree && treeType) {
      map.on('click', handleMapClick);
      
      // Change cursor to indicate adding mode
      map.getContainer().style.cursor = 'crosshair';
      
      return () => {
        map.off('click', handleMapClick);
        map.getContainer().style.cursor = '';
      };
    }
  }, [map, addingTree, treeType, handleMapClick]);

  // Define all control buttons
  const controlButtons: ControlButton[] = [
    {
      id: 'add-tree',
      icon: '➕',
      title: 'Baum hinzufügen',
      activeTitle: 'Klicken Sie auf die Karte, um einen Baum hinzuzufügen',
      onClick: handleAddTreeClick,
      isActive: addingTree,
      isDisabled: addingTree,
      shouldShow: true,
      color: 'green'
    },
    {
      id: 'tree-list',
      icon: treeListOpen ? '×' : '🌳',
      title: treeListOpen ? 'Baumliste ausblenden' : 'Baumliste anzeigen',
      onClick: toggleTreeList,
      isActive: treeListOpen,
      shouldShow: true,
      color: 'purple'
    },
    {
      id: 'background-layer',
      icon: backgroundLayerOpen ? '×' : '🗺️',
      title: backgroundLayerOpen ? 'Hintergrund-Karte ausblenden' : 'Hintergrund-Karte anzeigen',
      onClick: () => setBackgroundLayerOpen(!backgroundLayerOpen),
      isActive: backgroundLayerOpen,
      shouldShow: true,
      color: 'teal'
    },
    {
      id: 'open-osm',
      icon: '🌍',
      title: 'Diesen Kartenbereich in OpenStreetMap öffnen',
      onClick: handleOpenInOSM,
      shouldShow: true,
      color: 'red'
    },
    {
      id: 'share-map',
      icon: '🔗',
      title: 'Karte teilen (Link kopieren)',
      onClick: handleShareMap,
      shouldShow: true,
      color: 'blue'
    },
    {
      id: 'streuobstwiesen',
      icon: streuobstwiesenVisible ? '×' : '🍎',
      title: streuobstwiesenVisible ? 'Streuobstwiesen ausblenden' : 'Streuobstwiesen anzeigen',
      onClick: toggleStreuobstwiesen,
      isActive: streuobstwiesenVisible,
      shouldShow: true,
      color: 'red'
    },
    {
      id: 'settings',
      icon: settingsOpen ? '×' : '⚙️',
      title: settingsOpen ? 'Einstellungen ausblenden' : 'Einstellungen anzeigen',
      onClick: () => setSettingsOpen(!settingsOpen),
      isActive: settingsOpen,
      shouldShow: true,
      color: 'blue'
    },
    {
      id: 'upload',
      icon: uploadOpen ? '×' : '📤',
      title: uploadOpen ? 'Upload Manager ausblenden' : 'Upload Manager anzeigen',
      onClick: () => setUploadOpen(!uploadOpen),
      isActive: uploadOpen,
      shouldShow: hasPatchesInStore,
      color: 'orange'
    }
  ];

  const renderButton = (button: ControlButton) => {
    if (!button.shouldShow) return null;

    return (
      <button
        key={button.id}
        className={`${styles.controlButton} ${styles[`${button.color}Button`]} ${button.isActive ? styles.active : ''}`}
        onClick={button.onClick}
        title={button.isActive && button.activeTitle ? button.activeTitle : button.title}
        disabled={button.isDisabled}
        data-testid={`${button.id}-toggle`}
      >
        <span className={styles.buttonIcon}>{button.icon}</span>
        {button.id === 'add-tree' && addingTree && treeType && (
          <span className={styles.addingIndicator}>
            {treeType === 'apple' ? '🍎' : '🍐'} Klicken Sie auf die Karte
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <div className={styles.mapControls}>
        {controlButtons.filter(btn => btn.shouldShow).map(renderButton)}
      </div>
      
      {/* Slide-in panels */}
      {settingsOpen && (
        <div className={styles.slideInPanel}>
          <Settings onClose={() => setSettingsOpen(false)} />
        </div>
      )}
      
      {uploadOpen && hasPatchesInStore && (
        <div className={styles.slideInPanel}>
          <UploadManager onClose={() => setUploadOpen(false)} />
        </div>
      )}
      
      {backgroundLayerOpen && (
        <div className={styles.slideInPanel}>
          <BackgroundLayerSelector onClose={() => setBackgroundLayerOpen(false)} />
        </div>
      )}
      
      {treeListOpen && (
        <div className={styles.slideInPanel}>
          <TreeList 
            onTreeSelect={onTreeSelect || (() => {})}
            selectedTreeId={selectedTreeId || null}
            onClose={() => toggleTreeList()}
          />
        </div>
      )}
    </>
  );
};

export default MapControls; 