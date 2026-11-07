const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

async function post(path, body) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Unable to reach the escrow server. Please try again.");
  }

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
  return postSubmitWork(payload);
}

async function postSubmitWork(body) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/escrow/submit-work`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "The AI auditor is busy or unreachable. Please try again in a minute.",
    );
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 422) {
    return data;
  }

  if (!response.ok) {
    throw new Error(
      "The AI auditor is busy or unreachable. Please try again in a minute.",
    );
  }

  return data;
}
