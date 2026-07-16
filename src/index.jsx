import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { analytics } from "./firebase";
import { logEvent } from "firebase/analytics";
import { BrowserRouter, useLocation } from "react-router-dom";

function AnalyticsTracker({ children }) {
  const location = useLocation();
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page_path: location.pathname });
    }
  }, [location]);
  return children;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsTracker>
        <App />
      </AnalyticsTracker>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
