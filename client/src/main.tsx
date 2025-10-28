import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.error('Erro ao registrar SW:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
