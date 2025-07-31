import React, { useState } from 'react';
import { useChangeStore, useChangeStats } from '../store/useChangeStore';

export function ChangeStoreTest() {
  const {
    changes,
    pendingChanges,
    appliedChanges,
    changeCount,
    pendingChangeCount,
    appliedChangeCount,
    hasChanges,
    hasPendingChanges,
    addChange,
    updateChange,
    removeChange,
    moveToPending,
    applyChange,
    clearAllChanges,
    clearPendingChanges,
    clearAppliedChanges,
    getAllChanges,
    getAllPendingChanges,
    getAllAppliedChanges
  } = useChangeStore();

  const stats = useChangeStats();

  const [osmId, setOsmId] = useState<number>(12345);
  const [version, setVersion] = useState<number>(1);
  const [key, setKey] = useState<string>('species');
  const [value, setValue] = useState<string>('Oak');

  const handleAddChange = () => {
    addChange(osmId, version, { [key]: value });
  };

  const handleUpdateChange = () => {
    updateChange(osmId, { [key]: value });
  };

  const handleMoveToPending = () => {
    moveToPending(osmId);
  };

  const handleApplyChange = () => {
    applyChange(osmId);
  };

  const handleRemoveChange = () => {
    removeChange(osmId);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Change Store Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Statistics</h3>
        <p>Total Changes: {stats.totalChanges}</p>
        <p>Pending Changes: {stats.pendingChanges}</p>
        <p>Applied Changes: {stats.appliedChanges}</p>
        <p>Has Changes: {stats.hasChanges ? 'Yes' : 'No'}</p>
        <p>Has Pending Changes: {stats.hasPendingChanges ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Add/Update Change</h3>
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
            Version:
            <input
              type="number"
              value={version}
              onChange={(e) => setVersion(Number(e.target.value))}
              style={{ marginLeft: '5px' }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
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
          <button onClick={handleAddChange}>Add Change</button>
          <button onClick={handleUpdateChange}>Update Change</button>
          <button onClick={handleRemoveChange}>Remove Change</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Change Management</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleMoveToPending}>Move to Pending</button>
          <button onClick={handleApplyChange}>Apply Change</button>
          <button onClick={clearPendingChanges}>Clear Pending</button>
          <button onClick={clearAppliedChanges}>Clear Applied</button>
          <button onClick={clearAllChanges}>Clear All</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Current Changes ({changeCount})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {Object.entries(changes).map(([id, change]) => (
              <div key={id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                <strong>OSM ID: {change.osmId}</strong><br />
                Version: {change.version}<br />
                Changes: {JSON.stringify(change.changes)}<br />
                Timestamp: {change.timestamp}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Pending Changes ({pendingChangeCount})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {Object.entries(pendingChanges).map(([id, change]) => (
              <div key={id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#fff3cd' }}>
                <strong>OSM ID: {change.osmId}</strong><br />
                Version: {change.version}<br />
                Changes: {JSON.stringify(change.changes)}<br />
                Timestamp: {change.timestamp}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Applied Changes ({appliedChangeCount})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {Object.entries(appliedChanges).map(([id, change]) => (
              <div key={id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#d4edda' }}>
                <strong>OSM ID: {change.osmId}</strong><br />
                Version: {change.version}<br />
                Changes: {JSON.stringify(change.changes)}<br />
                Timestamp: {change.timestamp}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}