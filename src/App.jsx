import { Routes, Route, Navigate } from 'react-router-dom'
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

import MockPdfPage from './pages/MockPdfPage'

import SearchPage from './pages/SearchPage'
import MistakeBook from './pages/MistakeBook'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'

import { SubjectProvider } from './contexts/SubjectContext'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
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
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/score" element={<ScorePage />} />
              <Route path="/quiz-pdf" element={<QuizPdfPage />} />
              <Route path="/mock-pdf" element={<MockPdfPage />} />
              {/* Catch-all: redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SubjectProvider>
    </AuthProvider>
  )
}

export default App
