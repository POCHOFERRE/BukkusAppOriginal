import React from "react";
import ReactDOM from "react-dom/client";
import AppWrapper from "./App.jsx";
import { UserProvider } from "./context/UserContext";
import "./index.css"; // ✅ Tu CSS general (si tenés Tailwind, va acá)
import "react-toastify/dist/ReactToastify.css"; // ✅ Toast

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <AppWrapper />
    </UserProvider>
  </React.StrictMode>
);
