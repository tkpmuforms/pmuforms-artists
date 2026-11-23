import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store.ts";
import { captureAttribution } from "./utils/attribution.ts";
import { initAnalytics } from "./utils/analytics.ts";

// remember an ad or referral link before anything changes the URL
try {
  captureAttribution();
} catch {
  // never block the app over tracking
}
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
