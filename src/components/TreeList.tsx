import React from 'react'
import { useTreeStore } from '../store/useTreeStore'
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils'
import { getPatchedTree } from '../store/patchStore'
import { useOrchards } from '../store/useTreeStore'
import styles from '../styles/tree-list.module.css'
import { Tree } from '../types'

interface TreeListProps {
  selectedTreeId: number | null
  onTreeSelect: (tree: Tree) => void
  onClose?: () => void
}

const TreeList: React.FC<TreeListProps> = ({ selectedTreeId, onTreeSelect, onClose }) => {
  const { trees } = useTreeStore()
  const orchards = useOrchards()

  // Sort trees by ID for consistent ordering
  const sortedTrees = React.useMemo(() => {
    return [...trees].sort((a, b) => a.id - b.id)
  }, [trees])

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
      
      <div className={styles['tree-list-content']}>
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

            const hasPatch = false // Simplified for this interface

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
      </div>
    </div>
  )
}

export default TreeList 