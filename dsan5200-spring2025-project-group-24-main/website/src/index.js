import React from 'react';
import ReactDOM from 'react-dom/client'; // Correct for React 18
import App from './App';
import './styles/main.css';
import { ColorModeProvider } from './theme/ColorModeContext'; // Import ColorModeProvider
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary> {/* Wrapping with ErrorBoundary */}
    <ColorModeProvider> {/* Wrapping with ColorModeProvider */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ColorModeProvider>
  </ErrorBoundary>
);
