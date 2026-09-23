import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:8000";

async function customerLogin(request) {
  const response = await request.post(`${API}/api/auth/login`, {
    data: {
      email: "customer@skytech.com",
      password: "Customer@123",
    },
  });

  expect(response.status()).toBe(200);

  const data = await response.json();

  expect(data.access_token).toBeTruthy();
  expect(data.role).toBe("customer");

  return data.access_token;
}

test.describe("Customer APIs", () => {
  test("customer dashboard API works", async ({ request }) => {
    const token = await customerLogin(request);

    const response = await request.get(
      `${API}/api/customer/dashboard`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toBeTruthy();
  });

  test("customer equipment API works", async ({ request }) => {
    const token = await customerLogin(request);

    const response = await request.get(
      `${API}/api/customer/equipment`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toBeTruthy();
  });

  test("customer AMC API works", async ({ request }) => {
    const token = await customerLogin(request);

    const response = await request.get(
      `${API}/api/customer/amc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toBeTruthy();
  });

  test("customer service history API works", async ({ request }) => {
    const token = await customerLogin(request);

    const response = await request.get(
      `${API}/api/customer/service-history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toBeTruthy();
  });

  test("customer can create service request", async ({ request }) => {
    const token = await customerLogin(request);

    // Get equipment belonging to the logged-in customer
    const equipmentResponse = await request.get(
      `${API}/api/customer/equipment`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(equipmentResponse.status()).toBe(200);

    const equipmentData = await equipmentResponse.json();

    console.log(
      "CUSTOMER EQUIPMENT RESPONSE:",
      JSON.stringify(equipmentData, null, 2)
    );

    const equipment = Array.isArray(equipmentData)
      ? equipmentData[0]
      : equipmentData.equipment?.[0] ||
        equipmentData.items?.[0];

    console.log(
      "SELECTED EQUIPMENT:",
      JSON.stringify(equipment, null, 2)
    );

    expect(equipment).toBeTruthy();
    expect(equipment.id).toBeTruthy();

    // Create service request using the customer's actual equipment
    const response = await request.post(
      `${API}/api/customer/service-requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          equipment_id: equipment.id,
          issue: "Playwright automated service request",
          priority: "normal",
        },
      }
    );

    const responseText = await response.text();

    console.log(
      "SERVICE REQUEST STATUS:",
      response.status()
    );

    console.log(
      "SERVICE REQUEST RESPONSE:",
      responseText
    );

    expect([200, 201]).toContain(response.status());

    if (responseText) {
      const data = JSON.parse(responseText);
      expect(data).toBeTruthy();
    }
  });
});