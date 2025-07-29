import { BrowserRouter as Router } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import RouteGuard from "./routes/RouteGuard";

function App() {
  return (
    <>
      <Router>
        {/* <SnackbarProvider>     */}
        <AuthProvider>
          <RouteGuard />
        </AuthProvider>
        {/* </SnackbarProvider> */}
      </Router>
    </>
  );
}

export default App;
