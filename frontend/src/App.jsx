import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Landing          from "./pages/Landing";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import Dashboard        from "./pages/Dashboard";
import AuthCallback     from "./pages/AuthCallback";
import ForgotPassword   from "./pages/ForgotPassword";
import ResetPassword    from "./pages/ResetPassword";
import Settings         from "./pages/Settings";
import SharedCollection from "./pages/SharedCollection";

// Redirects logged-in users to /dashboard, otherwise shows the landing page
function HomeRoute() {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" /> : <Landing />;
}

// ProtectedRoute — redirects to /login if no token found
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<HomeRoute />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/c/:token" element={<SharedCollection />} />
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  );
}
