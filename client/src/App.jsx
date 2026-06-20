import Layout from './components/Layout'

function App({ context }) {
  return (
    <div className='bg-gray-900 text-gray-400 overflow-hidden'>
      <Layout context={context}/>
    </div>
  )
}

export default App
