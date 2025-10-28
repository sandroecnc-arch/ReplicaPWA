import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('SW registrado com sucesso:', registration.scope);
    } catch (error) {
      console.error('Erro ao registrar SW:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
