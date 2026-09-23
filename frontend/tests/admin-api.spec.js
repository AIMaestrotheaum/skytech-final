import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:8000";

async function adminLogin(request) {
  const response = await request.post(`${API}/api/auth/login`, {
    data: {
      email: "admin@skytech.com",
      password: "pass@123",
    },
  });

  expect(response.status()).toBe(200);

  const data = await response.json();

  expect(data.access_token).toBeTruthy();
  expect(data.role).toBe("admin");

  return data.access_token;
}

test.describe("Admin APIs", () => {
  test("admin dashboard works", async ({ request }) => {
    const token = await adminLogin(request);

    const response = await request.get(`${API}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
  });

  test("admin leads API works", async ({ request }) => {
    const token = await adminLogin(request);

    const response = await request.get(`${API}/api/admin/leads`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
  });

  test("admin quotes API works", async ({ request }) => {
    const token = await adminLogin(request);

    const response = await request.get(`${API}/api/admin/quotes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
  });

  test("admin AMC API works", async ({ request }) => {
    const token = await adminLogin(request);

    const response = await request.get(
      `${API}/api/admin/service-amc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);
  });

  test("admin service requests API works", async ({ request }) => {
    const token = await adminLogin(request);

    const response = await request.get(
      `${API}/api/admin/service-requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);
  });
});