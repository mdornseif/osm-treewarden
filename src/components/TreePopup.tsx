import React from 'react';
import { Popup } from 'react-leaflet';
import { Tree } from '../types';
import TreeInfo from './TreeInfo';

interface TreePopupProps {
  tree: Tree;
}

const TreePopup: React.FC<TreePopupProps> = ({ tree }) => {
  return (
    <Popup>
      <TreeInfo tree={tree} />
    </Popup>
  );
};

export default TreePopup; 