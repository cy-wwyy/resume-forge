import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ExportPage } from './export/ExportPage';
import './styles/app.css';
import './styles/resume.css';

const isExport = window.location.hash.startsWith('#/export');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isExport ? <ExportPage /> : <App />}</StrictMode>,
);
