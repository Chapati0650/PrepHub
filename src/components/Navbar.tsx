import React, { useState, useEffect } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionProvider } from './contexts/QuestionContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import QuestionGenerator from './pages/QuestionGenerator';
import Learn from './pages/Learn';
import Upgrade from './pages/Upgrade';
import PaymentSuccess from './pages/PaymentSuccess';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuestionProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/questions" element={<QuestionGenerator />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </QuestionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;