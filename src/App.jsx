import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import RequireSubject from './components/RequireSubject'

import { SubjectProvider } from './contexts/SubjectContext'
import { AuthProvider } from './contexts/AuthContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const QuizSetup = lazy(() => import('./pages/QuizSetup'))
const PaperPracticeSetup = lazy(() => import('./pages/PaperPracticeSetup'))
const PaperPracticePlayer = lazy(() => import('./pages/PaperPracticePlayer'))
const ExamSetup = lazy(() => import('./pages/ExamSetup'))
const QuizPlayer = lazy(() => import('./pages/QuizPlayer'))
const FRQPlayer = lazy(() => import('./pages/FRQPlayer'))
const FRQScorePage = lazy(() => import('./pages/FRQScorePage'))
const ScorePage = lazy(() => import('./pages/ScorePage'))
const QuizPdfPage = lazy(() => import('./pages/QuizPdfPage'))
const MockPdfPage = lazy(() => import('./pages/MockPdfPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const MistakeBook = lazy(() => import('./pages/MistakeBook'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

function PageLoading() {
  return (
    <div className="mx-auto flex min-h-[360px] max-w-6xl items-center justify-center px-4 text-sm text-slate-500">
      正在加载...
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <SubjectProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/dashboard" element={<HomePage forceDashboard />} />
                <Route path="/quiz" element={<RequireSubject><QuizSetup /></RequireSubject>} />
                <Route path="/paper-practice" element={<RequireSubject><PaperPracticeSetup /></RequireSubject>} />
                <Route path="/paper-play" element={<PaperPracticePlayer />} />
                <Route path="/exam" element={<RequireSubject><ExamSetup /></RequireSubject>} />
                <Route path="/play" element={<QuizPlayer />} />
                <Route path="/frq" element={<FRQPlayer />} />
                <Route path="/frq-score" element={<FRQScorePage />} />
                <Route path="/search" element={<RequireSubject><SearchPage /></RequireSubject>} />
                <Route path="/mistakes" element={<RequireSubject><MistakeBook /></RequireSubject>} />
                <Route path="/history" element={<RequireSubject><HistoryPage /></RequireSubject>} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/score" element={<ScorePage />} />
                <Route path="/quiz-pdf" element={<QuizPdfPage />} />
                <Route path="/mock-pdf" element={<MockPdfPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </SubjectProvider>
    </AuthProvider>
  )
}

export default App
