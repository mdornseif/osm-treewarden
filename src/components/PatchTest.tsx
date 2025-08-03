import React, { useState } from 'react';
import { usePatchStore } from '../store/usePatchStore';

export function PatchTest() {
  const { addPatch, clearAllPatches, getAllPatches } = usePatchStore();
  const [osmId, setOsmId] = useState<number>(12345);
  const [key, setKey] = useState<string>('species');
  const [value, setValue] = useState<string>('Oak');

  const handleAddPatch = () => {
    addPatch(osmId, 1, { [key]: value });
  };

  const handleClearPatches = () => {
    clearAllPatches();
  };

  const patches = getAllPatches();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h3>Patch Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <label>
            OSM ID:
            <input
              type="number"
              value={osmId}
              onChange={(e) => setOsmId(Number(e.target.value))}
              style={{ marginLeft: '5px' }}
            />
          </label>
          <label>
            Key:
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{ marginLeft: '5px' }}
            />
          </label>
          <label>
            Value:
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{ marginLeft: '5px' }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAddPatch}>Add Patch</button>
          <button onClick={handleClearPatches}>Clear All Patches</button>
        </div>
      </div>

      <div>
        <h4>Current Patches ({patches.length})</h4>
        {patches.length === 0 ? (
          <p>No patches</p>
        ) : (
          <ul>
            {patches.map((patch) => (
              <li key={patch.osmId}>
                OSM ID: {patch.osmId} - {JSON.stringify(patch.changes)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}