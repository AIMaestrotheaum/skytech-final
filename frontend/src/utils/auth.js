export function getAccessToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
}

export function getUserRole() {
  return (
    localStorage.getItem("role") ||
    sessionStorage.getItem("role")
  );
}

export function getUserEmail() {
  return (
    localStorage.getItem("user_email") ||
    sessionStorage.getItem("user_email")
  );
}

export function getUserId() {
  return (
    localStorage.getItem("user_id") ||
    sessionStorage.getItem("user_id")
  );
}

export function getUserName() {
  return (
    localStorage.getItem("name") ||
    sessionStorage.getItem("name")
  );
}

export function clearAuth() {
  /*
   * Clear authentication data
   */
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("role");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_id");
  localStorage.removeItem("name");

  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("token_type");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("user_email");
  sessionStorage.removeItem("user_id");
  sessionStorage.removeItem("name");

  /*
   * Clear selected records
   */
  sessionStorage.removeItem(
    "selected_lead_id"
  );

  sessionStorage.removeItem(
    "selected_quote_id"
  );

  sessionStorage.removeItem(
    "selected_amc_id"
  );

  sessionStorage.removeItem(
    "selected_amc_detail"
  );

  sessionStorage.removeItem(
    "selected_service_request_id"
  );
}

export function logout() {
  clearAuth();

  window.location.href =
    "/portal/login";
}