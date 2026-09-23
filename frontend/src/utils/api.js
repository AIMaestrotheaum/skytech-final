import {
  getAccessToken,
  clearAuth,
} from "./auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

export async function apiFetch(
  endpoint,
  options = {}
) {
  const token = getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;

  if (
    body &&
    typeof body !== "string" &&
    !(body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      ...options,
      headers,
      body,
    }
  );

  // Authentication endpoints should handle their own 401 errors.
  const isAuthEndpoint =
    endpoint === "/api/auth/login" ||
    endpoint === "/api/auth/register-customer";

  if (response.status === 401 && !isAuthEndpoint) {
    clearAuth();

    window.location.href = "/portal/login";

    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "You do not have permission to perform this action."
    );
  }

  return response;
}