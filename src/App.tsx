import Map from './components/Map'
import TreeListWindow from './components/TreeListWindow'
import './styles/tree-markers.css'
import './styles/tree-list.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <TreeListWindow>
        <Map />
      </TreeListWindow>
    </div>
  )
}

export default App 