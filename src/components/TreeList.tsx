import React from 'react'
import { useTreeStore } from '../store/useTreeStore'
import { usePatchStore } from '../store/usePatchStore'
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils'
import { Tree } from '../types'
import styles from '../styles/tree-list.module.css'
import { getPatchedTree } from '../store/patchStore'

interface TreeListProps {
  onTreeSelect: (tree: Tree) => void
  selectedTreeId: number | null
}

const TreeList: React.FC<TreeListProps> = ({ onTreeSelect, selectedTreeId }) => {
  const { trees, isLoading, error } = useTreeStore()
  const { hasPatchForOsmId } = usePatchStore()

  const handleTreeClick = (tree: Tree) => {
    onTreeSelect(tree)
  }

  if (isLoading) {
    return (
      <div className={styles['tree-list']}>
        <div className={styles['tree-list-header']}>
          <h3>Trees</h3>
        </div>
        <div className={styles['tree-list-content']}>
          <p>Bäume werden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles['tree-list']}>
        <div className={styles['tree-list-header']}>
          <h3>Trees</h3>
        </div>
        <div className={styles['tree-list-content']}>
          <p className={styles.error}>Fehler: {error}</p>
        </div>
      </div>
    )
  }

  // Sort trees in reverse order by genus + species + osm.id
  const sortedTrees = [...trees].sort((a, b) => {
    const aKey = `${a.properties.genus || ''}${a.properties.species || ''}${a.id}`
    const bKey = `${b.properties.genus || ''}${b.properties.species || ''}${b.id}`
    return bKey.localeCompare(aKey) // Reverse sort
  })

  return (
    <div className={styles['tree-list']}>
      <div className={styles['tree-list-header']}>
        <h3>Bäume ({trees.length})</h3>
      </div>
      <div className={styles['tree-list-content']}>
        {trees.length === 0 ? (
          <p>Keine Bäume in diesem Bereich gefunden.</p>
        ) : (
          <ul className={styles['tree-items']}>
            {sortedTrees.map((tree) => {
              const patchedTree = getPatchedTree(tree)
              const { errors, warnings } = getTreeIssues(patchedTree)
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

              const hasPatch = hasPatchForOsmId(tree.id)

              return (
                <li key={tree.id} className={itemClassName} onClick={() => handleTreeClick(tree)}>
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