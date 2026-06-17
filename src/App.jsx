import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import QuizGenerator from './pages/QuizGenerator'
import QuizPlayer from './pages/QuizPlayer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz" element={<QuizGenerator />} />
          <Route path="/quiz/play" element={<QuizPlayer />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
