import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./login";
import RegisterPage from "./register";
import Dashboard from "./dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}