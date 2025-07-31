import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import RouteGuard from "./routes/RouteGuard";

function App() {
  return (
    <>
      <Router>
        <Toaster />
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
