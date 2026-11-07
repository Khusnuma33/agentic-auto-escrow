const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

async function post(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with HTTP ${response.status}`);
  }

  return data;
}

export function createOrder(budget) {
  return post("/api/escrow/create-order", { budget });
}

export function submitWork(payload) {
  return post("/api/escrow/submit-work", payload);
}
