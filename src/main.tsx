import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// TEMPORARY DEBUG AID - shows any JS crash directly on the page instead
// of leaving it blank, since there's no browser devtools access here.
function showFatalError(label, err) {
  const msg = err instanceof Error ? (err.name + ': ' + err.message + '\n\n' + (err.stack || '')) : String(err);
  const el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:0;background:#1a0000;color:#ff8080;padding:16px;font-size:12px;white-space:pre-wrap;overflow:auto;z-index:99999;margin:0;';
  el.textContent = '[' + label + ']\n\n' + msg;
  document.body.appendChild(el);
}

window.addEventListener('error', (e) => showFatalError('window error', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => showFatalError('unhandled promise rejection', e.reason));

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  );
} catch (err) {
  showFatalError('render crash', err);
}
