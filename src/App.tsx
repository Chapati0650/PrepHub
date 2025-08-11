import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionProvider } from './contexts/QuestionContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Learn from './pages/Learn';
import Upgrade from './pages/Upgrade';
import AuthCallback from './pages/AuthCallback';
import QuestionList from './pages/QuestionList';
import QuestionViewer from './pages/QuestionViewer';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuestionProvider>
          <div className="min-h-screen bg-white">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/questions" element={<QuestionList />} />
              <Route path="/question/:questionId" element={<QuestionViewer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </QuestionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;