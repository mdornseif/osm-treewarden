import React, { useMemo } from 'react'
import { Tree } from '../types'
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils'
import { getPatchedTree } from '../store/patchStore'
import { useOrchards, useTreeStore } from '../store/useTreeStore'
import styles from '../styles/tree-list.module.css'

interface TreeListProps {
  selectedTreeId: number | null
  onTreeSelect: (tree: Tree) => void
  onClose?: () => void
}

const TreeList: React.FC<TreeListProps> = ({ onTreeSelect, selectedTreeId, onClose }) => {
  const orchards = useOrchards()
  const { trees, isLoading, error } = useTreeStore()

  // Sort trees by ID for consistent ordering
  const sortedTrees = useMemo(() => {
    return [...trees].sort((a, b) => a.id - b.id)
  }, [trees])

  // Prevent wheel events from bubbling up to the map when scrolling is possible
  const handleWheel = (e: React.WheelEvent) => {
    const target = e.currentTarget as HTMLElement
    const { scrollTop, scrollHeight, clientHeight } = target
    const isScrollable = scrollHeight > clientHeight
    
    if (isScrollable) {
      // Only stop propagation if we can actually scroll
      // Check if we're at the boundaries
      const isAtTop = scrollTop === 0 && e.deltaY < 0
      const isAtBottom = scrollTop >= scrollHeight - clientHeight && e.deltaY > 0
      
      // Only stop propagation if we're not at the boundaries or if we're scrolling in a direction that can be handled
      if (!isAtTop && !isAtBottom) {
        e.stopPropagation()
      }
    }
  }

  if (isLoading) {
    return (
      <div className={styles['tree-list']}>
        <div className={styles['tree-list-header']}>
          <h3>Bäume</h3>
          {onClose && (
            <button 
              className={styles['close-button']} 
              onClick={onClose}
              title="Bäume-Liste schließen"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles['tree-list-content']} onWheel={handleWheel}>
          <p>Bäume werden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles['tree-list']}>
        <div className={styles['tree-list-header']}>
          <h3>Bäume</h3>
          {onClose && (
            <button 
              className={styles['close-button']} 
              onClick={onClose}
              title="Bäume-Liste schließen"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles['tree-list-content']} onWheel={handleWheel}>
          <p className={styles.error}>Fehler: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles['tree-list']}>
      <div className={styles['tree-list-header']}>
        <h3>Bäume ({trees.length})</h3>
        {onClose && (
          <button 
            className={styles['close-button']} 
            onClick={onClose}
            title="Bäume-Liste schließen"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles['tree-list-content']} onWheel={handleWheel}>
        {trees.length === 0 ? (
          <p>Keine Bäume in diesem Bereich gefunden.</p>
        ) : (
          <ul className={styles['tree-items']}>
            {sortedTrees.map((tree) => {
              const patchedTree = getPatchedTree(tree)
              const { errors, warnings } = getTreeIssues(patchedTree, orchards)
              const hasErrors = errors.length > 0
              const hasWarnings = warnings.length > 0
              const isSelected = tree.id === selectedTreeId

              let itemClassName = styles['tree-item']
              if (isSelected) {
                itemClassName += ` ${styles['tree-item-selected']}`
              } else if (hasErrors) {
                itemClassName += ` ${styles['tree-item-error']}`
              } else if (hasWarnings) {
                itemClassName += ` ${styles['tree-item-warning']}`
              }

              const hasPatch = false // No patch logic here as per new_code

              return (
                <li key={tree.id} className={itemClassName} onClick={() => onTreeSelect(tree)}>
                  <div className={styles['tree-name']}>
                    {getTreeDisplayName(tree)}
                    {hasPatch && (
                      <span className={styles['tree-updated-label']}>aktualisiert</span>
                    )}
                    {isSelected && (
                      <span className={styles['selected-indicator']}>✓</span>
                    )}
                  </div>
                  <div className={styles['tree-details']}>
                    <span className={styles['tree-id']}>OSM ID: {tree.id}</span>
                    {tree.properties.species && (
                      <span className={styles['tree-species']}>
                        {tree.properties.species}
                      </span>
                    )}
                  </div>
                </li>
              )
          })}
        </ul>
      )}
    </div>
  </div>
  )
}

export default TreeList 