import Map from './components/Map'
import TreeListWindow from './components/TreeListWindow'
import SettingsWindow from './components/SettingsWindow'
import './styles/tree-markers.css'
import './styles/tree-list.css'
import './styles/tree-popup.css'
import './styles/settings.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Map />
      <SettingsWindow />
      <TreeListWindow />
    </div>
  )
}

export default App 