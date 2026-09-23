import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:8000";

test.describe("API validation", () => {
  test("invalid email is rejected by quote API", async ({ request }) => {
    const response = await request.post(`${API}/api/public/quote`, {
      data: {
        customer_name: "Invalid Test",
        company: "Test",
        email: "not-an-email",
        phone: "9999999999",
        industry: "Manufacturing",
        requirement: "UPS",
      },
    });

    expect(response.status()).toBe(422);
  });

  test("missing quote requirement is rejected", async ({ request }) => {
    const response = await request.post(`${API}/api/public/quote`, {
      data: {
        customer_name: "Validation Test",
        email: "validation@example.com",
      },
    });

    expect(response.status()).toBe(422);
  });

  test("invalid login credentials are rejected", async ({ request }) => {
    const response = await request.post(`${API}/api/auth/login`, {
      data: {
        email: "customer@skytech.com",
        password: "WRONG_PASSWORD",
      },
    });

    expect(response.status()).toBe(401);
  });

  test("missing authentication is rejected", async ({ request }) => {
    const response = await request.get(
      `${API}/api/customer/dashboard`
    );

    expect([401, 403]).toContain(response.status());
  });

  test("missing admin authentication is rejected", async ({ request }) => {
    const response = await request.get(
      `${API}/api/admin/dashboard`
    );

    expect([401, 403]).toContain(response.status());
  });
});