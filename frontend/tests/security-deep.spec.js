import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:8000";

test.describe("SKYTECH Security Tests", () => {
  test("invalid JWT cannot access customer dashboard", async ({ request }) => {
    const response = await request.get(
      `${API}/api/customer/dashboard`,
      {
        headers: {
          Authorization: "Bearer invalid-token-123",
        },
      }
    );

    expect([401, 403]).toContain(response.status());
  });

  test("invalid JWT cannot access admin dashboard", async ({ request }) => {
    const response = await request.get(
      `${API}/api/admin/dashboard`,
      {
        headers: {
          Authorization: "Bearer invalid-token-123",
        },
      }
    );

    expect([401, 403]).toContain(response.status());
  });

  test("customer cannot access admin leads", async ({ request }) => {
    const login = await request.post(`${API}/api/auth/login`, {
      data: {
        email: "customer@skytech.com",
        password: "Customer@123",
      },
    });

    expect(login.status()).toBe(200);

    const { access_token } = await login.json();

    const response = await request.get(
      `${API}/api/admin/leads`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("customer cannot access admin quotes", async ({ request }) => {
    const login = await request.post(`${API}/api/auth/login`, {
      data: {
        email: "customer@skytech.com",
        password: "Customer@123",
      },
    });

    expect(login.status()).toBe(200);

    const { access_token } = await login.json();

    const response = await request.get(
      `${API}/api/admin/quotes`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("customer cannot access admin AMC", async ({ request }) => {
    const login = await request.post(`${API}/api/auth/login`, {
      data: {
        email: "customer@skytech.com",
        password: "Customer@123",
      },
    });

    expect(login.status()).toBe(200);

    const { access_token } = await login.json();

    const response = await request.get(
      `${API}/api/admin/service-amc`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("customer cannot access admin service requests", async ({
    request,
  }) => {
    const login = await request.post(`${API}/api/auth/login`, {
      data: {
        email: "customer@skytech.com",
        password: "Customer@123",
      },
    });

    expect(login.status()).toBe(200);

    const { access_token } = await login.json();

    const response = await request.get(
      `${API}/api/admin/service-requests`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("empty authorization header is rejected", async ({ request }) => {
    const response = await request.get(
      `${API}/api/customer/dashboard`,
      {
        headers: {
          Authorization: "",
        },
      }
    );

    expect([401, 403]).toContain(response.status());
  });
});