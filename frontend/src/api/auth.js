import { apiFetch } from "../utils/api";

export async function loginUser(email, password) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data;
}