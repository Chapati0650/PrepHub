import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionProvider } from './contexts/QuestionContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import QuestionGenerator from './pages/QuestionGenerator';
import Learn from './pages/Learn';
import QuestionUpload from './pages/QuestionUpload';
import Upgrade from './pages/Upgrade'; // Import the new Upgrade page

function App() {
  // Replace this with your actual Google Client ID from Google Cloud Console
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id-here";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <QuestionProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/generator" element={<QuestionGenerator />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/upload" element={<QuestionUpload />} />
                  <Route path="/upgrade" element={<Upgrade />} /> {/* Add the new Upgrade route */}
                </Routes>
              </main>
            </div>
          </QuestionProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;