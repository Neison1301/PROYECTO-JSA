import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
//import { storage } from './services/almacenamiento';

//esto es para borrar el almacenamieto 
//storage.clear(); 
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
