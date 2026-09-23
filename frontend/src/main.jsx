import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import StitchNavigationBridge from "./components/StitchNavigationBridge";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>

      <StitchNavigationBridge />

      <AppRoutes />

    </BrowserRouter>
  </React.StrictMode>
);