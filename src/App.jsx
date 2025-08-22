function App() {
  return (
    <div style={{ padding: '20px', fontSize: '18px', color: 'red' }}>
      <h1>VisionPolish - Test</h1>
      <p>If you see this, React is working but CSS might not be.</p>
      <div className="bg-blue-500 text-white p-4 rounded">
        This should be blue with white text if Tailwind works
      </div>
    </div>
  )
}

export default App