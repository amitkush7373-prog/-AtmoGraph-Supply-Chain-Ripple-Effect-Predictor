import Header from './components/Header'
import Sidebar from './components/Sidebar'
import GraphCanvas from './components/GraphCanvas'
import { sampleGraph } from './data/sampleGraph'

function App() {
  const { nodes, edges } = sampleGraph

  return (
    <div className="h-screen w-screen flex flex-col bg-bg font-body overflow-hidden">
      <Header nodeCount={nodes.length} edgeCount={edges.length} />
      <div className="flex flex-1 min-h-0">
        <Sidebar nodes={nodes} />
        <main className="flex-1 min-w-0 relative">
          <GraphCanvas nodes={nodes} edges={edges} />
        </main>
      </div>
    </div>
  )
}

export default App