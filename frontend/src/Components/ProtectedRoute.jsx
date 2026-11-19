import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const isLoggedIn = sessionStorage.getItem("loggedIn") === "true";

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}