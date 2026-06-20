import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import QuizSetup from './pages/QuizSetup'
import ExamSetup from './pages/ExamSetup'
import QuizPlayer from './pages/QuizPlayer'
import FRQPlayer from './pages/FRQPlayer'
import FRQScorePage from './pages/FRQScorePage'
import ScorePage from './pages/ScorePage'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz" element={<QuizSetup />} />
          <Route path="/exam" element={<ExamSetup />} />
          <Route path="/play" element={<QuizPlayer />} />
          <Route path="/frq" element={<FRQPlayer />} />
          <Route path="/frq-score" element={<FRQScorePage />} />
          <Route path="/score" element={<ScorePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
