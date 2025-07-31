import React, { useState } from 'react'
import Map from './components/Map'
import TreeListSlidein from './components/TreeListSlidein'
import SettingsSlidein from './components/SettingsSlidein'
import UploadSlidein from './components/UploadSlidein'
import TreeInfoSlidein from './components/TreeInfoSlidein'
import { Tree } from './types'

function App() {
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [isTreeInfoOpen, setIsTreeInfoOpen] = useState(false);

  const handleTreeSelect = (tree: Tree) => {
    setSelectedTree(tree);
    setIsTreeInfoOpen(true);
  };

  const handleTreeInfoClose = () => {
    setIsTreeInfoOpen(false);
    setSelectedTree(null);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Map />
      <SettingsSlidein />
      <UploadSlidein />
      <TreeListSlidein onTreeSelect={handleTreeSelect} />
      <TreeInfoSlidein 
        tree={selectedTree}
        isOpen={isTreeInfoOpen}
        onClose={handleTreeInfoClose}
      />
    </div>
  )
}

export default App 