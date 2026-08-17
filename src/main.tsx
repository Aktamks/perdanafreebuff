import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ClientsProvider } from "./context/ClientsContext";
import { TeamsProvider } from "./context/TeamsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <ClientsProvider>
          <TeamsProvider>
            <App />
          </TeamsProvider>
        </ClientsProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
