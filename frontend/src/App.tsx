import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventWorkspacePage } from './pages/EventWorkspacePage';
import { AuthProvider } from './contexts/AuthContext';

import { ScrollToHash } from './components/ScrollToHash';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToHash />
        <div className="flex flex-col min-h-screen bg-navy-950 text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/features" element={<Navigate to="/#features" replace />} />
              <Route path="/plan-rescue" element={<Navigate to="/#plan-rescue" replace />} />
              <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
              <Route path="/signin" element={<AuthPage defaultMode="signin" />} />
              <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events/new" element={<CreateEventPage />} />
              <Route path="/events/:eventId" element={<EventWorkspacePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
