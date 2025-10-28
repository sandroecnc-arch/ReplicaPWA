import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado: ', registration);
      })
      .catch((error) => {
        console.log('SW falhou ao registrar: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
