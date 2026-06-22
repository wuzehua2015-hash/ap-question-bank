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

import QuizPdfPage from './pages/QuizPdfPage'

import SearchPage from './pages/SearchPage'
import MistakeBook from './pages/MistakeBook'
import HistoryPage from './pages/HistoryPage'

import { SubjectProvider } from './contexts/SubjectContext'

function App() {
  return (
    <SubjectProvider>
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
            <Route path="/search" element={<SearchPage />} />
            <Route path="/mistakes" element={<MistakeBook />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/score" element={<ScorePage />} />
            <Route path="/quiz-pdf" element={<QuizPdfPage />} />
            {/* 预留：未来营销页 */}
            {/* <Route path="/about" element={<AboutPage />} /> */}
            {/* 预留：未来科目主页 */}
            {/* <Route path="/subject/:id" element={<SubjectPage />} /> */}
          </Routes>
        </main>
        <Footer />
      </div>
    </SubjectProvider>
  )
}

export default App
