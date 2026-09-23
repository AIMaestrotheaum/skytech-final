import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getAccessToken,
  getUserRole,
} from "../utils/auth";

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const location = useLocation();

  const token = getAccessToken();
  const role = getUserRole();

  // =========================================================
  // NOT AUTHENTICATED
  // =========================================================

  if (!token) {
    return (
      <Navigate
        to="/portal/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // =========================================================
  // AUTHENTICATED BUT ROLE IS MISSING
  // =========================================================

  if (!role) {
    return (
      <Navigate
        to="/portal/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // =========================================================
  // ROLE NOT ALLOWED
  // =========================================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    // Admin trying to access another protected section
    if (role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    // Customer trying to access another protected section
    if (role === "customer") {
      return (
        <Navigate
          to="/portal/dashboard"
          replace
        />
      );
    }

    // Unknown role
    return (
      <Navigate
        to="/portal/login"
        replace
      />
    );
  }

  // =========================================================
  // AUTHORIZED
  // =========================================================

  return <Outlet />;
}