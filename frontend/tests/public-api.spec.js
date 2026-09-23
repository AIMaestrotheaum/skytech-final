import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:8000";

test.describe("Public APIs", () => {
  test("quote API creates a lead", async ({ request }) => {
    const response = await request.post(`${API}/api/public/quote`, {
      data: {
        customer_name: "Playwright Test User",
        company: "Playwright Test Company",
        email: `test-${Date.now()}@example.com`,
        phone: "9999999999",
        industry: "Manufacturing",
        requirement: "100 kVA UPS",
        source: "playwright-test",
      },
    });

    expect([200, 201]).toContain(response.status());

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test("contact API accepts valid contact request", async ({ request }) => {
    const response = await request.post(`${API}/api/public/contact`, {
      data: {
        customer_name: "Playwright Contact",
        company: "Test Company",
        email: null,
        phone: null,
        requirement: "Power consultation",
        message: "Automated integration test",
      },
    });

    expect([200, 201]).toContain(response.status());
  });

  test("AMC request API accepts valid request", async ({ request }) => {
    const response = await request.post(`${API}/api/public/amc-request`, {
      data: {
        customer_name: "Playwright AMC User",
        company: "Test Company",
        email: `amc-${Date.now()}@example.com`,
        phone: "9999999999",
        issue: "UPS maintenance required",
        priority: "normal",
      },
    });

    expect([200, 201]).toContain(response.status());
  });

  test("UPS calculator API works", async ({ request }) => {
    const response = await request.post(`${API}/api/public/ups-calculator`, {
      data: {
        load_kw: 80,
        power_factor: 0.8,
        safety_margin: 1.25,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test("battery calculator API works", async ({ request }) => {
    const response = await request.post(
      `${API}/api/public/battery-calculator`,
      {
        data: {
          load_kw: 50,
          backup_minutes: 30,
          battery_voltage: 12,
          battery_ah: 100,
          efficiency: 0.9,
          depth_of_discharge: 0.8,
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test("three phase UPS calculator API works", async ({ request }) => {
    const response = await request.post(
      `${API}/api/public/three-phase-ups`,
      {
        data: {
          load_kw: 100,
          power_factor: 0.8,
          safety_margin: 1.25,
          voltage: 415,
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test("AI power assistant API works", async ({ request }) => {
    const response = await request.post(
      `${API}/api/public/ai-power-assistant`,
      {
        data: {
          question: "What size UPS is suitable for a 100 kW load?",
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });
});