import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store.ts";

if (
  window.location.pathname === "/" &&
  window.location.hash.startsWith("#/integrations")
) {
  window.history.replaceState(
    window.history.state,
    "",
    window.location.hash.slice(1)
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
