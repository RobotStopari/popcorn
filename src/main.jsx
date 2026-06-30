import '../css/main.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { readSsrBootstrap } from './utils/ssr-bootstrap';

const bootstrap = readSsrBootstrap();
const ssrShell = document.getElementById('ssr-shell');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App ssrData={bootstrap?.data ?? null} />
    </BrowserRouter>
  </StrictMode>,
);

if (ssrShell) {
  ssrShell.remove();
}
