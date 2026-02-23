import axios from "axios";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const api = axios.create({
  baseURL: isLocalhost 
    ? "http://127.0.0.1:8000" 
    : "https://api.4ahub.com.br", // COLE AQUI A URL QUE VOCÊ TESTOU
  timeout: 30000, 
});