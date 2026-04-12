import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';
import { meetrixTheme } from './theme';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={meetrixTheme}>
      <CssBaseline />
      <div className="App">
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Authentication />} />
              <Route path="/home" element={<HomeComponent />} />
              <Route path="/history" element={<History />} />
              <Route path="/meet" element={<Navigate to="/home" replace />} />
              <Route path="/meet/:url" element={<VideoMeetComponent />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
