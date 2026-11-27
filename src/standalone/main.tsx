import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../app/App';
import '../styles/app.css';
import '../styles/resume.css';

// 离线单文件版：模板由 HTML 里的 <script id="resume-template"> 注入
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
