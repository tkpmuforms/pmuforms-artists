import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Auth from "./pages/Auth";


function App() {
  return <> 
  <Router>
  <Routes>
    <Route path="/" element={<Auth />} />
    <Route path="/forgot-password" element={<Auth />} />
    <Route path="/register" element={<Auth />} />

  </Routes>
  </Router>
 </>;
}

export default App;
