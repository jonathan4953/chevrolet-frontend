import axios from "axios";

// Verificamos se o app está rodando no seu PC (localhost) ou na nuvem
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const api = axios.create({
  // Se for local, usa o IP interno. Se for na nuvem, usa o IP da sua VPS.
  // Note o "http://" e a porta ":8000" (ajuste a porta se o seu backend usar outra)
  baseURL: isLocalhost 
    ? "http://127.0.0.1:8000" 
    : "http://31.97.167.71:8000", 
});