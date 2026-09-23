import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const location = useLocation();

  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role");

  /*
   * No token
   */
  if (!token) {
    return (
      <Navigate
        to="/portal/login"
        replace
        state={{
          from: location.pathname,
          reason: "authentication_required",
        }}
      />
    );
  }

  /*
   * Token exists but role is missing.
   */
  if (!role) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_email");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("user_email");

    return (
      <Navigate
        to="/portal/login"
        replace
      />
    );
  }

  /*
   * Role authorization.
   */
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    if (role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    if (role === "customer") {
      return (
        <Navigate
          to="/portal/dashboard"
          replace
        />
      );
    }

    /*
     * Unknown role.
     */
    localStorage.removeItem(
      "access_token"
    );
    localStorage.removeItem("role");
    localStorage.removeItem(
      "user_email"
    );

    sessionStorage.removeItem(
      "access_token"
    );
    sessionStorage.removeItem("role");
    sessionStorage.removeItem(
      "user_email"
    );

    return (
      <Navigate
        to="/portal/login"
        replace
      />
    );
  }

  return <Outlet />;
}